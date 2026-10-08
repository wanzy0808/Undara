import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as catalog from "../lib/templates/catalog.ts";
import * as categories from "../lib/events/catalog.ts";
import * as intent from "../lib/templates/template-intent.ts";
import * as input from "../lib/invitations/event-input.ts";
import * as parents from "../lib/events/parents.ts";
import * as slug from "../lib/invitations/slug.ts";
import * as music from "../lib/invitations/music-selection.ts";
import * as access from "../lib/packages/access.ts";
import * as design from "../lib/templates/design.ts";
import { eventInvitationDesignFromKey } from "../components/InvitationStudio/designer-state.ts";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import { TemplatePanel } from "../components/InvitationStudio/TemplatePanel.tsx";
import { loadSource } from "./helpers/package-access.mjs";

const birthdayKey = "confetti-club::confetti::syneInter";
const weddingKey = "botanical-ivory::botanical::rufinaAverage";
const json = { NextResponse: { json: (data, init) => Response.json(data, init) } };
const trusted = loadSource("lib/security/request-origin.ts", {}, {
  env: { APP_URL: "https://example.test", NODE_ENV: "production" },
});
const event = (overrides = {}) => ({
  id: "event-a", ownerId: "user-a", slug: "event-a", type: "WEDDING", eventCategory: "WEDDING",
  templateKey: "", eventConfigured: true, isPublished: false, title: "Pernikahan Una & Dara",
  groomName: "Una", brideName: "Dara", venue: "Gedung", address: null, mapUrl: null,
  eventDate: new Date("2027-01-05T10:00:00.000Z"), timezone: "Asia/Jakarta",
  ceremonyTime: "10:00", receptionTime: null, musicUrl: null, assets: [],
  payment: { packageKey: "INVITATION_BASIC", status: "PAID" }, ...overrides,
});

function saveFixture({ invitation = event(), current, user = { id: "user-a", firstName: "Una", role: "USER" }, digital = false, guests = [] } = {}) {
  const calls = { updates: [], creates: [], guestUpdates: [], locks: 0, transactions: 0 };
  const prisma = {
    invitation: {
      findFirst: async ({ where }) => invitation?.ownerId === where.ownerId && (invitation.id === where.id || (where.eventConfigured === false && invitation.eventConfigured === false)) ? invitation : null,
      findUnique: async () => null,
      count: async () => 1,
      create: async ({ data }) => { calls.creates.push(data); return { id: "event-new", assets: [], payment: null, ...data }; },
      findUniqueOrThrow: async () => current ?? invitation,
      update: async ({ data }) => { calls.updates.push(data); return { ...invitation, ...data }; },
    },
    invitationAsset: { findFirst: async () => null },
    guest: { findMany: async () => guests, update: async ({ where, data }) => { calls.guestUpdates.push({ where, data }); return { ...guests.find((guest) => guest.id === where.id), ...data }; } },
    $queryRaw: async () => { calls.locks += 1; return []; },
    $transaction: async (callback) => { calls.transactions += 1; return callback(prisma); },
  };
  const legacy = loadSource("lib/invitations/legacy-queries.ts", {
    "@/lib/prisma": { prisma }, "@/lib/invitations/slug": slug,
  });
  const route = loadSource("app/api/invitations/route.ts", {
    "@/generated/prisma/client": { Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
    "next/server": json,
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": { prisma },
    "@/lib/events/parents": parents,
    "@/lib/security/request-origin": trusted,
    "@/lib/packages/access": access,
    "@/lib/packages/owner-grants": {
      getOwnerGrantedDigitalInvitationIds: async () => new Set(digital ? ["event-a"] : []),
    },
    "@/lib/packages/server-access": {
      hasAccountDigitalInvitation: async (_userId, payment, invitationId) =>
        access.hasPaidDigitalInvitation(payment) || (digital && invitationId === "event-a"),
    },
    "@/lib/invitations/music-selection": music,
    "@/lib/templates/catalog": catalog,
    "@/lib/events/catalog": categories,
    "@/lib/invitations/event-input": input,
    "@/lib/invitations/legacy-queries": legacy,
  });
  return {
    calls,
    create: (body) => route.POST(new Request("https://example.test/api/invitations", { method: "POST", headers: { "content-type": "application/json", origin: "https://example.test" }, body: JSON.stringify({ eventConfigured: true, ...body }) })),
    save: (body, origin = "https://example.test") => route.PUT(new Request("https://example.test/api/invitations", {
      method: "PUT", headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ id: "event-a", ...body }),
    })),
  };
}

function gatewayFixture({ events = [], selected, designer, user = { id: "user-a", role: "USER" } } = {}) {
  const queries = [];
  class Redirect extends Error { constructor(url) { super(url); this.url = url; } }
  const page = loadSource("app/studio/page.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
    "next/headers": { cookies: async () => ({ get: () => selected ? { value: selected } : undefined }) },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": { prisma: {
      invitation: { findMany: async (query) => { queries.push(query); return events; } },
      designerTemplate: { findUnique: async () => designer ?? null },
    } },
    "@/components/InvitationStudio/StudioEntrySection": () => null,
    "@/lib/templates/template-intent": intent,
    "@/lib/templates/catalog": catalog,
  }).default;
  return { queries, Redirect, open: (template) => page({ searchParams: Promise.resolve(template ? { template } : {}) }) };
}

const choice = (id, eventCategory) => ({ id, title: id, type: "WEDDING", eventCategory });
const localCatalog = catalog.invitationTemplates.map((item) => ({ ...item, source: "built-in", ready: true }));

test("each categorized theme appears in exactly one of the supported event categories", () => {
  for (const theme of localCatalog) {
    assert.equal(theme.eventCategories.length, 1);
    for (const { key } of categories.eventCategoryOptions) {
      assert.equal(catalog.templatesForEvent([theme], key).length, Number(theme.eventCategories[0] === key));
    }
  }
  assert.deepEqual(catalog.templatesForEvent(localCatalog, "BIRTHDAY").map((item) => item.key), ["confetti-club"]);
  assert.ok(catalog.templatesForEvent(localCatalog, "WEDDING").some((item) => item.key === "botanical-ivory"));
});

test("uncategorized or shared metadata never leaks into a specific event; master catalog stays complete", () => {
  const ambiguous = { eventCategories: ["WEDDING", "BIRTHDAY"] };
  for (const { key } of categories.eventCategoryOptions) {
    assert.deepEqual(catalog.templatesForEvent([catalog.blankCanvasTemplate, ambiguous], key), []);
  }
  assert.equal(catalog.templatesForEvent(localCatalog), localCatalog);
  assert.equal(catalog.templateSupportsEventCategory({ category: "Birthday" }, "BIRTHDAY"), false);
  assert.equal(catalog.templateSupportsEventCategory({ eventCategories: ["OTHER"] }, "unknown"), false);
  assert.equal(catalog.isInvitationTemplateCompatible("unknown-theme", "WEDDING"), false);
});

test("future dedicated templates remain separate for every ordered category pair", () => {
  const themes = categories.eventCategoryOptions.map(({ key }) => ({ key: "fixture-" + key, eventCategories: [key] }));
  for (const { key } of categories.eventCategoryOptions) {
    assert.deepEqual(catalog.templatesForEvent(themes, key).map((item) => item.key), ["fixture-" + key]);
  }
});

test("the real Studio panel renders only the scoped theme cards", () => {
  for (const category of ["WEDDING", "BIRTHDAY"]) {
    const markup = renderToStaticMarkup(createElement(LanguageProvider, null,
      createElement(TemplatePanel, { selected: "", onSelect: () => {}, templates: catalog.templatesForEvent(localCatalog, category) })));
    assert.equal(markup.includes('aria-label="Confetti Club"'), category === "BIRTHDAY");
    assert.equal(markup.includes('aria-label="Romantic Rose"'), category === "WEDDING");
    assert.match(markup, /Cari template/);
    assert.match(markup, /Dengan foto/);
  }
});

test("new event defaults are compatible and an existing saved design is preserved", () => {
  const birthday = eventInvitationDesignFromKey("", "BIRTHDAY", "/decoration.webp");
  assert.equal(birthday.template, "confetti-club");
  assert.equal(birthday.palette, "confetti");
  assert.equal(birthday.font, "syneInter");
  assert.equal(eventInvitationDesignFromKey("", "WEDDING", "").template, "botanical-ivory");
  assert.equal(eventInvitationDesignFromKey(weddingKey, "BIRTHDAY", "").template, "botanical-ivory");
});

test("stale incompatible choices and refresh drafts cannot replace a saved theme", () => {
  assert.equal(catalog.canContinueInvitationTemplate(birthdayKey, weddingKey, "WEDDING"), false);
  assert.equal(catalog.canContinueInvitationTemplate(weddingKey, birthdayKey, "BIRTHDAY"), false);
  assert.equal(catalog.canContinueInvitationTemplate(birthdayKey, "", "WEDDING"), false);
  assert.equal(catalog.canContinueInvitationTemplate("blank-canvas", "", "OTHER"), false);
  assert.equal(intent.isSelectableTemplate("blank-canvas"), false);
  assert.equal(catalog.canContinueInvitationTemplate(weddingKey, weddingKey, "BIRTHDAY"), true,
    "An already assigned legacy design remains editable");
  assert.equal(intent.isSelectableTemplate("designer:001"), true);
  assert.equal(intent.isSelectableTemplate("designer:abc"), false);
});

for (const category of ["WEDDING", "BIRTHDAY"]) {
  test(`Save rejects the wrong template for ${category} without writing the event`, async () => {
    const f = saveFixture({ invitation: event({ eventCategory: category }) });
    const response = await f.save({ templateKey: category === "BIRTHDAY" ? weddingKey : birthdayKey });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /kategori acara/);
    assert.equal(f.calls.transactions, 0);
    assert.deepEqual(f.calls.updates, []);
  });
  test(`Save accepts a compatible template for ${category}`, async () => {
    const f = saveFixture({ invitation: event({ eventCategory: category }) });
    const templateKey = category === "BIRTHDAY" ? birthdayKey : weddingKey;
    const response = await f.save({ templateKey });
    assert.equal(response.status, 200);
    assert.equal(f.calls.updates[0].templateKey, templateKey);
    assert.equal(f.calls.updates[0].eventCategory, category);
    assert.equal(f.calls.updates[0].isPublished, false);
    assert.equal(f.calls.locks, 1);
  });
}

for (const category of ["SILVER_WEDDING", "GOLDEN_WEDDING", "BABY_SHOWER", "KHITANAN", "SANGJIT", "OTHER"]) {
  test(`${category} does not borrow Wedding/Birthday defaults or catalog cards`, () => {
    const expected = { SILVER_WEDDING: "silver-reverie", GOLDEN_WEDDING: "golden-keepsake", BABY_SHOWER: "little-cloud", KHITANAN: "taman-doa", SANGJIT: "red-thread", OTHER: "gathering" }[category];
    if (expected) {
      const expectedThemes = category === "KHITANAN"
        ? ["taman-doa", "serambi-pagi", "rumah-senja", "langit-safari", "purnama-biru"]
        : category === "SANGJIT"
          ? ["red-thread", "giok-abadi", "peony-silk", "imperial-crimson", "porcelain-bloom"]
          : [expected];
      assert.deepEqual(catalog.templatesForEvent(localCatalog, category).map((item) => item.key), expectedThemes);
      assert.equal(catalog.defaultInvitationTemplateForEvent(category).key, expected);
      assert.equal(eventInvitationDesignFromKey("", category, "").template, expected);
    } else {
      assert.deepEqual(catalog.templatesForEvent(localCatalog, category), []);
      assert.equal(catalog.defaultInvitationTemplateForEvent(category), null);
      assert.equal(eventInvitationDesignFromKey("", category, "").template, "");
    }
    const markup = renderToStaticMarkup(createElement(LanguageProvider, null,
      createElement(TemplatePanel, { selected: "", onSelect: () => {}, templates: [], emptyMessage: "Belum ada template untuk jenis acara ini." })));
    assert.match(markup, /Belum ada template untuk jenis acara ini/);
    assert.doesNotMatch(markup, /Canvas Kosong|Romantic Rose|Confetti Club|Cari template/);
  });

  test(`Save and first Publish reject Wedding/Birthday choices for ${category}`, async () => {
    for (const templateKey of [weddingKey, birthdayKey]) {
      const fresh = saveFixture({ invitation: event({ eventCategory: category }) });
      assert.equal((await fresh.save({ templateKey })).status, 400);
      assert.deepEqual(fresh.calls.updates, []);
      const assigned = saveFixture({ invitation: event({ eventCategory: category, templateKey }) });
      assert.equal((await assigned.save({ templateKey: templateKey + "::decor=%2Fnew.webp" })).status, 200);
      assert.equal((await assigned.save({ isPublished: true })).status, 400);
    }
  });

  test(`gateway never redirects a Wedding/Birthday selection to ${category}`, async () => {
    const f = gatewayFixture({ events: [choice("other-event", category)] });
    for (const key of ["botanical-ivory", "confetti-club"]) assert.deepEqual((await f.open(key)).props.events, []);
  });

  test(`custom handoff rejects a Wedding/Birthday theme for ${category}`, async () => {
    for (const templateKey of [weddingKey, birthdayKey]) {
      const f = handoffFixture({ category, templateKey });
      assert.equal((await f.assign()).status, 400);
      assert.deepEqual(f.calls, { archives: 0, updates: 0, audits: 0, locks: 0 });
    }
  });
}

test("Save rejects unknown themes and unresolved designer keys", async () => {
  for (const templateKey of ["unknown-theme", "designer:001"]) {
    const f = saveFixture();
    assert.equal((await f.save({ templateKey })).status, 400);
    assert.deepEqual(f.calls.updates, []);
  }
});

test("old designs stay editable; a newly published invitation requires a compatible theme", async () => {
  const invitation = event({ eventCategory: "BIRTHDAY", templateKey: weddingKey });
  const f = saveFixture({ invitation });
  assert.equal((await f.save({ templateKey: weddingKey + "::decor=%2Fnew.webp" })).status, 200);
  assert.equal((await f.save({ isPublished: true })).status, 400);
  const published = saveFixture({ invitation: { ...invitation, isPublished: true } });
  assert.equal((await published.save({ templateKey: weddingKey + "::decor=%2Fnew.webp" })).status, 200);
  const correction = saveFixture({ invitation });
  assert.equal((await correction.save({ templateKey: birthdayKey, isPublished: true })).status, 200);
});

test("changing a draft event category retains its saved design until an explicit compatible choice", async () => {
  const f = saveFixture({ invitation: event({ templateKey: weddingKey }) });
  assert.equal((await f.save({ eventCategory: "BIRTHDAY" })).status, 200);
  assert.equal(f.calls.updates[0].eventCategory, "BIRTHDAY");
  assert.equal(f.calls.updates[0].templateKey, weddingKey);
});

test("Save rechecks category under the event lock after a concurrent change", async () => {
  const f = saveFixture({ current: event({ eventCategory: "BIRTHDAY" }) });
  assert.equal((await f.save({ templateKey: weddingKey })).status, 400);
  assert.equal(f.calls.locks, 1);
  assert.deepEqual(f.calls.updates, []);
});

test("compatible choices preserve authentication, ownership, origin and payment gates", async () => {
  assert.equal((await saveFixture({ user: null }).save({ templateKey: weddingKey })).status, 401);
  assert.equal((await saveFixture().save({ templateKey: weddingKey }, "https://other.test")).status, 403);
  assert.equal((await saveFixture({ invitation: event({ ownerId: "other-user" }) }).save({ templateKey: weddingKey })).status, 404);
  const unpaid = saveFixture({ invitation: event({ payment: null }) });
  assert.equal((await unpaid.save({ templateKey: weddingKey })).status, 200);
  assert.equal((await unpaid.save({ templateKey: weddingKey, isPublished: true })).status, 402);
  const granted = saveFixture({ invitation: event({ eventCategory: "BIRTHDAY", payment: null }), digital: true });
  assert.equal((await granted.save({ templateKey: birthdayKey, isPublished: true })).status, 200);
});

test("blank custom designs keep the existing customer creation restriction", async () => {
  const fresh = saveFixture({ invitation: event({ eventCategory: "BIRTHDAY" }) });
  assert.equal((await fresh.save({ templateKey: "blank-canvas" })).status, 403);
  const assigned = saveFixture({ invitation: event({ eventCategory: "BIRTHDAY", templateKey: "blank-canvas" }) });
  assert.equal((await assigned.save({ templateKey: "blank-canvas::pearl::cinzelFauna" })).status, 200);
});

test("catalog handoff offers only compatible owned events and never writes their designs", async () => {
  const f = gatewayFixture({ events: [choice("wedding-a", "WEDDING"), choice("birthday-a", "BIRTHDAY"), choice("birthday-b", "BIRTHDAY")] });
  const result = await f.open("confetti-club");
  assert.deepEqual(result.props.events.map((item) => item.id), ["birthday-a", "birthday-b"]);
  assert.equal(result.props.selectedTemplate, "confetti-club");
  assert.deepEqual(f.queries[0].where, { ownerId: "user-a", eventConfigured: true });
});

test("one compatible event opens directly, without redirecting to the wrong event", async () => {
  const f = gatewayFixture({ events: [choice("wedding-a", "WEDDING"), choice("birthday-a", "BIRTHDAY")] });
  await assert.rejects(f.open("confetti-club"), { url: "/dashboard/editor?invitationId=birthday-a&type=WEDDING&template=confetti-club" });
  await assert.rejects(f.open("romantic-rose"), { url: "/dashboard/editor?invitationId=wedding-a&type=WEDDING&template=romantic-rose" });
});

test("cookie handoff asks for an appropriate new event when none match", async () => {
  const f = gatewayFixture({ events: [choice("wedding-a", "WEDDING")], selected: "confetti-club" });
  const result = await f.open();
  assert.deepEqual(result.props.events, []);
  assert.equal(result.props.selectedTemplate, "confetti-club");
});

test("plain Studio entry retains mixed event choices and unauthenticated choices go through login", async () => {
  const events = [choice("wedding-a", "WEDDING"), choice("birthday-a", "BIRTHDAY")];
  assert.deepEqual((await gatewayFixture({ events }).open()).props.events, events);
  const guest = gatewayFixture({ events, user: null });
  await assert.rejects(guest.open("confetti-club"), { url: "/login?next=%2Fstudio%3Ftemplate%3Dconfetti-club" });
  assert.deepEqual(guest.queries, []);
});

test("published designer themes inherit event compatibility from their renderer", async () => {
  const f = gatewayFixture({ events: [choice("wedding-a", "WEDDING"), choice("birthday-a", "BIRTHDAY")],
    designer: { status: "PUBLISHED", designKey: birthdayKey } });
  await assert.rejects(f.open("designer:001"), { url: "/dashboard/editor?invitationId=birthday-a&type=WEDDING&template=designer%3A001" });
  const unpublished = gatewayFixture({ events: [choice("birthday-a", "BIRTHDAY")], designer: { status: "DRAFT", designKey: birthdayKey } });
  assert.deepEqual((await unpublished.open("designer:001")).props.events, []);
});

test("catalog API uses renderer compatibility, regardless of designer aesthetic labels", async () => {
  const uploaded = [
    { templateNo: "001", name: "Birthday", tags: ["Floral"], category: "Floral", designKey: birthdayKey, usesPhotos: true },
    { templateNo: "002", name: "Wedding", tags: ["Birthday"], category: "Birthday", designKey: weddingKey, usesPhotos: false },
    { templateNo: "003", name: "Preview only", tags: ["Birthday"], category: "Birthday", designKey: null },
    { templateNo: "004", name: "Unclassified blank master", tags: ["Baby Shower"], category: "Baby Shower", designKey: "blank-canvas::pearl::cinzelFauna" },
  ];
  const route = loadSource("app/api/templates/route.ts", {
    "next/server": json, "@/lib/prisma": { prisma: { designerTemplate: { findMany: async () => uploaded } } },
    "@/lib/templates/catalog": catalog, "@/lib/templates/design": design,
  });
  const { templates } = await (await route.GET()).json();
  assert.deepEqual(catalog.templatesForEvent(templates, "BIRTHDAY").map((item) => item.key), ["confetti-club", "designer:001"]);
  assert.ok(catalog.templatesForEvent(templates, "WEDDING").some((item) => item.key === "designer:002"));
  assert.ok(!catalog.templatesForEvent(templates, "WEDDING").some((item) => item.key === "designer:001"));
  assert.equal(templates.find((item) => item.key === "designer:003").ready, false);
  assert.equal(templates.find((item) => item.key === "designer:004").ready, false);
  for (const { key } of categories.eventCategoryOptions) {
    assert.ok(!catalog.templatesForEvent(templates, key).some((item) => item.key === "designer:004"));
  }
});

function handoffFixture({ category = "WEDDING", templateKey = birthdayKey, current } = {}) {
  const calls = { archives: 0, updates: 0, audits: 0, locks: 0 };
  const invitation = event({ eventCategory: category });
  const prisma = {
    designerTemplate: {
      findUnique: async () => ({ id: "template-a", templateNo: "001", designKey: templateKey, status: "REVIEW", designerId: "designer-a", customInvitationId: "event-a" }),
      updateMany: async () => { calls.archives += 1; return { count: 1 }; },
    },
    user: { findFirst: async () => ({ id: "user-a" }) },
    invitation: { findFirst: async () => invitation, findUniqueOrThrow: async () => current ?? invitation,
      update: async ({ data }) => { calls.updates += 1; return { ...invitation, ...data }; } },
    auditLog: { create: async () => { calls.audits += 1; } },
    $queryRaw: async () => { calls.locks += 1; return []; },
    $transaction: (callback) => callback(prisma),
  };
  const route = loadSource("app/api/owner/custom-templates/route.ts", {
    "next/server": json, "@/lib/auth": { getCurrentUser: async () => ({ id: "owner-a", role: "OWNER" }) },
    "@/lib/prisma": { prisma }, "@/lib/templates/catalog": catalog,
    "@/lib/templates/design": design, "@/lib/security/request-origin": trusted,
  });
  return { calls, assign: () => route.POST(new Request("https://example.test/api/owner/custom-templates", {
    method: "POST", headers: { origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ templateId: "template-a", userId: "user-a", invitationId: "event-a" }),
  })) };
}

test("Owner custom handoff cannot assign a birthday theme to wedding or vice versa", async () => {
  for (const options of [{ category: "WEDDING", templateKey: birthdayKey }, { category: "BIRTHDAY", templateKey: weddingKey }]) {
    const f = handoffFixture(options);
    assert.equal((await f.assign()).status, 400);
    assert.deepEqual(f.calls, { archives: 0, updates: 0, audits: 0, locks: 0 });
  }
});

test("compatible custom handoff archives and assigns exactly once", async () => {
  const f = handoffFixture({ category: "BIRTHDAY", templateKey: birthdayKey });
  assert.equal((await f.assign()).status, 200);
  assert.deepEqual(f.calls, { archives: 1, updates: 1, audits: 1, locks: 1 });
});

test("custom handoff rechecks category and publish state before archiving or writing", async () => {
  for (const current of [event({ eventCategory: "WEDDING" }), event({ eventCategory: "BIRTHDAY", isPublished: true })]) {
    const f = handoffFixture({ category: "BIRTHDAY", templateKey: birthdayKey, current });
    assert.equal((await f.assign()).status, 409);
    assert.deepEqual(f.calls, { archives: 0, updates: 0, audits: 0, locks: 1 });
  }
});


test("explicitly assigned blank custom designs stay usable for all categories without becoming catalog defaults", async () => {
  for (const { key } of categories.eventCategoryOptions) {
    const assigned = saveFixture({ invitation: event({ eventCategory: key, templateKey: "blank-canvas::pearl::cinzelFauna" }) });
    assert.equal((await assigned.save({ isPublished: true })).status, 200);
    const handoff = handoffFixture({ category: key, templateKey: "blank-canvas::pearl::cinzelFauna" });
    assert.equal((await handoff.assign()).status, 200);
  }
});

for (const category of ["SILVER_WEDDING", "GOLDEN_WEDDING", "BABY_SHOWER", "KHITANAN", "SANGJIT", "OTHER"]) {
  test(`${category} accepts only its own new theme through Save/Publish, gateway and handoff`, async () => {
    const theme = catalog.defaultInvitationTemplateForEvent(category);
    const ownKey = design.makeDesignKey(theme.key, theme.preset.palette, theme.preset.font);
    const f = saveFixture({ invitation: event({ eventCategory: category }), digital: true });
    assert.equal((await f.save({ templateKey: ownKey, isPublished: true })).status, 200);
    assert.equal(f.calls.updates[0].templateKey, ownKey);
    assert.equal(f.calls.updates[0].eventCategory, category);
    assert.equal(f.calls.updates[0].isPublished, true);
    const gateway = gatewayFixture({ events: [choice("own", category), choice("wrong", category === "SILVER_WEDDING" ? "GOLDEN_WEDDING" : "SILVER_WEDDING")] });
    await assert.rejects(() => gateway.open(theme.key), (error) => error.url?.startsWith("/dashboard/editor?invitationId=own"));
    const handoff = handoffFixture({ category, templateKey: ownKey });
    assert.equal((await handoff.assign()).status, 200);
    for (const otherCategory of categories.eventCategoryOptions.map((item) => item.key).filter((key) => key !== category)) {
      const wrong = saveFixture({ invitation: event({ eventCategory: otherCategory }), digital: true });
      assert.equal((await wrong.save({ templateKey: ownKey, isPublished: true })).status, 400);
      assert.deepEqual(wrong.calls.updates, []);
    }
  });
}

const weddingSessions = [
  { id: "ceremony", kind: "BLESSING", label: "", start: "09:00", end: null, venue: "Kapel", address: null, mapUrl: null },
  { id: "reception", kind: null, label: "", start: "18:00", end: "END", venue: "Gedung Malam", address: "Jalan Resepsi", mapUrl: "https://maps.example.test/reception" },
];

test("event save persists independent session times and locations while compatibility fields project the first session", async () => {
  const f = saveFixture();
  const response = await f.save({ weddingSessions });
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls.updates[0].weddingSessions, weddingSessions);
  assert.equal(f.calls.updates[0].ceremonyTime, "09:00");
  assert.equal(f.calls.updates[0].receptionTime, null);
  assert.equal(f.calls.updates[0].venue, "Kapel");
  assert.equal(f.calls.updates[0].address, null);
  assert.equal(f.calls.updates[0].mapUrl, null);
});

test("event session creation rejects second dates and non-wedding configurations without writes", async () => {
  const f = saveFixture();
  assert.equal((await f.save({ weddingSessions: [{ ...weddingSessions[1], date: "2027-01-06" }] })).status, 400);
  const birthday = saveFixture({ invitation: event({ eventCategory: "BIRTHDAY", brideName: "" }) });
  assert.equal((await birthday.save({ weddingSessions })).status, 400);
  assert.deepEqual(f.calls.updates, []);
  assert.deepEqual(birthday.calls.updates, []);
});

test("enabling sessions requires explicit guest scopes, and save blocks a foreign guest assignment", async () => {
  const guests = [{ id: "guest-a", name: "Naya", invitedSessions: [], checkedIn: false, rsvpEvents: [] }];
  const f = saveFixture({ guests });
  const blocked = await f.save({ weddingSessions });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).guestsRequiringScope[0].id, "guest-a");
  assert.deepEqual(f.calls.updates, []);
  assert.equal((await f.save({ weddingSessions, weddingGuestScopes: [{ id: "foreign", invitedSessions: ["reception"] }] })).status, 400);
  const accepted = await f.save({ weddingSessions, weddingGuestScopes: [{ id: "guest-a", invitedSessions: ["reception"] }] });
  assert.equal(accepted.status, 200);
  assert.deepEqual(f.calls.guestUpdates[0].data.invitedSessions, ["reception"]);
});

test("publication reviews existing scopes and a published event keeps both its date and session configuration locked", async () => {
  const f = saveFixture({ invitation: event({ weddingSessions, templateKey: weddingKey }), guests: [{ id: "guest-a", name: "Naya", invitedSessions: [], checkedIn: false, rsvpEvents: [] }] });
  assert.equal((await f.save({ isPublished: true })).status, 409);
  assert.deepEqual(f.calls.updates, []);
  const published = saveFixture({ invitation: event({ weddingSessions, templateKey: weddingKey, isPublished: true }) });
  assert.equal((await published.save({ weddingSessions: [weddingSessions[1]] })).status, 409);
  assert.equal((await published.save({ eventDate: "2027-01-06" })).status, 409);
  assert.deepEqual(published.calls.updates, []);
});


test("new wedding creation supports reception-only and does not retain legacy map or end fallbacks", async () => {
  const f = saveFixture();
  const response = await f.create({ eventCategory: "WEDDING", groomName: "Una", brideName: "Dara", eventDate: "2027-01-05", weddingSessions: [{ ...weddingSessions[1], address: null, mapUrl: null, end: null }], address: "stale address", mapUrl: "https://maps.example.test/old", receptionTime: "22:00" });
  assert.equal(response.status, 201);
  assert.equal(f.calls.creates[0].ceremonyTime, "18:00");
  assert.equal(f.calls.creates[0].receptionTime, null);
  assert.equal(f.calls.creates[0].address, null);
  assert.equal(f.calls.creates[0].mapUrl, null);
  assert.equal(f.calls.creates[0].weddingSessions.length, 1);
});

test("reusing a draft cannot enable sessions around existing guests without explicit scope review", async () => {
  const invitation = event({ eventConfigured: false, eventCategory: "OTHER", templateKey: "", title: "" });
  const f = saveFixture({ invitation, guests: [{ id: "guest-a", name: "Naya", invitedSessions: [], checkedIn: false, rsvpEvents: [] }] });
  const body = { eventCategory: "WEDDING", groomName: "Una", brideName: "Dara", eventDate: "2027-01-05", weddingSessions };
  assert.equal((await f.create(body)).status, 409);
  assert.deepEqual(f.calls.updates, []);
  assert.equal((await f.create({ ...body, weddingGuestScopes: [{ id: "guest-a", invitedSessions: ["reception"] }] })).status, 200);
  assert.deepEqual(f.calls.guestUpdates[0].data.invitedSessions, ["reception"]);
});

test("a partial design save projects the latest session schedule read under the event lock", async () => {
  const current = event({ weddingSessions: [weddingSessions[1]], venue: "Gedung Malam" });
  const f = saveFixture({ invitation: event({ weddingSessions }), current });
  assert.equal((await f.save({ description: "Salam" })).status, 200);
  assert.equal(f.calls.updates[0].venue, "Gedung Malam");
  assert.equal(f.calls.updates[0].ceremonyTime, "18:00");
  assert.equal(f.calls.updates[0].receptionTime, "END");
});

for (const [category, primary, secondary, title] of [["KHITANAN", "Aksa", "", "Khitanan Aksa"], ["SANGJIT", "Leon", "Mei", "Sangjit Leon & Mei"]]) {
  test(`${category} creation validates its identity and keeps the generic schedule`, async () => {
    const body = { eventCategory: category, groomName: primary, brideName: secondary, eventDate: "2027-07-18", ceremonyTime: "10:00", receptionTime: "END", venue: "Rumah Keluarga" };
    const valid = saveFixture();
    assert.equal((await valid.create(body)).status, 201);
    const stored = valid.calls.creates[0];
    assert.equal(stored.eventCategory, category);
    assert.equal(stored.title, title);
    assert.equal(stored.groomName, primary);
    assert.equal(stored.brideName, secondary);
    assert.equal(stored.ceremonyTime, "10:00");
    assert.equal(stored.receptionTime, "END");
    assert.equal(stored.weddingSessions ?? null, null);
    for (const missing of category === "SANGJIT" ? [{ groomName: "" }, { brideName: "" }] : [{ groomName: "" }]) {
      const invalid = saveFixture();
      assert.equal((await invalid.create({ ...body, ...missing })).status, 400);
      assert.deepEqual(invalid.calls.creates, []);
    }
    const weddingOnly = saveFixture();
    assert.equal((await weddingOnly.create({ ...body, weddingSessions })).status, 400);
    assert.deepEqual(weddingOnly.calls.creates, []);
  });
}
