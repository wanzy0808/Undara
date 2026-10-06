import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as plans from "../lib/seating/plan.ts";
import { loadSource } from "./helpers/package-access.mjs";

const layout = () => ({ height: 620, tables: { "table-a": { x: 420, y: 310 } }, paths: [[100, 200, 260, 210, 330, 330]] });
const user = { id: "owner-a", role: "USER" };
const origin = loadSource("lib/security/request-origin.ts", {}, { env: { APP_URL: "https://example.test", NODE_ENV: "production" } });
function fixture({ account = user, ownerId = user.id, access = true, plan = null, tableIds = ["table-a"], lock = true, failure, oldClient = false } = {}) {
  const calls = { writes: [], locks: [], access: [], reads: [], tables: [] };
  let stored = plan;
  const event = { id: "event-a", ownerId, payment: { status: "PAID", packageKey: "INVITATION_BASIC" } };
  const readPlan = async ({ where }) => { calls.reads.push(where); if (failure) throw failure instanceof Error ? failure : new Error("Database unavailable"); return stored; };
  const forbidden = async () => { assert.fail("Layout saving must not mutate guests, tables or invitation content"); };
  const tx = {
    $queryRaw: async (_strings, ...values) => { calls.locks.push(values); return lock && values[0] === event.id && values[1] === event.ownerId ? [{ id: event.id }] : []; },
    weddingTable: { findMany: async (query) => { calls.tables.push(query); return tableIds.map((id) => ({ id })); }, update: forbidden, create: forbidden },
    guest: { update: forbidden, updateMany: forbidden },
    invitation: { update: forbidden },
    seatingPlan: {
      findUnique: readPlan,
      upsert: async (query) => {
        calls.writes.push(query);
        stored = { invitationId: query.where.invitationId, layout: stored ? query.update.layout : query.create.layout, updatedAt: new Date("2026-10-06T04:45:00.000Z") };
        return stored;
      },
    },
  };
  const route = loadSource("app/api/seating-plan/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": { getCurrentUser: async () => account },
    "@/lib/prisma": { prisma: {
      invitation: { findFirst: async ({ where }) => where.id === event.id && where.ownerId === ownerId ? event : null },
      seatingPlan: oldClient ? undefined : { findUnique: readPlan },
      $transaction: async (callback) => callback(tx),
    } },
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async (...args) => { calls.access.push(args); return access; } },
    "@/lib/security/request-origin": origin,
    "@/lib/seating/plan": plans,
  });
  return { route, calls, stored: () => stored };
}
const put = (body = { invitationId: "event-a", layout: layout(), updatedAt: null }, headers = {}) => new Request("https://example.test/api/seating-plan", {
  method: "PUT", headers: { Origin: "https://example.test", "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body),
});
const get = (invitationId = "event-a") => new Request(`https://example.test/api/seating-plan?invitationId=${invitationId}`);

test("the private seating model stores one event record and cascades with that event", () => {
  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../prisma/migrations/20261006043000_event_seating_plan/migration.sql", import.meta.url), "utf8");
  assert.match(schema, /model SeatingPlan \{\s+invitationId String\s+@id/);
  assert.match(migration, /PRIMARY KEY \("invitationId"\)/);
  assert.match(migration, /"layout" JSONB NOT NULL/);
  assert.match(migration, /REFERENCES "Invitation"\("id"\) ON DELETE CASCADE/);
});

test("layout codec preserves vector geometry, normalizes precision and discards arbitrary canvas properties", () => {
  const result = plans.parseSeatingPlan({ ...layout(), arbitraryUrl: "https://outside.test", tables: { "table-a": { x: 2, y: 300.3, name: "not stored" } } });
  assert.deepEqual(result, { height: 620, tables: { "table-a": { x: 110, y: 300 } }, paths: layout().paths });
  assert.equal(plans.parseSeatingPlan(JSON.parse(JSON.stringify(result))).paths[0].length, 6);
});

test("codec rejects invalid heights, out-of-board points, malformed paths and over-limit data", () => {
  const cases = [null, [], {}, { ...layout(), height: 600 }, { ...layout(), height: 6001 },
    { ...layout(), tables: { "table-a": { x: -1, y: 300 } } },
    { ...layout(), tables: { "table-a": { x: 300, y: 621 } } },
    { ...layout(), tables: { "table-a": { x: Infinity, y: 300 } } },
    { ...layout(), paths: [[1, 2, 3]] }, { ...layout(), paths: [[1, 2]] },
    { ...layout(), paths: [["1", 2, 3, 4]] }, { ...layout(), paths: [[1, 2, NaN, 4]] },
    { ...layout(), paths: [[0, 0, 1101, 620]] },
    { ...layout(), paths: Array.from({ length: 21 }, () => [0, 0, 100, 100]) },
    { ...layout(), paths: [Array(2050).fill(0)] },
    { ...layout(), tables: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`table-${i}`, { x: 300, y: 300 }])) },
  ];
  for (const value of cases) assert.equal(plans.parseSeatingPlan(value), null);
});

test("geometry accommodates 100 tables and maps pointer coordinates through scaled/scrolled canvas bounds", () => {
  assert.equal(plans.seatingCanvasHeight(0), 620);
  assert.equal(plans.seatingCanvasHeight(100), 5155);
  assert.deepEqual(plans.seatingPointFromClient({ x: 250, y: 105 }, { left: 30, top: -50, width: 550, height: 310 }, 620), { x: 440, y: 310 });
  assert.equal(plans.seatingPointFromClient({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 }, 620), null);
  const cleaned = plans.seatingPlanForTables({ ...layout(), tables: { ...layout().tables, removed: { x: 300, y: 300 } } }, ["table-a"]);
  assert.deepEqual(Object.keys(cleaned.tables), ["table-a"]);
  assert.deepEqual(cleaned.paths, layout().paths);
});

test("actual GET returns an empty or saved event layout with private no-store headers", async () => {
  for (const plan of [null, { layout: layout(), updatedAt: new Date("2026-10-06T04:44:00.000Z") }]) {
    const { route } = fixture({ plan });
    const response = await route.GET(get());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { layout: plan?.layout ?? null, updatedAt: plan?.updatedAt.toISOString() ?? null });
  }
});

test("actual GET/PUT enforce session, event ownership and the existing Digital entitlement", async () => {
  for (const [options, expected] of [[{ account: null }, 401], [{ ownerId: "owner-b" }, 404], [{ access: false }, 402]]) {
    for (const method of ["GET", "PUT"]) {
      const { route, calls } = fixture(options);
      assert.equal((await route[method](method === "GET" ? get() : put())).status, expected);
      assert.equal(calls.writes.length, 0);
      assert.equal(calls.reads.length, 0);
    }
  }
});

test("actual Save creates then updates the same event record without guest/table/content writes", async () => {
  const { route, calls, stored } = fixture();
  const first = await route.PUT(put());
  assert.equal(first.status, 200);
  const data = await first.json();
  assert.deepEqual(data.layout, layout());
  const next = { ...layout(), paths: [[50, 50, 100, 200]], tables: { "table-a": { x: 550, y: 330 } } };
  const second = await route.PUT(put({ invitationId: "event-a", layout: next, updatedAt: data.updatedAt }));
  assert.equal(second.status, 200);
  assert.deepEqual(calls.locks, [["event-a", user.id], ["event-a", user.id]]);
  assert.ok(calls.tables.every((query) => query.where.invitationId === "event-a"));
  assert.ok(calls.writes.every((query) => query.where.invitationId === "event-a" && query.create.invitationId === "event-a"));
  assert.deepEqual(stored().layout, next);
  assert.deepEqual((await (await route.GET(get())).json()).layout, next);
});

test("foreign/deleted table IDs and ownership changes under the event lock cannot save", async () => {
  for (const options of [{ tableIds: ["other-table"] }, { lock: false }]) {
    const { route, calls } = fixture(options);
    assert.equal((await route.PUT(put())).status, options.lock === false ? 404 : 409);
    assert.equal(calls.writes.length, 0);
  }
});

test("a stale or first-save snapshot cannot overwrite another session's existing plan", async () => {
  const plan = { layout: layout(), updatedAt: new Date("2026-10-06T04:44:00.000Z") };
  for (const updatedAt of [null, "2026-10-06T04:43:00.000Z"]) {
    const { route, calls } = fixture({ plan });
    assert.equal((await route.PUT(put({ invitationId: "event-a", layout: layout(), updatedAt }))).status, 409);
    assert.equal(calls.writes.length, 0);
  }
});

test("untrusted origins, malformed JSON, missing revision, invalid layouts and oversized bodies fail closed", async () => {
  const cases = [
    [put(undefined, { Origin: "https://other.test" }), 403],
    [put(undefined, { Origin: "" }), 403],
    [put(undefined, { "Content-Type": "text/plain" }), 415],
    [put("{"), 400], [put({ invitationId: "event-a", layout: layout() }), 400],
    [put({ invitationId: "event-a", layout: layout(), updatedAt: "invalid" }), 400],
    [put({ invitationId: "event-a", layout: { ...layout(), paths: [[0, 0, 1, 10000]] }, updatedAt: null }), 400],
    [put(" ".repeat(plans.SEATING_MAX_BODY_BYTES + 1)), 413],
  ];
  for (const [request, expected] of cases) {
    const { route, calls } = fixture();
    assert.equal((await route.PUT(request)).status, expected);
    assert.equal(calls.writes.length, 0);
  }
});

test("missing events and temporary database failures return useful errors without leaking layouts", async () => {
  assert.equal((await fixture().route.GET(get(""))).status, 400);
  const response = await fixture({ failure: true }).route.GET(get());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Denah belum dapat dimuat. Coba lagi." });
});

test("missing seating storage/schema returns a private actionable 503 instead of an empty saved plan", async () => {
  for (const code of ["P2021", "P2022"]) {
    const failure = Object.assign(new Error("Private database table/column details"), { code });
    for (const method of ["GET", "PUT"]) {
      const { route, calls } = fixture({ failure });
      const response = await route[method](method === "GET" ? get() : put());
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.deepEqual(await response.json(), { error: "Penyimpanan denah belum siap. Silakan hubungi pengelola.", code: "SEATING_STORAGE_UNAVAILABLE" });
      assert.equal(calls.writes.length, 0);
    }
  }
});

test("a cached pre-migration Prisma client is detected after ownership/access checks without writes", async () => {
  for (const method of ["GET", "PUT"]) {
    const { route, calls } = fixture({ oldClient: true });
    const response = await route[method](method === "GET" ? get() : put());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "SEATING_STORAGE_UNAVAILABLE");
    assert.equal(calls.reads.length, 0);
    assert.equal(calls.writes.length, 0);
    assert.equal(calls.locks.length, 0);
    for (const [options, status] of [[{ account: null }, 401], [{ ownerId: "other-owner" }, 404], [{ access: false }, 402]]) {
      const blocked = fixture({ ...options, oldClient: true });
      assert.equal((await blocked.route[method](method === "GET" ? get() : put())).status, status);
    }
  }
});
