import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { invitationTemplates } from "../lib/templates/catalog.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const activeKeys = invitationTemplates.map((template) => template.key);
const genericSceneKeys = [
  "botanical-ivory",
  "eternal-blossom",
  "modern-maroon",
  "garden-light",
  "midnight-romance",
  "classic-pearl",
  "golden-art-deco",
  "paper-cut-botanical",
  "celestial-ink",
  "velvet-horizon",
  "confetti-club",
  "silver-reverie",
  "golden-keepsake",
  "little-cloud",
  "gathering",
];

test("every active built-in template stays on the shared web-invitation renderer contract", () => {
  assert.deepEqual(activeKeys, [
    "romantic-rose",
    "botanical-ivory",
    "eternal-blossom",
    "modern-maroon",
    "garden-light",
    "midnight-romance",
    "classic-pearl",
    "golden-art-deco",
    "paper-cut-botanical",
    "pencil-reverie",
    "zen-atelier",
    "velvet-horizon",
    "celestial-ink",
    "serein",
    "confetti-club",
    "silver-reverie",
    "golden-keepsake",
    "little-cloud",
    "gathering",
  ]);

  const dispatcher = read("components/PublicInvitation/PublicInvitationRenderer.tsx");
  const preview = read("components/InvitationStudio/InvitationPreview.tsx");
  assert.match(dispatcher, /key === "romantic-rose"/);
  assert.match(dispatcher, /<UniversalInvitationTemplate/);
  assert.match(preview, /templateKey === "romantic-rose"/);
  assert.match(preview, /<UniversalInvitationTemplate/);
  assert.doesNotMatch(dispatcher, /ClassicInvitationTemplate/);
  assert.doesNotMatch(preview, /ClassicInvitationTemplate/);
});

test("all generic active themes have a real envelope and cover scene branch", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  for (const key of genericSceneKeys) {
    assert.ok(scenes.includes(`"${key}"`), `missing theme registration for ${key}`);
    assert.ok(scenes.includes(`theme === "${key}"`) || key === "botanical-ivory",
      `missing cover composition branch for ${key}`);
  }
  assert.match(scenes, /theme === "pencil-reverie"/);
  assert.match(scenes, /theme === "zen-atelier"/);
  assert.match(scenes, /<ThemeEnvelope/);
});

test("all active templates share selectable web section semantics rather than one poster artboard", () => {
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const instance = read("components/PublicInvitation/EditableSectionInstance.tsx");
  const studio = read("components/InvitationStudio/InvitationDesigner.tsx");

  assert.match(universal, /data-invitation-section=\{keyName\}/);
  assert.match(universal, /sectionInstanceId=\{instanceId\}/);
  assert.match(universal, /data-studio-native-heading/);
  assert.match(universal, /data-studio-native-object/);
  assert.match(rose, /data-invitation-section="identity"/);
  assert.match(rose, /sectionInstanceId=\{instanceId\}/);
  assert.match(rose, /data-studio-native-heading/);
  assert.match(rose, /data-studio-native-object/);
  assert.match(instance, /data-section-instance-id=\{instance\.id\}/);
  assert.match(studio, /sectionInstanceId:/);
});

test("template Studio follows content-left and styling-right ownership for every renderer", () => {
  const panels = read("components/InvitationStudio/DesignerPanels.tsx");
  const copyInspector = read("components/InvitationStudio/CopyTextInspector.tsx");
  const nativeInspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  const nativeModel = read("lib/templates/native-visual-transforms.ts");

  assert.match(panels, /copyFieldsBySection/);
  assert.match(panels, /onNarrativeCopy\(field, event\.target\.value\)/);
  assert.match(panels, /Judul RSVP/);
  assert.doesNotMatch(copyInspector, /<textarea/);
  assert.doesNotMatch(copyInspector, /onChange: \(value: string\)/);
  assert.match(copyInspector, /Ubah teks lewat Isi/);
  assert.match(nativeInspector, /Isi dari data acara/);
  assert.match(nativeModel, /nativeVisualUsesSystemContent/);
});

test("public template artwork does not leak Studio preview labels and primary CTAs are not pills", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const pencilCss = read("components/PublicInvitation/pencil-reverie.css");
  const zenCss = read("components/PublicInvitation/zen-atelier.css");

  assert.doesNotMatch(scenes, />Pratinjau<|>Preview ·/);
  assert.doesNotMatch(rose, />Pratinjau<|>Preview ·/);
  assert.match(scenes, /min-h-12 rounded-\[var\(--undara-control-radius\)\]/);
  assert.match(rose, /min-h-11 rounded-\[var\(--undara-control-radius\)\]/);
  assert.match(pencilCss, /\.pr-open-button\{[^}]*border-radius:9px/);
  assert.match(zenCss, /\.zen-open \{[^}]*border-radius:8px/);
  assert.match(zenCss, /\.zen-action \{[^}]*border-radius:var\(--undara-control-radius\)/);
});

test("all active templates expose the shared narrative wording contract", () => {
  const editableCopy = read("lib/templates/editable-copy.ts");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

  assert.match(editableCopy, /\["greeting", "attendanceRequest", "prayerWish", "closing"\]/);
  for (const renderer of [universal, rose]) {
    assert.match(renderer, /data-studio-copy-field="greeting"/);
    assert.match(renderer, /data-studio-copy-field="attendanceRequest"/);
    assert.match(renderer, /data-studio-copy-field="prayerWish"/);
    assert.match(renderer, /data-studio-copy-field="closing"/);
  }
});

test("Our Story remains an Identity subsection across shared and Romantic Rose renderers", () => {
  const story = read("components/PublicInvitation/OurStorySection.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

  assert.match(story, /data-invitation-subsection="our-story"/);
  assert.doesNotMatch(story, /data-invitation-section="our-story"/);
  assert.match(universal, /after\?\.\(instanceId\)/);
  assert.match(rose, /<OurStorySection/);
});
