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

function saveFixture({ invitation = event(), current, user = { id: "user-a", firstName: "Una", role: "USER" }, digital = false } = {}) {
  const calls = { updates: [], locks: 0, transactions: 0 };
  const prisma = {
    invitation: {
      findFirst: async ({ where }) => invitation?.id === where.id && invitation.ownerId === where.ownerId ? invitation : null,
      findUniqueOrThrow: async () => current ?? invitation,
      update: async ({ data }) => { calls.updates.push(data); return { ...invitation, ...data }; },
    },
    invitationAsset: { findFirst: async () => null },
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
    "@/lib/packages/owner-grants": { getOwnerPackageGrant: async () => ({ digital }) },
    "@/lib/invitations/music-selection": music,
    "@/lib/templates/catalog": catalog,
    "@/lib/events/catalog": categories,
    "@/lib/invitations/event-input": input,
    "@/lib/invitations/legacy-queries": legacy,
  });
  return {
    calls,
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

test("event compatibility separates birthdays from all three wedding categories", () => {
  const birthdays = catalog.templatesForEvent(localCatalog, "BIRTHDAY");
  assert.deepEqual(birthdays.map((item) => item.key), ["confetti-club"]);
  for (const category of ["WEDDING", "SILVER_WEDDING", "GOLDEN_WEDDING"]) {
    const weddings = catalog.templatesForEvent(localCatalog, category);
    assert.ok(weddings.length > 0);
    assert.ok(weddings.every((item) => item.key !== "confetti-club"));
    assert.equal(catalog.isInvitationTemplateCompatible(birthdayKey, category), false);
    assert.equal(catalog.isInvitationTemplateCompatible(weddingKey, category), true);
  }
  assert.equal(catalog.isInvitationTemplateCompatible(weddingKey, "BIRTHDAY"), false);
  assert.equal(catalog.isInvitationTemplateCompatible("unknown-theme", "WEDDING"), false);
});

test("other event types retain older themes; master authoring keeps the full catalog", () => {
  for (const category of ["BABY_SHOWER", "OTHER"]) {
    assert.ok(catalog.templatesForEvent(localCatalog, category).some((item) => item.key === "botanical-ivory"));
  }
  assert.equal(catalog.templatesForEvent(localCatalog), localCatalog);
  for (const item of localCatalog) assert.ok(item.eventCategories.length > 0);
  assert.equal(catalog.templateSupportsEventCategory({ category: "Birthday" }, "BIRTHDAY"), false,
    "An aesthetic tag is not event compatibility");
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
  assert.equal(catalog.canContinueInvitationTemplate(weddingKey, weddingKey, "BIRTHDAY"), true,
    "An already assigned legacy design remains editable");
  assert.equal(intent.isSelectableTemplate("designer:001"), true);
  assert.equal(intent.isSelectableTemplate("designer:abc"), false);
});

for (const category of ["WEDDING", "SILVER_WEDDING", "GOLDEN_WEDDING", "BIRTHDAY"]) {
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
