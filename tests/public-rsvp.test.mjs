import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "qrcode";
import { createGuestQrToken, verifyGuestQrToken } from "../lib/usher/qr.ts";
import { confirmedRsvpPax, rsvpCsvCell } from "../lib/guests/rsvp.ts";
import * as envelope from "../lib/guests/personal-envelope.ts";
import * as manualParty from "../lib/guests/manual-party.ts";
import * as guestSeats from "../lib/seating/guest-seats.ts";
import * as configHelpers from "../lib/templates/rsvp-config.ts";
import { buildRsvpTicketQrUrl } from "../components/InvitationStudio/rsvp-helpers.ts";
import { InvitationLanguageProvider } from "../components/PublicInvitation/InvitationLanguage.tsx";
import { RsvpInputPanel, RsvpSuccessPanel } from "../components/InvitationStudio/RsvpPanels.tsx";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import DashboardModule from "../components/Dashboard/RsvpAnalyticsPanel.tsx";
import { loadPackageAccess, loadSource } from "./helpers/package-access.mjs";

const RsvpAnalyticsPanel = DashboardModule.default ?? DashboardModule;
const priorSecret = process.env.QR_SIGNING_SECRET;
before(() => { process.env.QR_SIGNING_SECRET = "test-only-public-rsvp-secret"; });
after(() => {
  if (priorSecret === undefined) delete process.env.QR_SIGNING_SECRET;
  else process.env.QR_SIGNING_SECRET = priorSecret;
});

const paid = { packageKey: "INVITATION_BASIC", status: "PAID" };
const event = (overrides = {}) => ({
  id: "event-a", ownerId: "owner-a", slug: "event-a", eventConfigured: true,
  isPublished: true, eventCategory: "OTHER", templateKey: "confetti-club", payment: paid,
  ...overrides,
});
const personal = (overrides = {}) => ({
  id: "guest-a", invitationId: "event-a", name: "Naya", phone: "081234567890",
  invitedPax: 5, plusOnes: 0, rsvpStatus: "PENDING", personalToken: "test-only-personal-token",
  personalPublished: true, checkedIn: false, ...overrides,
});
const options = { ...configHelpers.defaultInvitationRsvpConfig, ceremony: true, reception: true, attendAll: true,
  customFields: [{ id: "meal", label: "Pilihan makanan", required: true }, { id: "city", label: "Kota asal", required: false }],
};

function fixture({ invitation = event(), guests = [], grants, allowed = true } = {}) {
  const records = structuredClone(guests);
  const calls = { creates: [], updates: [], renders: [], rates: [], queries: [] };
  const prisma = { invitation: {
    findUnique: async ({ where }) => invitation?.slug === where.slug ? invitation : null,
    findFirst: async ({ where }) => invitation?.id === where.id && invitation.ownerId === where.ownerId ? invitation : null,
  }, weddingTable: { findMany: async () => []
  }, guest: {
    findFirst: async ({ where }) => records.find((guest) => guest.id === where.id
      && (!where.invitationId || guest.invitationId === where.invitationId)
      && (!where.rsvpStatus || guest.rsvpStatus === where.rsvpStatus)
      && (!where.invitation || (guest.invitationId === invitation?.id && where.invitation.slug === invitation.slug)))
      && { ...records.find((guest) => guest.id === where.id), invitation },
    findMany: async ({ where, select }) => {
      calls.queries.push({ where, select });
      return records.filter((guest) => guest.invitationId === where.invitationId
        && (!where.name || (guest.name.toLowerCase() === where.name.equals.toLowerCase() && guest.phone)))
        .map((guest) => Object.fromEntries(Object.keys(select).filter((key) => select[key] === true).map((key) => [key, guest[key]])));
    },
    update: async ({ where, data }) => {
      calls.updates.push({ where, data });
      return Object.assign(records.find((guest) => guest.id === where.id), data);
    },
    create: async ({ data }) => {
      calls.creates.push(data);
      const guest = { id: `test-only-new-${records.length}`, checkedIn: false, ...data };
      records.push(guest);
      return guest;
    },
  } };
  const access = loadPackageAccess({ grants });
  const identity = loadSource("lib/guests/identity.ts", { "@/lib/prisma": { prisma } });
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/prisma": { prisma },
    "@/lib/auth": { getCurrentUser: async () => ({ id: "owner-a" }) },
    "@/lib/security/request-origin": { isTrustedMutationOrigin: () => true },
    "@/lib/guests/personal-profile": { parsePersonalGuestFields() { throw new Error("Unexpected guest mutation"); } },
    "@/lib/guests/personal-envelope": envelope,
    "@/lib/guests/manual-party": manualParty,
    "@/lib/seating/guest-seats": guestSeats,
    "@/lib/packages/server-access": access.access,
    "@/lib/usher/qr": { createGuestQrToken, verifyGuestQrToken },
    "@/lib/guests/identity": identity,
    "@/lib/templates/rsvp-config": configHelpers,
    "@/lib/security/public-rate-limit": {
      getClientIp: () => "test-only-client",
      checkPublicRateLimit: (...args) => { calls.rates.push(args); return { allowed, remaining: 4, retryAfterSeconds: 12 }; },
    },
    qrcode: { toBuffer: (...args) => { calls.renders.push(args); return QRCode.toBuffer(...args); } },
  };
  const rsvp = loadSource("app/api/invite/[slug]/rsvp/route.ts", modules);
  const qr = loadSource("app/api/invite/[slug]/rsvp/qr/route.ts", modules);
  const ownerGuests = loadSource("app/api/guests/route.ts", modules);
  const params = (slug) => ({ params: Promise.resolve({ slug }) });
  return { calls, records, invitation, grantQueries: access.queries,
    submit: (body, slug = "event-a") => rsvp.POST(new Request(`https://undara.example.test/api/invite/${slug}/rsvp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }), params(slug)),
    image: (token, slug = "event-a", download = false) => qr.GET(new Request(`https://undara.example.test${buildRsvpTicketQrUrl(slug, token)}${download ? "&download=1" : ""}`), params(slug)),
    readGuests: (invitationId = "event-a") => ownerGuests.GET(new Request(`https://undara.example.test/api/guests?invitationId=${invitationId}`)),
  };
}
const genericBody = (overrides = {}) => ({ name: "Rina", phone: "081212121212", status: "ATTENDING", plusOnes: 4, ...overrides });
const personalBody = (overrides = {}) => ({ guestId: "guest-a", guestToken: "test-only-personal-token", status: "ATTENDING", plusOnes: 4, ...overrides });

for (const status of ["ATTENDING", "NOT_ATTENDING", "TENTATIVE"]) {
  test(`public RSVP saves ${status}, confirmed attendees and a ticket only for attending`, async () => {
    const f = fixture();
    const response = await f.submit(genericBody({ status }));
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.equal(saved.guest.rsvpStatus, status);
    assert.equal(saved.guest.plusOnes, status === "ATTENDING" ? 4 : 0);
    assert.equal(confirmedRsvpPax(saved.guest), status === "ATTENDING" ? 5 : 0);
    assert.equal(f.records[0].invitationId, "event-a");
    assert.equal(f.calls.creates.length, 1);
    assert.equal(f.calls.updates.length, 0);
    assert.equal(Object.hasOwn(saved.guest, "personalToken"), false);
    if (status === "ATTENDING") {
      assert.equal(verifyGuestQrToken(saved.qrToken), saved.guest.id);
      for (const download of [false, true]) {
        const image = await f.image(saved.qrToken, "event-a", download);
        assert.equal(image.status, 200);
        assert.equal(image.headers.get("cache-control"), "private, no-store");
        assert.equal(image.headers.get("referrer-policy"), "no-referrer");
        assert.equal(image.headers.get("content-type"), "image/png");
        assert.ok(image.headers.get("content-disposition").startsWith(download ? "attachment;" : "inline;"));
        assert.equal(Buffer.from(await image.arrayBuffer()).readUInt32BE(16), 840);
        assert.equal(f.calls.renders.at(-1)[0], saved.qrToken);
      }
    } else assert.equal(saved.qrToken, null);
  });
}

test("personal RSVP updates the same canonical guest and saves all configured answers and event choices", async () => {
  const f = fixture({ invitation: event({ eventCategory: "WEDDING", templateKey: configHelpers.withInvitationRsvpConfig("romantic-rose", options) }), guests: [personal()] });
  const response = await f.submit(personalBody({ name: "Fake", phone: "Fake", rsvpEvents: ["ceremony", "reception"], rsvpAnswers: { meal: " Vegetarian ", city: "Jakarta", unknown: "discard" } }));
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.guest.id, "guest-a");
  assert.equal(saved.guest.name, "Naya");
  assert.equal(saved.guest.phone, "081234567890");
  assert.deepEqual(saved.guest.rsvpEvents, ["ceremony", "reception"]);
  assert.deepEqual(saved.guest.rsvpAnswers, { meal: "Vegetarian", city: "Jakarta" });
  assert.equal(saved.guest.invitedPax, 5);
  assert.equal(saved.guest.plusOnes, 4);
  assert.equal(f.calls.creates.length, 0);
  assert.equal(f.calls.updates.length, 1);
  const ownerList = await f.readGuests();
  assert.equal(ownerList.status, 200);
  const [ownerGuest] = (await ownerList.json()).guests;
  assert.equal(ownerGuest.id, saved.guest.id);
  assert.deepEqual(ownerGuest.rsvpEvents, saved.guest.rsvpEvents);
  assert.deepEqual(ownerGuest.rsvpAnswers, saved.guest.rsvpAnswers);
  assert.equal(ownerGuest.plusOnes, 4);
  assert.equal((await f.readGuests("event-b")).status, 404);
  const decline = await f.submit(personalBody({ status: "NOT_ATTENDING", rsvpEvents: ["ceremony"], rsvpAnswers: { city: "Jakarta" } }));
  assert.equal(decline.status, 200);
  assert.equal(f.records[0].plusOnes, 0);
  assert.deepEqual(f.records[0].rsvpEvents, []);
  assert.equal((await f.image(saved.qrToken)).status, 404);
});

test("RSVP validates required data, numbers, personal quota and attendee edits before writing", async (t) => {
  const cases = [
    { name: "missing name", body: genericBody({ name: "" }), status: 400 },
    { name: "missing WhatsApp", body: genericBody({ phone: "" }), status: 400 },
    { name: "invalid status", body: genericBody({ status: "PAID" }), status: 400 },
    { name: "negative count", body: genericBody({ plusOnes: -1 }), status: 400 },
    { name: "fractional count", body: genericBody({ plusOnes: 0.5 }), status: 400 },
    { name: "not a count", body: genericBody({ plusOnes: "bad" }), status: 400 },
    { name: "generic max 10 companions", body: genericBody({ plusOnes: 11 }), status: 400 },
    { name: "personal quota", guests: [personal()], body: personalBody({ plusOnes: 5 }), status: 400 },
    { name: "personal wrong token", guests: [personal()], body: personalBody({ guestToken: "bad" }), status: 403 },
    { name: "personal unpublished", guests: [personal({ personalPublished: false })], body: personalBody(), status: 403 },
    { name: "other event", guests: [personal({ invitationId: "event-b" })], body: personalBody(), status: 404 },
    { name: "already checked in", guests: [personal({ checkedIn: true, rsvpStatus: "ATTENDING", plusOnes: 1 })], body: personalBody(), status: 409 },
    { name: "required wedding event", wedding: true, body: genericBody({ rsvpAnswers: { meal: "Vegetarian" } }), status: 400 },
    { name: "required custom answer", wedding: true, body: genericBody({ rsvpEvents: ["ceremony"] }), status: 400 },
  ];
  for (const c of cases) await t.test(c.name, async () => {
    const f = fixture({ guests: c.guests, invitation: c.wedding ? event({ eventCategory: "WEDDING", templateKey: configHelpers.withInvitationRsvpConfig("romantic-rose", options) }) : event() });
    assert.equal((await f.submit(c.body)).status, c.status);
    assert.equal(f.calls.creates.length + f.calls.updates.length, 0);
  });
});

test("a generic shared link cannot overwrite or duplicate an existing recipient using their name and phone", async () => {
  const f = fixture({ guests: [personal()] });
  const response = await f.submit(genericBody({ name: "naya", phone: "+6281234567890" }));
  assert.equal(response.status, 409);
  assert.equal(f.calls.creates.length + f.calls.updates.length, 0);
  assert.equal(f.records[0].rsvpStatus, "PENDING");
});

test("shared RSVP and guest PNG both follow the actual owner's manual grant, including revocation", async () => {
  const grants = { "owner-a": { digital: true } };
  const f = fixture({ invitation: event({ payment: null }), grants });
  const response = await f.submit(genericBody());
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal((await f.image(saved.qrToken)).status, 200);
  assert.ok(f.grantQueries.every(({ where }) => where.entityId === "owner-a"));
  grants["owner-a"] = { digital: false, guestbook: false };
  assert.equal((await f.image(saved.qrToken)).status, 404);
  assert.equal((await f.submit(genericBody({ name: "Other" }))).status, 404);
  f.invitation.payment = paid;
  assert.equal((await f.image(saved.qrToken)).status, 200);
});

test("public RSVP and QR retain event publication, attendance, signature, entitlement and rate guards", async (t) => {
  for (const overrides of [{ isPublished: false }, { eventConfigured: false }, { payment: null }]) {
    const f = fixture({ invitation: event(overrides), guests: [personal({ rsvpStatus: "ATTENDING" })] });
    assert.equal((await f.submit(genericBody())).status, 404);
    assert.equal((await f.image(createGuestQrToken("guest-a"))).status, 404);
    assert.equal(f.calls.creates.length + f.calls.updates.length + f.calls.renders.length, 0);
  }
  const f = fixture({ guests: [personal({ rsvpStatus: "ATTENDING" })] });
  assert.equal((await f.image(createGuestQrToken("guest-a"), "other-event")).status, 404);
  assert.equal((await f.image(createGuestQrToken("guest-a").replace("guest-a", "guest-b"))).status, 403);
  const limited = fixture({ allowed: false });
  assert.equal((await limited.submit(genericBody())).status, 429);
  const png = await limited.image(createGuestQrToken("guest-a"));
  assert.equal(png.status, 429);
  assert.equal(png.headers.get("retry-after"), "12");
  await t.test("missing secret still confirms a committed RSVP", async () => {
    const secret = process.env.QR_SIGNING_SECRET;
    delete process.env.QR_SIGNING_SECRET;
    try {
      const f = fixture();
      const response = await f.submit(genericBody());
      assert.equal(response.status, 200);
      assert.equal((await response.json()).qrToken, null);
      assert.equal(f.calls.creates.length, 1);
    } finally { process.env.QR_SIGNING_SECRET = secret; }
  });
});

const inputHtml = (overrides = {}, language = "ID") => renderToStaticMarkup(createElement(InvitationLanguageProvider, { language }, createElement(RsvpInputPanel, {
  rsvpConfig: options, form: { name: "", phone: "", status: "ATTENDING", plusOnes: "4", eventChoice: "all", customAnswers: {} },
  setForm() {}, onSubmit() {}, message: "", submitting: false, ...overrides,
})));

test("the shared RSVP form exposes total attendee numbers with correct generic and personal limits in ID/EN", () => {
  for (const [quota, max] of [[undefined, 11], [1, 1], [2, 2], [5, 5], [30, 30]]) {
    for (const language of ["ID", "EN"]) {
      const count = Math.min(5, max);
      const html = inputHtml({ invitedPax: quota, guestId: quota ? "guest-a" : undefined, form: { name: "", phone: "", status: "ATTENDING", plusOnes: String(count - 1), eventChoice: "all", customAnswers: {} } }, language);
      const input = html.match(/<input[^>]*type="number"[^>]*>/)?.[0];
      assert.ok(input);
      assert.match(input, /min="1"/);
      assert.ok(input.includes(`max="${max}"`));
      assert.ok(input.includes(`value="${count}"`));
      assert.match(input, /required/);
      assert.ok(html.includes(language === "EN" ? "Including you." : "Termasuk Anda."));
      assert.doesNotMatch(html, /name="plusOnes"/);
      if (quota === 1) assert.match(input, /readOnly/);
    }
  }
  const guest = inputHtml({ guestId: "guest-a", guestName: "Naya", invitedPax: 5 });
  assert.doesNotMatch(guest, /placeholder="Nama lengkap"|placeholder="08xxxxxxxxxx"/);
  const generic = inputHtml();
  assert.match(generic, /autoComplete="name"/);
  assert.match(generic, /type="tel"/);
  assert.match(generic, /maxLength="120"/);
  assert.match(generic, /maxLength="32"/);
});

test("success and Dashboard counts use the saved status; configured answers are readable and escaped", () => {
  for (const status of ["ATTENDING", "NOT_ATTENDING", "TENTATIVE", "PENDING"]) assert.equal(confirmedRsvpPax({ rsvpStatus: status, plusOnes: 4 }), status === "ATTENDING" ? 5 : 0);
  const success = renderToStaticMarkup(createElement(RsvpSuccessPanel, { ticketGuest: { id: "g", name: "Naya", rsvpStatus: "ATTENDING", plusOnes: 4 }, ticketUrl: "", calendarUrl: "" }));
  assert.match(success, /Jumlah yang hadir.*5.*orang/);
  const guests = [personal({ rsvpStatus: "ATTENDING", plusOnes: 4, rsvpEvents: ["ceremony", "reception"], rsvpAnswers: { meal: "Vegetarian", city: "<script>bad</script>" } }), personal({ id: "guest-b", name: "Ardi", rsvpStatus: "NOT_ATTENDING", plusOnes: 4 })];
  const html = renderToStaticMarkup(createElement(LanguageProvider, { initialLocale: "id" }, createElement(RsvpAnalyticsPanel, { guests, slug: "event-a", rsvpConfig: options })));
  assert.match(html, /Pilihan makanan/);
  assert.match(html, /Vegetarian/);
  assert.match(html, /Upacara Nikah, Resepsi/);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Ardi[\s\S]*?Pax<\/dt><dd[^>]*>0<\/dd>/);
});

test("CSV keeps guest answers, quoted newlines and international phones as safe text", () => {
  assert.equal(rsvpCsvCell('Jakarta, "Indonesia"\nVegetarian'), '"Jakarta, ""Indonesia""\nVegetarian"');
  assert.equal(rsvpCsvCell(5), '"5"');
  for (const text of ['=1+1', ' +6281234567890', '-1+1', '@SUM(1,1)', '\t=HYPERLINK("https://example.test")']) {
    assert.equal(rsvpCsvCell(text), `"'${text.replaceAll('"', '""')}"`);
  }
});
