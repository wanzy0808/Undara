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
import { PersonalInvitationCreatePanel, PersonalInvitationListPanel } from "../components/Dashboard/PersonalInvitationPanels.tsx";
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
  "@/lib/guests/personal-envelope": envelope,
}).PersonalInvitationGuestFields;
const event = (id = "event-a") => ({
  id, title: id === "event-a" ? "Pernikahan Una & Dara" : "Ulang Tahun Nina",
  slug: id, venue: "Jakarta", eventDate: "2026-11-01", createdAt: "2026-10-01",
  templateKey: "romantic-rose", eventConfigured: true, accessPaid: false, isPublished: false,
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
    selectedEvent: event(), availableGuests: [], guestId: "", name: "", salutation: "BAPAK",
    profile: { ...fields.emptyGuestInvitationForm }, loading: false, busyId: null, drafts: [],
    setGuestId() {}, setName() {}, setSalutation() {}, setProfile() {}, onAddNames() {}, onAddExisting() {}, onRemoveDraft() {}, onEditDraft() {},
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
    react: hooks.hooks, "react/jsx-runtime": jsxRuntime, "next/link": (props) => React.createElement("a", props, props.children), "lucide-react": icons,
    "@/components/ui/button": { Button }, "@/components/Dashboard/EventScopePicker": Picker, "@/components/Dashboard/useDashboardI18n": i18n,
    "@/components/Dashboard/DashboardPrimitives": primitives,
    "@/components/Dashboard/PersonalInvitationPanels": { PersonalInvitationCreatePanel: Create, PersonalInvitationListPanel: List },
    "@/components/Dashboard/personal-invitation-helpers": helpers,
    "@/components/Dashboard/PersonalInvitationGuestFields": fields,
    "@/lib/guests/personal-envelope": envelope,
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetcher;
  let selectedEventId = "event-a";
  const render = (commit = true) => {
    const tree = hooks.render(() => Panel({ selectedEventId, onSelectEvent(id) { selectedEventId = id; } }), commit);
    return { save: nodes(tree).find((node) => node.type === Button && /Buat tautan personal|Menyimpan/.test(text(node.props.children)))?.props, create: find(tree, Create)?.props, list: find(tree, List)?.props, picker: find(tree, Picker)?.props, tree };
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

test("names use three short salutations before choosing an invitation, with category and an actual envelope preview", () => {
  const props = createProps({ selectedEvent: null, name: "bapak andi" });
  for (const [locale, label, add] of [["id", "Nama", "Tambah ke daftar"], ["en", "Name", "Add to list"]]) {
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(PersonalInvitationCreatePanel, props)));
    assert.ok(html.includes(label)); assert.ok(html.includes(add));
    assert.match(html, /Kepada Yth : Bapak Andi/);
    assert.doesNotMatch(html, /Sumber penerima|Recipient source|<details\b|type="tel"|type="number"|type="checkbox"|Buat undangan/);
    assert.equal((html.match(/<textarea\b/g) ?? []).length, 1);
    assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]), ["BAPAK", "IBU", "BAPAK_IBU", "REGULAR", "VIP", "VVIP"]);
    assert.match(html, /value="REGULAR" selected=""/);
    assert.match(html, /rows="2"/);
    assert.doesNotMatch(html, /Satu nama per baris|One name per line/);
  }
});

test("Add uses the selected mode, rejects invalid names and retains exact couple, override and disabled-envelope previews", () => {
  let added = 0, reused = 0;
  const harness = createHarness({ onAddNames() { added++; }, onAddExisting() { reused++; } });
  const submit = (tree) => find(tree, "form").props.onSubmit({ preventDefault() {} });
  submit(harness.render());
  submit(harness.render({ name: "Andi\nSari" }));
  submit(harness.render({ busyId: "create-batch" }));
  submit(harness.render({ busyId: null, name: "x".repeat(121) }));
  submit(harness.render({ name: "Andi", guestId: "missing" }));
  assert.equal(added, 1);
  submit(harness.render({ guestId: "guest-a", availableGuests: [guest()], name: guest().name }));
  assert.equal(reused, 1);
  for (const [profile, expected] of [
    [{ recipientType: "COUPLE", personalLanguage: "ID" }, "Kepada Yth : Bapak Andi dan Ibu Sari"],
    [{ recipientType: "COUPLE", personalLanguage: "EN" }, "Dear : Mr Andi and Mrs Sari"],
    [{ personalAddressee: "keluarga wijaya" }, "Kepada Yth : Keluarga Wijaya"],
    [{ personalEnvelopeEnabled: false }, "Amplop tanpa nama"],
  ]) {
    const saved = { ...guest(), name: "andi & sari", ...profile };
    const tree = harness.render({ guestId: saved.id, availableGuests: [saved], name: saved.name, profile: fields.guestInvitationFormFrom(saved) });
    assert.ok(text(find(tree, "form")).includes(expected));
  }
});

test("the short title selector previews each choice, rejects title-only names and keeps saved envelopes authoritative", () => {
  let chosen;
  const harness = createHarness({ setSalutation(value) { chosen = value; } });
  for (const [salutation, name, expected] of [
    ["BAPAK", "Andi", "Kepada Yth : Bapak Andi"],
    ["IBU", "Ibu Rina", "Kepada Yth : Ibu Rina"],
    ["BAPAK_IBU", "Andi & Rina", "Kepada Yth : Bapak Andi dan Ibu Rina"],
    ["BAPAK_IBU", "Andi", "Kepada Yth : Bapak & Ibu Andi"],
  ]) {
    const tree = harness.render({ salutation, name });
    const title = find(tree, fields.PersonalInvitationSalutationField);
    assert.equal(title.props.value, salutation); title.props.onChange(salutation); assert.equal(chosen, salutation);
    assert.ok(text(find(tree, "form")).includes(expected));
    assert.equal(find(tree, "textarea").props.rows, 1);
    assert.match(find(tree, "textarea").props.className, /capitalize/);
    assert.match(find(tree, "textarea").props.className, /resize-none/);
    assert.equal(nodes(tree).find((node) => node.type === Button && node.props.type === "submit").props.disabled, false);
  }
  const invalid = harness.render({ name: "Bapak" });
  assert.equal(nodes(invalid).find((node) => node.type === Button && node.props.type === "submit").props.disabled, true);
  const busy = harness.render({ name: "Andi", busyId: "create-batch" });
  assert.equal(find(busy, fields.PersonalInvitationSalutationField).props.disabled, true);
  const saved = { ...guest(), personalAddressee: "Keluarga Wijaya" };
  const reused = harness.render({ guestId: saved.id, availableGuests: [saved], profile: fields.guestInvitationFormFrom(saved) });
  assert.equal(find(reused, fields.PersonalInvitationSalutationField), undefined);
  assert.ok(text(find(reused, "form")).includes("Kepada Yth : Keluarga Wijaya"));
});

test("saved guest picker searches explicit IDs even for duplicate names and exposes further results", () => {
  const chosen = [];
  const guests = Array.from({ length: 43 }, (_, i) => ({ ...guest(`guest-${i}`), phone: `08123${i}` }));
  const harness = createHarness({ availableGuests: guests, setGuestId(id) { chosen.push(id); } });
  let tree = harness.render();
  assert.ok(nodes(tree).some((node) => node.type === Button && text(node.props.children) === "Cari dari Daftar Tamu"));
  find(tree, dialogs.Dialog).props.onOpenChange(true);
  tree = harness.render();
  let rows = nodes(tree).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 40);
  nodes(tree).find((node) => node.type === Button && text(node.props.children) === "Tampilkan lebih banyak").props.onClick();
  rows = nodes(harness.render()).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 43); rows[41].props.onClick();
  assert.deepEqual(chosen, ["guest-41"]);
  assert.equal(find(harness.render(), dialogs.Dialog).props.open, false);
  nodes(tree).find((node) => node.type === Input && node.props.type === "search").props.onChange({ target: { value: "0812342" } });
  rows = nodes(harness.render()).filter((node) => node.type === Button && /^guest-/.test(node.key ?? ""));
  assert.equal(rows.length, 1); rows[0].props.onClick();
  assert.deepEqual(chosen, ["guest-41", "guest-42"]);
});

test("a multi-name list comes before the invitation picker and is saved only on request, with duplicate-submit protection", async () => {
  const post = deferred(), calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return post.promise; }
    return fetchLists(url);
  });
  try {
    (await panel.settle()).create.setName(" Ibu Rina \r\n\n Bapak Andi ");
    let view = panel.render();
    view.create.onAddNames(); view.create.onAddNames();
    view = panel.render();
    assert.deepEqual(view.create.drafts.map((row) => [row.name, row.category]), [["Ibu Rina", "REGULAR"], ["Bapak Andi", "REGULAR"]]);
    assert.equal(new Set(view.create.drafts.map((row) => row.key)).size, 2);
    const treeNodes = nodes(view.tree);
    assert.ok(treeNodes.findIndex((node) => node.props === view.create) < treeNodes.findIndex((node) => node.props === view.picker));
    assert.equal(calls.length, 0);
    const first = view.save.onClick(); await view.save.onClick();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { invitationId: "event-a", published: false, recipients: view.create.drafts.map(({ key, name, category, salutation }) => ({ key, name, category, salutation })) });
    assert.equal(Object.hasOwn(calls[0].recipients[0], "invitedPax"), false);
    post.resolve(Response.json({ invitations: [personal(), { ...personal(), id: "second" }] }));
    await first;
    assert.deepEqual(panel.render().create.drafts, []);
  } finally { panel.dispose(); }
});

test("saved recipients retain their canonical ID and hidden profile while staged category and later contact edits use minimal writes", async () => {
  const saved = { ...guest(), recipientType: "FAMILY", invitedPax: 4, category: "Keluarga utama", tags: ["Keluarga"], personalAddressee: "Bapak Andi & Keluarga", personalLanguage: "EN", personalEnvelopeEnabled: false, personalGreeting: "Terima kasih", plusOnes: 2, rsvpStatus: "ATTENDING", checkedIn: true, table: { id: "table-a", name: "Meja 1" } };
  let listed = { ...personal(), ...saved, id: "personal-a" }; const calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return Response.json({ invitations: [listed] }); }
    if (options.method === "PATCH") { const body = JSON.parse(options.body); calls.push(body); listed = { ...listed, category: body.category, name: body.name, phone: body.phone }; return Response.json({ invitation: listed }); }
    return fetchLists(url, [saved, listed], [listed]);
  });
  try {
    (await panel.settle()).create.setGuestId("guest-a");
    let view = panel.render();
    assert.equal(view.create.name, saved.name);
    const legacy = CategoryFields({ value: view.create.profile, onChange: view.create.setProfile });
    assert.equal(find(legacy, "select").props.value, saved.category);
    assert.deepEqual(nodes(legacy).filter((node) => node.type === "option" && !node.props.disabled).map((node) => node.props.value), ["REGULAR", "VIP", "VVIP"]);
    view.create.onAddExisting(); view.create.onAddExisting();
    view = panel.render(); assert.equal(view.create.drafts.length, 1);
    const row = view.create.drafts[0];
    assert.deepEqual(row.profile, fields.guestInvitationFormFrom(saved));
    for (const category of ["REGULAR", "VIP", "VVIP"]) { view.create.onEditDraft(row.key, { category }); view = panel.render(); }
    await view.save.onClick();
    assert.deepEqual(calls[0], { invitationId: "event-a", recipients: [{ guestId: "guest-a", category: "VVIP" }], published: false });
    panel.render().list.onStartEdit(listed); view = panel.render();
    const editControl = CategoryFields({ value: view.list.editProfile, onChange: view.list.setEditProfile });
    find(editControl, "select").props.onChange({ target: { value: "VIP" } });
    panel.render().list.onSaveEdit(listed); view = await panel.settle();
    assert.deepEqual(calls[1], { invitationId: "event-a", id: "personal-a", name: saved.name, phone: saved.phone, category: "VIP" });
    for (const key of ["recipientType", "invitedPax", "tags", "personalAddressee", "personalLanguage", "personalEnvelopeEnabled", "personalGreeting", "plusOnes", "rsvpStatus", "checkedIn", "table"]) assert.deepEqual(view.list.personal[0][key], saved[key]);
  } finally { panel.dispose(); }
});

test("each staged name retains its own editable salutation and sends only its name, category and title", async () => {
  const calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") {
      const body = JSON.parse(options.body); calls.push(body);
      return Response.json({ invitations: body.recipients.map((row) => ({ ...personal(), id: row.key })) });
    }
    return fetchLists(url);
  });
  try {
    await panel.settle();
    for (const [salutation, name] of [["BAPAK", "Andi"], ["IBU", "Rina"], ["BAPAK_IBU", "Budi & Sari"]]) {
      panel.render().create.setSalutation(salutation); panel.render().create.setName(name); panel.render().create.onAddNames();
    }
    let view = panel.render();
    assert.deepEqual(view.create.drafts.map((row) => [row.name, row.salutation]), [["Andi", "BAPAK"], ["Rina", "IBU"], ["Budi & Sari", "BAPAK_IBU"]]);
    const key = view.create.drafts[0].key;
    view.create.onEditDraft(key, { name: "Nina", salutation: "IBU" }); view = panel.render();
    const preview = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: "id" }, React.createElement(PersonalInvitationCreatePanel, view.create)));
    assert.match(preview, /Kepada Yth : Ibu Nina/); assert.match(preview, /Kepada Yth : Bapak Budi dan Ibu Sari/);
    await view.save.onClick();
    assert.deepEqual(calls, [{ invitationId: "event-a", published: false, recipients: view.create.drafts.map(({ key, name, category, salutation }) => ({ key, name, category, salutation })) }]);
  } finally { panel.dispose(); }
});

test("editing a saved name refreshes its generated addressee while retaining its title and allowance", async () => {
  let listed = { ...personal(), name: "Andi", personalAddressee: "Bapak & Ibu Andi", invitedPax: 3 };
  const writes = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "PATCH") { const body = JSON.parse(options.body); writes.push(body); listed = { ...listed, ...body }; return Response.json({ invitation: listed }); }
    return fetchLists(url, [], [listed]);
  });
  try {
    (await panel.settle()).list.onStartEdit(listed); panel.render().list.setEditName("Budi & Rina");
    panel.render().list.onSaveEdit(listed); const view = await panel.settle();
    assert.deepEqual(writes, [{ invitationId: "event-a", id: "personal-a", name: "Budi & Rina", phone: listed.phone, category: "REGULAR", personalAddressee: "Bapak Budi dan Ibu Rina" }]);
    assert.equal(view.list.personal[0].invitedPax, 3);
    assert.equal(envelope.formatPersonalEnvelopeAddress(view.list.personal[0]), "Kepada Yth : Bapak Budi dan Ibu Rina");
  } finally { panel.dispose(); }
});

test("changing a chosen saved name creates a new recipient without copying old contact, addressee or allowance", async () => {
  const saved = { ...guest(), invitedPax: 8, personalAddressee: "Keluarga Andi", personalEnvelopeEnabled: false };
  const calls = []; const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return Response.json({ invitations: [personal()] }); }
    return fetchLists(url, [saved]);
  });
  try {
    (await panel.settle()).create.setGuestId("guest-a");
    panel.render().create.setName("Bapak Budi");
    let view = panel.render(); assert.equal(view.create.guestId, ""); assert.deepEqual(view.create.profile, fields.emptyGuestInvitationForm);
    view.create.setGuestId("guest-from-another-event");
    panel.render().create.onAddNames(); view = panel.render();
    await view.save.onClick();
    assert.deepEqual(calls, [{ invitationId: "event-a", published: false, recipients: [{ key: view.create.drafts[0].key, name: "Bapak Budi", category: "REGULAR", salutation: "BAPAK" }] }]);
  } finally { panel.dispose(); }
});

test("event switching retains new names, scopes saved recipients and cancels old roster responses", async () => {
  const old = deferred(), calls = []; let hold = false;
  const panel = panelHarness(async (url, options = {}) => {
    calls.push({ url, options });
    if (hold && url.includes("invitationId=event-a")) return old.promise;
    return fetchLists(url, [guest(url.includes("event-b") ? "guest-b" : "guest-a")], [personal()]);
  });
  try {
    let view = await panel.settle(); view.create.setGuestId("guest-a"); panel.render().create.onAddExisting();
    panel.render().create.setName("Ibu Rina"); panel.render().create.onAddNames(); panel.render().create.setName("Belum ditambahkan");
    hold = true; panel.render().list.onReload(); panel.render().picker.onChange("event-b");
    view = panel.render(false);
    assert.equal(view.create.name, "Belum ditambahkan"); assert.deepEqual(view.create.drafts.map((row) => row.name), ["Ibu Rina"]);
    assert.deepEqual(view.create.availableGuests, []); assert.deepEqual(view.list.personal, []);
    panel.commit(); view = await panel.settle();
    assert.deepEqual(view.create.availableGuests.map((row) => row.id), ["guest-b"]);
    assert.ok(calls.filter((call) => call.url.includes("invitationId=event-a")).slice(-2).every((call) => call.options.signal.aborted));
    old.resolve(Response.json({ guests: [guest("stale")], invitations: [personal()] })); await flush();
    assert.deepEqual(panel.render().create.availableGuests.map((row) => row.id), ["guest-b"]);
    hold = false; panel.render().picker.onChange("event-a"); view = await panel.settle();
    assert.deepEqual(view.create.drafts.map((row) => row.name), ["Bapak Andi", "Ibu Rina"]);
  } finally { panel.dispose(); }
});

test("failed creation keeps exact draft keys for retry and failed guest loading supports reload", async () => {
  let failing = true; const calls = [];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") { calls.push(JSON.parse(options.body)); return Response.json({ error: "Coba lagi." }, { status: 500 }); }
    if (url.startsWith("/api/guests?") && failing) return Response.json({ error: "Daftar tamu belum dapat dimuat." }, { status: 500 });
    return fetchLists(url);
  });
  try {
    let view = await panel.settle(); failing = false; view.list.onReload(); view = await panel.settle();
    assert.deepEqual(view.create.availableGuests.map((row) => row.id), ["guest-a"]);
    view.create.setName("Bapak Andi"); panel.render().create.onAddNames();
    const original = panel.render().create.drafts;
    await panel.render().save.onClick(); await panel.render().save.onClick();
    view = panel.render(); assert.deepEqual(view.create.drafts, original); assert.deepEqual(calls[0], calls[1]);
    assert.equal(view.create.busyId, null); assert.ok(text(view.tree).includes("Coba lagi."));
  } finally { panel.dispose(); }
});

test("a late invitation-selector refresh cannot revert the currently selected event or its queued names", async () => {
  const old = deferred(), calls = []; let delayed = false;
  const panel = panelHarness(async (url, options = {}) => {
    if (url === "/api/invitations?all=1") {
      calls.push(options);
      if (delayed && calls.length === 2) return old.promise;
    }
    return fetchLists(url);
  });
  try {
    await panel.settle(); delayed = true; panel.selectEvent("event-b"); await panel.settle();
    panel.selectEvent("event-a"); await panel.settle();
    assert.equal(calls[1].signal.aborted, true);
    panel.render().create.setName("Ibu Rina"); panel.render().create.onAddNames();
    old.resolve(Response.json({ invitations: [event(), event("event-b")] })); await flush();
    assert.equal(panel.render().picker.value, "event-a");
    assert.deepEqual(panel.render().create.drafts.map((row) => row.name), ["Ibu Rina"]);
  } finally { panel.dispose(); }
});

test("completion for an old event cannot reload or clear the current event's input", async () => {
  const post = deferred(), calls = [];
  const panel = panelHarness(async (url, options = {}) => { calls.push({ url, options }); if (options.method === "POST") return post.promise; return fetchLists(url, [guest(url.includes("event-b") ? "guest-b" : "guest-a")]); });
  try {
    (await panel.settle()).create.setName("Bapak Andi"); panel.render().create.onAddNames();
    const pending = panel.render().save.onClick(); panel.selectEvent("event-b"); await panel.settle();
    panel.render().create.setName("Ibu Nina"); const loads = calls.filter((call) => call.url.includes("invitationId=event-a")).length;
    post.resolve(Response.json({ invitations: [personal()] })); await pending;
    const view = panel.render(); assert.equal(view.create.selectedEvent.id, "event-b"); assert.equal(view.create.name, "Ibu Nina");
    assert.deepEqual(view.create.availableGuests.map((row) => row.id), ["guest-b"]);
    assert.equal(calls.filter((call) => call.url.includes("invitationId=event-a")).length, loads);
  } finally { panel.dispose(); }
});

test("large name batches remove only acknowledged rows and retry the failed remainder without resubmitting saved names", async () => {
  const calls = []; let failing = true;
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "POST") {
      const body = JSON.parse(options.body); calls.push(body);
      if (calls.length === 3 && failing) return Response.json({ error: "Jaringan gagal." }, { status: 500 });
      return Response.json({ invitations: body.recipients.map((row) => ({ ...personal(), id: row.key })) });
    }
    return fetchLists(url);
  });
  try {
    (await panel.settle()).create.setName(Array.from({ length: 205 }, (_, i) => `Tamu ${i}`).join("\n")); panel.render().create.onAddNames();
    const rows = panel.render().create.drafts;
    await panel.render().save.onClick();
    assert.deepEqual(calls.map((call) => call.recipients.length), [100, 100, 5]);
    assert.deepEqual(panel.render().create.drafts, rows.slice(200));
    assert.ok(text(panel.render().tree).includes("200 tamu tersimpan. Jaringan gagal."));
    failing = false; await panel.render().save.onClick(); assert.deepEqual(calls[2], calls[3]);
    assert.deepEqual(panel.render().create.drafts, []);
  } finally { panel.dispose(); }
});

test("bulk Publish uses only the current event's unpublished IDs in bounded requests and blocks repeated submits", async () => {
  const calls = [], first = deferred(); let count = 0;
  const list = Array.from({ length: 202 }, (_, i) => ({ ...personal(), id: `personal-${i}`, personalPublished: i === 201 }));
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "PATCH") { const body = JSON.parse(options.body); calls.push(body); if (++count === 1) return first.promise; return Response.json({ count: body.ids.length }); }
    if (url === "/api/invitations?all=1") return Response.json({ invitations: [{ ...event(), isPublished: true, accessPaid: true }] });
    return fetchLists(url, [], list);
  });
  try {
    const view = await panel.settle(); const pending = view.list.onPublishAll(); await view.list.onPublishAll();
    assert.equal(calls.length, 1); first.resolve(Response.json({ count: 100 })); await pending;
    assert.deepEqual(calls.map((call) => call.ids.length), [100, 100, 1]);
    assert.ok(calls.every((call) => call.invitationId === "event-a" && call.published === true));
    assert.deepEqual(calls.flatMap((call) => call.ids), list.filter((row) => !row.personalPublished).map((row) => row.id));
  } finally { panel.dispose(); }
});

test("selected Publish filters duplicate, published and foreign IDs before writing", async () => {
  const calls = [];
  const list = [
    { ...personal(), id: "personal-a", personalPublished: false },
    { ...personal(), id: "personal-b", personalPublished: false },
    { ...personal(), id: "personal-c", personalPublished: true },
  ];
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method === "PATCH") {
      const body = JSON.parse(options.body);
      calls.push(body);
      return Response.json({ count: body.ids.length });
    }
    if (url === "/api/invitations?all=1") {
      return Response.json({
        invitations: [{ ...event(), isPublished: true, accessPaid: true }],
      });
    }
    return fetchLists(url, [], list);
  });
  try {
    const view = await panel.settle();
    await view.list.onPublishSelected([
      "personal-b",
      "personal-c",
      "outside-event",
      "personal-b",
    ]);
    assert.deepEqual(calls, [{
      invitationId: "event-a",
      ids: ["personal-b"],
      published: true,
    }]);
  } finally {
    panel.dispose();
  }
});

test("personal links reuse only a saved invitation and creation never saves or publishes its design", async () => {
  const writes = [], lists = [];
  const saved = { ...event("event-b"), templateKey: "confetti-club::saved-design", accessPaid: false, isPublished: false };
  const panel = panelHarness(async (url, options = {}) => {
    if (options.method) {
      writes.push({ url, ...JSON.parse(options.body) });
      return Response.json({ invitations: [personal()] });
    }
    if (url === "/api/invitations?all=1") return Response.json({ invitations: [{ ...event(), templateKey: "", accessPaid: true }, saved] });
    lists.push(url); return fetchLists(url, [], []);
  });
  try {
    let view = await panel.settle();
    assert.deepEqual(view.picker.events.map((event) => event.id), ["event-b"]);
    assert.equal(view.picker.value, "event-b");
    assert.ok(lists.every((url) => url.includes("invitationId=event-b")));
    view.create.setName("Ibu Rina"); panel.render().create.onAddNames();
    view = panel.render(); assert.equal(view.save.disabled, false);
    const links = nodes(view.tree).filter((node) => node.props.href);
    assert.ok(links.every((node) => !String(node.props.href).startsWith("/dashboard/editor?")));
    assert.doesNotMatch(text(view.tree), /Edit undangan|Simpan draf|Simpan & Publish/);
    await view.save.onClick();
    assert.equal(writes.length, 1); assert.equal(writes[0].url, "/api/personal-invitations");
    assert.equal(writes[0].invitationId, "event-b"); assert.equal(writes[0].published, false);
    assert.equal(Object.hasOwn(writes[0], "templateKey"), false);
    assert.equal(Object.hasOwn(writes[0], "isPublished"), false);
    assert.equal(saved.templateKey, "confetti-club::saved-design"); assert.equal(saved.isPublished, false);
  } finally { panel.dispose(); }
});

test("with no saved design, names remain available without an Edit invitation button", async () => {
  const requests = [];
  const panel = panelHarness(async (url, options = {}) => {
    requests.push({ url, options });
    return Response.json({ invitations: [{ ...event(), templateKey: "" }] });
  });
  try {
    const view = await panel.settle();
    assert.equal(view.picker, undefined); assert.equal(view.list, undefined);
    assert.equal(find(view.tree, primitives.DashboardEmptyState).props.title, "Belum ada undangan tersimpan");
    view.create.setName("Ibu Rina"); panel.render().create.onAddNames();
    assert.equal(panel.render().save.disabled, true);
    await panel.render().save.onClick();
    assert.deepEqual(panel.render().create.drafts.map((row) => row.name), ["Ibu Rina"]);
    assert.ok(requests.every((request) => request.url === "/api/invitations?all=1" && !request.options.method));
    assert.ok(nodes(panel.render().tree).every((node) => node.props.href !== "/dashboard/editor?invitationId=event-a"));
  } finally { panel.dispose(); }
});

test("queued names are editable/removable by row identity, preserve duplicate names and expose remaining rows", () => {
  const edits = [], removed = [];
  const drafts = Array.from({ length: 43 }, (_, i) => ({ key: `draft-${i}`, name: "Bapak Andi", category: "REGULAR" }));
  const harness = createHarness({ drafts, onEditDraft: (...args) => edits.push(args), onRemoveDraft: (key) => removed.push(key) });
  let tree = harness.render();
  assert.equal(nodes(tree).filter((node) => node.type === Input).length, 40);
  nodes(tree).find((node) => node.type === Button && text(node.props.children) === "Tampilkan lebih banyak").props.onClick();
  tree = harness.render(); assert.equal(nodes(tree).filter((node) => node.type === Input).length, 43);
  const editableDraft = nodes(tree).find((node) => node.type === Input && node.props["aria-label"] === "Nama tamu 42");
  assert.match(editableDraft.props.className, /capitalize/);
  editableDraft.props.onChange({ target: { value: "Bapak Budi" } });
  const category = nodes(tree).filter((node) => node.type === fields.PersonalInvitationGuestFields)[42];
  category.props.onChange({ ...category.props.value, category: "VIP" });
  nodes(tree).filter((node) => node.type === Button && node.props["aria-label"]?.startsWith("Hapus:"))[41].props.onClick();
  assert.deepEqual(edits, [["draft-41", { name: "Bapak Budi" }], ["draft-41", { category: "VIP" }]]); assert.deepEqual(removed, ["draft-41"]);
});

function savedListHarness(overrides = {}) {
  const hooks = hookHarness();
  const production = loadSource("components/Dashboard/PersonalInvitationPanels.tsx", {
    react: hooks.hooks,
    "react/jsx-runtime": jsxRuntime,
    "next/link": (props) => React.createElement("a", props, props.children),
    "lucide-react": icons,
    "@/components/ui/button": { Button },
    "@/components/ui/input": { Input },
    "@/components/ui/dialog": dialogs,
    "@/components/Dashboard/useDashboardI18n": i18n,
    "@/lib/text/display-title-case": titles,
    "@/lib/guests/personal-envelope": envelope,
    "@/components/Dashboard/DashboardPrimitives": primitives,
    "@/components/Dashboard/PersonalInvitationGuestFields": fields,
    "@/components/Dashboard/personal-invitation-helpers": helpers,
  });
  let props = listProps(overrides);
  return {
    render(next = {}) {
      props = { ...props, ...next };
      return hooks.render(() => production.PersonalInvitationListPanel(props));
    },
    dispose() {
      hooks.unmount();
    },
  };
}

const listProps = (overrides = {}) => ({ selectedEvent: { ...event(), isPublished: true, accessPaid: true }, personal: [{ ...personal(), personalPublished: true }], editingId: null, editName: "", editPhone: "", editProfile: fields.emptyGuestInvitationForm, passwordId: null, password: "", busyId: null, loading: false, setEditName() {}, setEditPhone() {}, setEditProfile() {}, setPasswordId() {}, setPassword() {}, onReload() {}, onStartEdit() {}, onSaveEdit() {}, onPatch() {}, onSavePassword() {}, onDisablePassword() {}, onPublishAll() {}, onPublishSelected() {}, onCopyLink() {}, ...overrides });

test("saved recipients render as flat selectable rows with a right-edge send action", () => {
  const rows = [
    { ...personal(), id: "personal-a", name: "Andi", personalPublished: false },
    { ...personal(), id: "personal-b", name: "Rina", personalPublished: true, personalToken: "token-b" },
  ];
  const harness = savedListHarness({ personal: rows });
  try {
    const tree = harness.render();
    assert.equal(
      nodes(tree).filter(
        (node) => node.type === "input" && node.props.type === "checkbox",
      ).length,
      3,
    );
    assert.equal(
      renderToStaticMarkup(tree).includes("undara-dashboard-detail-card"),
      false,
    );
    const sendLabels = nodes(tree).filter((node) =>
      node.props["aria-label"]?.startsWith("Kirim:"),
    );
    assert.deepEqual(
      sendLabels.map((node) => node.props["aria-label"]),
      ["Kirim: Andi", "Kirim: Rina"],
    );
  } finally {
    harness.dispose();
  }
});

test("individual share controls use the actual recipient, optional phone and personal URL and never imply automatic delivery", () => {
  const published = { ...personal(), personalPublished: true, name: "Andi & Sari", recipientType: "COUPLE", personalLanguage: "EN", phone: "+62 812 3456 7890" };
  const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: "en" }, React.createElement(PersonalInvitationListPanel, listProps({ personal: [published] }))));
  assert.match(html, /Copy link/); assert.match(html, /Send<\/a>/); assert.match(html, /wa.me\/6281234567890\?text=/);
  const share = new URL(helpers.buildPersonalInvitationWhatsAppUrl(event(), published));
  assert.equal(share.searchParams.get("text"), `Dear : Mr Andi and Mrs Sari\n\n${event().title}\n${helpers.buildPersonalInvitationPublicUrl(event().slug, published.personalToken)}`);
  assert.equal(new URL(helpers.buildPersonalInvitationWhatsAppUrl(event(), { ...published, phone: null })).pathname, "/");
  for (const overrides of [{ personal: [personal()] }, { selectedEvent: event() }]) {
    const locked = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: "en" }, React.createElement(PersonalInvitationListPanel, listProps(overrides))));
    assert.doesNotMatch(locked, /Copy link|wa.me/);
    assert.match(locked, /Send<\/button>/);
  }
});

test("copying a recipient link changes no delivery markers and reports clipboard failures", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator"); const copies = [], requests = []; let denied = false;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { async writeText(value) { if (denied) throw new Error("Denied"); copies.push(value); } } } });
  const row = { ...personal(), personalPublished: true };
  const panel = panelHarness(async (url, options = {}) => {
    requests.push(options.method);
    if (url === "/api/invitations?all=1") return Response.json({ invitations: [{ ...event(), isPublished: true, accessPaid: true }] });
    return fetchLists(url, [], [row]);
  });
  try {
    await (await panel.settle()).list.onCopyLink(row);
    assert.deepEqual(copies, [helpers.buildPersonalInvitationPublicUrl(event().slug, row.personalToken)]);
    denied = true; await panel.render().list.onCopyLink(row);
    assert.ok(text(panel.render().tree).includes("Gagal menyalin tautan."));
    assert.ok(requests.every((method) => method === undefined));
    assert.equal(panel.render().list.personal[0].personalSharedAt, undefined);
  } finally { panel.dispose(); if (original) Object.defineProperty(globalThis, "navigator", original); else delete globalThis.navigator; }
});
