import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const repoFile = (path) => new URL(`../${path}`, import.meta.url);
const scene = readFileSync(repoFile("components/PublicInvitation/ZenAtelierScene.tsx"), "utf8");
const artwork = readFileSync(repoFile("components/PublicInvitation/ZenAtelierArtwork.tsx"), "utf8");
const source = scene + artwork;

test("Zen Atelier references only artwork that exists in the public template assets", () => {
  const files = [...source.matchAll(/(?:root \+ "|"\/templates\/zen-atelier\/)([a-z0-9]+\.webp)/g)].map((match) => match[1]);
  assert.ok(new Set(files).size >= 4, "expected the envelope, cover and section artwork");
  for (const file of new Set(files)) {
    assert.ok(existsSync(repoFile(`public/templates/zen-atelier/${file}`)), `missing artwork: ${file}`);
  }
});

test("Zen Atelier opens using the direct user gesture and reuses the shared invitation renderer", () => {
  assert.match(scene, /if \(preview && !allowEnvelopeOpen\) return;[\s\S]*?setOpening\(true\);[\s\S]*?onOpen\(\)/);
  assert.doesNotMatch(scene, /setTimeout\(onOpen/);
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  assert.match(universal, /<InvitationMusic ref=\{musicRef\}/);
  assert.match(universal, /<RsvpForm slug=\{invitation\.slug\}/);
});

test("Zen envelope uses Japanese washi folds, mizuhiki knot and existing Zen artwork", () => {
  const css = readFileSync(repoFile("components/PublicInvitation/zen-atelier.css"), "utf8");
  const envelope = scene.split('if (stage === "envelope") {')[1]?.split("\n  }\n\n  return (")[0];
  assert.ok(envelope, "expected distinct Zen digital envelope stage");
  assert.match(envelope, /<BlossomBranch className="zen-jp-branch"/);
  assert.match(envelope, /<EnsoSun className="zen-jp-sun"/);
  assert.match(envelope, /<InkMountains className="zen-jp-mountains"/);
  assert.match(envelope, /<div className="zen-jp-envelope-shell"/);
  assert.match(envelope, /className="zen-jp-fold-left"/);
  assert.match(envelope, /className="zen-jp-fold-right"/);
  assert.match(envelope, /className="zen-jp-fold-top"/);
  assert.match(envelope, /className="zen-jp-mizuhiki-band"/);
  assert.match(envelope, /<svg className="zen-jp-mizuhiki"/);
  assert.match(envelope, /className="zen-jp-seal" lang="ja"/);
  assert.match(envelope, /<span className="zen-jp-letter-names"[^>]*>\{title\}<\/span>/);
  assert.match(envelope, /\{tr\("Buka Undangan"\)\}<\/span>/);
  assert.match(envelope, /disabled=\{opening\}/);
  assert.doesNotMatch(envelope, /amplop1\.webp|wax|Lihat Undangan|Pratinjau|Preview/);
  assert.match(css, /\.zen-envelope\[data-opening\] \.zen-jp-mizuhiki-band \{ animation:zen-jp-untie/);
  assert.match(css, /\.zen-envelope\[data-opening\] \.zen-jp-fold-top \{ animation:zen-jp-unfold/);
  assert.match(css, /\.zen-envelope\[data-opening\] \.zen-jp-letter \{ animation:zen-jp-letter-rise/);
  assert.match(css, /\.zen-envelope\[data-opening\] \.zen-jp-paper-stage \{ animation:zen-jp-paper-exit/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  assert.match(universal, /musicRef\.current\?\.playOnOpen\(\)/);
  assert.match(universal, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(universal, /setOpened\(true\);\s*setOpening\(false\);\s*onEnvelopeOpened\?\.\(\)/);
});

test("Zen envelope honors Studio palette and font tokens without locking its paper to preset colors", () => {
  const css = readFileSync(repoFile("components/PublicInvitation/zen-atelier.css"), "utf8");
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  const studio = readFileSync(repoFile("components/InvitationStudio/InvitationDesigner.tsx"), "utf8");
  const envelope = css.split(".zen-envelope {")[1]?.split(".zen-envelope[data-opening]")[0];
  assert.ok(envelope, "expected the envelope's scoped artwork styles");
  for (const [token, parent] of [
    ["--jp-washi", "--inv-scene-bg"],
    ["--jp-paper", "--inv-scene-surface"],
    ["--jp-ink", "--inv-scene-ink"],
    ["--jp-paper-ink", "--inv-scene-surface-ink"],
    ["--jp-accent", "--inv-scene-accent"],
    ["--jp-soft", "--inv-scene-soft"],
  ]) {
    assert.ok(envelope.includes(`${token}:var(${parent},`), `${token} must inherit ${parent} with a Zen preset fallback`);
    assert.ok(universal.includes(`"${parent}":`), `renderer must supply ${parent} for custom palettes`);
  }
  for (const selector of [
    ".zen-jp-envelope-shell", ".zen-jp-letter", ".zen-jp-fold-left",
    ".zen-jp-fold-right", ".zen-jp-fold-top", ".zen-jp-mizuhiki-band",
    ".zen-jp-seal", ".zen-jp-sun circle",
  ]) {
    const rule = envelope.split("\n").find((line) => line.startsWith(`${selector} {`)) || "";
    assert.match(rule, /var\(--jp-/, `${selector} must derive visible colors from the active palette`);
  }
  assert.match(css, /\.zen-jp-letter-names \{[^}]*var\(--inv-heading\)/);
  assert.match(scene, /stroke="var\(--jp-accent\)"/);
  assert.match(scene, /stroke="var\(--jp-soft\)"/);
  assert.match(universal, /fontFamily: invitationFontFamily\(font\.body\)/);
  assert.doesNotMatch(studio, /<ColorPanel/);
  assert.match(studio, /const palette = invitationPalettes\[design\.palette\]/);
  assert.match(studio, /<TextObjectPanel[^>]*selectedFont=\{design\.font\}[\s\S]*onFontSelect=\{\(value\) => change\(\{ font: value \}\)\}/);
});

test("Zen artwork is a feature component with preserved lazy loading", () => {
  const renderer = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  assert.equal(existsSync(repoFile("assets/templates/zen-atelier/ZenArtwork.tsx")), false);
  assert.ok(existsSync(repoFile("components/PublicInvitation/ZenAtelierArtwork.tsx")));
  assert.match(scene, /from "@\/components\/PublicInvitation\/ZenAtelierArtwork"/);
  assert.match(renderer, /dynamic\(\(\) => import\("@\/components\/PublicInvitation\/ZenAtelierArtwork"\)/);
  assert.match(artwork, /export function ZenSectionArtwork\(/);
  assert.match(artwork, /export function ZenMemoryArtwork\(/);
});


test("Zen Atelier cover is an asymmetric kakemono photo composition with Studio-native motion", () => {
  const css = readFileSync(repoFile("components/PublicInvitation/zen-atelier.css"), "utf8");
  const themes = readFileSync(repoFile("components/PublicInvitation/InvitationThemeScenes.tsx"), "utf8");
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  const motion = readFileSync(repoFile("lib/templates/template-motion.ts"), "utf8");

  assert.match(scene, /className="zen-cover-scroll"/);
  assert.match(scene, /data-invitation-photo-slot="cover"/);
  assert.match(scene, /className="zen-cover-copy"/);
  assert.match(scene, /object:cover:personOne-name/);
  assert.match(scene, /object:cover:personTwo-name/);
  assert.match(scene, /object:cover:vertical-word/);
  assert.match(scene, /StudioPhotoCropOverlay/);
  assert.doesNotMatch(css, /\.zen-cover-blossom/);

  assert.match(themes, /theme === "zen-atelier"[\s\S]*?cover=\{cover\}[\s\S]*?cropEditing=\{cropEditing\}[\s\S]*?motionEnabled=\{motionEnabled\}/);
  assert.match(motion, /const zenAtelierPhotos: PhotoMotionMap/);
  assert.match(motion, /"zen-atelier": zenAtelierPhotos/);
  assert.match(motion, /const zenAtelierNative: Record<string, TemplateNativeMotion>/);
  assert.match(motion, /"zen-atelier": zenAtelierNative/);
  assert.match(motion, /"object:cover:scroll-group": \{ animation: "reveal-up"/);
  assert.match(motion, /"object:rsvp:bamboo-art": \{ animation: "glide-left"/);
  assert.doesNotMatch(universal, /key !== "zen-atelier"[\s\S]*?IntersectionObserver/);
});


test("Zen closing keeps independent copy slots without overlap and uses one motion engine", () => {
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  const gallery = readFileSync(repoFile("components/PublicInvitation/ZenAtelierGallery.tsx"), "utf8");
  const css = readFileSync(repoFile("components/PublicInvitation/zen-atelier.css"), "utf8");

  assert.match(universal, /zen-closing-message/);
  assert.match(universal, /zen-closing-prayer/);
  assert.match(universal, /zen-closing-quote/);
  assert.match(css, /grid-template-areas:[\s\S]*"message quote"[\s\S]*"names quote"[\s\S]*"prayer quote"/);
  assert.doesNotMatch(css, /\.zen-closing-copy \.zen-quote \{ grid-column:2; grid-row:1 \/ 3/);
  assert.doesNotMatch(gallery, /IntersectionObserver|classList\.toggle\("zen-reveal"/);
});

test("Zen couple names keep the same first-person then second-person order as other templates", () => {
  const universal = readFileSync(repoFile("components/PublicInvitation/UniversalInvitationTemplate.tsx"), "utf8");
  assert.match(universal, /const names = couple\s*\? \[displayTitleCase\(invitation\.groomName\), displayTitleCase\(invitation\.brideName\)\]/);
  assert.doesNotMatch(universal, /key === "zen-atelier" \? \[displayTitleCase\(invitation\.brideName\), displayTitleCase\(invitation\.groomName\)\]/);
});


test("Zen cover uses one-shot motion and avoids nested photo entrance flicker", () => {
  const nativeHook = readFileSync(repoFile("components/PublicInvitation/use-native-visual-animations.ts"), "utf8");
  const photoHook = readFileSync(repoFile("components/PublicInvitation/use-photo-animations.ts"), "utf8");
  const motion = readFileSync(repoFile("lib/templates/template-motion.ts"), "utf8");

  assert.match(nativeHook, /const replay = false;/);
  assert.match(nativeHook, /waitForImages: template === "zen-atelier"/);
  assert.match(photoHook, /const replay = false;/);
  const zenPhotos = motion.split("const zenAtelierPhotos: PhotoMotionMap = {")[1]?.split("};")[0] || "";
  assert.doesNotMatch(zenPhotos, /cover:\s*\{/);
  assert.match(zenPhotos, /gallery:\s*\{ animation: "tilt-in"/);
});
