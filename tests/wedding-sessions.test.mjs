import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as sessions from "../lib/events/wedding-sessions.ts";
import { reconcileWeddingGuestScopes, WeddingScopeConflict } from "../lib/events/wedding-session-mutation.ts";
import { buildWeddingCalendarLinks } from "../components/InvitationStudio/rsvp-helpers.ts";
import { defaultInvitationRsvpConfig } from "../lib/templates/rsvp-config.ts";
import { isNativeVisualKey, nativeVisualUsesSystemContent, nativeVisualCapabilities } from "../lib/templates/native-visual-transforms.ts";
import { WeddingGuestScopeField, WeddingSessionFields } from "../components/Dashboard/WeddingSessionFields.tsx";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import { InvitationLanguageProvider } from "../components/PublicInvitation/InvitationLanguage.tsx";
import ScheduleModule from "../components/PublicInvitation/WeddingSessionSchedule.tsx";
import PublicModule from "../components/PublicInvitation/PublicInvitation.tsx";
import ClassicModule from "../components/PublicInvitation/ClassicInvitationTemplate.tsx";
import { loadSource } from "./helpers/package-access.mjs";

export const wedding = [
  { id: "ceremony", kind: "BLESSING", label: "", start: "09:00", end: "10:00", venue: "Kapel Pagi", address: "Jalan Prosesi", mapUrl: "https://maps.example.test/ceremony" },
  { id: "reception", kind: null, label: "", start: "18:00", end: "END", venue: "Gedung Malam", address: "Jalan Resepsi", mapUrl: "https://maps.example.test/reception" },
];
const eventDate = new Date("2027-01-05T00:00:00.000Z");
const event = (overrides = {}) => ({
  id: "event-a", ownerId: "owner-a", slug: "event-a", eventCategory: "WEDDING", weddingSessions: wedding,
  eventDate, timezone: "Asia/Makassar", title: "Una & Dara", groomName: "Una", brideName: "Dara",
  venue: wedding[0].venue, address: wedding[0].address, mapUrl: wedding[0].mapUrl,
  ceremonyTime: "09:00", receptionTime: "10:00", templateKey: "romantic-rose", assets: [],
  description: null, giftBankName: null, giftAccountName: null, giftAccountNumber: null, ...overrides,
});
const Component = (value) => value.default ?? value;

test("legacy start/end never create two sessions; non-wedding events retain their existing schedule", () => {
  assert.deepEqual(sessions.weddingSessionsFor(event({ weddingSessions: null })), []);
  assert.deepEqual(sessions.weddingSessionsFor({ eventCategory: "BIRTHDAY", ceremonyTime: "09:00", receptionTime: "END" }), []);
  assert.throws(() => sessions.parseWeddingSessions(wedding, "BIRTHDAY"), sessions.WeddingSessionError);
  assert.deepEqual(sessions.parseWeddingSessions([wedding[1]], "WEDDING"), [wedding[1]]);
});

test("same-day sessions validate time, place, safe map links, uniqueness and ceremony kind", () => {
  assert.deepEqual(sessions.parseWeddingSessions([...wedding].reverse(), "WEDDING"), wedding);
  for (const bad of [[], [wedding[0], wedding[0]], [{ ...wedding[0], start: "9:00" }], [{ ...wedding[0], end: "08:59" }], [{ ...wedding[0], end: "09:00" }], [{ ...wedding[0], venue: " " }], [{ ...wedding[0], kind: "OTHER" }], [{ ...wedding[0], mapUrl: "javascript:alert(1)" }]]) {
    assert.throws(() => sessions.parseWeddingSessions(bad, "WEDDING"), sessions.WeddingSessionError);
  }
  for (const key of ["date", "eventDate"]) assert.throws(() => sessions.parseWeddingSessions([{ ...wedding[1], [key]: "2027-01-06" }], "WEDDING"), /dua acara/);
});

test("both-session invitations require an explicit choice; inactive, duplicate and empty scopes fail", () => {
  assert.deepEqual(sessions.parseInvitedSessions(undefined, [wedding[1]]), ["reception"]);
  assert.deepEqual(sessions.parseInvitedSessions(["reception", "ceremony"], wedding), ["ceremony", "reception"]);
  for (const value of [undefined, [], ["ceremony", "ceremony"], ["other"], "all"]) assert.throws(() => sessions.parseInvitedSessions(value, wedding));
  assert.throws(() => sessions.parseInvitedSessions(["ceremony"], [wedding[1]]));
  assert.deepEqual(sessions.parseInvitedSessions(undefined, []), []);
});

test("personal props exclude every other session’s time, address and map before serialization", () => {
  const original = event();
  const personal = sessions.invitationForWeddingGuest(original, ["reception"]);
  assert.deepEqual(personal.weddingSessions, [wedding[1]]);
  assert.equal(personal.ceremonyTime, "18:00");
  assert.equal(personal.receptionTime, "END");
  assert.equal(personal.venue, "Gedung Malam");
  assert.doesNotMatch(JSON.stringify(personal), /Kapel Pagi|Jalan Prosesi|09:00|10:00|maps.example.test\/ceremony/);
  assert.deepEqual(original.weddingSessions, wedding);
  assert.throws(() => sessions.invitationForWeddingGuest(original, []));
});

test("actual attendance drives calendar links independently of invited sessions, with the shared timezone", () => {
  const scoped = sessions.invitationForWeddingGuest(event(), ["reception"]);
  const config = sessions.weddingRsvpConfig(scoped, defaultInvitationRsvpConfig);
  assert.equal(config.ceremony, false);
  assert.equal(config.reception, true);
  assert.equal(config.attendAll, false);
  const links = buildWeddingCalendarLinks({ sessions: wedding, selected: ["reception"], title: "Una & Dara", eventDate: eventDate.toISOString(), timezone: "Asia/Makassar", language: "EN" });
  assert.equal(links.length, 1);
  assert.equal(links[0].label, "Reception");
  const params = new URL(links[0].url).searchParams;
  assert.equal(params.get("location"), "Gedung Malam");
  assert.equal(params.get("ctz"), "Asia/Makassar");
  assert.match(params.get("dates"), /^20270105T180000\//);
  assert.deepEqual(buildWeddingCalendarLinks({ sessions: wedding, selected: [], title: "", eventDate: eventDate.toISOString(), timezone: "Asia/Jakarta" }), []);
});

test("active session controls use floating labels and keep old event forms optional", () => {
  const markup = renderToStaticMarkup(createElement(LanguageProvider, null, createElement(WeddingSessionFields, { value: wedding, onChange() {}, timezone: "WITA" })));
  assert.match(markup, /Pemberkatan Pernikahan/);
  assert.match(markup, /Tanggal berbeda perlu acara/);
  assert.match(markup, /undara-floating-field/);
  const both = renderToStaticMarkup(createElement(LanguageProvider, null, createElement(WeddingGuestScopeField, { sessions: wedding, onChange() {} })));
  assert.match(both, /value="" selected/);
  assert.match(both, /Keduanya/);
  const single = renderToStaticMarkup(createElement(LanguageProvider, null, createElement(WeddingGuestScopeField, { sessions: [wedding[1]], onChange() {} })));
  assert.match(single, /disabled=""/);
  assert.match(single, /value="reception" selected/);
});

test("schedule renders ID/EN and restricted details in both legacy alternate renderers", () => {
  const scoped = sessions.invitationForWeddingGuest(event(), ["reception"]);
  for (const language of ["ID", "EN"]) {
    const html = renderToStaticMarkup(createElement(InvitationLanguageProvider, { language }, createElement(Component(ScheduleModule), { sessions: scoped.weddingSessions, timezone: "WITA", location: true })));
    assert.match(html, language === "ID" ? /Resepsi/ : /Reception/);
    assert.match(html, /18:00/);
    assert.doesNotMatch(html, /Kapel Pagi|Jalan Prosesi|09:00/);
  }
  for (const renderer of [PublicModule, ClassicModule]) {
    const html = renderToStaticMarkup(createElement(Component(renderer), { invitation: scoped }));
    assert.match(html, /Gedung Malam/);
    assert.doesNotMatch(html, /Kapel Pagi|Jalan Prosesi|maps.example.test\/ceremony/);
  }
});

function scopeFixture(rows) {
  const guests = structuredClone(rows);
  const writes = [];
  const tx = { guest: { findMany: async () => guests, update: async ({ where, data }) => { writes.push({ where, data }); Object.assign(guests.find((guest) => guest.id === where.id), data); } } };
  return { guests, writes, tx };
}
const guest = (overrides = {}) => ({ id: "guest-a", name: "Naya", invitedSessions: ["reception"], rsvpEvents: [], checkedIn: false, ...overrides });

test("changing the date or enabling sessions requires explicit guest review, never silently both", async () => {
  const f = scopeFixture([guest()]);
  const nextDay = new Date("2027-01-06T00:00:00Z");
  await assert.rejects(() => reconcileWeddingGuestScopes(f.tx, "event-a", event(), wedding, nextDay, undefined), (error) => error instanceof WeddingScopeConflict && error.guests[0].id === "guest-a");
  assert.equal(f.writes.length, 0);
  await reconcileWeddingGuestScopes(f.tx, "event-a", event(), wedding, nextDay, [{ id: "guest-a", invitedSessions: ["reception"] }]);
  assert.deepEqual(f.guests[0].invitedSessions, ["reception"]);
  const legacy = scopeFixture([guest({ invitedSessions: [] })]);
  await assert.rejects(() => reconcileWeddingGuestScopes(legacy.tx, "event-a", event({ weddingSessions: null }), wedding, eventDate, undefined), WeddingScopeConflict);
  assert.equal(legacy.writes.length, 0);
});

test("removing sessions and publication review reject stale scopes and foreign guests", async () => {
  const f = scopeFixture([guest({ invitedSessions: ["ceremony"] })]);
  await assert.rejects(() => reconcileWeddingGuestScopes(f.tx, "event-a", event(), [wedding[1]], eventDate, undefined), WeddingScopeConflict);
  await assert.rejects(() => reconcileWeddingGuestScopes(f.tx, "event-a", event(), wedding, eventDate, [{ id: "foreign", invitedSessions: ["reception"] }]), /acara ini/);
  const invalid = scopeFixture([guest({ invitedSessions: [] })]);
  await assert.rejects(() => reconcileWeddingGuestScopes(invalid.tx, "event-a", event(), wedding, eventDate, undefined, true), WeddingScopeConflict);
});

test("scope edits cannot revoke confirmed RSVP or change a checked-in guest", () => {
  assert.throws(() => sessions.editableGuestWeddingScope(["reception"], wedding, guest({ invitedSessions: ["ceremony", "reception"], rsvpEvents: ["ceremony"] })), /RSVP/);
  assert.throws(() => sessions.editableGuestWeddingScope(["ceremony"], wedding, guest({ checkedIn: true })), /check-in/);
  assert.deepEqual(sessions.editableGuestWeddingScope(["reception"], wedding, guest({ checkedIn: true })), ["reception"]);
});

function checkinFixture(scope = ["ceremony", "reception"]) {
  let record = { ...guest({ invitedSessions: scope }), invitationId: "event-a", invitation: event(), sessionCheckIns: [] };
  let tail = Promise.resolve();
  const prisma = {
    $transaction: async (callback) => {
      const previous = tail;
      let release;
      tail = new Promise((resolve) => { release = resolve; });
      await previous;
      const draft = structuredClone(record);
      const tx = {
        $queryRaw: async (_sql, invitationId, ownerId) => invitationId === "event-a" && ownerId === "owner-a" ? [{ id: invitationId }] : [],
        guest: {
          findFirst: async ({ where }) => where.id === draft.id && where.invitationId === draft.invitationId ? draft : null,
          update: async ({ data }) => { Object.assign(draft, data); return draft; },
        },
        guestSessionCheckIn: { create: async ({ data }) => {
          assert.ok(!draft.sessionCheckIns.some((entry) => entry.session === data.session));
          const entry = { ...data, checkedInAt: new Date() };
          draft.sessionCheckIns.push(entry); return entry;
        } },
      };
      try { const result = await callback(tx); record = draft; return result; }
      finally { release(); }
    },
  };
  const api = loadSource("lib/usher/wedding-check-in.ts", { "@/lib/prisma": { prisma } });
  return { ...api, state: () => structuredClone(record) };
}

test("one Guest ticket admits both invited sessions once each and retains the first audit timestamp", async () => {
  const f = checkinFixture();
  const first = await f.checkInWeddingSession("owner-a", "event-a", "guest-a", "ceremony");
  const second = await f.checkInWeddingSession("owner-a", "event-a", "guest-a", "reception");
  assert.equal(second.guest.checkedIn, true);
  assert.deepEqual(second.guest.checkedInAt, first.checkedInAt);
  assert.deepEqual(f.state().sessionCheckIns.map((entry) => entry.session), ["ceremony", "reception"]);
  await assert.rejects(() => f.checkInWeddingSession("owner-a", "event-a", "guest-a", "reception"), (error) => error.status === 409);
});

test("wrong owner, event, missing session and uninvited session never log admission", async () => {
  const f = checkinFixture(["reception"]);
  for (const [owner, eventId, requested, status] of [["owner-b", "event-a", "reception", 404], ["owner-a", "event-b", "reception", 404], ["owner-a", "event-a", undefined, 400], ["owner-a", "event-a", "ceremony", 403]]) {
    await assert.rejects(() => f.checkInWeddingSession(owner, eventId, "guest-a", requested), (error) => error.status === status);
    assert.equal(f.state().sessionCheckIns.length, 0);
  }
});

test("simultaneous scans create exactly one session admission", async () => {
  const f = checkinFixture();
  const results = await Promise.allSettled([f.checkInWeddingSession("owner-a", "event-a", "guest-a", "reception"), f.checkInWeddingSession("owner-a", "event-a", "guest-a", "reception")]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.find((result) => result.status === "rejected").reason.status, 409);
  assert.equal(f.state().sessionCheckIns.length, 1);
});

test("single-session events select their only admission session automatically", async () => {
  const f = checkinFixture(["reception"]);
  // Use the same production transaction helper with a one-session event.
  const prisma = { $transaction: async (callback) => callback({
    $queryRaw: async () => [{ id: "event-a" }],
    guest: { findFirst: async () => ({ ...f.state(), invitation: event({ weddingSessions: [wedding[1]] }) }), update: async () => ({ id: "guest-a", checkedIn: true }) },
    guestSessionCheckIn: { create: async ({ data }) => { assert.equal(data.session, "reception"); return { checkedInAt: new Date() }; } },
  }) };
  const api = loadSource("lib/usher/wedding-check-in.ts", { "@/lib/prisma": { prisma } });
  assert.equal((await api.checkInWeddingSession("owner-a", "event-a", "guest-a", undefined)).guest.checkedIn, true);
});

test("both server personal pages pass only allowed sessions, and owner preview cannot submit RSVP", async () => {
  function Renderer() {}
  const invitation = event({ isPublished: true, eventConfigured: true });
  const recipient = { ...guest(), invitation, personalToken: "token-a", personalPublished: true };
  const modules = {
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); }, redirect() { throw new Error("REDIRECT"); } },
    "next/link": { default() {}, __esModule: true },
    "lucide-react": { ArrowLeft() {} },
    "@/components/ui/button": { Button() {} },
    "@/lib/auth": { getCurrentUser: async () => ({ id: "owner-a" }) },
    "@/lib/prisma": { prisma: { invitation: { findUnique: async () => invitation }, guest: { findFirst: async () => recipient, update: async () => recipient } } },
    "@/lib/packages/server-access": { hasAccountDigitalInvitation: async () => true },
    "@/lib/invitations/password": { hasInvitationAccess: async () => true },
    "@/components/PublicInvitation/PublicInvitation": { InvitationLockedState() {} },
    "@/components/PublicInvitation/PublicInvitationRenderer": { default: Renderer, __esModule: true },
    "@/components/PublicInvitation/PersonalInvitationPasswordGate": { default() {}, __esModule: true },
  };
  const descendants = (node) => Array.isArray(node) ? node.flatMap(descendants) : node?.props ? [node, ...descendants(node.props.children)] : [];
  for (const path of ["app/invite/[slug]/p/[token]/page.tsx", "app/dashboard/personal-invitation/[guestId]/page.tsx"]) {
    const page = loadSource(path, modules);
    const tree = await page.default({ params: Promise.resolve({ slug: "event-a", token: "token-a", guestId: "guest-a" }) });
    const rendered = descendants(tree).find((node) => node.type === Renderer);
    assert.ok(rendered);
    assert.deepEqual(rendered.props.invitation.weddingSessions, [wedding[1]]);
    assert.doesNotMatch(JSON.stringify(rendered.props.invitation), /Kapel Pagi|Jalan Prosesi|maps.example.test\/ceremony/);
    assert.equal(Boolean(rendered.props.preview), path.includes("/dashboard/"));
    recipient.invitedSessions = [];
    await assert.rejects(() => page.default({ params: Promise.resolve({ slug: "event-a", token: "token-a", guestId: "guest-a" }) }), /NOT_FOUND/);
    recipient.invitedSessions = ["reception"];
  }
});

test("session text has distinct Studio styling targets whose content remains owned by the event", () => {
  const html = renderToStaticMarkup(createElement(Component(ScheduleModule), { sessions: wedding, timezone: "Asia/Makassar", location: true }));
  const keys = [...html.matchAll(/data-studio-native-object="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(keys).size, keys.length);
  assert.match(html, /WITA/);
  assert.doesNotMatch(html, /Asia\/Makassar/);
  for (const id of ["ceremony", "reception"]) for (const field of ["label", "start", "venue", "address"]) {
    const key = `object:location:${id}-${field}`;
    assert.ok(keys.includes(key));
    assert.equal(isNativeVisualKey(key), true);
    assert.equal(nativeVisualUsesSystemContent(key), true);
    assert.equal(nativeVisualCapabilities(key).typography, true);
  }
});
