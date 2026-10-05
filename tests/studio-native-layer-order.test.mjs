import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultNativeVisualTransform, nativeVisualStyleSheet, sanitizeNativeVisualTransforms, withNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { nativeVisualIsLocked, parseNativeVisualLocks, sanitizeNativeVisualLocks, withNativeVisualLocks } from "../lib/templates/native-visual-locks.ts";
import { nativeVisualSupportsLayerOrder, positionNativeVisuals } from "../lib/templates/native-visual-order.ts";
import { studioNativeLayerPeers } from "../components/InvitationStudio/studio-native-layer-order.ts";
import { observeNativeVisualLayerOrder } from "../components/PublicInvitation/native-layer-runtime.ts";
import NativeInspectorModule from "../components/InvitationStudio/StudioNativeVisualInspector.tsx";

const component = (module) => module.default ?? module;
const keys = ["object:cover:art-a:cover", "object:cover:art-b:cover", "object:cover:art-c:cover"];
const noop = () => {};

test("native lock metadata round-trips separately from paint and accepts only registered boolean keys", () => {
  const base = withNativeVisualTransforms("garden-light", { [keys[0]]: { ...defaultNativeVisualTransform, x: 12, color: "#123456" } });
  const locks = { [keys[0]]: true, "photo:personOne:identity": false };
  const key = withNativeVisualLocks(base, locks);
  assert.deepEqual(parseNativeVisualLocks(key), locks);
  assert.equal(withNativeVisualLocks(key, {}), base);
  const normalizedCss = (value) => nativeVisualStyleSheet(value).replace(/dc-native-[a-z0-9]+/g, "scope");
  assert.equal(normalizedCss(key), normalizedCss(base));
  assert.deepEqual(sanitizeNativeVisualLocks({ [keys[0]]: "true", 'object:cover:x"]{}': true, "photo:personOne": true }), { "photo:personOne": true });
  assert.deepEqual(parseNativeVisualLocks("garden-light::nativeLocks=%ZZ"), {});
  assert.equal(nativeVisualIsLocked({ "photo:personOne": true, "photo:personOne:identity_copy2": false }, "photo:personOne:identity"), true);
  assert.equal(nativeVisualIsLocked({ "photo:personOne": true, "photo:personOne:identity_copy2": false }, "photo:personOne:identity_copy2"), false);
});

test("all four native order actions preserve geometry, paint and objects outside the sibling group", () => {
  const other = "object:gallery:art-a:gallery";
  const values = { [keys[0]]: { ...defaultNativeVisualTransform, x: 14, color: "#123456" }, [other]: { ...defaultNativeVisualTransform, rotation: 12 } };
  for (const [action, expected] of [["front", [keys[1], keys[2], keys[0]]], ["forward", [keys[1], keys[0], keys[2]]]]) {
    const next = positionNativeVisuals(values, keys, keys[0], action);
    assert.deepEqual(expected.map((key) => next[key].layerOrder), [0, 1, 2]);
    assert.equal(next[keys[0]].x, 14);
    assert.equal(next[keys[0]].color, "#123456");
    assert.equal(next[other], values[other]);
  }
  for (const [action, expected] of [["back", [keys[2], keys[0], keys[1]]], ["backward", [keys[0], keys[2], keys[1]]]]) {
    const next = positionNativeVisuals(values, keys, keys[2], action);
    assert.deepEqual(expected.map((key) => next[key].layerOrder), [0, 1, 2]);
  }
});

test("native ordering honors edges, locks, instance boundaries and the existing 512-target capacity", () => {
  const values = {};
  for (const [key, action] of [[keys[0], "back"], [keys[0], "backward"], [keys[2], "front"], [keys[2], "forward"]]) {
    assert.equal(positionNativeVisuals(values, keys, key, action), values);
  }
  assert.equal(positionNativeVisuals(values, keys, keys[0], "front", { [keys[0]]: true }), values);
  assert.equal(positionNativeVisuals(values, [keys[0], "object:cover:art-b:cover_copy2"], keys[0], "front"), values);
  const full = Object.fromEntries(Array.from({ length: 512 }, (_, i) => [`object:cover:target_${i}:cover`, { ...defaultNativeVisualTransform, x: 1 }]));
  assert.equal(positionNativeVisuals(full, keys, keys[0], "front"), full);
});

test("native order codec bounds integers and emits scoped CSS without replacing authored positioning", () => {
  const values = sanitizeNativeVisualTransforms({ [keys[0]]: { ...defaultNativeVisualTransform, layerOrder: 9999 }, [keys[1]]: { ...defaultNativeVisualTransform, layerOrder: -9 }, [keys[2]]: { ...defaultNativeVisualTransform, layerOrder: "2;display:none" } });
  assert.equal(values[keys[0]].layerOrder, 511);
  assert.equal(values[keys[1]].layerOrder, 0);
  assert.equal(values[keys[2]].layerOrder, undefined);
  const css = nativeVisualStyleSheet(withNativeVisualTransforms("garden-light", values));
  assert.match(css, /data-section-instance-id="cover"[^\n]*z-index:511!important/);
  assert.match(css, /data-invitation-native-layer-static="true"\]\{position:relative!important/);
  assert.doesNotMatch(css, /position:absolute|position:fixed|display:none/);
  assert.equal(nativeVisualSupportsLayerOrder({ tagName: "IMG", namespaceURI: "http://www.w3.org/1999/xhtml" }), true);
  assert.equal(nativeVisualSupportsLayerOrder({ tagName: "g", namespaceURI: "http://www.w3.org/2000/svg" }), false);
  assert.equal(nativeVisualSupportsLayerOrder({ tagName: "svg", namespaceURI: "http://www.w3.org/2000/svg" }), true);
});

// Minimal selector/ancestor fixture; no claim about physical browser stacking or layout.
class Node {
  constructor(tag = "div", attributes = {}, parent = null, computed = {}) {
    this.tagName = tag.toUpperCase(); this.attributes = attributes; this.parentElement = parent; this.children = [];
    this.namespaceURI = tag === "g" || tag === "svg" ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml";
    this.computed = { display: "block", position: "static", zIndex: "auto", ...computed };
    this.dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith("data-")).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]));
    parent?.children.push(this);
  }
  hasAttribute(key) { return key in this.attributes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  matches(selector) {
    return selector.split(",").some((query) => {
      const parts = query.trim().split(/\s+/);
      if (parts.length > 1) {
        const last = parts.pop();
        if (!this.matches(last)) return false;
        let ancestor = this.parentElement;
        for (const part of parts.reverse()) { while (ancestor && !ancestor.matches(part)) ancestor = ancestor.parentElement; if (!ancestor) return false; ancestor = ancestor.parentElement; }
        return true;
      }
      const attr = query.trim().match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return attr ? this.hasAttribute(attr[1]) && (attr[2] === undefined || this.attributes[attr[1]] === attr[2]) : this.tagName.toLowerCase() === query.trim();
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
  contains(target) { return target === this || this.children.some((child) => child.contains(target)); }
  querySelectorAll(selector) { return this.children.flatMap((node) => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]); }
}

test("native inventory reflects actual painted siblings while excluding nested, hidden, boxless and foreign-instance targets", () => {
  const old = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => node.computed;
  try {
    const surface = new Node();
    const instance = new Node("div", { "data-section-instance-id": "cover" }, surface);
    const section = new Node("section", { "data-invitation-section": "cover" }, instance);
    const a = new Node("div", { "data-studio-native-object": "object:cover:art-a" }, section, { zIndex: "5" });
    new Node("div", { "data-studio-native-object": "object:cover:art-b" }, section, { zIndex: "1" });
    new Node("div", { "data-studio-native-object": "object:cover:art-c" }, section);
    new Node("div", { "data-studio-native-object": "object:cover:hidden" }, section, { display: "none" });
    new Node("div", { "data-studio-native-object": "object:cover:boxless" }, section, { display: "contents" });
    const nested = new Node("div", { "data-studio-native-object": "object:cover:nested" }, a);
    const svg = new Node("g", { "data-studio-native-object": "object:cover:svg-group" }, section);
    const other = new Node("div", { "data-section-instance-id": "cover_copy2" }, surface);
    new Node("section", { "data-invitation-section": "cover", "data-studio-native-object": "object:cover:foreign" }, other);
    assert.deepEqual(studioNativeLayerPeers(a, surface), [keys[2], keys[1], keys[0]]);
    assert.deepEqual(studioNativeLayerPeers(nested, surface), ["object:cover:nested:cover"]);
    assert.deepEqual(studioNativeLayerPeers(svg, surface), []);
    assert.deepEqual(studioNativeLayerPeers(a, new Node()), []);
  } finally { globalThis.getComputedStyle = old; }
});

test("shared native layer runtime marks only static boxes, handles late targets/breakpoints and cleans up without moving DOM", () => {
  const previous = { getComputedStyle: globalThis.getComputedStyle, window: globalThis.window, MutationObserver: globalThis.MutationObserver };
  const listeners = new Map();
  const observers = [];
  globalThis.getComputedStyle = (node) => node.computed;
  globalThis.window = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  globalThis.MutationObserver = class { constructor(fn) { this.refresh = fn; observers.push(this); } observe() {} disconnect() { this.stopped = true; } };
  try {
    const root = new Node();
    const instance = new Node("div", { "data-section-instance-id": "cover" }, root);
    const section = new Node("section", { "data-invitation-section": "cover" }, instance);
    const a = new Node("div", { "data-studio-native-object": "object:cover:art-a" }, section);
    const b = new Node("div", { "data-studio-native-object": "object:cover:art-b" }, section, { position: "absolute" });
    const order = [...section.children];
    const cleanup = observeNativeVisualLayerOrder(root, Object.fromEntries(keys.map((key, layerOrder) => [key, { ...defaultNativeVisualTransform, layerOrder }])));
    const observer = observers[0];
    const attr = "data-invitation-native-layer-static";
    assert.equal(a.attributes[attr], "true");
    assert.equal(b.attributes[attr], undefined);
    assert.deepEqual(section.children, order);
    const c = new Node("div", { "data-studio-native-object": "object:cover:art-c" }, section);
    observer.refresh();
    assert.equal(c.attributes[attr], "true");
    a.computed.position = "fixed";
    listeners.get("resize")();
    assert.equal(a.attributes[attr], undefined);
    cleanup();
    assert.equal(c.attributes[attr], undefined);
    assert.equal(observer.stopped, true);
    assert.equal(listeners.size, 0);
  } finally { Object.assign(globalThis, previous); }
});

test("native inspector keeps Unlock outside the disabled styling fieldset with separate protected-content meaning", () => {
  for (const [locale, label] of [["id", "Buka kunci elemen"], ["en", "Unlock element"]]) {
    const html = renderToStaticMarkup(createElement(component(NativeInspectorModule), { locale, targetKey: "object:event:venue:event", locked: true, onToggleLock: noop, onChange: noop, onClose: noop, onDelete: noop }));
    const toggle = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
    assert.ok(toggle);
    assert.doesNotMatch(toggle, /disabled=/);
    assert.ok(html.indexOf(`aria-label="${label}"`) < html.indexOf("<fieldset disabled"));
    assert.match(html, /Content from event data|Isi dari data acara/);
  }
  for (const path of ["UniversalInvitationTemplate.tsx", "RomanticRoseTemplate.tsx"]) {
    assert.match(readFileSync(new URL(`../components/PublicInvitation/${path}`, import.meta.url), "utf8"), /useInvitationNativeLayerOrder\(rootRef, activeDesignKey\)/);
  }
});

test("real native gesture handlers stop locked/busy drags, including a lock applied during an active pointer", () => {
  const text = readFileSync(new URL("../components/InvitationStudio/StudioNativeTransformHandles.tsx", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("StudioNativeTransformHandles.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ["apply", "clear", "calculate", "begin", "move", "end"];
  const declarations = new Map();
  const visit = (node) => { if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) declarations.set(node.name.text, node.getText(parsed)); ts.forEachChild(node, visit); };
  visit(parsed);
  assert.equal(declarations.size, names.length);
  const code = ts.transpileModule([...declarations.values()].join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const style = { removeProperty(name) { delete this[name]; } };
  const node = { offsetWidth: 100, offsetHeight: 100, style, getBoundingClientRect: () => ({ left: 80, top: 80, width: 100, height: 100 }) };
  const gesture = { current: null }, commits = [];
  let captures = 0;
  const context = { gesture, defaultNativeVisualTransform, transform: { ...defaultNativeVisualTransform }, targetKey: keys[0], zoom: 1,
    target: () => node, canvasRef: { current: { dataset: {}, scrollLeft: 0, scrollTop: 0, focus: noop,
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300 }) } },
    clamp: (n, min, max) => Math.min(max, Math.max(min, n)), round: (n) => Math.round(n * 100) / 100,
    onCommit: (...args) => commits.push(args), requestAnimationFrame: (fn) => fn(), measure: noop };
  const handlers = new Function(...Object.keys(context), `let locked = false, disabled = false;\n${code}\nreturn {begin,move,end,setLocked(value){locked=value},setBusy(value){disabled=value}};`)(...Object.values(context));
  const event = (x) => ({ button: 0, pointerId: 7, clientX: 100 + x, clientY: 100, preventDefault: noop, stopPropagation: noop, currentTarget: { setPointerCapture() { captures++; } } });
  handlers.setLocked(true);
  handlers.begin(event(0), "move");
  assert.equal(gesture.current, null);
  handlers.setLocked(false); handlers.setBusy(true);
  handlers.begin(event(0), "move");
  assert.equal(gesture.current, null);
  assert.equal(captures, 0);
  handlers.setBusy(false); handlers.begin(event(0), "move"); handlers.move(event(10));
  assert.equal(style.translate, "10% 0%");
  handlers.setLocked(true); handlers.move(event(20));
  assert.equal(gesture.current, null);
  assert.equal(style.translate, undefined);
  assert.equal(commits.length, 0);
  handlers.setLocked(false); handlers.begin(event(0), "move"); handlers.move(event(8)); handlers.end(event(8));
  assert.equal(commits.length, 1);
  assert.equal(commits[0][1].x, 8);
  const editor = readFileSync(new URL("../components/InvitationStudio/InvitationDesigner.tsx", import.meta.url), "utf8");
  assert.match(editor, /design\.nativeVisuals, design\.nativeLocks, design\.sections/);
});
