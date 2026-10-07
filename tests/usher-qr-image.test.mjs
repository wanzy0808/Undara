import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import ts from "typescript";
import QRCode from "qrcode";
import { createGuestQrToken, verifyGuestQrToken } from "../lib/usher/qr.ts";
import { hasPaidDigitalInvitation } from "../lib/packages/access.ts";
import { usherQrImageUrl } from "../components/Usher/utils.ts";
import * as weddingSessions from "../lib/events/wedding-sessions.ts";

const previousSecret = process.env.QR_SIGNING_SECRET;
before(() => { process.env.QR_SIGNING_SECRET = "test-only-owner-qr-image-secret"; });
after(() => {
  if (previousSecret === undefined) delete process.env.QR_SIGNING_SECRET;
  else process.env.QR_SIGNING_SECRET = previousSecret;
});

const source = readFileSync(new URL("../app/api/usher/qr/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function loadHandler({ user = { id: "owner-a" }, guest, ownerGrant = false, trustedOrigin = true, render = QRCode.toBuffer } = {}) {
  const record = guest === undefined ? {
    id: "guest-qr-test", invitationId: "invitation-a", name: "Test Guest", phone: null,
    rsvpStatus: "PENDING", plusOnes: 0,
    invitation: { ownerId: "owner-a", isPublished: false, payment: { packageKey: "INVITATION_BASIC", status: "PAID" } },
  } : guest;
  const calls = { queries: [], renders: [], fetches: [], entitlements: [] };
  const modules = {
    "@/lib/events/wedding-sessions": weddingSessions,
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    qrcode: { toBuffer: (...args) => { calls.renders.push(structuredClone(args)); return render(...args); } },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": { prisma: { guest: {
      findFirst: async (query) => {
        calls.queries.push(query);
        return record?.id === query.where.id && record?.invitation.ownerId === query.where.invitation.ownerId ? record : null;
      },
      findUnique: async (query) => record?.id === query.where.id ? record : null,
    } } },
    "@/lib/security/request-origin": { isTrustedMutationOrigin: () => trustedOrigin },
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async (userId, payment) => {
      calls.entitlements.push([userId, payment]);
      return hasPaidDigitalInvitation(payment) || ownerGrant;
    } },
    "@/lib/usher/qr": { createGuestQrToken, verifyGuestQrToken },
  };
  const routeModule = { exports: {} };
  const run = new Function("require", "exports", "module", "console", "fetch", compiled);
  run((id) => {
    assert.ok(Object.hasOwn(modules, id), `Unexpected route dependency: ${id}`);
    return modules[id];
  }, routeModule.exports, routeModule, { error() {} }, (...args) => {
    calls.fetches.push(args);
    throw new Error("Guest tickets must not be sent to an external QR renderer");
  });
  return { ...routeModule.exports, calls };
}

function imageRequest(token, download = false) {
  return new Request(`https://undara.example.test/api/usher/qr?token=${encodeURIComponent(token)}${download ? "&download=1" : ""}`);
}

test("owner QR image rejects invalid access and tampered tickets before encoding", async (t) => {
  const token = createGuestQrToken("guest-qr-test");
  const baseGuest = { id: "guest-qr-test", invitation: { ownerId: "owner-a" } };
  const cases = [
    { name: "no session", options: { user: null }, status: 401 },
    { name: "missing token", token: "", status: 400 },
    { name: "oversized token", token: "x".repeat(257), status: 400 },
    { name: "invalid token", token: "not-a-ticket", status: 403 },
    { name: "tampered token", token: token.replace("guest-qr-test", "other-guest"), status: 403 },
    { name: "missing guest", options: { guest: null }, status: 404 },
    { name: "another event owner", options: { user: { id: "owner-b" } }, status: 404 },
    { name: "unpaid event", payment: { packageKey: "INVITATION_BASIC", status: "PENDING" }, status: 402 },
    { name: "wrong paid package", payment: { packageKey: "WA_BLAST", status: "PAID" }, status: 402 },
  ];
  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const options = entry.payment
        ? { guest: { ...baseGuest, invitation: { ...baseGuest.invitation, payment: entry.payment } } }
        : entry.options;
      const { GET, calls } = loadHandler(options);
      const response = await GET(imageRequest(entry.token ?? token));
      assert.equal(response.status, entry.status);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
      assert.equal(typeof (await response.json()).error, "string");
      assert.equal(calls.renders.length, 0);
      assert.equal(calls.fetches.length, 0);
      if ([400, 401, 403].includes(entry.status)) assert.equal(calls.queries.length, 0);
    });
  }
});

test("owner QR renders the exact signed ticket as PNG, including an owned draft/pending guest", async (t) => {
  const token = createGuestQrToken("guest-qr-test");
  for (const download of [false, true]) {
    await t.test(download ? "download" : "preview", async () => {
      const { GET, calls } = loadHandler();
      const response = await GET(imageRequest(token, download));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/png");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("content-disposition"), `${download ? "attachment" : "inline"}; filename="undara-tamu-qr.png"`);
      const png = Buffer.from(await response.arrayBuffer());
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(png.readUInt32BE(16), 640);
      assert.equal(png.readUInt32BE(20), 640);
      assert.equal(Number(response.headers.get("content-length")), png.byteLength);
      assert.deepEqual(calls.queries[0].where, { id: "guest-qr-test", invitation: { ownerId: "owner-a" } });
      assert.deepEqual(calls.entitlements[0], ["owner-a", { packageKey: "INVITATION_BASIC", status: "PAID" }]);
      assert.equal(calls.renders[0][0], token);
      assert.equal(verifyGuestQrToken(calls.renders[0][0]), "guest-qr-test");
      assert.equal(calls.fetches.length, 0);
    });
  }
});

test("owner QR image preserves explicit owner package grants", async () => {
  const { GET } = loadHandler({ ownerGrant: true, guest: {
    id: "guest-qr-test", invitation: { ownerId: "owner-a", payment: null },
  } });
  assert.equal((await GET(imageRequest(createGuestQrToken("guest-qr-test")))).status, 200);
});

test("owner QR generation failure exposes no encoder detail", async () => {
  const { GET } = loadHandler({ render: async () => { throw new Error("private encoder detail"); } });
  const response = await GET(imageRequest(createGuestQrToken("guest-qr-test")));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "QR belum dapat dimuat." });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("ticket issuing POST keeps trusted-origin validation and its signed token response", async () => {
  const request = () => new Request("https://undara.example.test/api/usher/qr", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guestId: "guest-qr-test" }),
  });
  assert.equal((await loadHandler({ trustedOrigin: false }).POST(request())).status, 403);
  const { POST, calls } = loadHandler();
  const response = await POST(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.guest.id, "guest-qr-test");
  assert.equal(verifyGuestQrToken(body.token), body.guest.id);
  assert.equal(calls.renders.length, 0);
  assert.equal(calls.fetches.length, 0);
});

test("Usher image URL stays same-origin and preserves the encoded ticket", () => {
  const token = createGuestQrToken("guest-qr-test");
  const url = new URL(usherQrImageUrl(token), "https://undara.example.test");
  assert.equal(url.origin, "https://undara.example.test");
  assert.equal(url.pathname, "/api/usher/qr");
  assert.equal(verifyGuestQrToken(url.searchParams.get("token")), "guest-qr-test");
  assert.equal(new URL(usherQrImageUrl("ticket?x=1&another=2 +"), url.origin).searchParams.get("token"), "ticket?x=1&another=2 +");
});

test("invitation and guest QR renderers do not reference the retired external services", () => {
  for (const path of [
    "../app/api/invitations/qr/route.ts", "../app/api/usher/qr/route.ts",
    "../components/Usher/utils.ts", "../components/Usher/UsherWorkspace.tsx",
    "../components/Dashboard/RsvpAnalyticsPanel.tsx",
  ]) {
    assert.doesNotMatch(readFileSync(new URL(path, import.meta.url), "utf8"), /quickchart\.io\/qr|api\.qrserver\.com\/v1\/create-qr-code/);
  }
});
