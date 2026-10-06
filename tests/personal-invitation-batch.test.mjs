import assert from "node:assert/strict";
import test from "node:test";
import * as crypto from "node:crypto";
import * as profile from "../lib/guests/personal-profile.ts";
import { loadSource, loadPackageAccess } from "./helpers/package-access.mjs";

const origin = loadSource("lib/security/request-origin.ts", {}, { env: { APP_URL: "https://example.test", NODE_ENV: "production" } });
const recipient = (name = "Ibu Rina", category = "REGULAR") => ({ key: crypto.randomUUID(), name, category });
const request = (method, body, headers = {}) => new Request("https://example.test/api/personal-invitations", { method, headers: { Origin: "https://example.test", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const saved = (id = "guest-a", invitationId = "event-a") => ({ id, invitationId, name: "Bapak Andi", category: "VIP", phone: "081234567890", recipientType: "FAMILY", invitedPax: 4, personalAddressee: "Keluarga Andi", personalLanguage: "EN", personalEnvelopeEnabled: false, personalGreeting: "Terima kasih", tags: ["Keluarga"], rsvpStatus: "ATTENDING", plusOnes: 2, checkedIn: true, seatNumber: 3, tableId: "table-a", personalToken: "existing-token", personalPublished: false, personalPasswordProtected: true, personalPasswordHash: "private-hash", personalViewCount: 9 });

function fixture(options = {}) {
  let state = options.guests ?? [saved(), saved("foreign", "event-b")];
  let serial = 0, tail = Promise.resolve();
  const calls = { locks: [], writes: [], access: [] };
  const payment = options.payment ?? { status: "PAID", packageKey: "INVITATION_BASIC" };
  const matches = (guest, where) => (!where.invitationId || guest.invitationId === where.invitationId)
    && (!where.id?.in || where.id.in.includes(guest.id))
    && (!where.personalToken?.in || where.personalToken.in.includes(guest.personalToken))
    && (!Object.hasOwn(where.personalToken ?? {}, "not") || guest.personalToken != null);
  const findInvitation = async ({ where }) => where.id === "event-a" && where.ownerId === "owner-a" && options.configured !== false ? { id: "event-a", ownerId: "owner-a", templateKey: options.templateKey ?? "romantic-rose", isPublished: options.published !== false, payment } : null;
  const prisma = {
    invitation: { findFirst: findInvitation },
    async $transaction(callback) {
      const previous = tail;
      let release;
      tail = new Promise((resolve) => { release = resolve; });
      await previous;
      const draft = structuredClone(state);
      try {
        const tx = {
          $queryRaw: async (sql, ...values) => { calls.locks.push({ sql: sql.join("?"), values }); return values[0] === "event-a" && values[1] === "owner-a" && options.lock !== false ? [{ id: "event-a" }] : []; },
          invitation: { findFirst: findInvitation },
          guest: {
            findMany: async ({ where }) => draft.filter((guest) => matches(guest, where)),
            update: async ({ where, data }) => {
              const index = draft.findIndex((guest) => guest.id === where.id);
              assert.ok(index >= 0);
              calls.writes.push(["update", where.id, data]);
              draft[index] = { ...draft[index], ...data };
              return draft[index];
            },
            create: async ({ data }) => {
              if (++serial === options.failCreateAt) throw new Error("Database failed");
              const row = { id: `created-${serial}`, invitedPax: 1, recipientType: "INDIVIDUAL", personalEnvelopeEnabled: true, personalLanguage: "ID", personalPasswordHash: null, ...data };
              calls.writes.push(["create", data]); draft.push(row); return row;
            },
            updateMany: async ({ where, data }) => {
              let count = 0;
              for (let i = 0; i < draft.length; i++) if (matches(draft[i], where)) { draft[i] = { ...draft[i], ...data }; count++; }
              calls.writes.push(["updateMany", where, data]);
              return { count: options.changedCount ? count - 1 : count };
            },
          },
        };
        const result = await callback(tx);
        state = draft;
        return result;
      } finally { release(); }
    },
  };
  const packageAccess = loadPackageAccess({ grants: options.grant ? { "owner-a": { digital: true, guestbook: false } } : {} });
  const batch = loadSource("lib/guests/personal-batch.ts", {
    "node:crypto": crypto, "@/lib/prisma": { prisma },
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async (...args) => { calls.access.push(args); return packageAccess.access.hasAccountDigitalInvitation(...args); } },
  });
  const route = loadSource("app/api/personal-invitations/route.ts", {
    "node:crypto": crypto, "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getCurrentUser: async () => options.signedOut ? null : { id: "owner-a" } },
    "@/lib/prisma": { prisma }, "@/lib/security/request-origin": origin,
    "@/lib/invitations/password": { hashInvitationPassword: async () => "hash" },
    "@/lib/guests/personal-profile": profile, "@/lib/guests/identity": {}, "@/lib/guests/personal-batch": batch,
  });
  return { route, calls, state: () => structuredClone(state) };
}

test("bulk creation makes named personal drafts atomically without payment or name-based guest merging", async () => {
  const f = fixture({ published: false, payment: { status: "PENDING", packageKey: "INVITATION_BASIC" } });
  const before = f.state();
  const res = await f.route.POST(request("POST", { invitationId: "event-a", recipients: [recipient("Bapak Andi", "VIP"), recipient("Bapak Andi", "VVIP")] }));
  assert.equal(res.status, 201);
  const { invitations } = await res.json();
  assert.equal(new Set(invitations.map((guest) => guest.id)).size, 2);
  assert.equal(new Set(invitations.map((guest) => guest.personalToken)).size, 2);
  for (const guest of invitations) {
    assert.equal(guest.invitationId, "event-a"); assert.equal(guest.invitedPax, 1); assert.equal(guest.personalPublished, false);
    assert.equal(guest.personalEnvelopeEnabled, true); assert.equal(guest.personalLanguage, "ID");
    assert.equal(Object.hasOwn(guest, "personalPasswordHash"), false);
  }
  assert.deepEqual(f.state().slice(0, before.length), before);
  assert.equal(f.calls.access.length, 0);
  assert.match(f.calls.locks[0].sql, /FOR UPDATE/);
  assert.deepEqual(f.calls.locks[0].values, ["event-a", "owner-a"]);
});

test("saved IDs preserve RSVP, contact, envelope, seating, passwords and tokens during bulk category/publish", async () => {
  const f = fixture(); const before = f.state();
  const res = await f.route.POST(request("POST", { invitationId: "event-a", published: true, recipients: [{ guestId: "guest-a", category: "VVIP", invitedPax: 1, personalEnvelopeEnabled: true }] }));
  assert.equal(res.status, 201);
  const row = f.state()[0];
  assert.deepEqual(row, { ...before[0], category: "VVIP", personalPublished: true });
  assert.deepEqual(f.state()[1], before[1]);
  assert.equal(Object.hasOwn((await res.json()).invitations[0], "personalPasswordHash"), false);
});

test("creation retries, including concurrent retries, retain identical Guest IDs and tokens", async () => {
  const f = fixture(); const body = { invitationId: "event-a", recipients: [recipient(), recipient("Ibu Sari")], published: true };
  const results = await Promise.all([f.route.POST(request("POST", body)), f.route.POST(request("POST", body))]);
  assert.ok(results.every((res) => res.status === 201));
  const [first, second] = await Promise.all(results.map((res) => res.json()));
  assert.deepEqual(first.invitations.map((row) => [row.id, row.personalToken]), second.invitations.map((row) => [row.id, row.personalToken]));
  assert.equal(f.state().length, 4);
  const third = await f.route.POST(request("POST", { ...body, published: false }));
  assert.equal(third.status, 201);
  assert.ok((await third.json()).invitations.every((row) => row.personalPublished));
});

test("a bad final recipient or database failure leaves the whole batch unchanged", async () => {
  for (const options of [{}, { failCreateAt: 2 }]) {
    const f = fixture(options), before = f.state();
    const recipients = options.failCreateAt ? [recipient(), recipient("Ibu Sari")] : [recipient(), { guestId: "foreign", category: "VIP" }];
    const res = await f.route.POST(request("POST", { invitationId: "event-a", recipients, published: true }));
    assert.equal(res.status, options.failCreateAt ? 500 : 404);
    assert.deepEqual(f.state(), before);
  }
});

test("bulk writes require login, trusted origin, explicit owned configured invitation and valid row identities", async () => {
  const good = { invitationId: "event-a", recipients: [recipient()] };
  for (const [options, body, headers, status] of [
    [{ signedOut: true }, good, {}, 401], [{}, good, { Origin: "https://evil.test" }, 403],
    [{}, { ...good, invitationId: "" }, {}, 400], [{}, { ...good, invitationId: "event-b" }, {}, 404],
    [{ configured: false }, good, {}, 404], [{ lock: false }, good, {}, 404],
    [{}, { ...good, recipients: [] }, {}, 400], [{}, { ...good, recipients: Array.from({ length: 101 }, () => recipient()) }, {}, 400],
    [{}, { ...good, recipients: [{ key: "guessed", name: "Rina" }] }, {}, 400],
    [{}, { ...good, recipients: [recipient(" ")] }, {}, 400], [{}, { ...good, recipients: [recipient("x".repeat(121))] }, {}, 400],
    [{}, { ...good, recipients: [recipient("Rina", "Custom")] }, {}, 400],
    [{}, { ...good, recipients: [{ ...recipient(), category: 7 }] }, {}, 400],
    [{}, { ...good, recipients: [{ ...recipient(), guestId: 7 }] }, {}, 400],
    [{}, { ...good, recipients: [good.recipients[0], good.recipients[0]] }, {}, 400],
    [{}, { ...good, published: "true" }, {}, 400],
  ]) {
    const f = fixture(options), before = f.state();
    assert.equal((await f.route.POST(request("POST", body, headers))).status, status);
    assert.deepEqual(f.state(), before); assert.equal(f.calls.writes.length, 0);
  }
});

test("both bulk create-and-publish and later publishing enforce the current parent state and event-scoped entitlement", async () => {
  for (const [options, status] of [
    [{ published: false }, 409], [{ payment: { status: "PENDING", packageKey: "INVITATION_BASIC" } }, 403],
    [{ payment: { status: "PAID", packageKey: "WA_BLAST_50" } }, 403],
    [{ payment: { status: "PAID", packageKey: "GUESTBOOK_DIGITAL" } }, 201],
    [{ payment: { status: "PENDING", packageKey: "INVITATION_BASIC" }, grant: true }, 201],
  ]) {
    const f = fixture(options), before = f.state();
    assert.equal((await f.route.POST(request("POST", { invitationId: "event-a", recipients: [recipient()], published: true }))).status, status);
    if (status !== 201) assert.deepEqual(f.state(), before);
    const publish = await f.route.PATCH(request("PATCH", { invitationId: "event-a", ids: ["guest-a"], published: true }));
    assert.equal(publish.status, status === 201 ? 200 : status);
  }
});

test("bulk publishing updates only explicit personal recipients and rolls back foreign/missing or changed rows", async () => {
  for (const [options, ids, expected] of [[{}, ["guest-a"], 200], [{}, ["guest-a", "foreign"], 404], [{}, ["missing"], 404], [{ changedCount: true }, ["guest-a"], 409]]) {
    const f = fixture(options), before = f.state();
    const res = await f.route.PATCH(request("PATCH", { invitationId: "event-a", ids, published: true }));
    assert.equal(res.status, expected);
    assert.deepEqual(f.state(), expected === 200 ? [{ ...before[0], personalPublished: true }, before[1]] : before);
    if (expected === 200) assert.equal((await res.json()).count, 1);
  }
  for (const body of [{ ids: [], published: true }, { ids: ["guest-a", "guest-a"], published: true }, { ids: ["guest-a"], published: false }]) {
    const f = fixture(); assert.equal((await f.route.PATCH(request("PATCH", { invitationId: "event-a", ...body }))).status, 400);
    assert.equal(f.calls.writes.length, 0);
  }
  const f = fixture({ guests: [{ ...saved(), personalToken: null }] });
  assert.equal((await f.route.PATCH(request("PATCH", { invitationId: "event-a", ids: ["guest-a"], published: true }))).status, 404);
  assert.equal(f.calls.writes.length, 0);
});


test("single and batch personal-link creation require an already saved design, ignoring request-supplied templates", async () => {
  const f = fixture({ templateKey: "", published: false }); const before = f.state();
  for (const body of [{ name: "Ibu Rina" }, { recipients: [recipient()] }]) {
    const res = await f.route.POST(request("POST", { invitationId: "event-a", templateKey: "romantic-rose::pretend-saved", ...body }));
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /Edit undangan/);
    assert.deepEqual(f.state(), before); assert.equal(f.calls.writes.length, 0);
  }
});
