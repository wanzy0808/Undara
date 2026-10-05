import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { invitationDesignStateFromKey, makeInvitationDesignStateKey } from "../components/InvitationStudio/designer-state.ts";
import SelectionInspectorModule from "../components/InvitationStudio/StudioSelectionInspector.tsx";
import { defaultInvitationSectionLayout, parseInvitationSectionLayout, sanitizeInvitationSectionLayout, withInvitationSectionLayout } from "../lib/templates/section-layout.ts";
import { invitationSectionInstanceStyle } from "../lib/templates/section-styles.ts";
import { nativeVisualInstanceId } from "../lib/templates/native-visual-transforms.ts";
import { safeVisualColor } from "../lib/templates/visual-colors.ts";
import { defaultInvitationSections } from "../lib/templates/sections.ts";
import { InvitationLanguageProvider } from "../components/PublicInvitation/InvitationLanguage.tsx";
import { templateDemoInvitation } from "../data/templates/preview-invitation.ts";

const require = createRequire(import.meta.url);
require.extensions[".css"] = () => {};
const [{ default: RomanticRoseModule }, { default: UniversalModule }] = await Promise.all([
  import("../components/PublicInvitation/RomanticRoseTemplate.tsx"),
  import("../components/PublicInvitation/UniversalInvitationTemplate.tsx"),
]);
const component = (module) => module.default ?? module;
const noop = () => {};

// Exercise real editor commands; React state scheduling is the fixture boundary.
const source = readFileSync(new URL("../components/InvitationStudio/InvitationDesigner.tsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("InvitationDesigner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ["duplicateSectionInstance", "updateSectionStyle", "resetSectionStyle", "deleteSectionInstance"];
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

function editorHarness(initial = invitationDesignStateFromKey("garden-light", ""), overrides = {}) {
  const design = structuredClone(initial);
  const history = [], future = [];
  const event = Object.freeze({ id: "event-only", title: "Acara", assets: Object.freeze([]) });
  const context = {
    design, invitation: event, saving: false, audioBusy: false,
    selectedSectionInstanceId: null, selectedAssetLayer: null,
    assetLayerUsage: 0, maxAssetLayers: 12, locale: "id", crypto,
    safeVisualColor, nativeVisualInstanceId,
    change(patch) { history.push(structuredClone(design)); future.length = 0; Object.assign(design, patch); },
    ...Object.fromEntries([...new Set(compiled.match(/\bset[A-Z]\w*(?=\()/g))].map((name) => [name, noop])),
    ...overrides,
  };
  const commands = new Function(...Object.keys(context), `${compiled}\nreturn { ${names.join(",")} };`)(...Object.values(context));
  return {
    ...commands, design, event, history,
    undo() { future.push(structuredClone(design)); Object.assign(design, history.pop()); },
    redo() { history.push(structuredClone(design)); Object.assign(design, future.pop()); },
    reload() { return invitationDesignStateFromKey(makeInvitationDesignStateKey(design), ""); },
  };
}

test("instance backgrounds persist even on an otherwise default layout and legacy keys stay unchanged", () => {
  const original = "garden-light::pearl::cinzelFauna";
  assert.equal(withInvitationSectionLayout(original, defaultInvitationSectionLayout), original);
  const colored = defaultInvitationSectionLayout.map((item) => item.key === "cover" ? { ...item, background: "#ABCDEF" } : item);
  const key = withInvitationSectionLayout(original, colored);
  assert.match(key, /::sectionLayout=/);
  assert.equal(parseInvitationSectionLayout(key).find((item) => item.key === "cover").background, "#abcdef");
  assert.equal(parseInvitationSectionLayout(key).find((item) => item.key === "gallery").background, undefined);
  assert.equal(withInvitationSectionLayout(key, defaultInvitationSectionLayout), original);
  assert.deepEqual(parseInvitationSectionLayout(original), defaultInvitationSectionLayout);
});

test("layout paint rejects arbitrary CSS without changing IDs, visibility, ordering or the 36-section limit", () => {
  for (const background of ["red", "#fff", "transparent", "url(https://bad.example)", "#abcdef;display:none", null, {}]) {
    assert.deepEqual(sanitizeInvitationSectionLayout([{ id: "gallery_copy2", key: "gallery", hidden: true, background }]), [
      { id: "gallery_copy2", key: "gallery", hidden: true },
    ]);
  }
  const layout = Array.from({ length: 36 }, (_, i) => ({ id: `gallery_${i}`, key: "gallery", background: `#${i.toString(16).padStart(6, "0")}` }));
  assert.deepEqual(parseInvitationSectionLayout(withInvitationSectionLayout("garden-light", layout)), layout);
  assert.equal(sanitizeInvitationSectionLayout([...layout, { id: "overflow", key: "cover" }]).length, 36);
});

test("duplicate snapshots effective paint and later edits, Undo/Redo and reload stay independent", () => {
  const editor = editorHarness();
  editor.design.sectionStyles.gallery = { background: "#aabbcc", paddingY: 60 };
  editor.duplicateSectionInstance("gallery");
  const duplicate = editor.design.sectionLayout.find((item) => item.key === "gallery" && item.id !== "gallery");
  assert.equal(duplicate.background, "#aabbcc");
  editor.updateSectionStyle("gallery", { background: "#112233" }, "gallery");
  editor.updateSectionStyle("gallery", { background: "#445566" }, duplicate.id);
  const saved = editor.reload();
  assert.equal(saved.sectionLayout.find((item) => item.id === "gallery").background, "#112233");
  assert.equal(saved.sectionLayout.find((item) => item.id === duplicate.id).background, "#445566");
  assert.deepEqual(saved.sectionStyles.gallery, { background: "#aabbcc", paddingY: 60 });
  editor.undo();
  assert.equal(editor.reload().sectionLayout.find((item) => item.id === duplicate.id).background, "#aabbcc");
  editor.redo();
  assert.equal(editor.reload().sectionLayout.find((item) => item.id === duplicate.id).background, "#445566");
  assert.equal(editor.event.title, "Acara");
  assert.deepEqual(editor.event.assets, []);
});

test("individual and full Reset preserve sibling paint and return the selected surface to its inherited baseline", () => {
  const editor = editorHarness();
  editor.design.sectionLayout = [{ id: "cover", key: "cover", background: "#112233" }, { id: "cover_copy2", key: "cover", background: "#445566" }];
  editor.design.sectionStyles.cover = { background: "#abcdef", paddingY: 24, opacity: 0.8 };
  editor.updateSectionStyle("cover", { background: undefined }, "cover");
  assert.equal(editor.design.sectionLayout[0].background, undefined);
  assert.equal(invitationSectionInstanceStyle(editor.design.sectionStyles.cover, editor.design.sectionLayout[0]).background, "#abcdef");
  assert.equal(editor.design.sectionLayout[1].background, "#445566");
  editor.updateSectionStyle("cover", { background: "#556677" }, "cover");
  editor.resetSectionStyle("cover", "cover");
  assert.equal(editor.reload().sectionLayout[0].background, undefined);
  assert.equal(editor.reload().sectionLayout[1].background, "#445566");
  assert.deepEqual(editor.reload().sectionStyles.cover, { background: "#abcdef" });
  editor.deleteSectionInstance("cover");
  assert.deepEqual(editor.reload().sectionLayout, [{ id: "cover_copy2", key: "cover", background: "#445566" }]);
});

test("busy, invalid or stale section controls cannot change a different section; envelope remains unique", () => {
  for (const overrides of [{ invitation: null }, { saving: true }, { audioBusy: true }]) {
    const editor = editorHarness(undefined, overrides);
    editor.updateSectionStyle("cover", { background: "#123456" }, "cover");
    editor.resetSectionStyle("cover", "cover");
    assert.equal(editor.history.length, 0);
  }
  const editor = editorHarness();
  editor.updateSectionStyle("cover", { background: "url(x)" }, "cover");
  editor.updateSectionStyle("cover", { background: "#123456" }, "missing");
  editor.updateSectionStyle("cover", { background: "#123456" }, "gallery");
  editor.resetSectionStyle("cover", "gallery");
  assert.equal(editor.history.length, 0);
  editor.updateSectionStyle("envelope", { background: "#123456" });
  assert.equal(editor.reload().sectionStyles.envelope.background, "#123456");
  editor.resetSectionStyle("envelope");
  assert.equal(editor.reload().sectionStyles.envelope, undefined);
});

for (const [name, module, template] of [["Universal", UniversalModule, "garden-light"], ["Romantic Rose", RomanticRoseModule, "romantic-rose"]]) {
  test(`${name} renders independent section colors in editor, final Preview and public markup`, () => {
    const state = invitationDesignStateFromKey(template, "");
    state.sectionStyles.cover = { background: "#ffeedd" };
    state.sectionStyles.gallery = { background: "#abcdef" };
    state.sectionLayout = [
      { id: "cover", key: "cover", background: "#112233" }, { id: "cover_copy2", key: "cover", background: "#445566" },
      { id: "gallery", key: "gallery", background: "#778899" }, { id: "gallery_copy2", key: "gallery" },
    ];
    const designKey = makeInvitationDesignStateKey(state);
    const props = { templateKey: template, invitation: { ...templateDemoInvitation, assets: [] }, designKey,
      sections: { ...defaultInvitationSections, envelope: false, music: false } };
    for (const options of [{ preview: true, editorPreview: true }, { preview: true, editorPreview: false }, { preview: false, editorPreview: false }]) {
      const html = renderToStaticMarkup(createElement(InvitationLanguageProvider, { language: "ID" }, createElement(component(module), { ...props, ...options })));
      for (const [id, color] of [["cover", "#112233"], ["cover_copy2", "#445566"], ["gallery", "#778899"], ["gallery_copy2", "#abcdef"]]) {
        const instance = html.split(`data-section-instance-id="${id}"`)[1]?.split("data-section-instance-id=")[0];
        assert.ok(instance, id);
        assert.match(instance, new RegExp(`data-invitation-section="(?:cover|gallery)"[^>]*style="[^\"]*background:${color}`));
        assert.match(instance, new RegExp(`--inv-section-background:${color}`));
      }
      if (name === "Universal") assert.equal((html.match(/<div[^>]*data-invitation-background-override="true"/g) ?? []).length, 2);
    }
  });
}

test("right inspector displays the selected instance, resets only its own paint and disables editing while busy", () => {
  const design = invitationDesignStateFromKey("garden-light", "");
  design.sectionStyles.gallery = { background: "#abcdef" };
  design.sectionLayout.push({ id: "gallery_copy2", key: "gallery", background: "#112233" });
  const calls = [];
  const props = { locale: "id", design, selectedAssetLayer: null, selectedAssetIndex: -1, maxAssetLayers: 12,
    selectedPhotoSlot: null, photoAssets: [], photoEditingDisabled: false, selectedRsvpElementKey: null,
    selectedSectionElement: null, selectedCopyField: null, selectedNativeKey: null,
    selectedSectionKey: "gallery", selectedSectionInstanceId: "gallery_copy2", onCloseSection: noop,
    onUpdateSectionStyle: (...args) => calls.push(args), onResetSectionStyle: noop };
  const element = component(SelectionInspectorModule)(props);
  element.props.onUpdate({ background: "#445566" });
  assert.deepEqual(calls, [["gallery", { background: "#445566" }, "gallery_copy2"]]);
  const render = (extra) => renderToStaticMarkup(createElement(component(SelectionInspectorModule), { ...props, ...extra }));
  assert.match(render({}), /type="color"[^>]*value="#112233"/);
  assert.match(render({ selectedSectionInstanceId: "gallery" }), /type="color"[^>]*value="#abcdef"/);
  const inheritedReset = render({ selectedSectionInstanceId: "gallery" }).match(/<button[^>]*aria-label="Reset Latar"[^>]*>/)?.[0];
  assert.match(inheritedReset, /disabled=""/);
  assert.match(render({ nativeEditingDisabled: true }), /<fieldset disabled=""/);
  assert.match(render({ locale: "en" }), /aria-label="Reset Background"/);
});
