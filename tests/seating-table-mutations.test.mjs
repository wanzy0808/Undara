import assert from "node:assert/strict";
import test from "node:test";
import * as plans from "../lib/seating/plan.ts";
import { loadSource } from "./helpers/package-access.mjs";

const stamp = "2026-10-06T05:00:00.000Z";
const origin = loadSource("lib/security/request-origin.ts", {}, { env: { APP_URL: "https://example.test", NODE_ENV: "production" } });
const table = (id, name = "Meja 1", invitationId = "event-a") => ({ id, name, invitationId, capacity: 8, shape: "ROUND" });
const request = (method, body, headers = {}) => new Request("https://example.test/api/seating-plan", {
  method, headers: { Origin: "https://example.test", "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body),
});
const clearBody = { invitationId: "event-a", tableIds: ["table-a"], updatedAt: stamp };

function fixture(options = {}) {
  let state = {
    tables: options.tables ?? [table("table-a"), table("table-b", "Other event", "event-b")],
    guests: [
      { id: "guest-a", invitationId: "event-a", tableId: "table-a", seatNumber: 2, name: "Naya", source: "RSVP", rsvpStatus: "ATTENDING", invitedPax: 3, checkedIn: true, personalToken: "keep-private-token" },
      { id: "guest-b", invitationId: "event-b", tableId: "table-b", seatNumber: 1, name: "Arga", rsvpStatus: "PENDING" },
    ],
    plan: { invitationId: "event-a", layout: { height: 620, tables: { "table-a": { x: 420, y: 310 } }, paths: [[100, 100, 500, 300]] }, updatedAt: new Date(stamp) },
  };
  const calls = { transactions: 0, locks: [], writes: [], access: [] };
  let serial = 0, tail = Promise.resolve();
  const prisma = {
    invitation: { findFirst: async ({ where }) => where.id === "event-a" && where.ownerId === "owner-a" ? { id: "event-a", ownerId: "owner-a", payment: { status: "PAID" } } : null },
    seatingPlan: options.oldClient ? undefined : { findUnique: async () => state.plan },
    async $transaction(callback) {
      calls.transactions++;
      // Database boundary serializes the event lock; commits/rollbacks are modeled separately.
      const previous = tail;
      let release;
      tail = new Promise((resolve) => { release = resolve; });
      await previous;
      const draft = structuredClone(state);
      try {
        const tx = {
          $queryRaw: async (sql, ...values) => { calls.locks.push({ sql: sql.join("?"), values }); return options.lock === false ? [] : [{ id: "event-a" }]; },
          weddingTable: {
            findMany: async ({ where }) => draft.tables.filter((item) => item.invitationId === where.invitationId),
            create: async ({ data }) => {
              if (options.failCreateAt === ++serial) throw new Error("Creation failed");
              const created = { id: `created-${serial}`, ...data };
              calls.writes.push(["create", data]); draft.tables.push(created); return created;
            },
            deleteMany: async ({ where }) => { calls.writes.push(["delete", where]); draft.tables = draft.tables.filter((item) => item.invitationId !== where.invitationId); return { count: 1 }; },
          },
          guest: { updateMany: async ({ where, data }) => { calls.writes.push(["guest", where, data]); draft.guests = draft.guests.map((guest) => guest.invitationId === where.invitationId ? { ...guest, ...data } : guest); return { count: 1 }; } },
          seatingPlan: {
            findUnique: async () => { if (options.schemaError) throw Object.assign(new Error("Private schema details"), { code: "P2021" }); return draft.plan; },
            upsert: async ({ where, update }) => {
              if (options.failReset) throw new Error("Storage failed");
              calls.writes.push(["plan", where, update]); draft.plan = { invitationId: where.invitationId, layout: update.layout, updatedAt: new Date("2026-10-06T05:01:00.000Z") }; return draft.plan;
            },
          },
        };
        const result = await callback(tx);
        state = draft;
        return result;
      } finally { release(); }
    },
  };
  const storage = loadSource("lib/seating/table-storage.ts", { "@/lib/prisma": { prisma } });
  const dependencies = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getCurrentUser: async () => options.signedOut ? null : { id: "owner-a", role: "USER" } },
    "@/lib/prisma": { prisma },
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async (...args) => { calls.access.push(args); return options.access !== false; } },
    "@/lib/security/request-origin": origin,
  };
  return {
    calls, state: () => structuredClone(state),
    tables: loadSource("app/api/tables/route.ts", { ...dependencies, "@/lib/seating/table-storage": storage }),
    legacy: loadSource("app/api/wedding-tables/route.ts", { ...dependencies, "@/lib/seating/table-storage": storage }),
    layout: loadSource("app/api/seating-plan/route.ts", { ...dependencies, "@/lib/seating/plan": plans }),
  };
}

test("batch Add appends numbered tables under one event lock without touching guests or saved geometry", async () => {
  const f = fixture({ tables: [table("a", "Meja 4"), table("b", "Table 7"), table("foreign", "Meja 100", "event-b")] });
  const before = f.state();
  const response = await f.tables.POST(request("POST", { invitationId: "event-a", count: 2, capacity: 12, locale: "en" }));
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.deepEqual(data.tables.map((item) => [item.name, item.capacity, item.invitationId]), [["Table 8", 12, "event-a"], ["Table 9", 12, "event-a"]]);
  assert.deepEqual(f.state().tables.slice(0, before.tables.length), before.tables);
  assert.deepEqual(f.state().guests, before.guests);
  assert.deepEqual(f.state().plan, before.plan);
  assert.equal(f.calls.transactions, 1);
  assert.match(f.calls.locks[0].sql, /FOR UPDATE/);
  assert.deepEqual(f.calls.locks[0].values, ["event-a", "owner-a"]);
});

test("existing single-table endpoints retain their response shape and share the creation lock", async () => {
  for (const endpoint of ["tables", "legacy"]) {
    const f = fixture();
    const response = await f[endpoint].POST(request("POST", { invitationId: "event-a", name: "VIP", capacity: 4, shape: "SQUARE" }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).table.name, "VIP");
    assert.equal(f.calls.locks.length, 1);
  }
});

test("table Add validates count/capacity/shape/session/origin/ownership/entitlement before mutation", async () => {
  const body = { invitationId: "event-a", count: 2, capacity: 8 };
  const cases = [
    [{}, { ...body, count: 0 }, {}, 400], [{}, { ...body, count: 101 }, {}, 400], [{}, { ...body, count: 1.5 }, {}, 400],
    [{}, { ...body, capacity: 51 }, {}, 400], [{}, { ...body, shape: "UNKNOWN" }, {}, 400], [{}, "{", {}, 400],
    [{ signedOut: true }, body, {}, 401], [{ access: false }, body, {}, 402],
    [{}, { ...body, invitationId: "event-b" }, {}, 402], [{}, body, { Origin: "https://other.test" }, 403],
  ];
  for (const [options, payload, headers, status] of cases) {
    const f = fixture(options);
    assert.equal((await f.tables.POST(request("POST", payload, headers))).status, status);
    assert.equal(f.calls.transactions, 0); assert.equal(f.calls.writes.length, 0);
  }
});

test("table-limit conflicts and partial database errors leave the whole batch unchanged", async () => {
  for (const options of [{ tables: Array.from({ length: 99 }, (_, i) => table(`t-${i}`, `Meja ${i + 1}`)) }, { failCreateAt: 2 }, { lock: false }]) {
    const f = fixture(options), before = f.state();
    const response = await f.tables.POST(request("POST", { invitationId: "event-a", count: 2, capacity: 8 }));
    assert.equal(response.status, options.failCreateAt ? 500 : options.lock === false ? 404 : 409);
    assert.deepEqual(f.state(), before);
  }
});

test("serialized concurrent additions cannot exceed the event's 100-table allowance", async () => {
  const f = fixture({ tables: Array.from({ length: 99 }, (_, i) => table(`t-${i}`, `Meja ${i + 1}`)) });
  const responses = await Promise.all([1, 2].map(() => f.tables.POST(request("POST", { invitationId: "event-a", count: 1, capacity: 8 }))));
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(f.state().tables.length, 100); assert.equal(f.calls.locks.length, 2);
});

test("Empty commits tables, routes and placements together while preserving guest identity/RSVP/tickets and other events", async () => {
  const f = fixture(), before = f.state();
  const response = await f.layout.DELETE(request("DELETE", clearBody));
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual((await response.json()).layout, plans.emptySeatingPlan());
  const after = f.state();
  assert.deepEqual(after.tables, [before.tables[1]]);
  assert.deepEqual(after.guests[0], { ...before.guests[0], tableId: null, seatNumber: null });
  assert.deepEqual(after.guests[1], before.guests[1]);
  assert.deepEqual(after.plan.layout, plans.emptySeatingPlan());
  assert.equal(f.calls.transactions, 1);
  assert.deepEqual(f.calls.writes.map((call) => call[0]), ["delete", "guest", "plan"]);
  assert.deepEqual(f.calls.writes[1], ["guest", { invitationId: "event-a" }, { tableId: null, seatNumber: null }]);
  const read = await f.layout.GET(new Request("https://example.test/api/seating-plan?invitationId=event-a"));
  assert.deepEqual((await read.json()).layout, plans.emptySeatingPlan());
  assert.equal((await f.tables.POST(request("POST", { invitationId: "event-a", count: 1, capacity: 8 }))).status, 201);
  assert.equal(f.state().tables.at(-1).name, "Meja 1");
});

test("stale layout/table snapshots and ownership changes block Empty without any data writes", async () => {
  for (const [options, body, status] of [
    [{}, { ...clearBody, updatedAt: null }, 409], [{}, { ...clearBody, tableIds: [] }, 409],
    [{}, { ...clearBody, tableIds: ["table-b"] }, 409], [{ lock: false }, clearBody, 404],
  ]) {
    const f = fixture(options), before = f.state();
    assert.equal((await f.layout.DELETE(request("DELETE", body))).status, status);
    assert.deepEqual(f.state(), before); assert.equal(f.calls.writes.length, 0);
  }
  const f = fixture();
  await f.tables.POST(request("POST", { invitationId: "event-a", count: 1, capacity: 8 }));
  const before = f.state();
  assert.equal((await f.layout.DELETE(request("DELETE", clearBody))).status, 409);
  assert.deepEqual(f.state(), before);
});

test("Empty enforces trusted JSON, exact IDs, session, event ownership and Digital entitlement", async () => {
  const cases = [
    [{}, clearBody, { Origin: "https://other.test" }, 403], [{}, clearBody, { "Content-Type": "text/plain" }, 415],
    [{}, "{", {}, 400], [{}, { ...clearBody, updatedAt: undefined }, {}, 400], [{}, { ...clearBody, tableIds: ["table-a", "table-a"] }, {}, 400],
    [{}, { ...clearBody, tableIds: Array(101).fill("a") }, {}, 400], [{}, { ...clearBody, tableIds: [null] }, {}, 400],
    [{}, " ".repeat(plans.SEATING_MAX_BODY_BYTES + 1), {}, 413], [{ signedOut: true }, clearBody, {}, 401],
    [{}, { ...clearBody, invitationId: "event-b" }, {}, 404], [{ access: false }, clearBody, {}, 402],
  ];
  for (const [options, body, headers, status] of cases) {
    const f = fixture(options), before = f.state();
    assert.equal((await f.layout.DELETE(request("DELETE", body, headers))).status, status);
    assert.deepEqual(f.state(), before); assert.equal(f.calls.transactions, 0);
  }
});

test("unavailable storage and reset failures retain tables and placements instead of partially emptying", async () => {
  for (const options of [{ oldClient: true }, { schemaError: true }, { failReset: true }]) {
    const f = fixture(options), before = f.state();
    const response = await f.layout.DELETE(request("DELETE", clearBody));
    assert.equal(response.status, options.failReset ? 500 : 503);
    assert.deepEqual(f.state(), before);
    assert.doesNotMatch(JSON.stringify(await response.json()), /Private schema details|Storage failed/);
  }
});
