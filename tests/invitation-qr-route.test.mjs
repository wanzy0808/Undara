import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import ts from "typescript";
import QRCode from "qrcode";
import { invitationQrFilename } from "../lib/invitations/qr.ts";
import { invitationQrDownloadCard } from "../lib/invitations/qr-card.ts";
import { createGuestQrToken, verifyGuestQrToken } from "../lib/usher/qr.ts";
import { hasPaidDigitalInvitation, hasPaidGuestbook } from "../lib/packages/access.ts";
import { loadPackageAccess, loadSource } from "./helpers/package-access.mjs";

const previousSecret = process.env.QR_SIGNING_SECRET;
before(() => { process.env.QR_SIGNING_SECRET = "test-only-admission-card-secret"; });
after(() => {
  if (previousSecret === undefined) delete process.env.QR_SIGNING_SECRET;
  else process.env.QR_SIGNING_SECRET = previousSecret;
});

const source = readFileSync(new URL("../app/api/invitations/qr/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

// Exercise the real handler with authentication/database boundaries replaced;
// the PNG encoder and entitlement/signature helpers remain the production code.
function loadHandler({ user = { id: "owner-a" }, invitation, guest = { id: "guest-a", invitationId: "invitation-a", name: "Naya" }, render = QRCode.toBuffer, cardRender = invitationQrDownloadCard, grants, grantError } = {}) {
  const record = invitation === undefined
    ? { id: "invitation-a", ownerId: "owner-a", title: "Acara Keluarga", payment: { packageKey: "INVITATION_BASIC", status: "PAID" } }
    : invitation;
  const calls = { queries: [], guestQueries: [], renders: [], cards: [], fetches: [], errors: [] };
  const packageAccess = loadPackageAccess({ grants, grantError });
  calls.grantQueries = packageAccess.queries;
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    qrcode: { toBuffer: (...args) => { calls.renders.push(structuredClone(args)); return render(...args); } },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": { prisma: { invitation: { findFirst: async (query) => {
      calls.queries.push(query);
      return record?.id === query.where.id && record?.ownerId === query.where.ownerId ? record : null;
    } }, guest: { findFirst: async (query) => {
      calls.guestQueries.push(query);
      return guest?.id === query.where.id && guest?.invitationId === query.where.invitationId ? guest : null;
    } } } },
    "@/lib/invitations/qr": { invitationQrFilename },
    "@/lib/usher/qr": { createGuestQrToken },
    "@/lib/invitations/qr-card": { invitationQrDownloadCard: (...args) => { calls.cards.push(args); return cardRender(...args); } },
    "@/lib/packages/server-access": packageAccess.access,
  };
  const routeModule = { exports: {} };
  const run = new Function("require", "exports", "module", "process", "console", "fetch", compiled);
  run((id) => {
    assert.ok(Object.hasOwn(modules, id), `Unexpected route dependency: ${id}`);
    return modules[id];
  }, routeModule.exports, routeModule, { env: {} }, {
    error: (...args) => calls.errors.push(args),
  }, (...args) => {
    calls.fetches.push(args);
    throw new Error("QR generation must not call an external renderer");
  });
  return { GET: routeModule.exports.GET, calls };
}

test("invitation QR rejects unauthenticated, malformed, missing, other-owner and unpaid requests before rendering", async (t) => {
  const cases = [
    { name: "unauthenticated", options: { user: null }, status: 401 },
    { name: "malformed ID", id: "../another", status: 400 },
    { name: "missing guest ID", guestId: "", status: 400 },
    { name: "malformed guest ID", guestId: "../guest", status: 400 },
    { name: "missing guest", options: { guest: null }, status: 404 },
    { name: "guest from another event", options: { guest: { id: "guest-a", invitationId: "invitation-b", name: "Naya" } }, status: 404 },
    { name: "missing invitation", options: { invitation: null }, status: 404 },
    { name: "different owner", options: { user: { id: "owner-b" } }, status: 404 },
    { name: "different owner with a manual grant", options: { user: { id: "owner-b" }, grants: { "owner-b": { digital: true } } }, status: 404 },
    { name: "unpaid", payment: { packageKey: "INVITATION_BASIC", status: "PENDING" }, status: 402 },
    { name: "no payment", payment: null, status: 402 },
    { name: "wrong package", payment: { packageKey: "WA_BLAST", status: "PAID" }, status: 402 },
  ];
  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const options = entry.payment !== undefined
        ? { invitation: { id: "invitation-a", ownerId: "owner-a", payment: entry.payment } }
        : entry.options;
      const { GET, calls } = loadHandler(options);
      const response = await GET(new Request(`https://undara.example.test/api/invitations/qr?invitationId=${encodeURIComponent(entry.id ?? "invitation-a")}&guestId=${encodeURIComponent(entry.guestId ?? "guest-a")}`));
      assert.equal(response.status, entry.status);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(typeof (await response.json()).error, "string");
      assert.equal(calls.renders.length, 0);
      assert.equal(calls.fetches.length, 0);
    });
  }
});

test("paid owner gets byte-identical branded previews and downloads in both languages without a provider request", async (t) => {
  for (const locale of ["id", "en"]) {
    const images = [];
    for (const download of [false, true]) {
      await t.test(`${locale} ${download ? "download" : "preview"}`, async () => {
        const { GET, calls } = loadHandler();
        const response = await GET(new Request(`https://request.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a${download ? "&download=1" : ""}&locale=${locale}`));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), "image/png");
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.equal(response.headers.get("content-disposition"), `${download ? "attachment" : "inline"}; filename="undara-tiket-masuk-acara-keluarga-naya.png"`);
        const png = Buffer.from(await response.arrayBuffer());
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.equal(png.readUInt32BE(16), 900);
        assert.equal(png.readUInt32BE(20), 1320);
        assert.equal(Number(response.headers.get("content-length")), png.byteLength);
        assert.deepEqual(calls.queries[0].where, { id: "invitation-a", ownerId: "owner-a" });
        assert.equal(calls.queries[0].select.title, true);
        assert.deepEqual(calls.guestQueries[0].where, { id: "guest-a", invitationId: "invitation-a" });
        assert.equal(verifyGuestQrToken(calls.renders[0][0]), "guest-a");
        assert.equal(response.headers.get("referrer-policy"), "no-referrer");
        assert.deepEqual(calls.renders, [[createGuestQrToken("guest-a"), {
          type: "png", width: 640, margin: 4, errorCorrectionLevel: "M",
        }]]);
        assert.equal(calls.fetches.length, 0);
        assert.equal(calls.errors.length, 0);
        assert.equal(calls.cards.length, 1);
        assert.deepEqual(calls.cards[0].slice(1), ["Acara Keluarga", "Naya", locale]);
        images.push(png);
      });
    }
    assert.deepEqual(images[0], images[1]);
  }
});

test("preview and download locales select only ID or EN and cannot replace the saved event title or QR target", async () => {
  for (const download of [false, true]) {
    for (const [locale, expected] of [["en", "en"], ["id", "id"], ["../../fonts", "id"]]) {
      const { GET, calls } = loadHandler();
      const response = await GET(new Request(`https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a${download ? "&download=1" : ""}&locale=${encodeURIComponent(locale)}&title=Another%20Event`));
      assert.equal(response.status, 200);
      assert.deepEqual(calls.cards[0].slice(1), ["Acara Keluarga", "Naya", expected]);
      assert.equal(calls.renders[0][0], createGuestQrToken("guest-a"));
      assert.equal(calls.fetches.length, 0);
    }
  }
});

test("card previews and downloads retain authentication, invitation ownership and payment guards before composition", async () => {
  for (const download of [false, true]) {
    for (const [options, status] of [[{ user: null }, 401], [{ user: { id: "owner-b" }, grants: { "owner-b": { digital: true } } }, 404], [{ invitation: { id: "invitation-a", ownerId: "owner-a", payment: null } }, 402]]) {
      const { GET, calls } = loadHandler(options);
      const response = await GET(new Request(`https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a${download ? "&download=1" : ""}&locale=en`));
      assert.equal(response.status, status);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(calls.renders.length, 0);
      assert.equal(calls.cards.length, 0);
    }
  }
});

test("card composition errors stay private and a retry recovers the matching preview or download", async () => {
  for (const download of [false, true]) {
    let fail = true;
    const { GET, calls } = loadHandler({ cardRender: async (...args) => {
      if (fail) throw new Error("private font/image detail");
      return invitationQrDownloadCard(...args);
    } });
    const request = () => new Request(`https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a${download ? "&download=1" : ""}`);
    const failed = await GET(request());
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await failed.json(), { error: "QR belum dapat dibuat. Coba lagi." });
    assert.equal(calls.errors.length, 1);
    assert.equal(calls.cards.length, 1);
    fail = false;
    const recovered = await GET(request());
    assert.equal(recovered.status, 200);
    const png = Buffer.from(await recovered.arrayBuffer());
    assert.equal(png.readUInt32BE(16), 900);
    assert.equal(png.readUInt32BE(20), 1320);
    assert.equal(calls.cards.length, 2);
    assert.equal(calls.fetches.length, 0);
  }
});

test("QR download follows the saved event title while keeping unsafe characters out of response headers", async () => {
  const invitation = { id: "invitation-a", ownerId: "owner-a", title: "Ulang Tahun Naya", payment: { packageKey: "INVITATION_BASIC", status: "PAID" } };
  const guest = { id: "guest-a", invitationId: "invitation-a", name: "Naya" };
  const { GET, calls } = loadHandler({ invitation, guest });
  const request = () => new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a&download=1");
  for (const [title, name] of [
    ["Ulang Tahun Naya", "ulang-tahun-naya"],
    ['Fête / Naya "B"\r\n', "fete-naya-b"],
    [" ", "acara"],
    ["a".repeat(200), "a".repeat(80)],
  ]) {
    invitation.title = title;
    const response = await GET(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-disposition"), `attachment; filename="undara-tiket-masuk-${name}-naya.png"`);
    assert.equal(calls.renders.at(-1)[0], createGuestQrToken("guest-a"));
  }
  invitation.title = "Ulang Tahun Naya";
  for (const [name, filename] of [['Fête / Naya "B"\r\n', "fete-naya-b"], [" ", "tamu"], ["a".repeat(200), "a".repeat(50)]]) {
    guest.name = name;
    const response = await GET(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-disposition"), `attachment; filename="undara-tiket-masuk-ulang-tahun-naya-${filename}.png"`);
    assert.equal(calls.renders.at(-1)[0], createGuestQrToken("guest-a"));
  }
});

test("Owner-granted Digital Invitation and Guestbook access allow preview and download without payment", async (t) => {
  for (const metadata of [{ digital: true, guestbook: false }, { digital: false, guestbook: true }]) {
    for (const download of [false, true]) {
      await t.test(`${metadata.guestbook ? "Guestbook" : "Digital"} ${download ? "download" : "preview"}`, async () => {
        const { GET, calls } = loadHandler({
          invitation: { id: "invitation-a", ownerId: "owner-a", payment: null },
          grants: { "owner-a": metadata },
        });
        const response = await GET(new Request(`https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a${download ? "&download=1" : ""}`));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        assert.equal(response.headers.get("content-type"), "image/png");
        assert.ok(response.headers.get("content-disposition").startsWith(download ? "attachment;" : "inline;"));
        const png = Buffer.from(await response.arrayBuffer());
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.equal(calls.renders[0][0], createGuestQrToken("guest-a"));
        assert.deepEqual(calls.grantQueries[0], {
          where: { action: "OWNER_PACKAGE_ACCESS_UPDATED", entity: "User", entityId: "owner-a" },
          select: { metadata: true }, orderBy: { createdAt: "desc" },
        });
        assert.equal(calls.fetches.length, 0);
      });
    }
  }
});

test("revoking a manual grant blocks the next QR request while leaving a paid event accessible", async () => {
  const grants = { "owner-a": { digital: true } };
  const { GET, calls } = loadHandler({ invitation: { id: "invitation-a", ownerId: "owner-a", payment: null }, grants });
  const request = () => new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a");
  assert.equal((await GET(request())).status, 200);
  grants["owner-a"] = { digital: false, guestbook: false };
  assert.equal((await GET(request())).status, 402);
  assert.equal(calls.renders.length, 1);
  const paid = loadHandler({ grants });
  assert.equal((await paid.GET(request())).status, 200);
  assert.equal(paid.calls.grantQueries.length, 0);
});

test("another account's grant and malformed manual access do not authorize an unpaid invitation", async (t) => {
  for (const grants of [{ "owner-b": { digital: true } }, { "owner-a": { digital: "true", guestbook: false } }]) {
    await t.test(JSON.stringify(grants), async () => {
      const { GET, calls } = loadHandler({ invitation: { id: "invitation-a", ownerId: "owner-a", payment: null }, grants });
      const response = await GET(new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a"));
      assert.equal(response.status, 402);
      assert.equal(calls.renders.length, 0);
    });
  }
});

test("grant lookup failures return a private generic error before rendering", async () => {
  const { GET, calls } = loadHandler({ invitation: { id: "invitation-a", ownerId: "owner-a", payment: null }, grantError: new Error("private audit failure") });
  const response = await GET(new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a"));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { error: "QR belum dapat dibuat. Coba lagi." });
  assert.equal(calls.renders.length, 0);
});

test("missing signing configuration fails closed rather than issuing an unsigned or URL QR", async () => {
  const secret = process.env.QR_SIGNING_SECRET;
  delete process.env.QR_SIGNING_SECRET;
  try {
    const { GET, calls } = loadHandler();
    const response = await GET(new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a"));
    assert.equal(response.status, 503);
    assert.equal(calls.renders.length, 0);
    assert.deepEqual(await response.json(), { error: "QR belum dapat dibuat. Coba lagi." });
  } finally { process.env.QR_SIGNING_SECRET = secret; }
});


test("QR encoder failure returns a private generic error without exposing details", async () => {
  const { GET, calls } = loadHandler({ render: async () => { throw new Error("private encoder detail"); } });
  const response = await GET(new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a"));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { error: "QR belum dapat dibuat. Coba lagi." });
  assert.equal(calls.errors.length, 1);
  assert.equal(calls.fetches.length, 0);
});

test("two guests in the same event receive different tickets and saved names, never a shared event URL", async () => {
  const tokens = [];
  for (const guest of [
    { id: "guest-a", invitationId: "invitation-a", name: "Naya" },
    { id: "guest-b", invitationId: "invitation-a", name: "Ardi" },
  ]) {
    const { GET, calls } = loadHandler({ guest });
    const response = await GET(new Request(`https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=${guest.id}&guestName=Fake&token=Unsigned`));
    assert.equal(response.status, 200);
    const token = calls.renders[0][0];
    assert.equal(verifyGuestQrToken(token), guest.id);
    assert.equal(calls.cards[0][2], guest.name);
    assert.doesNotMatch(token, /^https?:/);
    tokens.push(token);
  }
  assert.notEqual(tokens[0], tokens[1]);
});

const checkinCompiled = ts.transpileModule(readFileSync(new URL("../app/api/usher/checkin/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function loadCheckin({ user = { id: "owner-a" }, ownerId = "owner-a", invitationId = "invitation-a", trustedOrigin = true, payment = { packageKey: "INVITATION_GUESTBOOK", status: "PAID" } } = {}) {
  const guest = { id: "guest-a", invitationId, name: "Naya", checkedIn: false, invitation: { ownerId, payment } };
  const calls = { writes: 0, entitlements: 0 };
  const packageAccess = loadSource("lib/packages/server-access.ts", {
    "@/lib/prisma": { prisma: { payment: { findFirst: async () => null } } },
    "@/lib/packages/access": { hasPaidDigitalInvitation, hasPaidGuestbook },
    "@/lib/packages/owner-grants": { getOwnerPackageGrant: async () => ({ digital: false, guestbook: false }) },
  });
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/security/request-origin": { isTrustedMutationOrigin: () => trustedOrigin },
    "@/lib/usher/qr": { verifyGuestQrToken },
    "@/lib/packages/server-access": { hasAccountGuestbook: async (...args) => {
      calls.entitlements++;
      return packageAccess.hasAccountGuestbook(...args);
    } },
    "@/lib/prisma": { prisma: { guest: {
      findFirst: async ({ where }) => guest.id === where.id && guest.invitation.ownerId === where.invitation.ownerId ? guest : null,
      updateMany: async ({ where, data }) => {
        calls.writes++;
        if (guest.id !== where.id || guest.invitationId !== where.invitationId || guest.checkedIn !== where.checkedIn) return { count: 0 };
        Object.assign(guest, data);
        return { count: 1 };
      },
      findUnique: async () => guest,
    } } },
  };
  const routeModule = { exports: {} };
  new Function("require", "exports", "module", "console", checkinCompiled)((id) => {
    assert.ok(Object.hasOwn(modules, id), `Unexpected check-in dependency: ${id}`);
    return modules[id];
  }, routeModule.exports, routeModule, { error() {} });
  return { POST: routeModule.exports.POST, guest, calls };
}

const scanRequest = (token, invitationId = "invitation-a") => new Request("https://undara.example.test/api/usher/checkin", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, invitationId }),
});

test("the branded admission payload enters the real Usher check-in handler once, including simultaneous scans", async () => {
  const { GET, calls } = loadHandler({ invitation: {
    id: "invitation-a", ownerId: "owner-a", title: "Event", payment: { packageKey: "INVITATION_GUESTBOOK", status: "PAID" },
  } });
  assert.equal((await GET(new Request("https://undara.example.test/api/invitations/qr?invitationId=invitation-a&guestId=guest-a"))).status, 200);
  const token = calls.renders[0][0];
  const checkin = loadCheckin();
  const results = await Promise.all([checkin.POST(scanRequest(token)), checkin.POST(scanRequest(token))]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [200, 409]);
  const result = await results.find(({ status }) => status === 200).json();
  assert.equal(result.guest.id, "guest-a");
  assert.equal(result.guest.checkedIn, true);
  assert.equal(checkin.guest.checkedInById, "owner-a");
  assert.ok(checkin.guest.checkedInAt instanceof Date);
  assert.equal((await checkin.POST(scanRequest(token))).status, 409);
});

test("admission scans preserve origin, owner, event, signature and Guestbook entitlement before writing", async (t) => {
  for (const entry of [
    { name: "no session", options: { user: null }, status: 401 },
    { name: "untrusted origin", options: { trustedOrigin: false }, status: 403 },
    { name: "another owner", options: { user: { id: "owner-b" } }, status: 404 },
    { name: "another selected event", selectedEvent: "invitation-b", status: 409 },
    { name: "tampered signature", token: createGuestQrToken("guest-a").replace("guest-a", "guest-b"), status: 400 },
    { name: "invitation URL", token: "https://undara.example.test/q/invitation-a", status: 400 },
    { name: "no Guestbook access", options: { payment: { packageKey: "INVITATION_BASIC", status: "PAID" } }, status: 402 },
  ]) {
    await t.test(entry.name, async () => {
      const checkin = loadCheckin(entry.options);
      const response = await checkin.POST(scanRequest(entry.token ?? createGuestQrToken("guest-a"), entry.selectedEvent));
      assert.equal(response.status, entry.status);
      assert.equal(checkin.calls.writes, 0);
      assert.equal(checkin.guest.checkedIn, false);
    });
  }
});
