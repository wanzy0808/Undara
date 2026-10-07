import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSource } from "./helpers/package-access.mjs";
import { eventCategoryOptions, buildEventTitle, getEventCategory, normalizeEventCategory } from "../lib/events/catalog.ts";
import { invitationTemplates, defaultInvitationTemplateForEvent, templatesForEvent, isInvitationTemplateCompatible, getInvitationTemplate } from "../lib/templates/catalog.ts";
import { makeDesignKey, invitationPalettes } from "../lib/templates/design.ts";
import { getTemplateDemoInvitation, resolveTemplateStudioDemo, templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { availableEditableCopyFields, invitationCopyDefaults, withEditableCopy } from "../lib/templates/editable-copy.ts";
import { invitationText, localizedEditableCopy } from "../lib/invitations/language.ts";
import { readableInk, contrastRatio } from "../lib/templates/presentation.ts";
import { occasionPresentation, occasionSectionBackground } from "../lib/templates/occasion-presentation.ts";
import { nativeVisualCapabilities, nativeVisualUsesSystemContent, isNativeVisualKey, withNativeVisualTransforms, parseNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { templateHasDefaultMotion, templateNativeMotionForKey, templateHasDefaultPhotoMotion } from "../lib/templates/template-motion.ts";
import { getInvitationDefaultMusic, resolveInvitationMusic } from "../lib/templates/music.ts";
import * as artwork from "../components/PublicInvitation/FamilyCelebrationArtwork.tsx";
import * as parts from "../components/PublicInvitation/OccasionSceneParts.tsx";
import * as language from "../components/PublicInvitation/InvitationLanguage.tsx";

const Scene = loadSource("components/PublicInvitation/FamilyCelebrationScene.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/PublicInvitation/FamilyCelebrationArtwork": artwork,
  "@/components/PublicInvitation/OccasionSceneParts": parts,
  "@/components/PublicInvitation/InvitationLanguage": language,
  "@/lib/invitations/language": { invitationText },
  "./occasion-themes.css": {}, "./family-celebrations.css": {},
}).default;

const cases = [["taman-doa", "KHITANAN", "tamanDoa", false], ["red-thread", "SANGJIT", "redThread", true]];
for (const [key, category, paletteKey, couple] of cases) {
  const theme = invitationTemplates.find((item) => item.key === key);
  const design = makeDesignKey(key, theme.preset.palette, theme.preset.font);

  test(`${category} has its own name mode, catalog default and server-compatible design`, () => {
    assert.equal(normalizeEventCategory(category), category);
    assert.equal(getEventCategory(category).nameMode, couple ? "couple" : "single");
    assert.equal(buildEventTitle(category, "Aksa", "Mei"), couple ? "Sangjit Aksa & Mei" : "Khitanan Aksa");
    assert.deepEqual(theme.eventCategories, [category]);
    assert.equal(defaultInvitationTemplateForEvent(category), theme);
    assert.deepEqual(templatesForEvent(invitationTemplates, category), [theme]);
    assert.equal(isInvitationTemplateCompatible(design, category), true);
    for (const row of eventCategoryOptions.filter((row) => row.key !== category)) {
      assert.equal(isInvitationTemplateCompatible(design, row.key), false);
    }
    assert.deepEqual(theme.photoSlots, ["cover", "gallery"]);
    assert.match(readFileSync(new URL("../public" + theme.previewImage, import.meta.url), "utf8"), /viewBox="0 0 390 760"/);
    assert.equal(getInvitationTemplate("unknown").key, "romantic-rose", "new categories must not change the legacy registry fallback");
  });

  test(`${key} keeps demo data isolated and clears a previous master occasion on switch`, () => {
    const demo = getTemplateDemoInvitation(design);
    assert.equal(demo.eventCategory, category);
    assert.equal(demo.description, null);
    assert.equal(demo.isPublished, false);
    assert.equal(demo.brideName.length > 0, couple);
    assert.equal(demo.assets.length, 0);
    assert.notEqual(demo.id, templateDemoInvitation.id);
    const changed = resolveTemplateStudioDemo({ ...templateDemoInvitation, id: "master-a", assets: [...templateDemoInvitation.assets, { id: "staff-art", type: "IMAGE", url: "/staff.webp" }] }, key);
    assert.equal(changed.id, "master-a");
    assert.equal(changed.eventCategory, category);
    assert.deepEqual(changed.assets.map((row) => row.id), ["staff-art"]);
  });

  test(`${key} renders escaped real names, one opening control, personal address and editable native artwork`, () => {
    const props = { theme: key, names: "Aksa & Mei <script>", date: "18 Juli 2027", focus: "center", stage: "cover", onOpen: () => {} };
    const cover = renderToStaticMarkup(createElement(Scene, { ...props, cover: "/actual-photo.webp" }));
    const envelope = renderToStaticMarkup(createElement(Scene, { ...props, stage: "envelope", recipientLine: "Untuk Rani & Budi" }));
    assert.match(cover, /Aksa &amp; Mei &lt;script&gt;/);
    assert.match(cover, /18 Juli 2027/);
    assert.doesNotMatch(cover, /<img|Buka Undangan|Una|Dara/);
    assert.match(envelope, /data-personal-envelope-address/);
    assert.match(envelope, /Untuk Rani &amp; Budi/);
    assert.equal((envelope.match(/<button/g) || []).length, 1);
    assert.match(envelope, /Buka Undangan/);
    for (const markup of [cover, envelope]) {
      const keys = [...markup.matchAll(/data-studio-native-object="([^"]+)"/g)].map((row) => row[1]);
      assert.equal(new Set(keys).size, keys.length);
      assert.ok(keys.every(isNativeVisualKey));
    }
    assert.equal(nativeVisualCapabilities("object:cover:event-label").typography, true);
    assert.equal(nativeVisualUsesSystemContent("object:cover:event-label"), true);
    const art = renderToStaticMarkup(createElement(artwork.FamilyCelebrationSectionArt, { theme: key, section: "closing" }));
    const target = [...art.matchAll(/data-studio-native-object="([^"]+)"/g)][1][1];
    const transformed = withNativeVisualTransforms(design, { [target]: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, color: "#123456", hidden: true } });
    assert.equal(parseNativeVisualTransforms(transformed)[target].color, "#123456");
    assert.equal(parseNativeVisualTransforms(transformed)[target].hidden, true);
  });

  test(`${key} localizes template copy while preserving family-authored text`, () => {
    const defaults = invitationCopyDefaults(key);
    for (const field of ["greeting", "attendanceRequest", "prayerWish", "closing"]) {
      assert.notEqual(invitationText("EN", defaults[field]), defaults[field]);
    }
    assert.equal(availableEditableCopyFields(key, couple).includes("ourStory"), couple);
    assert.doesNotMatch(Object.values(defaults).join(" "), /Una|Dara|akad|resepsi|mempelai|ulang tahun/i);
    const saved = withEditableCopy(design, { closing: "Pesan keluarga kami" });
    assert.equal(localizedEditableCopy(saved, key, "Pengantar kami", "EN").closing, "Pesan keluarga kami");
    const markup = renderToStaticMarkup(createElement(language.InvitationLanguageProvider, { language: "EN" }, createElement(Scene, {
      theme: key, names: "Our real names", date: "July 18, 2027", stage: "envelope", focus: "center", onOpen: () => {},
    })));
    assert.match(markup, /Open Invitation/);
    assert.doesNotMatch(markup, /Syukur|keluarga|Buka Undangan/);
  });

  test(`${key} keeps contrast on both section surfaces, motion OFF and event-selected music`, () => {
    const palette = invitationPalettes[paletteKey];
    assert.equal(occasionPresentation(key).gallery, couple ? "stack" : "carousel");
    for (const section of ["greeting", "identity", "event", "dateTime", "gallery", "rsvp", "wishes", "gift", "closing"]) {
      const background = occasionSectionBackground(key, section, palette);
      assert.ok(contrastRatio(readableInk(background, palette.ink), background) >= 4.5);
    }
    assert.ok(contrastRatio(readableInk(palette.accent, palette.bg), palette.accent) >= 4.5);
    assert.equal(templateHasDefaultMotion(key), true);
    assert.equal(templateHasDefaultPhotoMotion(key), true);
    const target = couple ? "object:cover:ceremonial-knot-art" : "object:cover:garden-art";
    assert.equal(templateNativeMotionForKey(key, target, { cover: { animation: "none" } }), undefined);
    assert.ok(getInvitationDefaultMusic(key).url);
    assert.equal(resolveInvitationMusic(key, "/my-track.mp3", []), "/my-track.mp3");
  });
}
