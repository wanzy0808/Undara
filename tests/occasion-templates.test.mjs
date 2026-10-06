import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSource } from "./helpers/package-access.mjs";
import { invitationTemplates, defaultInvitationTemplateForEvent, templatesForEvent } from "../lib/templates/catalog.ts";
import { invitationPalettes, makeDesignKey } from "../lib/templates/design.ts";
import { availableEditableCopyFields, invitationCopyDefaults, withEditableCopy } from "../lib/templates/editable-copy.ts";
import { invitationText, localizedEditableCopy } from "../lib/invitations/language.ts";
import { contrastRatio } from "../lib/templates/presentation.ts";
import { getTemplateDemoInvitation, templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { nativeVisualCapabilities, nativeVisualUsesSystemContent, isNativeVisualKey, withNativeVisualTransforms, parseNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { templateHasDefaultMotion, templateHasDefaultPhotoMotion, templateNativeMotionForKey, templatePhotoMotion } from "../lib/templates/template-motion.ts";
import { resolveInvitationMusic } from "../lib/templates/music.ts";
import { occasionPresentation, occasionSectionBackground } from "../lib/templates/occasion-presentation.ts";
import * as artwork from "../components/PublicInvitation/AnniversaryArtwork.tsx";
import * as parts from "../components/PublicInvitation/OccasionSceneParts.tsx";
import * as languageContext from "../components/PublicInvitation/InvitationLanguage.tsx";

const scene = loadSource("components/PublicInvitation/AnniversaryScene.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/PublicInvitation/AnniversaryArtwork": artwork,
  "@/components/PublicInvitation/OccasionSceneParts": parts,
  "@/components/PublicInvitation/InvitationLanguage": languageContext,
  "./occasion-themes.css": {},
}).default;

const themes = [
  ["silver-reverie", "SILVER_WEDDING", "silverReverie", "masonry"],
  ["golden-keepsake", "GOLDEN_WEDDING", "goldenKeepsake", "stack"],
];
for (const [key, category, paletteKey, gallery] of themes) {
  const theme = invitationTemplates.find((item) => item.key === key);
  test(`${key} is a real category-scoped preset with an isolated preview fixture`, () => {
    assert.ok(theme);
    assert.deepEqual(theme.eventCategories, [category]);
    assert.equal(defaultInvitationTemplateForEvent(category), theme);
    assert.deepEqual(templatesForEvent(invitationTemplates, category), [theme]);
    assert.deepEqual(theme.photoSlots, ["cover", "gallery"]);
    assert.equal(theme.usesPhotos, true);
    assert.equal(theme.preset.palette, paletteKey);
    assert.equal(occasionPresentation(key).gallery, gallery);
    const demo = getTemplateDemoInvitation(key);
    assert.equal(demo.eventCategory, category);
    assert.equal(demo.description, null);
    assert.equal(demo.isPublished, false);
    assert.notEqual(demo.id, templateDemoInvitation.id);
    assert.equal(templateDemoInvitation.eventCategory, "WEDDING");
    assert.match(readFileSync(new URL("../public" + theme.previewImage, import.meta.url), "utf8"), /viewBox="0 0 390 760"/);
  });

  test(`${key} keeps all narrative slots localized and preserves family-authored text`, () => {
    const fields = availableEditableCopyFields(key, true);
    assert.ok(fields.includes("ourStory"));
    const defaults = invitationCopyDefaults(key);
    for (const field of ["greeting", "attendanceRequest", "prayerWish", "closing"]) {
      assert.ok(defaults[field]?.trim());
      assert.notEqual(invitationText("EN", defaults[field]), defaults[field]);
    }
    assert.doesNotMatch(Object.values(defaults).join(" "), /\b25\b|\b50\b|Una|Dara|langkah baru/i);
    const design = makeDesignKey(key, theme.preset.palette, theme.preset.font);
    const saved = withEditableCopy(design, { closing: "Pesan asli keluarga", ourStory: "Kami bertemu di taman.\nMasih berjalan bersama." });
    assert.equal(localizedEditableCopy(saved, key, "Sapaan milik keluarga", "EN").closing, "Pesan asli keluarga");
    assert.equal(localizedEditableCopy(saved, key, "Sapaan milik keluarga", "EN").greeting, "Sapaan milik keluarga");
    assert.equal(localizedEditableCopy(saved, key, null, "ID").ourStory, "Kami bertemu di taman.\nMasih berjalan bersama.");
  });

  test(`${key} renders actual names/date/address without a stock photo fallback or duplicate edit identities`, () => {
    const props = { theme: key, names: "Raka & Sinta <script>", date: "6 Oktober 2027", focus: "center", stage: "cover", onOpen: () => {} };
    const cover = renderToStaticMarkup(createElement(scene, props));
    assert.match(cover, /Raka &amp; Sinta &lt;script&gt;/);
    assert.match(cover, /6 Oktober 2027/);
    assert.equal(nativeVisualCapabilities("object:cover:event-label").typography, true);
    assert.equal(nativeVisualUsesSystemContent("object:cover:event-label"), true);
    assert.doesNotMatch(cover, /<img|Una|Dara|pilih foto|Pilih foto|Atur Foto/);
    const photo = renderToStaticMarkup(createElement(scene, { ...props, cover: "/my-event.webp", crop: { x: 17, y: 61, zoom: 1.4 } }));
    assert.match(photo, /src="\/my-event.webp"/);
    assert.match(photo, /object-position:17% 61%/);
    assert.match(photo, /scale\(1.4\)/);
    assert.match(photo, /data-invitation-photo-slot="cover"/);
    const envelope = renderToStaticMarkup(createElement(scene, { ...props, stage: "envelope", recipientLine: "Untuk Rani & Budi" }));
    assert.match(envelope, /data-personal-envelope-address/);
    assert.match(envelope, /Untuk Rani &amp; Budi/);
    assert.match(envelope, /Buka Undangan/);
    assert.doesNotMatch(envelope, /src=|data-studio-system-action/);
    for (const markup of [cover, photo, envelope]) {
      const keys = [...markup.matchAll(/data-studio-native-object="([^"]+)"/g)].map((item) => item[1]);
      assert.equal(new Set(keys).size, keys.length);
      assert.ok(keys.every(isNativeVisualKey));
    }
  });

  test(`${key} preserves OFF overrides, individual artwork colors and accessible palette contrast`, () => {
    assert.equal(templateHasDefaultMotion(key), true);
    assert.equal(templateHasDefaultPhotoMotion(key), true);
    assert.equal(templateNativeMotionForKey(key, "heading:cover", { cover: { animation: "none" } }), undefined);
    assert.equal(templatePhotoMotion(key, { gallery: { animation: "none" } }).gallery.animation, "none");
    assert.equal(templatePhotoMotion(key, {}, { cover: { animation: "none" } }).cover.animation, undefined);
    const markup = renderToStaticMarkup(createElement(artwork.AnniversarySectionArt, { theme: key, section: "closing" }));
    const target = [...markup.matchAll(/data-studio-native-object="([^"]+)"/g)][1][1];
    assert.ok(isNativeVisualKey(target));
    const painted = withNativeVisualTransforms(key, { [target]: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, color: "#123456", hidden: true } });
    assert.equal(parseNativeVisualTransforms(painted)[target].color, "#123456");
    assert.equal(parseNativeVisualTransforms(painted)[target].hidden, true);
    const palette = invitationPalettes[paletteKey];
    for (const section of ["greeting", "identity", "event", "gallery", "rsvp", "closing"]) {
      assert.ok(contrastRatio(palette.ink, occasionSectionBackground(key, section, palette)) >= 4.5);
    }
    assert.ok(contrastRatio(palette.accent, palette.surface) >= 4.5);
    assert.ok(contrastRatio(palette.accent, palette.bg) >= 3);
    assert.equal(resolveInvitationMusic(key, "/my-music.mp3", []), "/my-music.mp3");
  });
}

test("occasion opening calls the shared gesture synchronously and skips movement for keyboard/OFF", () => {
  let reduced = false;
  const calls = [];
  const hooks = loadSource("components/PublicInvitation/OccasionSceneParts.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useState: () => [false, (value) => calls.push(["state", value])] },
    "motion/react": { useReducedMotion: () => reduced },
    "lucide-react": { ArrowDown: () => null, ArrowUpRight: () => null },
    "@/components/InvitationStudio/StudioPhotoCropOverlay": { default: () => null },
    "@/lib/invitations/language": { invitationText },
    "@/components/PublicInvitation/InvitationLanguage": languageContext,
  });
  const event = { detail: 1, preventDefault: () => calls.push(["prevent"]), stopPropagation: () => calls.push(["stop"]) };
  const options = { onOpen: (immediate) => calls.push(["open", immediate]) };
  for (const opts of [{}, { motionEnabled: false }, { keyboard: true }, { reduced: true }]) {
    calls.length = 0; reduced = Boolean(opts.reduced);
    hooks.useOccasionOpening({ ...options, ...opts }).open({ ...event, detail: opts.keyboard ? 0 : 1 });
    assert.deepEqual(calls, [["state", !(opts.motionEnabled === false || opts.keyboard || opts.reduced)], ["open", Boolean(opts.motionEnabled === false || opts.keyboard || opts.reduced)]]);
  }
  calls.length = 0;
  hooks.useOccasionOpening({ ...options, preview: true, allowEnvelopeOpen: false }).open(event);
  assert.deepEqual(calls, [["prevent"], ["stop"]]);
  calls.length = 0; reduced = false;
  hooks.useOccasionOpening({ ...options, preview: true, allowEnvelopeOpen: true }).open(event);
  assert.deepEqual(calls, [["state", true], ["open", false]]);
});
