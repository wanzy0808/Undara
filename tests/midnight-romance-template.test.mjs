import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
const scene = read("components/PublicInvitation/MidnightRomanceScene.tsx");
const artwork = read("components/PublicInvitation/MidnightRomanceArtwork.tsx");
const gallery = read("components/PublicInvitation/MidnightRomanceGallery.tsx");
const css = read("components/PublicInvitation/midnight-romance.css");
const motion = read("lib/templates/template-motion.ts");
const catalog = read("lib/templates/catalog.ts");
const design = read("lib/templates/design.ts");

test("Midnight Romance uses dedicated envelope, cover, gallery and section artwork", () => {
  assert.match(scenes, /MidnightRomanceScene/);
  assert.match(scenes, /theme === "midnight-romance"/);
  assert.doesNotMatch(scenes, /if \(theme === "midnight-romance"\) return <section/);
  assert.match(universal, /midnight-romance-invitation/);
  assert.match(universal, /midnight \? "mr-section"/);
  assert.match(universal, /<MidnightRomanceSectionArt section=\{keyName\}/);
  assert.match(universal, /<MidnightRomanceGallery photos=\{media\.gallery\}/);
});

test("Midnight Romance preserves real photo slots and shared invitation engines", () => {
  assert.match(catalog, /key: "midnight-romance"[\s\S]*usesPhotos: true[\s\S]*photoSlots: \["cover", "personOne", "personTwo", "gallery"\]/);
  assert.match(scene, /data-invitation-photo-slot="cover"/);
  assert.match(gallery, /data-invitation-photo-slot="gallery"/);
  assert.match(gallery, /photos\.map\(\(asset, index\)/);
  assert.doesNotMatch(gallery, /photos\.slice/);
  assert.match(universal, /midnight-romance[\s\S]{0,500}<RsvpForm[^>]*appearance="zen"/);
  assert.match(universal, /<GuestWishes[\s\S]*midnight-romance[\s\S]*\? "zen" : "default"/);
  assert.match(universal, /data-studio-section-element="location:button"/);
  assert.match(universal, /data-studio-section-element="gift:button"/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <CalendarDays/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <MapPin/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <Gift/);
});

test("Midnight Romance maps all ten local WebP props and keeps them uncropped", () => {
  for (const asset of [
    "01_ornate_candlelit_lantern.webp",
    "02_baroque_chaise_lounge.webp",
    "03_burgundy_light_garland.webp",
    "04_navy_rose_wedding_arch.webp",
    "05_parisian_tea_table.webp",
    "06_celestial_rose_mirror.webp",
    "07_gothic_candelabra.webp",
    "08_golden_rose_carriage.webp",
    "09_crescent_moon_chandelier.webp",
    "10_sapphire_perfume_bottle.webp",
  ]) assert.match(artwork, new RegExp(asset.replace(".", "\\.")));
  assert.match(css, /\.mr-art img \{[^}]*object-fit: contain/);
});

test("Midnight Romance owns photo/native motion without animating changing countdown digits", () => {
  assert.match(motion, /const midnightRomancePhotos/);
  assert.match(motion, /"midnight-romance": midnightRomancePhotos/);
  assert.match(motion, /const midnightRomanceNative/);
  assert.match(motion, /"midnight-romance": midnightRomanceNative/);
  assert.match(motion, /gallery: \{ animation: "tilt-in"/);
  const nativeBlock = motion.slice(motion.indexOf("const midnightRomanceNative"), motion.indexOf("const gardenLightNative"));
  assert.doesNotMatch(nativeBlock, /object:countdown:[^"]*-value/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("Midnight Romance uses its velvet palette and Bodoni editorial pairing", () => {
  assert.match(catalog, /key: "midnight-romance"[\s\S]*preset: \{ layout: "midnight", palette: "midnightVelvet", font: "bodoniManrope" \}/);
  assert.match(design, /midnightVelvet: \{ name: "Midnight Romance"/);
  assert.match(design, /bodoniManrope: \{ name: "Bodoni Moda \+ Manrope"/);
  assert.match(catalog, /private midnight salon|intimate midnight salon/);
});

test("Midnight Romance entrances are one-shot and wait for artwork", () => {
  const nativeHook = read("components/PublicInvitation/use-native-visual-animations.ts");
  const photoHook = read("components/PublicInvitation/use-photo-animations.ts");
  assert.match(nativeHook, /const replay = false;/);
  assert.match(photoHook, /const replay = false;/);
  assert.match(nativeHook, /waitForImages:[^\n]*midnight-romance/);
  assert.match(universal, /key === "midnight-romance"[\s\S]{0,250}sectionStyles\.envelope\?\.animation === "none"/);
});

test("Midnight Romance section ink stays palette-aware", () => {
  assert.match(universal, /midnight \? \(sectionStyle\?\.background \? readableInk\(sectionStyle\.background, palette\.ink\) : palette\.ink\)/);
  assert.doesNotMatch(universal, /midnight \? readableInk\(sectionStyle\?\.background \|\| \(midnightBackdrop\[keyName\]/);
});
