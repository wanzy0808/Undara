import assert from "node:assert/strict";
import test from "node:test";
import { resolveStudioCanvasSelection } from "../components/InvitationStudio/studio-canvas-selection.ts";
import { findSectionAt } from "../components/InvitationStudio/studio-canvas-dom.ts";
import { isStudioCanvasShortcutTarget } from "../components/InvitationStudio/studio-canvas-shortcuts.ts";
import { nativePhotoVisualKey, nativeVisualCanHide, nativeVisualSelector } from "../lib/templates/native-visual-transforms.ts";

// A small ancestor/geometry fixture exercises dispatch and hit lookup without claiming browser QA.
class Node {
  constructor(tag = "div", attributes = {}, parent = null, rect = {}) {
    this.tag = tag;
    this.attributes = attributes;
    this.parent = parent;
    this.children = [];
    this.rect = { left: 0, top: 0, right: 340, bottom: 300, width: 340, height: 300, ...rect };
    this.dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith("data-")).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
    parent?.children.push(this);
  }
  hasAttribute(name) { return name in this.attributes; }
  matches(selector) {
    return selector.split(",").some((query) => {
      query = query.trim();
      if (query.startsWith(".")) return (this.attributes.class ?? "").split(" ").includes(query.slice(1));
      if (query === '[contenteditable]:not([contenteditable="false"])') return this.hasAttribute("contenteditable") && this.attributes.contenteditable !== "false";
      const attribute = query.match(/^\[([^=\]]+)(?:=(?:"([^"]*)"|([^\]]+)))?\]$/);
      if (attribute) return this.hasAttribute(attribute[1]) && (attribute[2] === undefined && attribute[3] === undefined || this.attributes[attribute[1]] === (attribute[2] ?? attribute[3]));
      return this.tag === query;
    });
  }
  closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
  contains(node) { for (; node; node = node.parent) if (node === this) return true; return false; }
  querySelectorAll(selector) { return this.children.flatMap((node) => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]); }
  getBoundingClientRect() { return this.rect; }
}

function sectionFixture(section = "identity", instanceId = `${section}_copy2`) {
  const canvas = new Node("div", { class: "undara-studio-canvas-scroll" });
  const surface = new Node("div", { class: "undara-studio-preview-surface" }, canvas);
  const instance = new Node("div", { "data-section-instance-id": instanceId }, surface);
  const root = new Node("section", { "data-invitation-section": section }, instance);
  return { canvas, surface, root, resolve: (target) => resolveStudioCanvasSelection(target, canvas) };
}

test("headings, copy, decorative objects and protected display data resolve to the right instance", () => {
  const { root, resolve } = sectionFixture("greeting");
  const targets = [
    ["h2", { "data-studio-native-heading": "" }, { kind: "native", key: "heading:greeting:greeting_copy2" }],
    ["p", { "data-studio-copy-field": "greeting" }, { kind: "copy", field: "greeting", instanceId: "greeting_copy2" }],
    ["svg", { "data-studio-native-object": "object:greeting:divider" }, { kind: "native", key: "object:greeting:divider:greeting_copy2" }],
    ["p", { "data-studio-native-object": "object:greeting:names" }, { kind: "native", key: "object:greeting:names:greeting_copy2" }],
  ];
  for (const [tag, attributes, expected] of targets) {
    assert.deepEqual(resolve(new Node("span", {}, new Node(tag, attributes, root))), expected);
  }
  assert.equal(nativeVisualCanHide("object:greeting:divider:greeting_copy2"), true);
  assert.equal(nativeVisualCanHide("object:greeting:names:greeting_copy2"), true);
});

test("RSVP inputs, custom fields and button use their component inspector before parent native groups", () => {
  const { canvas, root, resolve } = sectionFixture("rsvp");
  const group = new Node("form", { "data-studio-native-object": "object:rsvp:form-group" }, root);
  for (const key of ["title", "inputs", "button", "custom:question_1"]) {
    const marked = new Node("div", { "data-studio-rsvp-element": key }, group);
    const target = new Node(key === "button" ? "button" : "input", {}, marked);
    assert.deepEqual(resolve(target), { kind: "rsvp-element", key, instanceId: "rsvp_copy2" });
    assert.equal(isStudioCanvasShortcutTarget(canvas, target), key === "button");
  }
});

test("Location, Gift and Wishes select their own input/button styling before native groups", () => {
  for (const [section, kinds] of [["location", ["button"]], ["gift", ["button"]], ["wishes", ["input", "button"]]]) {
    const { root, resolve } = sectionFixture(section);
    const group = new Node("div", { "data-studio-native-object": `object:${section}:panel` }, root);
    for (const elementKind of kinds) {
      const target = new Node(elementKind === "input" ? "textarea" : "button", { "data-studio-section-element": `${section}:${elementKind}` }, group);
      assert.deepEqual(resolve(target), { kind: "section-element", section, elementKind, instanceId: `${section}_copy2` });
    }
  }
});

test("photo frames take priority over their native parent and retain slot, asset and instance identity", () => {
  for (const slot of ["cover", "personOne", "personTwo", "gallery"]) {
    const section = slot === "cover" ? "cover" : slot === "gallery" ? "gallery" : "identity";
    const { root, resolve } = sectionFixture(section);
    const group = new Node("div", { "data-studio-native-object": `object:${section}:photo-group` }, root);
    const photo = new Node("div", { "data-invitation-photo-slot": slot, ...(slot === "gallery" ? { "data-studio-photo-id": "asset_1" } : {}) }, group);
    const selected = resolve(new Node("img", {}, photo));
    assert.deepEqual(selected, { kind: "photo", slot, instanceId: `${section}_copy2`, ...(slot === "gallery" ? { assetId: "asset_1" } : {}) });
    assert.match(nativeVisualSelector(nativePhotoVisualKey(slot, "cover", selected.instanceId, selected.assetId)), new RegExp(`data-section-instance-id="${section}_copy2"`));
    assert.deepEqual(resolve(new Node("div", { "data-studio-photo-crop": "" }, photo)), { kind: "ignore" });
  }
});

test("protected envelope actions retain a selectable visual target even on the inner icon", () => {
  const { root, resolve } = sectionFixture("envelope", "envelope");
  const button = new Node("button", { "data-studio-native-object": "object:envelope:open-button", "data-studio-system-action": "open-invitation" }, root);
  assert.deepEqual(resolve(new Node("svg", {}, button)), { kind: "native", key: "object:envelope:open-button:envelope" });
  assert.equal(nativeVisualCanHide("object:envelope:open-button:envelope"), true);
});

test("all section backgrounds select their section; editor controls and empty canvas keep their semantics", () => {
  for (const section of ["envelope", "cover", "greeting", "identity", "event", "dateTime", "gallery", "countdown", "location", "rsvp", "wishes", "gift", "closing", "footer"]) {
    const { root, canvas, surface, resolve } = sectionFixture(section);
    assert.deepEqual(resolve(root), { kind: "section", section, instanceId: `${section}_copy2` });
    for (const attributes of [{ "data-studio-design-object": "shape_1" }, { class: "undara-studio-layer-side" }, { class: "undara-studio-section-side" }]) {
      assert.deepEqual(resolve(new Node("button", attributes, surface)), { kind: "ignore" });
    }
    assert.deepEqual(resolve(surface), { kind: "clear" });
    assert.deepEqual(resolve(canvas), { kind: "clear" });
  }
});

test("asset drag hit lookup reaches another section instance using the current Studio surface", () => {
  for (const className of ["undara-studio-preview-surface", "dc-studio-preview-surface"]) {
    const { surface, root } = sectionFixture();
    surface.attributes.class = className;
    const instance = new Node("div", { "data-section-instance-id": "gallery_copy3" }, surface);
    const rect = { left: 0, top: 350, right: 340, bottom: 650, width: 340, height: 300 };
    new Node("section", { "data-invitation-section": "gallery" }, instance, rect);
    const layer = new Node("div", { "data-studio-design-object": "image_1" }, root);
    assert.deepEqual(findSectionAt(100, 400, layer), { section: "gallery", instanceId: "gallery_copy3", rect });
    assert.equal(findSectionAt(400, 400, layer), null);
    assert.equal(findSectionAt(100, 700, layer), null);
    assert.equal(findSectionAt(100, 400, new Node()), null);
  }
});
