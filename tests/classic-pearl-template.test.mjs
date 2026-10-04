import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { nativeVisualCanHide, nativeVisualUsesSystemContent } from "../lib/templates/native-visual-transforms.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
const scene = read("components/PublicInvitation/ClassicPearlScene.tsx");
const artwork = read("components/PublicInvitation/ClassicPearlArtwork.tsx");
const gallery = read("components/PublicInvitation/ClassicPearlGallery.tsx");
const css = read("components/PublicInvitation/classic-pearl.css");
const motion = read("lib/templates/template-motion.ts");
const catalog = read("lib/templates/catalog.ts");
const design = read("lib/templates/design.ts");

test("Classic Pearl uses dedicated photo-free scenes and heirloom sections", () => {
  assert.match(scenes, /ClassicPearlScene/);
  assert.match(scenes, /theme === "classic-pearl"/);
  assert.doesNotMatch(scenes, /if \(theme === "classic-pearl"\) return <section/);
  assert.doesNotMatch(scenes, /"classic-pearl": \{ backdrop:/);
  assert.match(universal, /classic-pearl-invitation/);
  assert.match(universal, /classic \? "cp-section"/);
  assert.match(universal, /<ClassicPearlSectionArt section=\{keyName\}/);
  assert.match(universal, /<ClassicPearlIdentity/);
  assert.match(universal, /key === "classic-pearl" \? <ClassicPearlGallery/);
  assert.match(catalog, /key: "classic-pearl"[\s\S]*usesPhotos: false[\s\S]*photoSlots: \[\]/);
});

test("Classic Pearl cover is intentionally asymmetric instead of another centered framed hero", () => {
  assert.match(scene, /object:cover:ledger-line/);
  assert.match(scene, /object:cover:pearl-trail/);
  assert.match(scene, /cp-cover-name-first/);
  assert.match(scene, /cp-cover-name-second/);
  assert.doesNotMatch(scene, /object:cover:pearl-rule/);
  assert.doesNotMatch(scene, /object:cover:oval-frame/);
  assert.match(css, /\.cp-cover-copy \{[^}]*left: 10%;[^}]*top: 29%;[^}]*text-align: left;/);
  assert.match(css, /\.cp-cover-arch \{[^}]*right: 2%;[^}]*top: 13%;/);
  assert.match(css, /\.cp-cover-chandelier \{[^}]*left: 3%;/);
  assert.match(css, /\.cp-cover-tiara \{[^}]*right: 6%;[^}]*bottom: 6%;/);
  assert.doesNotMatch(css, /\.cp-cover-copy \{[^}]*margin:[^;]*auto/);
});

test("Classic Pearl maps all ten local WebP heirloom assets without cropping them", () => {
  for (const asset of [
    "01_ornate_golden_candelabra.webp",
    "02_ivory_victorian_chaise_lounge.webp",
    "03_pearl_crested_baroque_mirror_frame.webp",
    "04_pearl_adorned_perfume_bottle.webp",
    "05_gold_pearl_bridal_tiara.webp",
    "06_crystal_pearl_chandelier.webp",
    "07_bridal_tea_table.webp",
    "08_ivory_gold_wedding_arch.webp",
    "09_ivory_bridal_garland_swag.webp",
    "10_golden_bridal_carriage.webp",
  ]) assert.match(artwork, new RegExp(asset.replace(".", "\\.")));
  assert.match(css, /\.cp-art img \{[^}]*object-fit: contain/);
});

test("Classic Pearl varies section props instead of repeating one bridal ornament", () => {
  assert.match(artwork, /greeting: "mirror"/);
  assert.match(artwork, /event: "teaTable"/);
  assert.match(artwork, /dateTime: "candelabra"/);
  assert.match(artwork, /countdown: "chandelier"/);
  assert.match(artwork, /location: "carriage"/);
  assert.match(artwork, /rsvp: "garland"/);
  assert.match(artwork, /wishes: "perfume"/);
  assert.match(artwork, /gift: "tiara"/);
  assert.match(artwork, /closing: "chaise"/);
});

test("Classic Pearl keeps event identity and shared functional engines protected", () => {
  assert.match(scene, /object:cover:date/);
  assert.match(artwork, /object:identity:personOne-name/);
  assert.match(artwork, /object:identity:personTwo-name/);
  assert.match(artwork, /object:identity:personOne-parents/);
  assert.match(artwork, /object:identity:personTwo-parents/);
  assert.match(universal, /classic-pearl[\s\S]{0,900}<RsvpForm[^>]*appearance="zen"/);
  assert.match(universal, /<GuestWishes[\s\S]*classic-pearl[\s\S]*\? "zen" : "default"/);
  assert.match(universal, /data-studio-section-element="location:button"/);
  assert.match(universal, /data-studio-section-element="gift:button"/);
  assert.match(universal, /usesPhotos && gallerySettings\.presentation !== "template"/);
});

test("Classic Pearl replaces generic section icons with its themed object world", () => {
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <CalendarDays/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <MapPin/);
  assert.match(universal, /key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <Gift/);
});

test("Classic Pearl registers restrained asymmetric motion without animating countdown values", () => {
  assert.match(motion, /const classicPearlNative/);
  assert.match(motion, /"classic-pearl": classicPearlNative/);
  const block = motion.slice(motion.indexOf("const classicPearlNative"), motion.indexOf("const midnightRomanceNative"));
  assert.doesNotMatch(block, /object:countdown:[^"]*-value/);
  assert.match(block, /"object:cover:ledger-line": \{ animation: "reveal-up"/);
  assert.match(block, /"object:cover:chandelier-art": \{ animation: "glide-left"/);
  assert.match(block, /"object:cover:arch-art": \{ animation: "glide-right"/);
  assert.match(block, /"object:cover:pearl-trail": \{ animation: "reveal-left"/);
  assert.match(block, /"object:gallery:promise-group": \{ animation: "tilt-in"/);
  assert.match(block, /"object:gallery:memory-group": \{ animation: "tilt-in"/);
  assert.match(block, /"object:gallery:reflection-group": \{ animation: "rise"/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(scene, /animate=\{\{[\s\S]{0,180}transform:/);
  assert.doesNotMatch(scene, /animate=\{\{\s*(?:x|y|scale|rotate):/);
});

test("Classic Pearl uses its atelier palette and Cormorant editorial pairing", () => {
  assert.match(catalog, /key: "classic-pearl"[\s\S]*preset: \{ layout: "classic", palette: "pearlAtelier", font: "cormorantManrope" \}/);
  assert.match(design, /pearlAtelier: \{ name: "Classic Pearl"/);
  assert.match(design, /cormorantManrope: \{ name: "Cormorant Garamond \+ Manrope"/);
  assert.match(catalog, /Atelier klasik dengan porcelain ivory/);
});

test("Classic Pearl entrance motion is one-shot and waits for local artwork", () => {
  const nativeHook = read("components/PublicInvitation/use-native-visual-animations.ts");
  const photoHook = read("components/PublicInvitation/use-photo-animations.ts");
  assert.match(nativeHook, /const replay = false;/);
  assert.match(photoHook, /const replay = false;/);
  assert.match(nativeHook, /waitForImages:[^\n]*classic-pearl/);
  assert.match(universal, /key === "classic-pearl"[\s\S]{0,350}sectionStyles\.envelope\?\.animation === "none"/);
});

test("Classic Pearl keepsake Gallery stays photo-free and avoids repeated card architecture", () => {
  assert.doesNotMatch(gallery, /data-invitation-photo-slot/);
  assert.match(gallery, /Galeri Kenangan/);
  assert.match(gallery, /object:gallery:promise-group/);
  assert.match(gallery, /object:gallery:memory-group/);
  assert.match(gallery, /object:gallery:reflection-group/);
  assert.match(gallery, /object:gallery:tiara-art/);
  assert.match(gallery, /object:gallery:perfume-art/);
  assert.match(gallery, /object:gallery:mirror-art/);
  assert.match(gallery, /Yang tetap tinggal/);
  assert.match(gallery, /Yang ingin dikenang/);
  assert.match(gallery, /Yang tumbuh bersama/);
  assert.doesNotMatch(gallery, /cp-keepsake-card/);
  assert.match(universal, /classic && keyName === "gallery" \? "Galeri Kenangan"/);
});

test("Classic Pearl flourishes and date presentation can be removed while the date stays data-bound", () => {
  assert.equal(nativeVisualCanHide("object:cover:pearl-trail"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
  assert.match(scene, /object:cover:pearl-trail/);
  assert.doesNotMatch(scene, /object:cover:pearl-rule/);
});
