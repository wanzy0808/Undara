import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseAssetLayers, sanitizeAssetLayers, withAssetLayers } from "../lib/templates/asset-layers.ts";
import {
  defaultNativeVisualTransform, nativeVisualColorFilters, nativeVisualScopeClass, nativeVisualStyleSheet,
  nativeVisualSupportsFramePaint,
  parseNativeVisualTransforms, sanitizeNativeVisualTransforms, withNativeVisualTransforms,
} from "../lib/templates/native-visual-transforms.ts";
import { invitationComponentColorCss } from "../lib/templates/component-colors.ts";
import { invitationColorFilterCss, invitationFieldColors, invitationTintMatrix, safeVisualColor } from "../lib/templates/visual-colors.ts";
import { defaultInvitationRsvpConfig } from "../lib/templates/rsvp-config.ts";
import { defaultInvitationSections } from "../lib/templates/sections.ts";
import { invitationDesignStateFromKey, makeInvitationDesignStateKey } from "../components/InvitationStudio/designer-state.ts";
import AssetLayersModule from "../components/PublicInvitation/InvitationAssetLayers.tsx";
import ColorFiltersModule from "../components/PublicInvitation/InvitationColorFilters.tsx";
import NativeInspectorModule from "../components/InvitationStudio/StudioNativeVisualInspector.tsx";
import TextInspectorModule from "../components/InvitationStudio/TextLayerInspector.tsx";
import AssetInspectorModule from "../components/InvitationStudio/AssetLayerInspector.tsx";
import GuestWishesModule from "../components/PublicInvitation/GuestWishes.tsx";
import { RsvpInputPanel } from "../components/InvitationStudio/RsvpPanels.tsx";

const component = (module) => module.default ?? module;
const render = (module, props) => renderToStaticMarkup(createElement(component(module), props));
const noop = () => {};
const image = { id: "flower", src: "/templates/pencil-reverie/flower.webp", x: 36, y: 42, width: 28, opacity: 0.8 };
const text = { id: "text-a", src: "", kind: "text", text: "Halo <tamu>", x: 40, y: 35, width: 50, opacity: 1 };

test("text backgrounds, image tint and frame colors survive the existing layer codec", () => {
  const layers = sanitizeAssetLayers([
    { ...text, color: "#123456", background: "#ABCDEF", borderColor: "#654321", borderWidth: 3 },
    { ...image, color: "#221144", background: "transparent", borderColor: "#ABCDEF", borderWidth: 2 },
  ]);
  const key = withAssetLayers("garden-light::pearl::cinzelFauna", layers);
  assert.deepEqual(parseAssetLayers(key), layers);
  assert.equal(layers[0].background, "#abcdef");
  assert.equal(layers[1].background, "transparent");
  assert.equal(layers[1].color, "#221144");
  assert.equal(sanitizeAssetLayers([image])[0].color, undefined);
  assert.equal(sanitizeAssetLayers([text])[0].background, undefined);
});

test("new layer paint rejects CSS/URLs and bounds frame width without changing legacy defaults", () => {
  const [layer] = sanitizeAssetLayers([{ ...image, color: "red;display:none", background: "url(https://evil.test)", borderColor: "#fff", borderWidth: 999 }]);
  assert.equal(layer.color, undefined);
  assert.equal(layer.background, undefined);
  assert.equal(layer.borderColor, undefined);
  assert.equal(layer.borderWidth, 12);
  assert.deepEqual(sanitizeAssetLayers([image]), [image]);
  assert.equal(safeVisualColor("transparent"), undefined);
  assert.equal(safeVisualColor("transparent", true), "transparent");
  assert.equal(invitationColorFilterCss('x"){display:none}', "solid"), undefined);
});

test("draft design serialization carries paint and preserves geometry, template and photo assignment", () => {
  const state = invitationDesignStateFromKey("garden-light", "");
  state.layers = sanitizeAssetLayers([{ ...text, background: "#123456" }, { ...image, color: "#334455" }]);
  state.photos.cover = "photo-selected";
  state.nativeVisuals = {
    "photo:cover:cover_copy2": { ...defaultNativeVisualTransform, x: 17, rotation: 9, color: "#445566", background: "transparent", borderColor: "#778899", borderWidth: 4 },
  };
  const reopened = invitationDesignStateFromKey(makeInvitationDesignStateKey(state), state.template);
  assert.deepEqual(reopened.layers, state.layers);
  assert.deepEqual(reopened.nativeVisuals, state.nativeVisuals);
  assert.equal(reopened.photos.cover, "photo-selected");
  assert.equal(reopened.palette, state.palette);
  assert.equal(reopened.font, state.font);
});

test("native photo tint and frames stay per instance; protected components keep their own style model", () => {
  const values = sanitizeNativeVisualTransforms({
    "photo:personOne:identity": { ...defaultNativeVisualTransform, color: "#ABCDEF", borderColor: "#123456", borderWidth: 3 },
    "photo:personOne:identity_copy2": { ...defaultNativeVisualTransform, background: "transparent", borderColor: "#654321", borderWidth: 999 },
    "rsvp:button": { ...defaultNativeVisualTransform, color: "#123456", background: "#abcdef" },
    "photo:personTwo:identity": { ...defaultNativeVisualTransform, color: "url(x)", background: "#fff" },
  });
  assert.equal(values["photo:personOne:identity"].color, "#abcdef");
  assert.equal(values["photo:personOne:identity_copy2"].color, undefined);
  assert.equal(values["photo:personOne:identity_copy2"].borderWidth, 12);
  assert.equal(values["rsvp:button"], undefined);
  assert.equal(values["photo:personTwo:identity"].color, undefined);
  assert.deepEqual(parseNativeVisualTransforms(withNativeVisualTransforms("serein", values)), values);
});

test("native paint replaces inline/gradient surfaces and restores the theme when individual paint is cleared", () => {
  const base = { ...defaultNativeVisualTransform, x: 12, rotation: 18 };
  const colored = withNativeVisualTransforms("serein", {
    "heading:cover": { ...base, color: "#123456", background: "transparent", borderColor: "#abcdef", borderWidth: 4 },
  });
  const css = nativeVisualStyleSheet(colored);
  assert.match(css, /color:#123456!important/);
  assert.match(css, /background:transparent!important/);
  assert.match(css, /border:4px solid #abcdef!important/);
  const cleared = withNativeVisualTransforms("serein", { "heading:cover": base });
  assert.deepEqual(parseNativeVisualTransforms(cleared)["heading:cover"], base);
  assert.doesNotMatch(nativeVisualStyleSheet(cleared), /color:|background:|border:|filter:/);
});

test("parent paint excludes registered children and photo paint uses detail tint on images", () => {
  const key = withNativeVisualTransforms("confetti-club", {
    "object:cover:cake-body-art": { ...defaultNativeVisualTransform, color: "#123456" },
    "photo:cover": { ...defaultNativeVisualTransform, color: "#abcdef" },
  });
  const css = nativeVisualStyleSheet(key);
  assert.match(css, /:not\([^}]*data-studio-native-object/);
  assert.match(css, /:not\([^}]*data-invitation-photo-slot/);
  assert.match(css, /:is\(path,rect,circle,ellipse,line,polyline,polygon,use,text\)/);
  assert.match(css, /:is\(img\)[^}]*filter:url\("#undara-tint-123456"\)!important/);
  assert.match(css, /filter:url\("#undara-solid-123456"\)!important/);
  assert.match(css, /filter:url\("#undara-tint-abcdef"\)!important/);
  assert.deepEqual(nativeVisualColorFilters(key), [{ color: "#123456", mode: "solid" }, { color: "#123456", mode: "tint" }, { color: "#abcdef", mode: "tint" }]);
});

test("tint preserves alpha and proportional image detail; original images require no filter", () => {
  const matrix = invitationTintMatrix("#804020").split(" ").map(Number);
  assert.equal(matrix.length, 20);
  assert.deepEqual(matrix.slice(15), [0, 0, 0, 1, 0]);
  const apply = (rgba) => [0, 1, 2, 3].map((row) => rgba.reduce((sum, value, column) => sum + matrix[row * 5 + column] * value, matrix[row * 5 + 4]));
  const dark = apply([0.2, 0.2, 0.2, 0.35]);
  const light = apply([0.8, 0.8, 0.8, 0.35]);
  assert.equal(dark[3], 0.35);
  assert.equal(light[3], 0.35);
  for (let channel = 0; channel < 3; channel++) assert.ok(Math.abs(light[channel] - dark[channel] * 4) < 0.00001);
  assert.equal(invitationTintMatrix("url(x)"), undefined);
  assert.equal(invitationColorFilterCss(undefined, "tint"), undefined);
});

test("paint definitions deduplicate safe IDs and retain solid artwork alpha", () => {
  const html = render(ColorFiltersModule, { filters: [{ color: "#ABCDEF", mode: "solid" }, { color: "#abcdef", mode: "solid" }, { color: "#abcdef", mode: "tint" }, { color: "url(x)", mode: "solid" }] });
  assert.equal((html.match(/id="undara-solid-abcdef"/g) ?? []).length, 1);
  assert.equal((html.match(/id="undara-tint-abcdef"/g) ?? []).length, 1);
  assert.match(html, /in2="SourceAlpha" operator="in"/);
  assert.match(html, /type="matrix"/);
  assert.doesNotMatch(html, /url\(x\)/);
  assert.equal(render(ColorFiltersModule, { filters: [] }), "");
});

test("added text paints the same background and border in canvas and public output", () => {
  const [layer] = sanitizeAssetLayers([{ ...text, color: "#112233", background: "#abcdef", borderColor: "#445566", borderWidth: 3 }]);
  for (const editable of [true, false]) {
    const html = render(AssetLayersModule, { layers: [layer], section: "cover", editable });
    assert.match(html, /color:#112233;background-color:#abcdef;border:3px solid #445566/);
    assert.match(html, /Halo &lt;tamu&gt;/);
    assert.doesNotMatch(html, /undara-tint-/);
  }
});

test("tinted image rendering retains its source, flip and shadow while the frame keeps its own color", () => {
  const layer = { ...image, color: "#112233", background: "#aabbcc", borderColor: "#445566", borderWidth: 4, flipX: true, shadowOpacity: 0.3 };
  for (const editable of [true, false]) {
    const html = render(AssetLayersModule, { layers: [layer], section: "cover", editable });
    assert.match(html, /src="\/templates\/pencil-reverie\/flower.webp"/);
    assert.match(html, /background-color:#aabbcc;border:4px solid #445566/);
    assert.match(html, /drop-shadow/);
    assert.match(html, /scaleX\(-1\)/);
    assert.match(html, /filter:url\(&quot;#undara-tint-112233&quot;\)/);
  }
  assert.doesNotMatch(render(AssetLayersModule, { layers: [image], section: "cover" }), /<filter|undara-tint/);
});

test("right inspectors expose paint by object type with accessible individual resets", () => {
  const common = { locale: "id", selectedIndex: 0, selectedAssetIndex: 0, layerCount: 1, maxLayers: 10, sections: defaultInvitationSections, onClose: noop, onDeselect: noop, onUpdate: noop, onPosition: noop };
  const textHtml = render(TextInspectorModule, { ...common, layer: text });
  assert.match(textHtml, /Warna teks/);
  assert.match(textHtml, />Latar</);
  assert.match(textHtml, /aria-label="Reset Latar"/);
  assert.match(textHtml, /Transparan/);
  const imageHtml = render(AssetInspectorModule, { ...common, selectedAssetLayer: image });
  assert.match(imageHtml, />Tint</);
  assert.match(imageHtml, /aria-label="Reset Tint"/);
  const photoHtml = render(NativeInspectorModule, { locale: "id", targetKey: "photo:cover", onChange: noop, onClose: noop });
  assert.match(photoHtml, />Tint</);
  assert.match(photoHtml, />Latar</);
  assert.match(photoHtml, />Garis</);
  const buttonHtml = render(NativeInspectorModule, { locale: "id", targetKey: "rsvp:button", onChange: noop, onClose: noop });
  assert.doesNotMatch(buttonHtml, /type="color"/);
});

test("native frame paint requires a box separate from raster tint or SVG group geometry", () => {
  const html = "http://www.w3.org/1999/xhtml";
  const svg = "http://www.w3.org/2000/svg";
  for (const tagName of ["IMG", "img"]) assert.equal(nativeVisualSupportsFramePaint({ tagName, namespaceURI: html }), false);
  for (const tagName of ["DIV", "SPAN", "BUTTON", "H1"]) assert.equal(nativeVisualSupportsFramePaint({ tagName, namespaceURI: html }), true);
  for (const tagName of ["g", "path", "rect", "circle"]) assert.equal(nativeVisualSupportsFramePaint({ tagName, namespaceURI: svg }), false);
  assert.equal(nativeVisualSupportsFramePaint({ tagName: "svg", namespaceURI: svg }), true);
  assert.equal(nativeVisualSupportsFramePaint(null), false);
});

test("RSVP paints labels and real fields, retaining a separately colored submit button", () => {
  const config = { ...defaultInvitationRsvpConfig, ceremony: true, reception: true, attendAll: true, customFields: [{ id: "q1", label: "Kota", required: false }], elementStyles: {
    inputs: { color: "#112233", background: "#abcdef", borderColor: "#445566", fontSize: 24, width: 80, opacity: 0.7 },
    button: { color: "#fffafa", background: "#665544" },
  } };
  const html = renderToStaticMarkup(createElement(RsvpInputPanel, {
    preview: true, rsvpConfig: config, form: { name: "", phone: "", status: "ATTENDING", plusOnes: "0", eventChoice: "", customAnswers: {} },
    setForm: noop, onSubmit: noop, submitting: false, message: "", eventCategory: "WEDDING",
  }));
  for (const match of html.matchAll(/<(?:input|select)\b[^>]*>/g)) {
    if (match[0].includes('type="radio"')) continue;
    assert.match(match[0], /font-size:24px;color:#112233;background-color:#abcdef;border-color:#445566/);
    assert.doesNotMatch(match[0], /width:80%|opacity:0.7/);
  }
  assert.match(html, /<label[^>]*color:#112233/);
  assert.match(html, /data-studio-rsvp-element="button"[^>]*background-color:#665544;color:#fffafa/);
});

test("Wishes paints its actual input and textarea independently from its submit button", () => {
  const html = render(GuestWishesModule, { slug: "test-only", preview: true, inputStyle: { color: "#112233", backgroundColor: "#abcdef", borderColor: "#445566", fontSize: 23, opacity: 0.7, width: "80%" }, buttonStyle: { color: "#fffafa", backgroundColor: "#665544" } });
  for (const match of html.matchAll(/<(?:input|textarea)\b[^>]*>/g)) {
    assert.match(match[0], /font-size:23px;color:#112233;background-color:#abcdef;border-color:#445566/);
    assert.doesNotMatch(match[0], /opacity:0.7|width:80%/);
  }
  assert.match(html, /data-studio-section-element="wishes:button"[^>]*color:#fffafa;background-color:#665544/);
  assert.deepEqual(invitationFieldColors({ width: "70%", opacity: 0.5, fontSize: 18, color: "#123456" }), { fontSize: 18, color: "#123456" });
});

test("component paint overrides theme priority with validated scoped selectors only", () => {
  const scope = nativeVisualScopeClass("zen-atelier");
  const css = invitationComponentColorCss(scope, { ...defaultInvitationRsvpConfig, elementStyles: { button: { background: "#ABCDEF", color: "#112233" }, inputs: { borderColor: "#123456" }, 'x"]{display:none}': { color: "#445566" } } }, { "wishes:button": { color: "#778899" }, "gift:button": { background: "url(x)" } });
  assert.match(css, /\[data-invitation-section="rsvp"\] \[data-studio-rsvp-element="button"\]\{background:#abcdef!important;color:#112233!important/);
  assert.match(css, /\[data-studio-section-element="wishes:button"\]\{color:#778899!important/);
  assert.doesNotMatch(css, /display:none|url\(x\)|#445566/);
  assert.equal(invitationComponentColorCss('x"]{display:none}', defaultInvitationRsvpConfig, {}), "");
  assert.equal(invitationComponentColorCss(scope, defaultInvitationRsvpConfig, {}), "");
});
