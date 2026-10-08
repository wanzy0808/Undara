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
import { getTemplateDemoInvitation, birthdayTemplateDemoInvitation, resolveTemplateStudioDemo, templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { invitationCopyDefaults, availableEditableCopyFields, withEditableCopy } from "../lib/templates/editable-copy.ts";
import { invitationText, localizedEditableCopy } from "../lib/invitations/language.ts";
import { occasionPresentation, occasionSectionBackground } from "../lib/templates/occasion-presentation.ts";
import { readableInk, contrastRatio } from "../lib/templates/presentation.ts";
import { isNativeVisualKey, withNativeVisualTransforms, parseNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
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
  "./occasion-themes.css": {}, "./family-stationery.css": {}, "./birthday-stationery.css": {},
}).default;
const cases = [
  ["cherry-picnic", "picnic", "masonry"],
  ["velvet-wish", "velvet", "filmstrip"],
  ["little-parade", "parade", "carousel"],
  ["disco-bloom", "disco", "stack"],
];

test("Birthday offers exactly four new themes alongside Confetti Club", () => {
  assert.deepEqual(templatesForEvent(invitationTemplates, "BIRTHDAY").map(t => t.key),
    ["confetti-club", ...cases.map(([key]) => key)]);
  assert.equal(new Set(invitationTemplates.map(t => t.key)).size, invitationTemplates.length);
});

for (const [key, composition, gallery] of cases) {
  const theme = invitationTemplates.find(t => t.key === key);
  const design = makeDesignKey(key, theme.preset.palette, theme.preset.font);

  test(`${key} is Birthday-only and keeps Dara confined to demo data`, () => {
    assert.deepEqual(theme.eventCategories, ["BIRTHDAY"]);
    assert.deepEqual(theme.photoSlots, ["cover", "gallery"]);
    assert.equal(isInvitationTemplateCompatible(design, "BIRTHDAY"), true);
    for (const category of ["WEDDING", "SILVER_WEDDING", "GOLDEN_WEDDING", "BABY_SHOWER", "KHITANAN", "SANGJIT", "OTHER"]) {
      assert.equal(isInvitationTemplateCompatible(design, category), false);
    }
    const demo = getTemplateDemoInvitation(design);
    assert.equal(demo, birthdayTemplateDemoInvitation);
    assert.equal(demo.groomName, "Dara");
    assert.equal(demo.brideName, "");
    assert.equal(demo.isPublished, false);
    assert.equal(demo.description, null);
    const master = resolveTemplateStudioDemo({ ...templateDemoInvitation, id: "master-only" }, key);
    assert.equal(master.id, "master-only");
    assert.equal(master.eventCategory, "BIRTHDAY");
    assert.equal(master.groomName, "Dara");
  });

  test(`${key} renders actual escaped identity, a recipient and removable section-owned visuals`, () => {
    const props = { theme: key, names: "Nama Customer <script>", date: "18 Juli 2027", eventLabel: "Ulang Tahun", focus: "center", stage: "cover", onOpen: () => {} };
    const cover = renderToStaticMarkup(createElement(Scene, props));
    const envelope = renderToStaticMarkup(createElement(Scene, { ...props, stage: "envelope", recipientLine: "Untuk Rani & Budi" }));
    assert.match(cover, new RegExp("rf-cover--" + composition));
    for (const html of [cover, envelope]) {
      assert.match(html, /Nama Customer &lt;script&gt;/);
      assert.match(html, /18 Juli 2027/);
      assert.match(decodeURIComponent(html), new RegExp(`/templates/${key}/scene`));
      assert.doesNotMatch(html, /Una|Dara|mempelai|akad|Khitanan|Sangjit/);
      const targets = [...html.matchAll(/data-studio-native-object="([^"]+)"/g)].map(m => m[1]);
      assert.equal(targets.length, new Set(targets).size);
      assert.ok(targets.every(isNativeVisualKey));
    }
    assert.equal((envelope.match(/<button/g) || []).length, 1);
    assert.match(envelope, /Untuk Rani &amp; Budi/);
    for (const section of ["greeting", "closing"]) {
      const accent = renderToStaticMarkup(createElement(art.FamilyStationerySectionArt, { theme: key, section }));
      assert.match(accent, /<svg/);
      const target = `object:${section}:party-mark`;
      assert.ok(isNativeVisualKey(target));
      const hidden = withNativeVisualTransforms(design, { [target]: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, hidden: true, color: "#123456" } });
      assert.equal(parseNativeVisualTransforms(hidden)[target].hidden, true);
      assert.equal(parseNativeVisualTransforms(hidden)[target].color, "#123456");
      assert.equal(parseNativeVisualTransforms(withNativeVisualTransforms(hidden, {}))[target], undefined);
    }
    assert.equal(renderToStaticMarkup(createElement(art.FamilyStationerySectionArt, { theme: key, section: "rsvp" })), "");
  });

  test(`${key} localizes four narratives without translating or replacing customer text`, () => {
    const defaults = invitationCopyDefaults(key);
    assert.deepEqual(availableEditableCopyFields(key, false), ["greeting", "attendanceRequest", "prayerWish", "closing"]);
    for (const field of ["greeting", "attendanceRequest", "prayerWish", "closing"]) {
      assert.ok(defaults[field]);
      assert.notEqual(invitationText("EN", defaults[field]), defaults[field]);
    }
    assert.doesNotMatch(Object.values(defaults).join(" "), /pernikahan|mempelai|akad|sangjit|khitanan|Una|Dara|\d/i);
    assert.equal(invitationCopyDefaults(key, "Pengantar customer").greeting, "Pengantar customer");
    const authored = withEditableCopy(design, { greeting: "My own words", closing: "Sampai ketemu besok" });
    const copy = localizedEditableCopy(authored, key, null, "EN");
    assert.equal(copy.greeting, "My own words");
    assert.equal(copy.closing, "Sampai ketemu besok");
    const english = renderToStaticMarkup(createElement(language.InvitationLanguageProvider, { language: "EN" }, createElement(Scene, { theme: key, names: "Customer", date: "July 18, 2027", eventLabel: "Birthday", focus: "center", stage: "envelope", onOpen: () => {} })));
    assert.match(english, /Open Invitation/);
    assert.doesNotMatch(english, /Buka Undangan/);
  });

  test(`${key} has readable section surfaces, chosen music and motion-OFF precedence`, async () => {
    assert.equal(occasionPresentation(key).gallery, gallery);
    const palette = invitationPalettes[theme.preset.palette];
    for (const section of ["greeting", "identity", "event", "dateTime", "gallery", "countdown", "location", "rsvp", "wishes", "gift", "closing"]) {
      const bg = occasionSectionBackground(key, section, palette);
      assert.ok(contrastRatio(readableInk(bg, palette.ink), bg) >= 4.5);
    }
    assert.ok(templateNativeMotionForKey(key, "heading:cover", {}));
    assert.equal(templateNativeMotionForKey(key, "heading:cover", { cover: { animation: "none" } }), undefined);
    assert.equal(templateHasDefaultPhotoMotion(key), true);
    assert.ok(getInvitationDefaultMusic(key).url);
    assert.equal(resolveInvitationMusic(key, "/owned-track.mp3", []), "/owned-track.mp3");
    const bytes = readFileSync(new URL(`../public/templates/${key}/scene.webp`, import.meta.url));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.deepEqual([metadata.width, metadata.height], [1024, 1536]);
    assert.ok(bytes.byteLength < 240000);
  });
}
