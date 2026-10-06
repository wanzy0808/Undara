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
import { getTemplateDemoInvitation, resolveTemplateStudioDemo, templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { nativeVisualCapabilities, nativeVisualUsesSystemContent, isNativeVisualKey, withNativeVisualTransforms, parseNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { templateHasDefaultMotion, templateHasDefaultPhotoMotion, templateNativeMotionForKey, templatePhotoMotion } from "../lib/templates/template-motion.ts";
import { resolveInvitationMusic } from "../lib/templates/music.ts";
import { occasionPresentation, occasionSectionBackground } from "../lib/templates/occasion-presentation.ts";
import * as artwork from "../components/PublicInvitation/AnniversaryArtwork.tsx";
import * as celebrationArtwork from "../components/PublicInvitation/CelebrationArtwork.tsx";
import * as parts from "../components/PublicInvitation/OccasionSceneParts.tsx";
import * as languageContext from "../components/PublicInvitation/InvitationLanguage.tsx";
import { RsvpInputPanel } from "../components/InvitationStudio/RsvpPanels.tsx";
import { defaultInvitationRsvpConfig } from "../lib/templates/rsvp-config.ts";

const scene = loadSource("components/PublicInvitation/AnniversaryScene.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/PublicInvitation/AnniversaryArtwork": artwork,
  "@/components/PublicInvitation/OccasionSceneParts": parts,
  "@/components/PublicInvitation/InvitationLanguage": languageContext,
  "./occasion-themes.css": {},
}).default;

const celebrationScene = loadSource("components/PublicInvitation/CelebrationScene.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "@/components/PublicInvitation/CelebrationArtwork": celebrationArtwork,
  "@/components/PublicInvitation/OccasionSceneParts": parts,
  "@/components/PublicInvitation/InvitationLanguage": languageContext,
  "./occasion-themes.css": {},
}).default;

const themes = [
  ["silver-reverie", "SILVER_WEDDING", "silverReverie", "masonry", true],
  ["golden-keepsake", "GOLDEN_WEDDING", "goldenKeepsake", "stack", true],
  ["little-cloud", "BABY_SHOWER", "littleCloud", "carousel", false],
  ["gathering", "OTHER", "gathering", "masonry", false],
];
for (const [key, category, paletteKey, gallery, couple] of themes) {
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
    const fields = availableEditableCopyFields(key, couple);
    assert.equal(fields.includes("ourStory"), couple);
    assert.equal(fields.includes("zenQuote"), false);
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
    const themeScene = couple ? scene : celebrationScene;
    const props = { theme: key, names: "Raka & Sinta <script>", date: "6 Oktober 2027", focus: "center", stage: "cover", onOpen: () => {} };
    const cover = renderToStaticMarkup(createElement(themeScene, props));
    assert.match(cover, /Raka &amp; Sinta &lt;script&gt;/);
    assert.match(cover, /6 Oktober 2027/);
    assert.equal(nativeVisualCapabilities("object:cover:event-label").typography, true);
    assert.equal(nativeVisualUsesSystemContent("object:cover:event-label"), true);
    assert.doesNotMatch(cover, /<img|Una|Dara|pilih foto|Pilih foto|Atur Foto/);
    const photo = renderToStaticMarkup(createElement(themeScene, { ...props, cover: "/my-event.webp", crop: { x: 17, y: 61, zoom: 1.4 } }));
    if (key === "little-cloud") {
      assert.doesNotMatch(photo, /<img/, "Baby cover is illustrated; the optional photo belongs to Identity");
    } else {
      assert.match(photo, /src="\/my-event.webp"/);
      assert.match(photo, /object-position:17% 61%/);
      assert.match(photo, /scale\(1.4\)/);
      assert.match(photo, /data-invitation-photo-slot="cover"/);
    }
    const envelope = renderToStaticMarkup(createElement(themeScene, { ...props, stage: "envelope", recipientLine: "Untuk Rani & Budi" }));
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
    assert.equal(templatePhotoMotion(key, {}, { cover: { animation: "none" } }).cover?.animation, undefined);
    const markup = renderToStaticMarkup(createElement(couple ? artwork.AnniversarySectionArt : celebrationArtwork.CelebrationSectionArt, { theme: key, section: "closing" }));
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


test("master preview follows every selected/undone theme while preserving its ID and own media", () => {
  const uploaded = { id: "staff-image", type: "IMAGE", url: "/uploaded-own.webp", title: "My own photo" };
  const audio = { id: "staff-audio", type: "AUDIO", url: "/uploaded-audio.mp3", title: "My audio" };
  const current = { ...templateDemoInvitation, id: "template-studio-draft:17", slug: "staff-preview", accessPaid: true, templateKey: "draft-design", assets: [...templateDemoInvitation.assets, uploaded, audio] };
  for (const [key, category] of themes) {
    const resolved = resolveTemplateStudioDemo(current, key);
    assert.equal(resolved.eventCategory, category);
    assert.equal(resolved.id, current.id);
    assert.equal(resolved.slug, current.slug);
    assert.equal(resolved.templateKey, current.templateKey);
    assert.equal(resolved.accessPaid, current.accessPaid);
    assert.ok(resolved.assets.includes(uploaded));
    assert.ok(resolved.assets.includes(audio));
    if (category === "BABY_SHOWER" || category === "OTHER") {
      assert.equal(resolved.brideName, "");
      assert.equal(resolved.assets.length, 2);
      assert.ok(resolved.assets.every((asset) => !asset.url.includes("/couple")));
    }
  }
  const undone = resolveTemplateStudioDemo(resolveTemplateStudioDemo(current, "little-cloud"), "silver-reverie");
  assert.equal(undone.eventCategory, "SILVER_WEDDING");
  assert.equal(undone.groomName, "Una");
  assert.equal(undone.brideName, "Dara");
  assert.ok(undone.assets.includes(uploaded));
  assert.equal(current.eventCategory, "WEDDING");
  assert.equal(templateDemoInvitation.assets.length, 5);
  const studio = readFileSync(new URL("../components/InvitationStudio/InvitationDesigner.tsx", import.meta.url), "utf8");
  assert.match(studio, /invitationState && templateMode && !templateCustomInvitationId/);
  assert.match(studio, /resolveTemplateStudioDemo\(invitationState, design.template\)/);
});

test("non-couple demo fixtures stay neutral and themed scene text is localized", () => {
  for (const [key, category] of themes.filter((item) => !item[4])) {
    const fixture = getTemplateDemoInvitation(key);
    assert.equal(fixture.eventCategory, category);
    assert.equal(fixture.assets.length, 0);
    assert.equal(fixture.brideName, "");
    const markup = renderToStaticMarkup(createElement(languageContext.InvitationLanguageProvider, { language: "EN" },
      createElement(celebrationScene, { theme: key, names: "My own event", date: "October 6, 2027", stage: "cover", focus: "center", onOpen: () => {} })));
    assert.match(markup, /My own event/);
    assert.doesNotMatch(markup.replace(/<[^>]+>/g, " "), /Menyambut|Acara|Gulir|Dara|Una|\b25\b|\b50\b/);
    assert.doesNotMatch(Object.values(invitationCopyDefaults(key)).join(" "), /pernikahan|mempelai|ulang tahun/i);
  }
});


test("occasion form skins bind to the actual shared RSVP controls with a readable attendance input", () => {
  const markup = renderToStaticMarkup(createElement(RsvpInputPanel, {
    preview: true, eventCategory: "BABY_SHOWER", rsvpConfig: defaultInvitationRsvpConfig,
    form: { name: "Rani", phone: "0812345678", status: "ATTENDING", plusOnes: "2", eventChoice: "", customAnswers: {} },
    setForm: () => {}, message: "", submitting: false, onSubmit: () => {},
  }));
  assert.match(markup, /Jumlah yang hadir/);
  // Two additional guests means three people including the recipient.
  assert.match(markup, /aria-label="Jumlah yang hadir"[^>]*value="3"/);
  const controls = [...markup.matchAll(/data-studio-rsvp-element="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(controls.includes("inputs"));
  assert.ok(controls.includes("button"));
  assert.match(markup, /aria-disabled="true"/);
  const css = readFileSync(new URL("../components/PublicInvitation/occasion-themes.css", import.meta.url), "utf8");
  assert.ok(css.includes('[data-studio-rsvp-element="button"]'));
  assert.ok(css.includes('[data-studio-native-object="object:rsvp:form-group"]'));
  assert.doesNotMatch(css, /data-studio-rsvp-element="submit"|transition:\s*all|infinite/);
});
