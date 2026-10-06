import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import * as primitives from "../components/Dashboard/DashboardPrimitives.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import * as dialogs from "../components/ui/dialog.tsx";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import { PersonalInvitationCreatePanel } from "../components/Dashboard/PersonalInvitationPanels.tsx";
import * as fields from "../components/Dashboard/PersonalInvitationGuestFields.tsx";
import * as helpers from "../components/Dashboard/personal-invitation-helpers.ts";
import * as titles from "../lib/text/display-title-case.ts";
import * as envelope from "../lib/guests/personal-envelope.ts";
import { loadSource } from "./helpers/package-access.mjs";

const d = (text) => text;
const i18n = { useDashboardI18n: () => ({ d, locale: "id" }) };
const CategoryFields = loadSource("components/Dashboard/PersonalInvitationGuestFields.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/Dashboard/useDashboardI18n": i18n,
  "@/lib/text/display-title-case": titles,
}).PersonalInvitationGuestFields;
const event = (id = "event-a") => ({
  id, title: id === "event-a" ? "Pernikahan Una & Dara" : "Ulang Tahun Nina",
  slug: id, venue: "Jakarta", eventDate: "2026-11-01", createdAt: "2026-10-01",
  eventConfigured: true, accessPaid: false, isPublished: false,
});
const guest = (id = "guest-a") => ({ id, name: "Bapak Andi", phone: "081234567890", category: "REGULAR" });
const personal = () => ({ ...guest("personal-a"), personalToken: "token-a", personalPublished: false, personalPasswordProtected: false, personalViewCount: 0 });
const deferred = () => {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
const nodes = (tree) => (Array.isArray(tree) ? tree : [tree]).flatMap((node) => Array.isArray(node) ? nodes(node) : React.isValidElement(node) ? [node, ...nodes(node.props.children)] : []);
const text = (tree) => React.Children.toArray(tree).map((node) => React.isValidElement(node) ? text(node.props.children) : String(node)).join("");
const find = (tree, type) => nodes(tree).find((node) => node.type === type);

// Run production handlers/effects with deterministic hook scheduling and fetch boundaries.
function hookHarness() {
  const cells = [];
  let cursor = 0, pending = [];
  const changed = (previous, deps) => !previous || !deps || deps.some((value, index) => !Object.is(previous[index], value));
  return {
    hooks: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in cells)) cells[index] = typeof initial === "function" ? initial() : initial;
        return [cells[index], (next) => { cells[index] = typeof next === "function" ? next(cells[index]) : next; }];
      },
      useRef(initial) { const index = cursor++; return cells[index] ??= { current: initial }; },
      useMemo(fn, deps) {
        const index = cursor++;
        if (changed(cells[index]?.deps, deps)) cells[index] = { value: fn(), deps };
        return cells[index].value;
      },
      useCallback(fn, deps) {
        const index = cursor++;
        if (changed(cells[index]?.deps, deps)) cells[index] = { value: fn, deps };
        return cells[index].value;
      },
      useEffect(fn, deps) {
        const index = cursor++;
        if (changed(cells[index]?.deps, deps)) {
          const previous = cells[index];
          cells[index] = { deps, cleanup: previous?.cleanup };
          pending.push(() => { previous?.cleanup?.(); cells[index].cleanup = fn(); });
        }
      },
    },
    render(fn, commit = true) { cursor = 0; const tree = fn(); if (commit) this.commit(); return tree; },
    commit() { const effects = pending; pending = []; effects.forEach((run) => run()); },
    unmount() { cells.forEach((cell) => cell?.cleanup?.()); },
  };
}

function createProps(overrides = {}) {
  return {
    selectedEvent: event(), availableGuests: [], guestId: "", name: "",
    profile: { ...fields.emptyGuestInvitationForm }, loading: false, busyId: null,
    setGuestId() {}, setName() {}, setProfile() {}, onCreateNew() {}, onCreateExisting() {},
    ...overrides,
  };
}

function createHarness(overrides = {}) {
  const hooks = hookHarness();
  const production = loadSource("components/Dashboard/PersonalInvitationPanels.tsx", {
    react: hooks.hooks, "react/jsx-runtime": jsxRuntime, "next/link": () => null, "lucide-react": icons,
    "@/components/ui/button": { Button }, "@/components/ui/input": { Input }, "@/components/ui/dialog": dialogs,
    "@/components/Dashboard/useDashboardI18n": i18n, "@/lib/text/display-title-case": titles,
    "@/lib/guests/personal-envelope": envelope, "@/components/Dashboard/DashboardPrimitives": primitives,
    "@/components/Dashboard/PersonalInvitationGuestFields": fields,
    "@/components/Dashboard/personal-invitation-helpers": helpers,
  });
  let props = createProps(overrides);
  return { render(next = {}) { props = { ...props, ...next }; return hooks.render(() => production.PersonalInvitationCreatePanel(props)); } };
}

function panelHarness(fetcher) {
  const hooks = hookHarness();
  const Create = () => null, List = () => null, Picker = () => null;
  const { default: Panel } = loadSource("components/Dashboard/PersonalInvitationPanel.tsx", {
    react: hooks.hooks, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "@/components/Dashboard/EventScopePicker": Picker, "@/components/Dashboard/useDashboardI18n": i18n,
    "@/components/Dashboard/DashboardPrimitives": primitives,
    "@/components/Dashboard/PersonalInvitationPanels": { PersonalInvitationCreatePanel: Create, PersonalInvitationListPanel: List },
    "@/components/Dashboard/personal-invitation-helpers": helpers,
    "@/components/Dashboard/PersonalInvitationGuestFields": fields,
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetcher;
  let selectedEventId = "event-a";
  const render = (commit = true) => {
    const tree = hooks.render(() => Panel({ selectedEventId, onSelectEvent(id) { selectedEventId = id; } }), commit);
    return { create: find(tree, Create)?.props, list: find(tree, List)?.props, picker: find(tree, Picker)?.props, tree };
  };
  return {
    render, commit: () => hooks.commit(),
    selectEvent(id) { selectedEventId = id; },
    async settle() { for (let i = 0; i < 4; i++) { render(); await flush(); } return render(); },
    dispose() { hooks.unmount(); globalThis.fetch = originalFetch; },
  };
}

const fetchLists = (url, guests = [guest()], invitations = []) => {
  if (url === "/api/invitations?all=1") return Response.json({ invitations: [event(), event("event-b")] });
  return Response.json(url.startsWith("/api/guests?") ? { guests } : { invitations });
};

test("creation shows the saved invitation title, guest name, category and live addressee without additional settings", () => {
  const props = createProps({ name: "bapak andi" });
  for (const [locale, label] of [["id", "Nama tamu"], ["en", "Guest name"]]) {
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(PersonalInvitationCreatePanel, props)));
    assert.match(html, /Pernikahan Una &amp; Dara/);
    assert.ok(html.includes(label));
    assert.match(html, /Kepada Yth : Bapak Andi/);
    assert.doesNotMatch(html, /Sumber penerima|Recipient source/);
    assert.doesNotMatch(html, /<details\b|<textarea\b|type="tel"|type="number"|type="checkbox"/);
    assert.equal((html.match(/<select\b/g) ?? []).length, 1);
    assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]), ["REGULAR", "VIP", "VVIP"]);
    assert.match(html, /value="REGULAR" selected=""/);
    assert.ok(html.indexOf('value="bapak andi"') < html.indexOf("<select"));
    assert.ok(html.indexOf("<select") < html.indexOf("Kepada Yth : Bapak Andi"));
  }
});

test("name-first form submits the right recipient mode and keeps exact couple, override and disabled-envelope previews", () => {
  let created = 0, reused = 0;
  const harness = createHarness({ onCreateNew() { created++; }, onCreateExisting() { reused++; } });
  const submit = (tree) => find(tree, "form").props.onSubmit({ preventDefault() {} });
  submit(harness.render());
  submit(harness.render({ name: "Andi" }));
  submit(harness.render({ busyId: "create-new" }));
  submit(harness.render({ busyId: null, guestId: "missing" }));
  assert.equal(created, 1);
  submit(harness.render({ guestId: "guest-a", availableGuests: [guest()], name: guest().name }));
  assert.equal(reused, 1);
  for (const [profile, expected] of [
    [{ recipientType: "COUPLE", personalLanguage: "ID" }, "Kepada Yth : Bapak Andi dan Ibu Sari"],
    [{ recipientType: "COUPLE", personalLanguage: "EN" }, "Dear : Mr Andi and Mrs Sari"],
    [{ personalAddressee: "keluarga wijaya" }, "Kepada Yth : Keluarga Wijaya"],
    [{ personalEnvelopeEnabled: false }, "Amplop tanpa nama"],
  ]) {
    const tree = harness.render({ guestId: "", name: "andi & sari", profile: { ...fields.emptyGuestInvitationForm, ...profile } });
    assert.ok(text(find(tree, "form")).includes(expected));
  }
});

test("saved guest picker searches and selects explicit IDs even for duplicate names, and exposes further results", () => {
  const chosen = [];
  const guests = Array.from({ length: 43 }, (_, i) => ({ ...guest(`guest-${i}`), phone: `08123${i}` }));
  const harness = createHarness({ availableGuests: guests, setGuestId(id) { chosen.push(id); } });
  let tree = harness.render();
  find(tree, dialogs.Dialog).props.onOpenChange(true);
  tree = harness.render();
  let rows = nodes(tree).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 40);
  nodes(tree).find((node) => node.type === Button && text(node.props.children) === "Tampilkan lebih banyak").props.onClick();
  tree = harness.render();
  rows = nodes(tree).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 43);
  rows[41].props.onClick();
  assert.deepEqual(chosen, ["guest-41"]);
  assert.equal(find(harness.render(), dialogs.Dialog).props.open, false);
  nodes(tree).find((node) => node.type === Input && node.props.type === "search").props.onChange({ target: { value: "0812342" } });
  rows = nodes(harness.render()).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 1);
  rows[0].props.onClick();
  assert.deepEqual(chosen, ["guest-41", "guest-42"]);
});

test("typing only a name creates a draft for the selected invitation with safe defaults and blocks repeated submission", async () => {
  const post = deferred(), calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return post.promise; }
    return fetchLists(url);
  });
  try {
    (await panel.settle()).create.setName("  Ibu Rina  ");
    const view = panel.render();
    const first = view.create.onCreateNew();
    await view.create.onCreateNew();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { invitationId: "event-a", name: "Ibu Rina", phone: "", ...fields.guestInvitationProfilePayload(fields.emptyGuestInvitationForm) });
    assert.equal(calls[0].invitedPax, 1);
    assert.equal(calls[0].personalEnvelopeEnabled, true);
    assert.equal(calls[0].category, "REGULAR");
    assert.equal(Object.hasOwn(calls[0], "published"), false);
    post.resolve(Response.json({ invitation: personal() }));
    await first;
    assert.equal(panel.render().create.name, "");
  } finally { panel.dispose(); }
});

test("reusing a saved guest and changing their category retains the canonical ID, allowance and hidden envelope profile", async () => {
  const saved = { ...guest(), recipientType: "FAMILY", invitedPax: 4, category: "Keluarga utama", tags: ["Keluarga"], personalAddressee: "Bapak Andi & Keluarga", personalLanguage: "EN", personalEnvelopeEnabled: false, personalGreeting: "Terima kasih", plusOnes: 2, rsvpStatus: "ATTENDING", checkedIn: true, table: { id: "table-a", name: "Meja 1" } };
  let listed = { ...personal(), ...saved, id: "personal-a" };
  const calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return Response.json({ invitation: personal() }); }
    if (options.method === "PATCH") {
      const body = JSON.parse(options.body);
      calls.push(body);
      listed = { ...listed, category: body.category, name: body.name, phone: body.phone };
      return Response.json({ invitation: listed });
    }
    return fetchLists(url, [saved, listed], [listed]);
  });
  try {
    let view = await panel.settle();
    assert.deepEqual(view.create.availableGuests.map((item) => item.id), ["guest-a"]);
    view.create.setGuestId("guest-a");
    view = panel.render();
    assert.equal(view.create.name, saved.name);
    assert.deepEqual(view.create.profile, fields.guestInvitationFormFrom(saved));
    const legacyControl = CategoryFields({ value: view.create.profile, onChange: view.create.setProfile });
    assert.deepEqual(nodes(legacyControl).filter((node) => node.type === "option" && !node.props.disabled).map((node) => node.props.value), ["REGULAR", "VIP", "VVIP"]);
    assert.equal(find(legacyControl, "select").props.value, saved.category);
    for (const category of ["REGULAR", "VIP", "VVIP"]) {
      const control = CategoryFields({ value: view.create.profile, onChange: view.create.setProfile });
      find(control, "select").props.onChange({ target: { value: category } });
      view = panel.render();
      assert.deepEqual(view.create.profile, { ...fields.guestInvitationFormFrom(saved), category });
    }
    await view.create.onCreateExisting();
    assert.deepEqual(calls, [{ invitationId: "event-a", guestId: "guest-a", category: "VVIP" }]);
    assert.equal(panel.render().create.name, "");

    panel.render().list.onStartEdit(listed);
    view = panel.render();
    const editControl = CategoryFields({ value: view.list.editProfile, onChange: view.list.setEditProfile });
    find(editControl, "select").props.onChange({ target: { value: "VIP" } });
    panel.render().list.onSaveEdit(listed);
    view = await panel.settle();
    assert.deepEqual(calls[1], { invitationId: "event-a", id: "personal-a", name: saved.name, phone: saved.phone, category: "VIP" });
    for (const key of ["recipientType", "invitedPax", "tags", "personalAddressee", "personalLanguage", "personalEnvelopeEnabled", "personalGreeting", "plusOnes", "rsvpStatus", "checkedIn", "table"]) assert.deepEqual(view.list.personal[0][key], saved[key]);
  } finally { panel.dispose(); }
});

test("editing a selected name starts a new recipient and drops the old guest's phone, addressee and allowance", async () => {
  const saved = { ...guest(), invitedPax: 8, personalAddressee: "Keluarga Andi", personalEnvelopeEnabled: false };
  const calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return Response.json({ invitation: personal() }); }
    return fetchLists(url, [saved]);
  });
  try {
    (await panel.settle()).create.setGuestId("guest-a");
    panel.render().create.setName("Bapak Budi");
    const view = panel.render().create;
    assert.equal(view.guestId, "");
    assert.equal(view.name, "Bapak Budi");
    assert.deepEqual(view.profile, fields.emptyGuestInvitationForm);
    view.setGuestId("guest-from-another-event");
    assert.equal(panel.render().create.guestId, "");
    await panel.render().create.onCreateNew();
    assert.deepEqual(calls, [{ invitationId: "event-a", name: "Bapak Budi", phone: "", ...fields.guestInvitationProfilePayload(fields.emptyGuestInvitationForm) }]);
  } finally { panel.dispose(); }
});

test("event switches hide previous recipients immediately and cancel late responses before they can replace the current list", async () => {
  const old = deferred(), calls = [];
  let hold = false;
  const panel = panelHarness(async (url, options = {}) => {
    calls.push({ url, options });
    if (hold && url.includes("invitationId=event-a")) return old.promise;
    return fetchLists(url, [guest(url.includes("event-b") ? "guest-b" : "guest-a")], [personal()]);
  });
  try {
    let view = await panel.settle();
    view.create.setName("Ibu Rina");
    hold = true;
    view.list.onReload();
    panel.render().picker.onChange("event-b");
    view = panel.render(false);
    assert.equal(view.picker.label, "Pilih undangan");
    assert.equal(view.create.selectedEvent.title, "Ulang Tahun Nina");
    assert.equal(view.create.name, "");
    assert.equal(view.create.loading, true);
    assert.deepEqual(view.create.availableGuests, []);
    assert.deepEqual(view.list.personal, []);
    panel.commit();
    view = await panel.settle();
    assert.deepEqual(view.create.availableGuests.map((item) => item.id), ["guest-b"]);
    const stale = calls.filter((call) => call.url.includes("invitationId=event-a")).slice(-2);
    assert.ok(stale.every((call) => call.options.signal.aborted));
    old.resolve(Response.json({ guests: [guest("stale-guest")], invitations: [personal()] }));
    await flush();
    assert.deepEqual(panel.render().create.availableGuests.map((item) => item.id), ["guest-b"]);
  } finally { panel.dispose(); }
});

test("a failed creation retains the guest name and a failed load supports retry", async () => {
  let failing = true;
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") return Response.json({ error: "Tamu ini sudah ada." }, { status: 409 });
    if (url.startsWith("/api/guests?") && failing) return Response.json({ error: "Daftar tamu belum dapat dimuat." }, { status: 500 });
    return fetchLists(url);
  });
  try {
    let view = await panel.settle();
    assert.equal(view.list.loading, false);
    failing = false;
    view.list.onReload();
    view = await panel.settle();
    assert.deepEqual(view.create.availableGuests.map((item) => item.id), ["guest-a"]);
    view.create.setName("Bapak Andi");
    await panel.render().create.onCreateNew();
    view = panel.render();
    assert.equal(view.create.name, "Bapak Andi");
    assert.equal(view.create.busyId, null);
    assert.ok(text(view.tree).includes("Tamu ini sudah ada."));
  } finally { panel.dispose(); }
});

test("a completed creation for a previous invitation cannot reload or clear the newly selected invitation", async () => {
  const post = deferred(), calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === "POST") return post.promise;
    return fetchLists(url, [guest(url.includes("event-b") ? "guest-b" : "guest-a")]);
  });
  try {
    (await panel.settle()).create.setName("Bapak Andi");
    const pending = panel.render().create.onCreateNew();
    panel.selectEvent("event-b");
    let view = await panel.settle();
    assert.equal(view.create.selectedEvent.id, "event-b");
    assert.deepEqual(view.create.availableGuests.map((item) => item.id), ["guest-b"]);
    const previousLoads = calls.filter((call) => call.url.includes("invitationId=event-a")).length;
    post.resolve(Response.json({ invitation: personal() }));
    await pending;
    view = panel.render();
    assert.equal(view.create.selectedEvent.id, "event-b");
    assert.equal(view.create.busyId, null);
    assert.deepEqual(view.create.availableGuests.map((item) => item.id), ["guest-b"]);
    assert.equal(calls.filter((call) => call.url.includes("invitationId=event-a")).length, previousLoads);
    assert.equal(JSON.parse(calls.find((call) => call.options.method === "POST").options.body).invitationId, "event-a");
  } finally { panel.dispose(); }
});
