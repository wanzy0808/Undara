import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { loadSource } from "./helpers/package-access.mjs";
import { invitationTemplates, templatesForEvent, isInvitationTemplateCompatible } from "../lib/templates/catalog.ts";
import { invitationPalettes, makeDesignKey } from "../lib/templates/design.ts";
import { getTemplateDemoInvitation, resolveTemplateStudioDemo, templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { invitationCopyDefaults, withEditableCopy, availableEditableCopyFields } from "../lib/templates/editable-copy.ts";
import { invitationText, localizedEditableCopy } from "../lib/invitations/language.ts";
import { occasionPresentation, occasionSectionBackground } from "../lib/templates/occasion-presentation.ts";
import { contrastRatio, readableInk } from "../lib/templates/presentation.ts";
import { isNativeVisualKey, nativeVisualCapabilities, nativeVisualUsesSystemContent, withNativeVisualTransforms, parseNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { templateNativeMotionForKey, templateHasDefaultPhotoMotion } from "../lib/templates/template-motion.ts";
import { getInvitationDefaultMusic, resolveInvitationMusic } from "../lib/templates/music.ts";
import * as art from "../components/PublicInvitation/FamilyStationeryArtwork.tsx";
import * as parts from "../components/PublicInvitation/OccasionSceneParts.tsx";
import * as language from "../components/PublicInvitation/InvitationLanguage.tsx";
import * as directions from "../lib/templates/family-art-directions.ts";

const Scene = loadSource("components/PublicInvitation/FamilyStationeryScene.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/PublicInvitation/FamilyStationeryArtwork": art,
  "@/components/PublicInvitation/OccasionSceneParts": parts,
  "@/lib/templates/family-art-directions": directions,
  "./occasion-themes.css": {}, "./family-stationery.css": {},
}).default;
const cases = [
  ["serambi-pagi", "KHITANAN", "arched", "masonry"],
  ["rumah-senja", "KHITANAN", "editorial", "filmstrip"],
  ["langit-safari", "KHITANAN", "playful", "carousel"],
  ["purnama-biru", "KHITANAN", "night", "stack"],
  ["giok-abadi", "SANGJIT", "tea", "stack"],
  ["peony-silk", "SANGJIT", "romantic", "masonry"],
  ["imperial-crimson", "SANGJIT", "ceremony", "carousel"],
  ["porcelain-bloom", "SANGJIT", "porcelain", "filmstrip"],
];

test("the collection adds four themes per family category without replacing the existing defaults", () => {
  assert.equal(invitationTemplates.length, 29);
  for (const [category, original] of [["KHITANAN", "taman-doa"], ["SANGJIT", "red-thread"]]) {
    assert.deepEqual(templatesForEvent(invitationTemplates, category).map((t) => t.key),
      [original, ...cases.filter((t) => t[1] === category).map((t) => t[0])]);
  }
  assert.equal(directions.familyArtworkUrl("unknown"), undefined);
});

for (const [key, category, composition, gallery] of cases) {
  const theme = invitationTemplates.find((t) => t.key === key);
  const design = makeDesignKey(key, theme.preset.palette, theme.preset.font);

  test(`${key} respects exact event eligibility, optional photos and isolated category fixtures`, () => {
    assert.deepEqual(theme.eventCategories, [category]);
    assert.deepEqual(theme.photoSlots, ["cover", "gallery"]);
    assert.equal(theme.usesPhotos, true);
    assert.equal(isInvitationTemplateCompatible(design, category), true);
    for (const other of ["WEDDING", "BIRTHDAY", "OTHER", category === "KHITANAN" ? "SANGJIT" : "KHITANAN"]) {
      assert.equal(isInvitationTemplateCompatible(design, other), false);
    }
    const demo = getTemplateDemoInvitation(design);
    assert.equal(demo.eventCategory, category);
    assert.equal(Boolean(demo.brideName), category === "SANGJIT");
    assert.equal(demo.description, null);
    assert.equal(demo.isPublished, false);
    assert.deepEqual(demo.assets, []);
    const next = resolveTemplateStudioDemo({ ...templateDemoInvitation, id: "master", assets: [...templateDemoInvitation.assets, { id: "author-art", type: "IMAGE", url: "/author.webp" }] }, key);
    assert.equal(next.id, "master");
    assert.equal(next.eventCategory, category);
    assert.deepEqual(next.assets.map((a) => a.id), ["author-art"]);
  });

  test(`${key} renders live escaped names/date, complete art, native targets and one shared opening action`, () => {
    const props = { theme: key, names: "Nama Panjang & Keluarga <script>", date: "18 Juli 2027", eventLabel: category === "KHITANAN" ? "Khitanan" : "Sangjit", focus: "center", stage: "cover", onOpen: () => {} };
    const cover = renderToStaticMarkup(createElement(Scene, { ...props, cover: "/private-customer.webp" }));
    const envelope = renderToStaticMarkup(createElement(Scene, { ...props, stage: "envelope", recipientLine: "Untuk Rani & Budi" }));
    assert.match(cover, new RegExp("rf-cover--" + composition));
    for (const markup of [cover, envelope]) {
      assert.match(markup, /Nama Panjang &amp; Keluarga &lt;script&gt;/);
      assert.match(markup, /18 Juli 2027/);
      assert.match(markup, /scene\.webp/);
      assert.doesNotMatch(markup, /private-customer|Una|Dara|Leon|Mei/);
      const keys = [...markup.matchAll(/data-studio-native-object="([^"]+)"/g)].map((m) => m[1]);
      assert.equal(keys.length, new Set(keys).size);
      assert.ok(keys.every(isNativeVisualKey));
    }
    assert.equal((envelope.match(/<button/g) || []).length, 1);
    assert.match(envelope, /data-personal-envelope-address/);
    assert.match(envelope, /Untuk Rani &amp; Budi/);
    assert.equal(nativeVisualCapabilities("object:cover:event-label").typography, true);
    assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
    const vignetteSection = directions.familyArtDirection(key).vignette;
    const vignette = renderToStaticMarkup(createElement(art.FamilyStationerySectionArt, { theme: key, section: vignetteSection }));
    assert.match(vignette, /detail\.webp/);
    assert.equal(renderToStaticMarkup(createElement(art.FamilyStationerySectionArt, { theme: key, section: "location" })), "");
    for (const target of ["object:cover:scene-art", "object:cover:scene-frame", `object:${vignetteSection}:detail-art`, "object:envelope:seal"]) {
      const saved = withNativeVisualTransforms(design, { [target]: { x: 8, y: 12, scaleX: 1, scaleY: 1, rotation: 0, color: "#123456", hidden: true } });
      assert.equal(parseNativeVisualTransforms(saved)[target].color, "#123456");
      assert.equal(parseNativeVisualTransforms(saved)[target].hidden, true);
      assert.equal(parseNativeVisualTransforms(withNativeVisualTransforms(saved, {}))[target], undefined);
    }
  });

  test(`${key} translates its four defaults and preserves authored family copy and empty story`, () => {
    const defaults = invitationCopyDefaults(key);
    for (const field of ["greeting", "attendanceRequest", "prayerWish", "closing"]) {
      assert.ok(defaults[field]);
      assert.notEqual(invitationText("EN", defaults[field]), defaults[field]);
    }
    assert.equal(defaults.ourStory, undefined);
    assert.equal(availableEditableCopyFields(key, category === "SANGJIT").includes("ourStory"), category === "SANGJIT");
    assert.doesNotMatch(Object.values(defaults).join(" "), /akad|resepsi|mempelai|Una|Dara|ulang tahun/i);
    assert.equal(invitationCopyDefaults(key, "Pengantar keluarga").greeting, "Pengantar keluarga");
    const saved = withEditableCopy(design, { closing: "Kalimat keluarga kami" });
    assert.equal(localizedEditableCopy(saved, key, "Pengantar kami", "EN").closing, "Kalimat keluarga kami");
    const english = renderToStaticMarkup(createElement(language.InvitationLanguageProvider, { language: "EN" },
      createElement(Scene, { theme: key, names: "Real names", date: "July 18, 2027", eventLabel: "Khitan Celebration", focus: "center", stage: "envelope", onOpen: () => {} })));
    assert.match(english, /Open Invitation/);
    assert.doesNotMatch(english, /Buka Undangan/);
  });

  test(`${key} keeps contrast, chosen music, finite default motion and explicit OFF precedence`, () => {
    assert.equal(occasionPresentation(key).gallery, gallery);
    const palette = invitationPalettes[theme.preset.palette];
    for (const section of ["greeting", "identity", "event", "dateTime", "gallery", "location", "rsvp", "wishes", "gift", "closing"]) {
      const background = occasionSectionBackground(key, section, palette);
      assert.ok(contrastRatio(readableInk(background, palette.ink), background) >= 4.5);
    }
    const motion = templateNativeMotionForKey(key, "heading:cover", {});
    assert.ok(motion && motion.animationDuration <= .7);
    assert.equal(templateNativeMotionForKey(key, "heading:cover", { cover: { animation: "none" } }), undefined);
    assert.equal(templateHasDefaultPhotoMotion(key), true);
    assert.ok(getInvitationDefaultMusic(key).url);
    assert.equal(resolveInvitationMusic(key, "/chosen.mp3", []), "/chosen.mp3");
  });

  test(`${key} ships bounded photographic WebP and a transparent complete detail asset`, async () => {
    const scenePath = new URL(`../public/templates/${key}/scene.webp`, import.meta.url);
    const detailPath = new URL(`../public/templates/${key}/detail.webp`, import.meta.url);
    const scene = readFileSync(scenePath);
    const detail = readFileSync(detailPath);
    const [a, b] = await Promise.all([sharp(scene).metadata(), sharp(detail).metadata()]);
    assert.equal(a.format, "webp");
    assert.deepEqual([a.width, a.height], [1024, 1536]);
    assert.deepEqual([b.width, b.height], [960, 640]);
    assert.equal(b.hasAlpha, true);
    assert.ok(scene.byteLength + detail.byteLength < 350000);
  });
}
