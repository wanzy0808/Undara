import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { nativeVisualCanHide, nativeVisualUsesSystemContent } from "../lib/templates/native-visual-transforms.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
const scene = read("components/PublicInvitation/GoldenArtDecoScene.tsx");
const artwork = read("components/PublicInvitation/GoldenArtDecoArtwork.tsx");
const gallery = read("components/PublicInvitation/GoldenArtDecoGallery.tsx");
const css = read("components/PublicInvitation/golden-art-deco.css");
const motion = read("lib/templates/template-motion.ts");
const catalog = read("lib/templates/catalog.ts");
const design = read("lib/templates/design.ts");

test("Golden Art Deco uses dedicated photo-free scenes and section artwork", () => {
  assert.match(scenes, /GoldenArtDecoScene/);
  assert.match(scenes, /theme === "golden-art-deco"/);
  assert.doesNotMatch(scenes, /if \(theme === "golden-art-deco"\) return <section/);
  assert.doesNotMatch(scenes, /"golden-art-deco": \{ backdrop:/);
  assert.match(universal, /golden-art-deco-invitation/);
  assert.match(universal, /golden \? "gd-section"/);
  assert.match(universal, /<GoldenArtDecoSectionArt section=\{keyName\}/);
  assert.match(universal, /<GoldenArtDecoIdentity/);
  assert.match(universal, /key === "golden-art-deco" \? <GoldenArtDecoGallery/);
  assert.match(catalog, /key: "golden-art-deco"[\s\S]*usesPhotos: false[\s\S]*photoSlots: \[\]/);
});

test("Golden Art Deco Cover is a Gatsby poster, not another centered framed hero", () => {
  for (const marker of [
    "object:cover:rail",
    "object:cover:steps",
    "object:cover:fan-art",
    "object:cover:garland-art",
    "object:cover:arch-art",
    "object:cover:champagne-art",
    "object:cover:copy-panel",
    "object:cover:date",
  ]) assert.match(scene, new RegExp(marker));
  assert.doesNotMatch(scene, /object:cover:photo-frame/);
  assert.doesNotMatch(scene, /object:cover:border-outer/);
  assert.doesNotMatch(scene, /object:cover:diamond-main/);
  assert.doesNotMatch(scene, /object:cover:gem-icon/);
  assert.doesNotMatch(scene, /object:cover:deco-bars/);
  assert.match(css, /\.gd-cover-copy \{[^}]*left: 15%;[^}]*top: 28%;[^}]*text-align: left;/);
  assert.match(css, /\.gd-cover-arch \{[^}]*right: 1%;[^}]*bottom: 4%;/);
  assert.match(css, /\.gd-cover-champagne \{[^}]*left: 2%;[^}]*bottom: 4%;/);
  assert.match(css, /\.gd-cover-date \{[^}]*right: 4\.5%;[^}]*writing-mode: vertical-rl;/);
  assert.doesNotMatch(css, /\.gd-cover-copy \{[^}]*margin:[^;]*auto/);
});

test("Golden Art Deco maps all ten local WebP assets and preserves complete artwork", () => {
  for (const asset of [
    "01_gatsby_archway.webp",
    "02_gold_pearl_fan_emblem.webp",
    "03_champagne_tower.webp",
    "04_vintage_gramophone.webp",
    "05_art_deco_oval_mirror.webp",
    "06_golden_crystal_candelabra.webp",
    "07_paired_art_deco_lanterns.webp",
    "08_art_deco_dessert_table.webp",
    "09_ivory_gold_chaise_lounge.webp",
    "10_crystal_drapery_garland.webp",
  ]) assert.match(artwork, new RegExp(asset.replace(".", "\\.")));
  assert.match(css, /\.gd-art img \{[^}]*object-fit: contain/);
});

test("Golden Art Deco varies section props instead of repeating diamonds", () => {
  assert.match(artwork, /greeting: "lanterns"/);
  assert.match(artwork, /event: "gramophone"/);
  assert.match(artwork, /dateTime: "candelabra"/);
  assert.match(artwork, /countdown: "champagne"/);
  assert.match(artwork, /location: "arch"/);
  assert.match(artwork, /rsvp: "lanterns"/);
  assert.match(artwork, /wishes: "mirror"/);
  assert.match(artwork, /gift: "dessertTable"/);
  assert.match(artwork, /closing: "chaise"/);
  assert.doesNotMatch(universal, /object:\$\{keyName\}:theme-diamond/);
});

test("Golden Art Deco keeps protected event data and shared functional engines", () => {
  assert.match(scene, /object:cover:date/);
  assert.match(artwork, /object:identity:personOne-name/);
  assert.match(artwork, /object:identity:personTwo-name/);
  assert.match(artwork, /object:identity:personOne-parents/);
  assert.match(artwork, /object:identity:personTwo-parents/);
  assert.match(universal, /golden-art-deco[\s\S]{0,1000}<RsvpForm[^>]*appearance="zen"/);
  assert.match(universal, /<GuestWishes[\s\S]*golden-art-deco[\s\S]*\? "zen" : "default"/);
  assert.match(universal, /data-studio-section-element="location:button"/);
  assert.match(universal, /data-studio-section-element="gift:button"/);
});

test("Golden Art Deco replaces generic section icons with its object world", () => {
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <CalendarDays/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <MapPin/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <Gift/);
  assert.match(universal, /key === "golden-art-deco" \? "gd-action"/);
});

test("Golden Art Deco default Gallery stays photo-free and tells a celebration story", () => {
  assert.doesNotMatch(gallery, /data-invitation-photo-slot/);
  assert.match(gallery, /Vignette Malam/);
  assert.match(gallery, /object:gallery:toast-group/);
  assert.match(gallery, /object:gallery:rhythm-group/);
  assert.match(gallery, /object:gallery:reflection-group/);
  assert.match(gallery, /object:gallery:champagne-art/);
  assert.match(gallery, /object:gallery:gramophone-art/);
  assert.match(gallery, /object:gallery:mirror-art/);
  assert.match(gallery, /Sebuah Kilau/);
  assert.match(gallery, /Sebuah Irama/);
  assert.match(gallery, /Sebuah Pantulan/);
  assert.match(universal, /golden && keyName === "gallery" \? "Vignette Malam"/);
});

test("Golden Art Deco has restrained one-shot motion without animating countdown values", () => {
  assert.match(motion, /const goldenArtDecoNative/);
  assert.match(motion, /"golden-art-deco": goldenArtDecoNative/);
  const block = motion.slice(motion.indexOf("const goldenArtDecoNative"), motion.indexOf("const classicPearlNative"));
  assert.doesNotMatch(block, /object:countdown:[^"]*-value/);
  assert.match(block, /"object:cover:rail": \{ animation: "reveal-up"/);
  assert.match(block, /"object:cover:arch-art": \{ animation: "glide-right"/);
  assert.match(block, /"object:cover:champagne-art": \{ animation: "rise"/);
  assert.match(block, /"object:gallery:toast-group": \{ animation: "tilt-in"/);
  assert.match(block, /"object:gallery:rhythm-group": \{ animation: "tilt-in"/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);

  const nativeHook = read("components/PublicInvitation/use-native-visual-animations.ts");
  const photoHook = read("components/PublicInvitation/use-photo-animations.ts");
  assert.match(nativeHook, /const replay = false;/);
  assert.match(photoHook, /const replay = false;/);
  assert.match(nativeHook, /waitForImages:[^\n]*golden-art-deco/);
  assert.match(universal, /golden-art-deco"[\s\S]{0,420}sectionStyles\.envelope\?\.animation === "none"/);
});

test("Golden Art Deco uses noir palette and Poiret poster typography", () => {
  assert.match(catalog, /key: "golden-art-deco"[\s\S]*preset: \{ layout: "classic", palette: "decoNoir", font: "poiretMontserrat" \}/);
  assert.match(design, /decoNoir: \{ name: "Golden Art Deco"/);
  assert.match(catalog, /1920s soirée poster/);
  assert.match(universal, /golden \? \(sectionStyle\?\.background \? readableInk\(sectionStyle\.background, palette\.ink\) : palette\.ink\)/);
});

test("Golden Art Deco rails, steps and date presentation can be removed while data stays protected", () => {
  assert.equal(nativeVisualCanHide("object:cover:rail"), true);
  assert.equal(nativeVisualCanHide("object:cover:steps"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
  assert.match(scene, /object:cover:rail/);
  assert.match(scene, /object:cover:steps/);
  assert.match(scene, /object:envelope:ticket-ornament/);
});
