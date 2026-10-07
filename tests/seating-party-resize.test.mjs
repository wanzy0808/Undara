import assert from "node:assert/strict";
import test from "node:test";
import * as envelope from "../lib/guests/personal-envelope.ts";
import * as profile from "../lib/guests/personal-profile.ts";
import * as manualParty from "../lib/guests/manual-party.ts";
import * as guestSeats from "../lib/seating/guest-seats.ts";
import { loadSource } from "./helpers/package-access.mjs";

const baseGuest = (overrides = {}) => ({
  id: "guest-a", invitationId: "event-a", name: "hendra", phone: null,
  category: "VIP", tags: ["keluarga"], invitedPax: 2, source: "MANUAL",
  tableId: "table-a", seatNumber: 8, rsvpStatus: "PENDING", plusOnes: 0,
  checkedIn: false, personalToken: "test-personal", personalPublished: true,
  usherQrToken: "test-ticket", recipientType: "FAMILY", personalLanguage: "ID",
  personalGreeting: "Sampai bertemu", personalEnvelopeEnabled: true,
  personalAddressee: envelope.buildPersonalGuestAddressee("hendra", "BAPAK"), ...overrides,
});
const baseTable = { id: "table-a", invitationId: "event-a", capacity: 8 };
const request = (body, path = "manage", method = "PATCH") => new Request(`https://example.test/api/guests/${path}`, {
  method, headers: { Origin: "https://example.test", "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const origin = loadSource("lib/security/request-origin.ts", {}, { env: { APP_URL: "https://example.test", NODE_ENV: "production" } });

// Replace the database boundary; execute the real handlers, parser, party rules
// and transaction callback. Draft records are rolled back on every rejection.
function fixture(options = {}) {
  let records = structuredClone(options.guests ?? [baseGuest()]);
  const tables = structuredClone(options.tables ?? [baseTable]);
  const event = { id: "event-a", ownerId: "owner-a", payment: { status: "PAID" } };
  const calls = { writes: [], transactions: [], reads: [] };
  let queue = Promise.resolve();
  const matches = (guest, where) => (!where.id || (typeof where.id === "string" ? guest.id === where.id
    : (!where.id.not || guest.id !== where.id.not) && (!where.id.notIn || !where.id.notIn.includes(guest.id)) && (!where.id.in || where.id.in.includes(guest.id))))
    && (!where.invitationId || guest.invitationId === where.invitationId)
    && (!where.invitation || (guest.invitationId === event.id && event.ownerId === where.invitation.ownerId))
    && (!where.tableId || (typeof where.tableId === "string" ? guest.tableId === where.tableId : where.tableId.in.includes(guest.tableId)))
    && (!where.OR || where.OR.some((condition) => guest.source === condition.source && (!condition.rsvpStatus || guest.rsvpStatus === condition.rsvpStatus)));
  const project = (guest, query) => {
    if (!guest) return null;
    const value = { ...structuredClone(guest), invitation: structuredClone(event), table: tables.find((table) => table.id === guest.tableId) ?? null };
    return query.select ? Object.fromEntries(Object.keys(query.select).filter((key) => query.select[key]).map((key) => [key, value[key]])) : value;
  };
  const model = (getRecords, transaction) => ({
    findFirst: async (query) => {
      if (transaction) assert.match(transaction.locks[0]?.sql ?? "", /Invitation.*FOR UPDATE/);
      calls.reads.push(query);
      return project(getRecords().find((guest) => matches(guest, query.where)), query);
    },
    findUnique: async (query) => {
      const snapshot = project(getRecords().find((guest) => guest.id === query.where.id), query);
      await options.afterOuterLookup?.(records, event);
      return snapshot;
    },
    findMany: async (query) => getRecords().filter((guest) => matches(guest, query.where)).map((guest) => project(guest, query)),
    update: async (query) => {
      const guest = getRecords().find((guest) => guest.id === query.where.id);
      assert.ok(guest); Object.assign(guest, query.data);
      (transaction?.writes ?? calls.writes).push(query);
      return project(guest, query);
    },
    updateMany: async (query) => {
      const guests = getRecords().filter((guest) => matches(guest, query.where));
      for (const guest of guests) Object.assign(guest, query.data);
      (transaction?.writes ?? calls.writes).push(query);
      return { count: guests.length };
    },
  });
  const weddingTable = {
    findFirst: async ({ where }) => tables.find((table) => table.id === where.id && table.invitationId === where.invitationId) ?? null,
    findMany: async ({ where }) => tables.filter((table) => table.invitationId === where.invitationId && where.id.in.includes(table.id)),
  };
  const prisma = { guest: model(() => records), weddingTable, $transaction: (callback) => {
    const work = queue.then(async () => {
      await options.beforeTransaction?.(records, event);
      const draft = structuredClone(records), transaction = { locks: [], writes: [] };
      calls.transactions.push(transaction);
      const tx = { guest: model(() => draft, transaction), weddingTable, $queryRaw: async (strings, ...values) => {
        const sql = strings.join("?"); transaction.locks.push({ sql, values });
        assert.match(sql, /FOR UPDATE/);
        if (sql.includes('FROM "Invitation"')) return values[0] === event.id && values[1] === event.ownerId ? [{ id: event.id }] : [];
        if (sql.includes('FROM "Guest"')) return draft.some((guest) => guest.id === values[0] && guest.invitationId === values[1]) ? [{ id: values[0] }] : [];
        if (sql.includes('FROM "WeddingTable"')) return tables.some((table) => table.id === values[0] && table.invitationId === values[1]) ? [{ id: values[0] }] : [];
        throw Error(`Unexpected lock ${sql}`);
      } };
      const result = await callback(tx);
      records = draft; calls.writes.push(...transaction.writes); return result;
    });
    queue = work.catch(() => {}); return work;
  } };
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/prisma": { prisma }, "@/lib/auth": { getCurrentUser: async () => ({ id: "owner-a" }) },
    "@/lib/security/request-origin": origin,
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async () => options.access !== false },
    "@/lib/guests/personal-envelope": envelope, "@/lib/guests/personal-profile": profile,
    "@/lib/guests/identity": { findGuestsByContact: async () => [] }, "@/lib/seating/guest-seats": guestSeats,
  };
  const party = loadSource("lib/guests/party-update.ts", { ...modules, "./personal-envelope": envelope, "./manual-party": manualParty });
  const manage = loadSource("app/api/guests/manage/route.ts", { ...modules, "@/lib/guests/party-update": party });
  const assign = loadSource("app/api/guests/[id]/route.ts", modules);
  const swap = loadSource("app/api/guests/[id]/swap/route.ts", modules);
  const params = (id) => ({ params: Promise.resolve({ id }) });
  return { calls, records: () => structuredClone(records),
    resize: (invitedPax, changes = {}) => manage.PATCH(request({ id: "guest-a", invitationId: "event-a", invitedPax, ...changes })),
    assign: (id, tableId, seatNumber) => assign.PATCH(request({ tableId, seatNumber }, id), params(id)),
    swap: (id, targetGuestId) => swap.POST(request({ targetGuestId }, `${id}/swap`, "POST"), params(id)),
  };
}

test("party resizing preserves one Guest, anchor, tokens, check-in and RSVP while updating the generated addressee", async () => {
  const f = fixture({ guests: [baseGuest({ checkedIn: true, rsvpStatus: "ATTENDING", plusOnes: 1 })] }), before = f.records()[0];
  for (const invitedPax of [4, 2]) {
    const response = await f.resize(invitedPax, { name: "hendra baru", category: "VVIP" });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.guest.id, before.id); assert.equal(data.guest.invitedPax, invitedPax);
    assert.equal(Object.hasOwn(data.guest, "personalToken"), false); assert.equal(Object.hasOwn(data.guest, "usherQrToken"), false);
    assert.deepEqual(f.records(), [{ ...before, invitedPax, name: "hendra baru", category: "VVIP", personalAddressee: envelope.buildPersonalGuestAddressee("hendra baru", "BAPAK") }]);
    assert.deepEqual(guestSeats.seatingGuestSeats(f.records()[0], 8), invitedPax === 4 ? [8, 1, 2, 3] : [8, 1]);
    const transaction = f.calls.transactions.at(-1);
    assert.match(transaction.locks[0].sql, /Invitation.*ownerId.*FOR UPDATE/);
    assert.deepEqual(transaction.locks[0].values, ["event-a", "owner-a"]);
    assert.match(transaction.locks[1].sql, /Guest.*invitationId.*FOR UPDATE/);
    assert.equal(transaction.writes.length, 1);
  }
});

test("unassigned parties accept 1–30; custom envelopes and recipient profile are preserved", async () => {
  const f = fixture({ guests: [baseGuest({ tableId: null, seatNumber: null, personalAddressee: "Keluarga Besar Wijaya" })] });
  for (const invitedPax of [30, 1]) {
    assert.equal((await f.resize(invitedPax, { name: "naya" })).status, 200);
    assert.equal(f.records()[0].personalAddressee, "Keluarga Besar Wijaya");
    assert.equal(f.records()[0].recipientType, "FAMILY"); assert.equal(f.records()[0].invitedPax, invitedPax);
    assert.equal(f.records()[0].tableId, null); assert.equal(f.records()[0].seatNumber, null);
  }
});

test("resize rejects occupied blocks, capacity including unanchored reservations, and invalid anchors atomically", async () => {
  const cases = [
    { guests: [baseGuest(), baseGuest({ id: "other", seatNumber: 3, invitedPax: 1 })], pax: 4, error: /bersebelahan/ },
    { guests: [baseGuest(), baseGuest({ id: "other", seatNumber: null, invitedPax: 6 })], pax: 3, error: /Kapasitas/ },
    { guests: [baseGuest(), baseGuest({ id: "other", seatNumber: null, invitedPax: 6, source: "RSVP", rsvpStatus: "NOT_ATTENDING" })], pax: 3, error: /Kapasitas/ },
    { pax: 9, error: /Kapasitas/ },
    { guests: [baseGuest({ seatNumber: 9 })], pax: 3, error: /bersebelahan/ },
  ];
  for (const scenario of cases) {
    const f = fixture(scenario), before = f.records();
    const response = await f.resize(scenario.pax, { name: "must not save", category: "VVIP" });
    assert.equal(response.status, 409); assert.match((await response.json()).error, scenario.error);
    assert.deepEqual(f.records(), before); assert.equal(f.calls.writes.length, 0);
  }
  const f = fixture({ guests: [baseGuest({ seatNumber: null })] });
  assert.equal((await f.resize(4)).status, 200); assert.equal(f.records()[0].seatNumber, null);
});

test("resize validates quota and Bapak & Ibu minimum without altering names or canonical identities", async () => {
  for (const invitedPax of [0, 31, 1.5, "bad"]) {
    const f = fixture(), before = f.records();
    assert.equal((await f.resize(invitedPax, { name: "must not save" })).status, 400);
    assert.deepEqual(f.records(), before); assert.equal(f.calls.writes.length, 0);
  }
  const f = fixture({ guests: [baseGuest({ personalAddressee: envelope.buildPersonalGuestAddressee("hendra", "BAPAK_IBU") })] });
  assert.equal((await f.resize(1)).status, 400); assert.equal(f.records()[0].invitedPax, 2);
});

test("resize reads fresh RSVP, owner and envelope under locks and does not overwrite attendance", async () => {
  const attending = fixture({ beforeTransaction: (records) => Object.assign(records[0], { rsvpStatus: "ATTENDING", plusOnes: 1 }) });
  const response = await attending.resize(1, { name: "must not save" });
  assert.equal(response.status, 409); assert.match((await response.json()).error, /RSVP hadir/);
  assert.equal(attending.records()[0].invitedPax, 2); assert.equal(attending.records()[0].name, "hendra");
  assert.equal(attending.records()[0].plusOnes, 1); assert.equal(attending.calls.writes.length, 0);
  const movedOwner = fixture({ beforeTransaction: (_records, event) => { event.ownerId = "owner-b"; } });
  assert.equal((await movedOwner.resize(3)).status, 404); assert.equal(movedOwner.records()[0].invitedPax, 2);
  const changedEnvelope = fixture({ beforeTransaction: (records) => { records[0].personalAddressee = "Keluarga Wijaya"; } });
  assert.equal((await changedEnvelope.resize(3, { name: "naya" })).status, 200);
  assert.equal(changedEnvelope.records()[0].personalAddressee, "Keluarga Wijaya");
  const checked = fixture({ guests: [baseGuest({ checkedIn: true, rsvpStatus: "ATTENDING", plusOnes: 1 })] });
  assert.equal((await checked.resize(3, { rsvpStatus: "NOT_ATTENDING" })).status, 409);
  assert.equal(checked.records()[0].rsvpStatus, "ATTENDING");
});

test("party resize retains account, event and entitlement boundaries", async () => {
  for (const [options, changes, status] of [
    [{ access: false }, {}, 402], [{}, { invitationId: "event-b" }, 404], [{}, { id: "foreign-guest" }, 404],
    [{ guests: [baseGuest({ invitationId: "event-b" })] }, {}, 404],
  ]) {
    const f = fixture(options), before = f.records();
    assert.equal((await f.resize(3, changes)).status, status); assert.deepEqual(f.records(), before);
    assert.equal(f.calls.writes.length, 0);
  }
});

test("assignment reads a resized party after the shared event lock rather than its old snapshot", async () => {
  const f = fixture({ guests: [baseGuest({ tableId: null, seatNumber: null })], tables: [{ ...baseTable, capacity: 3 }],
    afterOuterLookup: (records) => { records[0].invitedPax = 4; } });
  const response = await f.assign("guest-a", "table-a", 1);
  assert.equal(response.status, 409); assert.match((await response.json()).error, /Rombongan 4/);
  assert.equal(f.records()[0].tableId, null); assert.equal(f.calls.writes.length, 0);
});

test("resize and competing placement serialize at the event and cannot claim the same adjacent seats", async () => {
  const f = fixture({ guests: [baseGuest({ seatNumber: 1 }), baseGuest({ id: "guest-b", tableId: null, seatNumber: null })] });
  const [resized, placed] = await Promise.all([f.resize(4), f.assign("guest-b", "table-a", 3)]);
  assert.equal(resized.status, 200); assert.equal(placed.status, 409);
  assert.equal(f.records()[0].invitedPax, 4); assert.equal(f.records()[1].tableId, null);
  assert.equal(f.calls.writes.length, 1);
});

test("swap reads the current party after event lock, rejects insufficient capacity, and swaps valid blocks intact", async () => {
  const source = baseGuest({ seatNumber: 1 }), target = baseGuest({ id: "guest-b", tableId: "table-b", seatNumber: 1, invitedPax: 1 });
  const smallTables = [baseTable, { ...baseTable, id: "table-b", capacity: 3 }];
  const tooLarge = fixture({ guests: [source, target], tables: smallTables, afterOuterLookup: (records) => { records[0].invitedPax = 4; } });
  assert.equal((await tooLarge.swap("guest-a", "guest-b")).status, 409);
  assert.equal(tooLarge.records()[0].tableId, "table-a"); assert.equal(tooLarge.calls.writes.length, 0);
  const f = fixture({ guests: [source, target], tables: smallTables });
  const response = await f.swap("guest-a", "guest-b"); assert.equal(response.status, 200);
  assert.deepEqual(f.records(), [{ ...source, tableId: "table-b" }, { ...target, tableId: "table-a" }]);
  assert.deepEqual(guestSeats.seatingGuestSeats(f.records()[0], 3), [1, 2]);
});
