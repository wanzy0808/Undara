import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
const artwork = read("components/PublicInvitation/GardenLightArtwork.tsx");
const gallery = read("components/PublicInvitation/GardenLightGallery.tsx");
const css = read("components/PublicInvitation/garden-light.css");
const motion = read("lib/templates/template-motion.ts");
const catalog = read("lib/templates/catalog.ts");
const design = read("lib/templates/design.ts");

test("Garden Light uses dedicated scenes and a twilight editorial section system", () => {
  assert.match(scenes, /GardenLightScene/);
  assert.match(scenes, /theme === "garden-light"/);
  assert.match(universal, /garden-light-invitation/);
  assert.match(universal, /garden \? "gl-section"/);
  assert.match(universal, /<GardenLightSectionArt section=\{keyName\}/);
  assert.match(universal, /<GardenLightGallery photos=\{media\.gallery\}/);
});

test("Garden Light keeps real photo slots and shared functional engines", () => {
  assert.match(catalog, /key: "garden-light"[\s\S]*usesPhotos: true[\s\S]*photoSlots: \["cover", "personOne", "personTwo", "gallery"\]/);
  assert.match(scenes, /data-invitation-photo-slot="cover"/);
  assert.match(gallery, /data-invitation-photo-slot="gallery"/);
  assert.match(universal, /garden-light[\s\S]{0,500}<RsvpForm[^>]*appearance="zen"/);
  assert.match(universal, /<GuestWishes[\s\S]*garden-light[\s\S]*\? "zen" : "default"/);
  assert.match(universal, /data-studio-section-element="location:button"/);
  assert.match(universal, /data-studio-section-element="gift:button"/);
});

test("Garden Light uses the complete themed prop library instead of repeated leaves", () => {
  for (const asset of [
    "01_ornate_golden_birdcage.webp",
    "02_vintage_lace_parasol.webp",
    "03_romantic_lantern_arrangement.webp",
    "04_hanging_botanical_lantern.webp",
    "05_vintage_garden_tea_table.webp",
    "06_illuminated_garden_swing.webp",
    "07_romantic_ivory_bicycle.webp",
    "08_elegant_garden_fountain.webp",
    "09_glowing_floral_light_garland.webp",
    "10_romantic_lit_wedding_arch.webp",
  ]) assert.match(artwork, new RegExp(asset.replace(".", "\\.")));
  assert.doesNotMatch(scenes, /theme === "garden-light"[\s\S]{0,500}<BotanicalSprig/);
  assert.match(css, /\.gl-art img \{[^}]*object-fit: contain/);
});

test("Garden Light has template-owned photo and native motion with reduced-motion fallback", () => {
  assert.match(motion, /const gardenLightPhotos/);
  assert.match(motion, /"garden-light": gardenLightPhotos/);
  assert.match(motion, /const gardenLightNative/);
  assert.match(motion, /"object:envelope:fireflies": \{ animation: "fade"/);
  assert.match(motion, /"object:cover:fireflies": \{ animation: "fade"/);
  assert.match(motion, /"garden-light": gardenLightNative/);
  assert.match(motion, /gallery: \{ animation: "tilt-in"/);
  assert.doesNotMatch(motion, /object:countdown:[^"]*-value/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("Garden Light defaults to its own palette and editorial font pairing", () => {
  assert.match(catalog, /key: "garden-light"[\s\S]*preset: \{ layout: "garden", palette: "gardenGlow", font: "youngInstrument" \}/);
  assert.match(design, /gardenGlow: \{ name: "Garden Light"/);
  assert.match(catalog, /Nuansa pesta taman dari golden hour menuju senja/);
});


test("Garden Light viewport entrances are one-shot while explicit Studio replay stays available", () => {
  const nativeMotion = read("components/PublicInvitation/use-native-visual-animations.ts");
  const photoMotion = read("components/PublicInvitation/use-photo-animations.ts");
  assert.match(nativeMotion, /const replay = false;/);
  assert.match(photoMotion, /const replay = false;/);
  assert.match(nativeMotion, /waitForImages:[^\n]*garden-light/);
});


test("Garden Light section ink stays palette-aware instead of feeding CSS expressions into hex contrast math", () => {
  assert.match(universal, /garden \? \(sectionStyle\?\.background \? readableInk\(sectionStyle\.background, palette\.ink\) : palette\.ink\)/);
  assert.doesNotMatch(universal, /garden \? readableInk\(sectionStyle\?\.background \|\| \(gardenBackdrop\[keyName\]/);
});
