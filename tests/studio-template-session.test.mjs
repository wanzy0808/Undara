import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { invitationTemplates } from "../lib/templates/catalog.ts";
import { templateDemoInvitation, getTemplateDemoInvitation, templateDemoPhoto } from "../data/templates/preview-invitation.ts";
import { getInvitationDefaultMusic } from "../lib/templates/music.ts";
import { invitationDesignStateFromKey, makeInvitationDesignStateKey } from "../components/InvitationStudio/designer-state.ts";
import { invitationTemplatePresets, invitationDecorOptions } from "../components/InvitationStudio/designer-config.ts";
import { makeStudioSavedState, makeStudioServerRevision } from "../components/InvitationStudio/designer-persistence.ts";
import { STUDIO_REFRESH_DRAFT_KEY, makeStudioRefreshDraft, recoverStudioRefreshDraft, templateStudioEntryId } from "../lib/templates/studio-refresh-draft.ts";

// Exercise the actual component actions/effect, replacing only React setters and browser/API boundaries.
const source = readFileSync(new URL("../components/InvitationStudio/InvitationDesigner.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("InvitationDesigner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const actions = new Map();
let refreshEffect, entryExpression;
function inspect(node) {
  if (ts.isFunctionDeclaration(node) && ["change", "undo", "redo", "save", "load"].includes(node.name?.text)) actions.set(node.name.text, node.getText(ast));
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "studioEntryId" && node.initializer?.getText(ast).startsWith("templateMode")) entryExpression = node.initializer.getText(ast);
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect" && node.arguments[0]?.getText(ast).includes("makeStudioRefreshDraft(")) refreshEffect = node.arguments[0].getText(ast);
  ts.forEachChild(node, inspect);
}
inspect(ast);
assert.equal(actions.size, 5);
assert.ok(refreshEffect && entryExpression);
const compiled = ts.transpileModule([
  ...actions.values(),
  `function currentEntry() { return ${entryExpression}; }`,
  `function persistRefreshDraft() { return (${refreshEffect})(); }`,
].join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function studio(overrides = {}) {
  const storage = new Map(), saves = [], invitationSaves = [];
  let savedDraft;
  const state = {
    design: invitationDesignStateFromKey("silver-reverie"),
    selectedCatalogKey: "silver-reverie", history: [], future: [],
    templateMode: true, templateDraftId: null, templateCustomInvitationId: null,
    templateDraftStatus: null, saving: false, notice: "", audioMutation: { current: false },
    musicUrl: "", eventTag: "", dressCode: "", savedState: "", serverRevision: "",
    invitation: { ...templateDemoInvitation, id: templateStudioEntryId(), assets: [] },
    catalog: invitationTemplates,
    invitationDesignStateFromKey, makeInvitationDesignStateKey, makeStudioSavedState, makeStudioServerRevision,
    STUDIO_REFRESH_DRAFT_KEY, makeStudioRefreshDraft, recoverStudioRefreshDraft, templateStudioEntryId, URL, URLSearchParams,
    invitationTemplatePresets, invitationDecorOptions, getInvitationDefaultMusic, getTemplateDemoInvitation, templateDemoPhoto,
    clearTemplateSelection: () => {},
    saveStudioTemplateDraft: async (payload, draftId) => {
      saves.push({ payload, draftId });
      const result = { id: draftId || "draft-first-save", templateNo: 27, status: "DRAFT", updatedAt: "2026-10-06T02:10:00.000Z" };
      savedDraft = { ...payload, ...result, musicUrl: payload.musicUrl || null };
      return result;
    },
    loadStudioTemplateDraft: async () => ({ ...savedDraft, customInvitation: state.templateCustomInvitationId ? state.invitation : null }),
    saveStudioInvitation: async (invitation, templateKey, musicUrl, weddingHashtag, dressCode) => {
      invitationSaves.push(invitation.id);
      return { ...invitation, templateKey, musicUrl, weddingHashtag, dressCode };
    },
    window: {
      location: { href: "https://undara.example/owner/studio?template=silver-reverie", get search() { return new URL(this.href).search; } },
      performance: { getEntriesByType: () => [{ type: "reload" }] },
      sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
      history: {
        state: {},
        replaceState(next, _title, url) { this.state = next; state.window.location.href = new URL(url, state.window.location.href).href; },
      },
    },
    ...overrides,
  };
  for (const property of ["history", "future", "design", "selectedCatalogKey", "saving", "notice", "templateDraftId", "templateDraftStatus", "savedState", "invitation", "serverRevision", "musicUrl", "eventTag", "dressCode", "templateCustomInvitationId", "canvasStage", "selectedLayerId", "copiedAssetLayer", "copiedAssetLayers"]) {
    state[`set${property[0].toUpperCase()}${property.slice(1)}`] = (next) => { state[property] = typeof next === "function" ? next(state[property]) : next; };
  }
  Object.defineProperties(state, {
    designKey: { get: () => makeInvitationDesignStateKey(state.design) },
    currentState: { get: () => makeStudioSavedState(state.designKey, state.musicUrl, state.eventTag, state.dressCode) },
    dirty: { get: () => state.savedState !== state.currentState },
    template: { get: () => invitationTemplates.find((item) => item.key === state.design.template) },
    studioEntryId: { get: () => state.currentEntry() },
  });
  vm.runInContext(compiled, vm.createContext(state));
  return { state, storage, saves, invitationSaves };
}

test("actual Undo/Redo restores the theme catalog identity used by staff Save", async () => {
  const { state, saves } = studio();
  state.change({ template: "little-cloud", copy: { greeting: "Welcome, little one" } });
  state.setSelectedCatalogKey("little-cloud");
  state.undo();
  assert.equal(state.design.template, "silver-reverie");
  assert.equal(state.selectedCatalogKey, "silver-reverie");
  await state.save();
  assert.equal(saves[0].payload.name, "Silver Reverie Studio");
  assert.equal(saves[0].payload.category, "Anniversary");
  assert.equal(saves[0].payload.previewUrl, "/templates/silver-reverie/preview.svg");
  assert.equal(invitationDesignStateFromKey(saves[0].payload.designKey).template, "silver-reverie");
  state.redo();
  assert.equal(state.design.template, "little-cloud");
  assert.equal(state.selectedCatalogKey, "little-cloud");
  assert.equal(state.design.copy.greeting, "Welcome, little one");
  await state.save();
  assert.equal(saves[1].payload.name, "Little Cloud Studio");
  assert.equal(saves[1].payload.category, "Family");
});

test("catalog identity survives Undo/Redo between designer presets sharing one renderer", async () => {
  const base = invitationTemplates.find((item) => item.key === "silver-reverie");
  const { state, saves } = studio({ selectedCatalogKey: "designer:first", catalog: [
    { ...base, key: "designer:first", name: "Silver First", previewImage: "/first.webp" },
    { ...base, key: "designer:second", name: "Silver Second", previewImage: "/second.webp" },
  ] });
  state.change({ copy: { greeting: "Second preset copy" } });
  state.setSelectedCatalogKey("designer:second");
  state.undo();
  assert.equal(state.selectedCatalogKey, "designer:first");
  state.redo();
  assert.equal(state.selectedCatalogKey, "designer:second");
  await state.save();
  assert.equal(saves[0].payload.name, "Silver Second Studio");
  assert.equal(saves[0].payload.previewUrl, "/second.webp");
});

test("design history stays bounded and a new edit clears Redo without changing catalog identity", () => {
  const { state } = studio();
  for (let i = 0; i < 20; i++) state.change({ copy: { greeting: `Revision ${i}` } });
  assert.equal(state.history.length, 15);
  state.undo();
  assert.equal(state.design.copy.greeting, "Revision 18");
  state.change({ copy: { greeting: "New branch" } });
  assert.equal(state.future.length, 0);
  state.redo();
  assert.equal(state.design.copy.greeting, "New branch");
  assert.equal(state.selectedCatalogKey, "silver-reverie");
});

test("unsaved edits after the first staff Save recover under the newly created draft session", async () => {
  const { state, storage } = studio();
  const originalId = state.invitation.id;
  await state.save();
  state.change({ copy: { greeting: "Edited after first save" } });
  state.persistRefreshDraft();
  const entry = templateStudioEntryId(state.templateDraftId);
  const raw = storage.get(STUDIO_REFRESH_DRAFT_KEY);
  assert.equal(state.window.history.state.__dcStudioDraftEntry, entry);
  assert.equal(JSON.parse(raw).invitationId, entry);
  assert.deepEqual(recoverStudioRefreshDraft(raw, "reload", entry, state.serverRevision), JSON.parse(state.currentState));
  assert.equal(recoverStudioRefreshDraft(raw, "reload", originalId, state.serverRevision), null);
  await state.save();
  assert.equal(storage.has(STUDIO_REFRESH_DRAFT_KEY), false);
});

test("custom drafts use draft sessions for recovery while preserving the actual customer invitation id", async () => {
  const customer = { ...templateDemoInvitation, id: "event-A", assets: [{ id: "customer-photo", type: "IMAGE", url: "/customer.webp" }] };
  const { state, storage, invitationSaves } = studio({ templateDraftId: "custom-first", templateCustomInvitationId: customer.id, invitation: customer });
  await state.save();
  state.change({ copy: { greeting: "Customer custom greeting" } });
  state.persistRefreshDraft();
  const raw = storage.get(STUDIO_REFRESH_DRAFT_KEY);
  assert.deepEqual(recoverStudioRefreshDraft(raw, "reload", templateStudioEntryId("custom-first"), state.serverRevision), JSON.parse(state.currentState));
  assert.equal(recoverStudioRefreshDraft(raw, "reload", templateStudioEntryId("custom-second"), state.serverRevision), null);
  assert.equal(state.invitation.id, customer.id);
  assert.deepEqual(state.invitation.assets, customer.assets);
  assert.equal(invitationSaves.length, 0);
});

test("ordinary customer Save and refresh remain scoped to the actual event", async () => {
  const { state, storage, saves, invitationSaves } = studio({ templateMode: false, invitation: { ...templateDemoInvitation, id: "event-customer", assets: [] } });
  await state.save();
  state.change({ copy: { greeting: "Event-only edit" } });
  state.persistRefreshDraft();
  const raw = storage.get(STUDIO_REFRESH_DRAFT_KEY);
  assert.deepEqual(recoverStudioRefreshDraft(raw, "reload", "event-customer", state.serverRevision), JSON.parse(state.currentState));
  assert.equal(recoverStudioRefreshDraft(raw, "reload", "another-event", state.serverRevision), null);
  assert.deepEqual(invitationSaves, ["event-customer"]);
  assert.equal(saves.length, 0);
});

test("actual master Save/edit/reload restores the changed theme and catalog choice with default music", async () => {
  const { state } = studio();
  await state.save();
  state.change({ template: "little-cloud", copy: { greeting: "New Baby Shower draft" } });
  state.setSelectedCatalogKey("little-cloud");
  state.persistRefreshDraft();
  await state.load();
  assert.equal(state.design.template, "little-cloud");
  assert.equal(state.design.copy.greeting, "New Baby Shower draft");
  assert.equal(state.selectedCatalogKey, "little-cloud");
  assert.equal(state.musicUrl, "");
});

test("actual custom Save/edit/reload preserves authored copy and owned data with inherited music", async () => {
  const customer = { ...templateDemoInvitation, id: "event-custom", musicUrl: "/assets/audio/customer-song.mp3", assets: [{ id: "owned-photo", type: "IMAGE", url: "/owned.webp" }] };
  const { state } = studio({ templateDraftId: "custom-saved", templateCustomInvitationId: customer.id, invitation: customer });
  await state.save();
  state.change({ copy: { greeting: "Our real custom greeting" } });
  state.persistRefreshDraft();
  await state.load();
  assert.equal(state.design.copy.greeting, "Our real custom greeting");
  assert.equal(state.selectedCatalogKey, "silver-reverie");
  assert.equal(state.invitation.id, customer.id);
  assert.equal(state.invitation.title, customer.title);
  assert.deepEqual(state.invitation.assets, customer.assets);
  assert.equal(state.invitation.musicUrl, customer.musicUrl);
  assert.equal(state.musicUrl, "");
});
