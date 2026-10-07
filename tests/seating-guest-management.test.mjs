import assert from "node:assert/strict";
import test from "node:test";
import * as profile from "../lib/guests/personal-profile.ts";
import * as envelope from "../lib/guests/personal-envelope.ts";
import * as manualParty from "../lib/guests/manual-party.ts";
import * as guestSeats from "../lib/seating/guest-seats.ts";
import { loadSource } from "./helpers/package-access.mjs";

const origin = loadSource("lib/security/request-origin.ts", {}, { env: { APP_URL: "https://example.test", NODE_ENV: "production" } });
const request = (method, body = {}, headers = {}) => new Request(`https://example.test/api/guests/manage${method === "DELETE" ? `?${new URLSearchParams(body)}` : ""}`, {
  method, headers: { Origin: "https://example.test", "Content-Type": "application/json", ...headers },
  ...(method === "PATCH" ? { body: JSON.stringify(body) } : {}),
});
const patchBody = { id: "guest-a", invitationId: "event-a", name: "  hendra baru  ", category: "VVIP" };
const deleteBody = { id: "guest-a", invitationId: "event-a" };

function fixture(options = {}) {
  let guests = [{
    id: "guest-a", invitationId: "event-a", name: "hendra", phone: "081234567890", category: "VIP", tags: ["keluarga"],
    source: "MANUAL", invitedPax: 3, tableId: "table-a", seatNumber: 8, rsvpStatus: "ATTENDING", plusOnes: 2,
    checkedIn: false, personalToken: null, usherQrToken: "fixture-ticket", personalPublished: false,
    personalAddressee: envelope.buildPersonalGuestAddressee("hendra", "BAPAK"),
    personalGreeting: "Sampai bertemu", personalLanguage: "ID", recipientType: "FAMILY", personalEnvelopeEnabled: true,
    ...options.guest,
  }, { id: "foreign-guest", invitationId: "event-b", name: "Reni", ownerId: "owner-b", personalToken: null, checkedIn: false }];
  const invitation = { id: "event-a", ownerId: options.ownerId ?? "owner-a", payment: { status: "PAID" } };
  const calls = { lookups: [], updates: [], deletes: [], access: [], contacts: [] };
  const prisma = { guest: {
    findFirst: async (query) => {
      calls.lookups.push(query);
      const guest = guests.find((item) => item.id === query.where.id);
      return guest && (guest.ownerId ?? invitation.ownerId) === query.where.invitation.ownerId ? { ...guest, invitation } : null;
    },
    update: async ({ where, data, select }) => {
      calls.updates.push({ where, data, select });
      guests = guests.map((guest) => guest.id === where.id ? { ...guest, ...data } : guest);
      const updated = guests.find((guest) => guest.id === where.id);
      return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, updated[key]]));
    },
    deleteMany: async ({ where }) => {
      calls.deletes.push(where);
      if (options.lateProtection) guests = guests.map((guest) => guest.id === where.id ? { ...guest, ...options.lateProtection } : guest);
      if (options.lateOwnerChange) invitation.ownerId = "owner-b";
      const before = guests.length;
      guests = guests.filter((guest) => !(guest.id === where.id && guest.invitationId === where.invitationId && invitation.ownerId === where.invitation.ownerId && guest.personalToken === where.personalToken && guest.checkedIn === where.checkedIn));
      return { count: before - guests.length };
    },
  } };
  const access = { hasAccountDigitalInvitation: async (...args) => { calls.access.push(args); return options.access !== false; } };
  const partyUpdate = loadSource("lib/guests/party-update.ts", {
    "@/lib/prisma": { prisma }, "@/lib/packages/server-access": access,
    "./personal-envelope": envelope, "./manual-party": manualParty, "@/lib/seating/guest-seats": guestSeats,
  });
  const routes = loadSource("app/api/guests/manage/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getCurrentUser: async () => options.signedOut ? null : { id: "owner-a" } }, "@/lib/prisma": { prisma },
    "@/lib/security/request-origin": origin,
    "@/lib/packages/server-access": access, "@/lib/guests/party-update": partyUpdate,
    "@/lib/guests/identity": { findGuestsByContact: async (...args) => { calls.contacts.push(args); return options.duplicate ? [{ id: "other-guest" }] : [{ id: "guest-a" }]; } },
    "@/lib/guests/personal-profile": profile, "@/lib/guests/personal-envelope": envelope,
  });
  return { routes, calls, guests: () => structuredClone(guests) };
}

test("seating name/category edits update the shared Guest and generated envelope while preserving the party and check-in data", async () => {
  for (const salutation of ["BAPAK", "IBU", "BAPAK_IBU"]) {
    const f = fixture({ guest: { checkedIn: true, personalToken: "fixture-personal", personalPublished: true, personalAddressee: envelope.buildPersonalGuestAddressee("hendra", salutation) } }), before = f.guests();
    const response = await f.routes.PATCH(request("PATCH", patchBody));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true); assert.equal(data.guest.id, "guest-a"); assert.equal(data.guest.invitationId, "event-a");
    assert.equal(data.guest.tableId, "table-a"); assert.equal(data.guest.seatNumber, 8); assert.equal(data.guest.source, "MANUAL");
    const changed = { name: "hendra baru", category: "VVIP", personalAddressee: envelope.buildPersonalGuestAddressee("hendra baru", salutation) };
    assert.deepEqual(f.calls.updates[0].data, changed);
    assert.deepEqual(f.guests()[0], { ...before[0], ...changed }); assert.deepEqual(f.guests()[1], before[1]);
    assert.equal(Object.hasOwn(data.guest, "personalToken"), false); assert.equal(Object.hasOwn(data.guest, "usherQrToken"), false);
    assert.deepEqual(f.calls.lookups[0].where, { id: "guest-a", invitation: { ownerId: "owner-a" } });
    assert.deepEqual(f.calls.contacts[0], ["event-a", "hendra baru", before[0].phone]);
  }
});

test("guest rename preserves custom/missing envelope names and respects an explicit shared envelope edit", async () => {
  for (const personalAddressee of ["Keluarga Besar Wijaya", null]) {
    const f = fixture({ guest: { personalAddressee, category: null } });
    const response = await f.routes.PATCH(request("PATCH", { id: "guest-a", invitationId: "event-a", name: "Naya" }));
    assert.equal(response.status, 200);
    assert.deepEqual(f.calls.updates[0].data, { name: "Naya" });
    assert.equal(f.guests()[0].personalAddressee, personalAddressee); assert.equal(f.guests()[0].category, null);
  }
  const f = fixture();
  assert.equal((await f.routes.PATCH(request("PATCH", { ...patchBody, personalAddressee: "Keluarga Baru" }))).status, 200);
  assert.equal(f.guests()[0].personalAddressee, "Keluarga Baru");
});

test("guest edits validate session/origin/owner/event/entitlement/name/category/contact before any update", async () => {
  const cases = [
    [{ signedOut: true }, patchBody, {}, 401], [{}, patchBody, { Origin: "https://other.test" }, 403],
    [{ ownerId: "owner-b" }, patchBody, {}, 404], [{}, { ...patchBody, id: "foreign-guest" }, {}, 404],
    [{}, { ...patchBody, invitationId: "event-b" }, {}, 404], [{ access: false }, patchBody, {}, 402],
    [{}, { ...patchBody, name: " " }, {}, 400], [{}, { ...patchBody, name: "n".repeat(121) }, {}, 400],
    [{}, { ...patchBody, category: "x".repeat(61) }, {}, 400], [{ duplicate: true }, patchBody, {}, 409],
  ];
  for (const [options, body, headers, status] of cases) {
    const f = fixture(options), before = f.guests();
    assert.equal((await f.routes.PATCH(request("PATCH", body, headers))).status, status);
    assert.equal(f.calls.updates.length, 0); assert.deepEqual(f.guests(), before);
  }
});

test("deleting a normal guest removes only that event's shared party with an atomic protection predicate", async () => {
  const f = fixture(), before = f.guests();
  const response = await f.routes.DELETE(request("DELETE", deleteBody));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(f.guests(), [before[1]]);
  assert.deepEqual(f.calls.deletes, [{ id: "guest-a", invitationId: "event-a", invitation: { ownerId: "owner-a" }, personalToken: null, checkedIn: false }]);
  assert.equal(f.calls.updates.length, 0);
});

test("personal invitations and checked-in guests cannot be deleted before or during the deletion write", async () => {
  for (const protection of [{ personalToken: "fixture-personal" }, { checkedIn: true }]) {
    const protectedGuest = fixture({ guest: protection }), before = protectedGuest.guests();
    const response = await protectedGuest.routes.DELETE(request("DELETE", deleteBody));
    assert.equal(response.status, 409); assert.equal(protectedGuest.calls.deletes.length, 0); assert.deepEqual(protectedGuest.guests(), before);
    const racing = fixture({ lateProtection: protection });
    const lateResponse = await racing.routes.DELETE(request("DELETE", deleteBody));
    assert.equal(lateResponse.status, 409); assert.match((await lateResponse.json()).error, /Data tamu berubah/);
    assert.equal(racing.calls.deletes.length, 1); assert.equal(racing.guests().length, 2);
    assert.deepEqual(racing.guests()[0], { ...fixture().guests()[0], ...protection });
  }
  const changedOwner = fixture({ lateOwnerChange: true });
  assert.equal((await changedOwner.routes.DELETE(request("DELETE", deleteBody))).status, 409);
  assert.equal(changedOwner.guests().length, 2);
});

test("guest deletion enforces event/account and package boundaries without removing records on failure", async () => {
  for (const [options, body, headers, status] of [
    [{ signedOut: true }, deleteBody, {}, 401], [{}, deleteBody, { Origin: "https://other.test" }, 403],
    [{ ownerId: "owner-b" }, deleteBody, {}, 404], [{}, { ...deleteBody, id: "foreign-guest" }, {}, 404],
    [{}, { ...deleteBody, invitationId: "event-b" }, {}, 404], [{ access: false }, deleteBody, {}, 402],
    [{}, { invitationId: "event-a" }, {}, 400],
  ]) {
    const f = fixture(options), before = f.guests();
    assert.equal((await f.routes.DELETE(request("DELETE", body, headers))).status, status);
    assert.equal(f.calls.deletes.length, 0); assert.deepEqual(f.guests(), before);
  }
});
