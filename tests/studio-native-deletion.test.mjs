import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StudioSelectionInspectorModule from "../components/InvitationStudio/StudioSelectionInspector.tsx";
import { invitationTemplatePresets } from "../components/InvitationStudio/designer-config.ts";
import { invitationDesignStateFromKey, makeInvitationDesignStateKey } from "../components/InvitationStudio/designer-state.ts";
import { nativeVisualIsLocked } from "../lib/templates/native-visual-locks.ts";
import * as native from "../lib/templates/native-visual-transforms.ts";
import { defaultInvitationSections } from "../lib/templates/sections.ts";
import { defaultPhotoAssignments } from "../lib/templates/photo-slots.ts";
import { defaultInvitationRsvpConfig } from "../lib/templates/rsvp-config.ts";
import { defaultInvitationSectionLayout } from "../lib/templates/section-layout.ts";

const source = readFileSync(new URL("../components/InvitationStudio/InvitationDesigner.tsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("InvitationDesigner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ["clearCanvasSelection", "commitNativeVisual", "hideSelectedNativeVisual", "deleteSectionInstance", "restoreDefaults", "toggleNativeLock", "duplicateSectionInstance"];
const functions = new Map();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) functions.set(node.name.text, node.getText(parsed));
  ts.forEachChild(node, visit);
}
visit(parsed);
assert.equal(functions.size, names.length);
const compiled = ts.transpileModule([...functions.values()].join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

// Execute the real editor commands. State scheduling, focus and scrolling are fixtures.
function editorHarness(initial = invitationDesignStateFromKey("garden-light", ""), overrides = {}) {
  const design = structuredClone(initial);
  const event = Object.freeze({ id: "event-a", title: "Acara A", assets: Object.freeze([{ id: "photo-a", url: "/photo-a.webp" }]) });
  const history = [];
  const ui = { setSelectedPhotoSlot: "personOne", setSelectedNativeKey: "photo:personOne", setCropModeSlot: "personOne" };
  let focusCount = 0;
  const context = {
    nativeVisualIsLocked,
    defaultNativeVisualTransform: native.defaultNativeVisualTransform,
    isNativeVisualKey: native.isNativeVisualKey,
    nativeVisualCanHide: native.nativeVisualCanHide,
    nativeVisualTransformForKey: native.nativeVisualTransformForKey,
    nativeVisualInstanceId: native.nativeVisualInstanceId,
    sanitizeNativeVisualTransforms: native.sanitizeNativeVisualTransforms,
    defaultInvitationSections, defaultPhotoAssignments,
    defaultInvitationRsvpConfig, defaultInvitationSectionLayout, invitationTemplatePresets,
    design, invitation: event, saving: false, audioBusy: false, audioMutation: { current: false },
    assetLayerUsage: 0, maxAssetLayers: 12, locale: "id", crypto,
    blankCanvasSections: {}, selectedSectionInstanceId: "cover", selectedAssetLayer: null,
    draggedAssetSrc: { current: null }, canvasScrollRef: { current: { scrollTo() {} } },
    requestAnimationFrame: (callback) => callback(),
    activateCanvasEditing: () => { focusCount++; },
    change(patch) { history.push(structuredClone(design)); Object.assign(design, patch); },
    ...Object.fromEntries([...new Set(compiled.match(/\bset[A-Z]\w*(?=\()/g))]
      .map((name) => [name, (value) => { ui[name] = typeof value === "function" ? value(ui[name] ?? 0) : value; }])),
    ...overrides,
  };
  const commands = new Function(...Object.keys(context), `${compiled}\nreturn { ${names.join(",")} };`)(...Object.values(context));
  return {
    ...commands, design, event, history, ui,
    get focusCount() { return focusCount; },
    undo() { Object.assign(design, history.pop()); },
    reload() { return invitationDesignStateFromKey(makeInvitationDesignStateKey(design), ""); },
  };
}

test("Delete removes every registered visual kind and keeps source event/media assignments", () => {
  const editor = editorHarness();
  editor.design.photos.personOne = "photo-a";
  const photos = structuredClone(editor.design.photos);
  const rsvp = structuredClone(editor.design.rsvpConfig);
  for (const key of [
    "heading:envelope", "heading:cover:cover", "copy:greeting:greeting",
    "photo:envelope:cover", "photo:cover:cover", "photo:personOne:identity", "photo:personTwo:identity_copy2",
    "photo:gallery:photo-a:gallery", "object:event:venue:event", "object:countdown:hari-value:countdown",
    "object:gift:account-number:gift", "object:cover:content-group:cover",
    "element:location:button:location", "element:gift:button:gift",
    "element:wishes:input:wishes", "element:wishes:button:wishes", "object:wishes:form-group:wishes",
    "rsvp:title:rsvp", "rsvp:inputs:rsvp", "rsvp:button:rsvp", "object:rsvp:form-group:rsvp",
  ]) {
    assert.equal(editor.hideSelectedNativeVisual(key), true, key);
    assert.equal(editor.reload().nativeVisuals[key]?.hidden, true, key);
  }
  assert.deepEqual(editor.design.photos, photos);
  assert.deepEqual(editor.design.rsvpConfig, rsvp);
  assert.equal(editor.event.title, "Acara A");
  assert.equal(editor.event.assets[0].id, "photo-a");
  for (const key of ["setSelectedPhotoSlot", "setSelectedNativeKey", "setCropModeSlot", "setSelectedCopyField", "setSelectedRsvpElementKey", "setSelectedSectionElement"]) {
    assert.equal(editor.ui[key], null, key);
  }
  assert.equal(editor.focusCount, 21);
});

test("instance deletion retains its geometry and never hides the sibling instance", () => {
  const editor = editorHarness();
  editor.design.nativeVisuals = {
    "photo:personOne": { ...native.defaultNativeVisualTransform, x: 14, color: "#123456" },
    "photo:personOne:identity_copy2": { ...native.defaultNativeVisualTransform, x: -18, rotation: 12 },
  };
  editor.hideSelectedNativeVisual("photo:personOne:identity_copy2");
  const reloaded = editor.reload();
  assert.equal(reloaded.nativeVisuals["photo:personOne:identity_copy2"].x, -18);
  assert.equal(reloaded.nativeVisuals["photo:personOne:identity_copy2"].rotation, 12);
  assert.equal(native.nativeVisualTransformForKey(reloaded.nativeVisuals, "photo:personOne:identity")?.hidden, undefined);
  const css = native.nativeVisualStyleSheet(makeInvitationDesignStateKey(reloaded));
  assert.match(css, /\[data-section-instance-id="identity_copy2"\][^\n]*display:none!important/);
  assert.doesNotMatch(css, /\[data-section-instance-id="identity"\][^\n]*display:none/);
});

test("an empty content layout survives reload; Default restores sections and removed elements with Undo", () => {
  const editor = editorHarness();
  editor.hideSelectedNativeVisual("heading:envelope");
  editor.hideSelectedNativeVisual("photo:personOne:identity");
  for (const { id } of [...editor.design.sectionLayout]) editor.deleteSectionInstance(id);
  editor.design.sections.envelope = false;
  editor.design.sections.music = false;
  assert.deepEqual(editor.reload().sectionLayout, []);
  assert.ok(Object.values(editor.reload().sections).every((value) => value === false));
  const empty = structuredClone(editor.design);
  editor.restoreDefaults();
  assert.deepEqual(editor.reload().nativeVisuals, {});
  assert.deepEqual(editor.reload().sectionLayout, defaultInvitationSectionLayout);
  assert.deepEqual(editor.reload().sections, defaultInvitationSections);
  assert.equal(editor.ui.setSelectedPhotoSlot, null);
  assert.equal(editor.ui.setSelectedNativeKey, null);
  assert.equal(editor.event.assets[0].id, "photo-a");
  editor.undo();
  assert.deepEqual(editor.design, empty);
});

test("all 512 native targets keep their hidden flags after serialization beyond the old 96/24k limits", () => {
  const values = Object.fromEntries(Array.from({ length: 512 }, (_, index) => [
    `object:cover:visual_${index}:cover_copy2`, { ...native.defaultNativeVisualTransform, hidden: true },
  ]));
  const key = native.withNativeVisualTransforms("garden-light", values);
  assert.ok(key.length > 24000);
  assert.deepEqual(native.parseNativeVisualTransforms(key), values);
  const bounded = native.sanitizeNativeVisualTransforms({ ...values, "object:cover:overflow": { ...native.defaultNativeVisualTransform, hidden: true } });
  assert.equal(Object.keys(bounded).length, 512);
});

test("unregistered selectors and busy editor states cannot remove visuals", () => {
  for (const overrides of [{ saving: true }, { audioBusy: true }, { invitation: null }]) {
    const editor = editorHarness(undefined, overrides);
    assert.equal(editor.hideSelectedNativeVisual("photo:personOne:identity"), false);
    assert.equal(editor.history.length, 0);
  }
  const editor = editorHarness();
  for (const key of ["rsvp:custom:question_1:rsvp", 'object:cover:bad"]{display:none}', "photo:gallery", "object:music:player"]) {
    assert.equal(editor.hideSelectedNativeVisual(key), false);
    assert.deepEqual(native.sanitizeNativeVisualTransforms({ [key]: { ...native.defaultNativeVisualTransform, hidden: true } }), {});
  }
  assert.deepEqual(editor.design.nativeVisuals, {});
});

test("native lock blocks direct styling, geometry and deletion until explicitly unlocked, with Undo", () => {
  const editor = editorHarness();
  const key = "photo:personOne:identity";
  editor.toggleNativeLock(key);
  assert.equal(editor.reload().nativeLocks[key], true);
  const count = editor.history.length;
  editor.commitNativeVisual(key, { ...native.defaultNativeVisualTransform, x: 18, color: "#123456" });
  assert.equal(editor.hideSelectedNativeVisual(key), false);
  assert.equal(editor.history.length, count);
  assert.equal(editor.design.nativeVisuals[key], undefined);
  editor.toggleNativeLock(key);
  assert.equal(nativeVisualIsLocked(editor.reload().nativeLocks, key), false);
  editor.undo();
  assert.equal(nativeVisualIsLocked(editor.reload().nativeLocks, key), true);
  editor.toggleNativeLock(key);
  editor.commitNativeVisual(key, { ...native.defaultNativeVisualTransform, x: 18 });
  assert.equal(editor.reload().nativeVisuals[key].x, 18);
  assert.equal(editor.event.assets[0].id, "photo-a");
});

test("unlocking one inherited native lock leaves its sibling locked and preserves an explicit false override", () => {
  const editor = editorHarness();
  editor.design.nativeLocks["photo:personOne"] = true;
  editor.toggleNativeLock("photo:personOne:identity_copy2");
  const reloaded = editor.reload();
  assert.equal(reloaded.nativeLocks["photo:personOne:identity_copy2"], false);
  assert.equal(nativeVisualIsLocked(reloaded.nativeLocks, "photo:personOne:identity_copy2"), false);
  assert.equal(nativeVisualIsLocked(reloaded.nativeLocks, "photo:personOne:identity"), true);
});

test("section Duplicate/Delete and Default carry or clear native locks and layer order with their own instance", () => {
  const editor = editorHarness();
  const key = "object:cover:content-group:cover";
  editor.design.nativeLocks[key] = true;
  editor.design.nativeVisuals[key] = { ...native.defaultNativeVisualTransform, x: 12, layerOrder: 3 };
  editor.duplicateSectionInstance("cover");
  const duplicate = editor.design.sectionLayout.find((item) => item.key === "cover" && item.id !== "cover");
  const cloneKey = `object:cover:content-group:${duplicate.id}`;
  assert.equal(editor.reload().nativeLocks[cloneKey], true);
  assert.equal(editor.reload().nativeVisuals[cloneKey].layerOrder, 3);
  editor.deleteSectionInstance(duplicate.id);
  assert.equal(editor.reload().nativeLocks[cloneKey], undefined);
  assert.equal(editor.reload().nativeLocks[key], true);
  editor.restoreDefaults();
  assert.deepEqual(editor.reload().nativeLocks, {});
  assert.deepEqual(editor.reload().nativeVisuals, {});
  editor.undo();
  assert.equal(editor.reload().nativeLocks[key], true);
  assert.equal(editor.reload().nativeVisuals[key].layerOrder, 3);
});

test("right inspector binds Delete to the selected instance, exposes short ID/EN labels and obeys busy state", () => {
  const Inspector = StudioSelectionInspectorModule.default ?? StudioSelectionInspectorModule;
  const design = invitationDesignStateFromKey("garden-light", "");
  const deleted = [];
  for (const [locale, label] of [["id", "Hapus"], ["en", "Delete"]]) {
    const props = {
      locale, design, selectedAssetLayer: null, selectedAssetIndex: -1, maxAssetLayers: 10,
      selectedPhotoSlot: null, selectedNativeKey: "photo:personOne:identity_copy2",
      onUpdateNative() {}, onCloseNative() {}, onDeleteNative: (key) => deleted.push(key),
    };
    const control = Inspector(props);
    control.props.onDelete();
    assert.equal(deleted.at(-1), props.selectedNativeKey);
    assert.match(renderToStaticMarkup(createElement(Inspector, props)), new RegExp(`>${label}</button>`));
    assert.match(renderToStaticMarkup(createElement(Inspector, { ...props, nativeEditingDisabled: true })), new RegExp(`disabled=""[^>]*>.*>${label}</button>`));
    assert.doesNotMatch(renderToStaticMarkup(createElement(Inspector, { ...props, selectedNativeKey: "rsvp:custom:question_1" })), /Hapus|Delete/);
  }
});
