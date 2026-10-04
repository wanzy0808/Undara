import assert from "node:assert/strict";
import test from "node:test";
import { statSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { invitationTemplates } from "../lib/templates/catalog.ts";
import { parseDesignKey } from "../lib/templates/design.ts";
import { invitationSectionItems } from "../lib/templates/sections.ts";
import { isInvitationSectionAnimation } from "../lib/templates/section-animations.ts";
import { templateHasDefaultMotion, templateNativeMotion, templateNativeMotionForKey, templatePhotoMotion } from "../lib/templates/template-motion.ts";
import { defaultNativeVisualTransform, nativeVisualCanHide, nativeVisualSupportsAnimation, parseNativeVisualTransforms, withNativeVisualTransforms } from "../lib/templates/native-visual-transforms.ts";
import { withEditableCopy } from "../lib/templates/editable-copy.ts";
import { invitationText, localizedEditableCopy } from "../lib/invitations/language.ts";
import { BotanicalIdentity } from "../components/PublicInvitation/BotanicalIvoryArtwork.tsx";
import BotanicalIvoryGallery from "../components/PublicInvitation/BotanicalIvoryGallery.tsx";
import OurStorySection from "../components/PublicInvitation/OurStorySection.tsx";
import { InvitationLanguageProvider } from "../components/PublicInvitation/InvitationLanguage.tsx";

test("Botanical keeps its photo-free identity and accepts saved palette/font choices", () => {
  const theme = invitationTemplates.find((item) => item.key === "botanical-ivory");
  assert.equal(theme.usesPhotos, false);
  assert.deepEqual(theme.photoSlots, []);
  assert.deepEqual(theme.preset, { layout: "botanical", palette: "botanical", font: "rufinaAverage" });
  assert.deepEqual(templatePhotoMotion(theme.key), {});
  const saved = parseDesignKey("botanical-ivory::pearl::cinzelFauna");
  assert.equal(saved.palette, "pearl");
  assert.equal(saved.font, "cinzelFauna");
  assert.equal(invitationSectionItems.length, 15, "Our Story and gallery illustrations create no extra section toggles");
});

test("botanical motion uses real Studio targets and respects section OFF, authored sequences and native OFF", () => {
  assert.equal(templateHasDefaultMotion("botanical-ivory"), true);
  assert.equal(templateHasDefaultMotion("celestial-ink"), true, "Celestial Ink now owns native theme motion");
  const defaults = templateNativeMotion("botanical-ivory");
  for (const [key, motion] of Object.entries(defaults)) {
    assert.ok(nativeVisualSupportsAnimation(key), key);
    assert.ok(isInvitationSectionAnimation(motion.animation), key);
    assert.ok((motion.animationDuration ?? .7) <= .9);
  }
  const key = "object:gallery:specimenTwo-group:gallery-copy";
  assert.equal(nativeVisualCanHide("object:gallery:specimenTwo-group"), true, "The group can be removed visually without deleting its source photos");
  assert.equal(nativeVisualCanHide("object:gallery:specimen-fern-art"), true, "Its illustration remains independently removable");
  assert.equal(templateNativeMotionForKey("botanical-ivory", key).animation, "tilt-in");
  for (const authored of [{ animation: "none" }, { animation: "fade" }, { timeline: "keepsake-sequence" }]) {
    assert.equal(templateNativeMotionForKey("botanical-ivory", key, { gallery: authored }), undefined);
  }
  const stored = withNativeVisualTransforms("botanical-ivory::botanical::rufinaAverage", {
    [key]: { ...defaultNativeVisualTransform, animation: "none", opacity: .45, rotation: 8 },
  });
  assert.equal(parseNativeVisualTransforms(stored)[key].animation, "none");
  assert.equal(parseNativeVisualTransforms(stored)[key].opacity, .45);
  assert.equal(parseNativeVisualTransforms(stored)[key].rotation, 8);
  assert.equal(templateNativeMotionForKey("botanical-ivory", key).animation, "tilt-in", "Reset still has a theme default");
  assert.ok(!Object.keys(defaults).some((key) => /countdown:.*-value/.test(key)), "Changing countdown digits remain still");
});

test("actual botanical derivatives preserve source aspect ratio and transparent alpha within a mobile byte budget", async () => {
  for (const [source, derivative] of [["greenplant.webp", "greenplant.webp"], ["greenplant2.webp", "fern.webp"]]) {
    const original = await sharp(new URL(`../public/templates/botanical-ivory/${source}`, import.meta.url).pathname).metadata();
    const file = sharp(new URL(`../public/templates/botanical-ivory/${derivative}`, import.meta.url).pathname);
    const meta = await file.metadata();
    assert.equal(meta.width, 768);
    assert.equal(meta.height, 1152);
    assert.equal(meta.width / meta.height, original.width / original.height);
    assert.ok(meta.hasAlpha);
    assert.ok(statSync(new URL(`../public/templates/botanical-ivory/${derivative}`, import.meta.url)).size < 300_000, derivative);
    const { data, info } = await file.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const pixel of [0, info.width - 1, (info.height - 1) * info.width, info.width * info.height - 1]) {
      assert.equal(data[pixel * 4 + 3], 0, `${derivative} has a transparent corner`);
    }
    assert.ok((await file.stats()).channels[3].max > 200, "The visible art has not been erased");
  }
});

test("identity renders actual long names/parents and does not fabricate a couple for other events", () => {
  const html = renderToStaticMarkup(React.createElement(BotanicalIdentity, {
    couple: true, first: "Alexandra Maharani", second: "Bima Wiratama", firstParents: "Putri Bapak A & Ibu B", secondParents: "Putra Bapak C & Ibu D", names: "", emptyName: "Nama belum diisi",
  }));
  assert.match(html, /Alexandra Maharani/);
  assert.match(html, /Bima Wiratama/);
  assert.match(html, /Putri Bapak A &amp; Ibu B/);
  assert.doesNotMatch(html, /data-invitation-photo-slot/);
  const single = renderToStaticMarkup(React.createElement(BotanicalIdentity, {
    couple: false, first: "", second: "", firstParents: "", secondParents: "", names: "Perayaan Komunitas", emptyName: "Nama belum diisi",
  }));
  assert.match(single, /Perayaan Komunitas/);
  assert.doesNotMatch(single, /personOne-name|personTwo-name/);
});

test("English keepsake gallery stays romantic and photo-free, while optional Our Story stays customer-owned", () => {
  const inEnglish = (child) => React.createElement(InvitationLanguageProvider, { language: "EN" }, child);
  // tsx's CommonJS interop wraps default TSX exports in this ESM test runner.
  const Gallery = BotanicalIvoryGallery.default ?? BotanicalIvoryGallery;
  const Story = OurStorySection.default ?? OurStorySection;
  const gallery = renderToStaticMarkup(inEnglish(React.createElement(Gallery)));
  for (const key of ["object:gallery:specimenOne-group", "object:gallery:specimenTwo-group"]) {
    assert.ok(gallery.includes(`data-studio-native-object="${key}"`), "The real page owns its default motion target");
  }
  assert.match(gallery, /aria-label="Story Gallery"/);
  assert.match(gallery, /aria-label="Previous Story" disabled/);
  assert.match(gallery, /aria-label="Next Story"/);
  assert.match(gallery, /Two Hearts, One Promise/);
  assert.match(gallery, /One Day, One Forever/);
  assert.doesNotMatch(gallery, /greenplant|fern\.webp|data-invitation-photo-slot/);
  assert.equal(renderToStaticMarkup(React.createElement(Story, { theme: "botanical-ivory" })), "");
  const story = renderToStaticMarkup(inEnglish(React.createElement(Story, { theme: "botanical-ivory", story: "Bertemu di perpustakaan.\nKemudian tumbuh bersama." })));
  assert.match(story, /Bertemu di perpustakaan/);
  assert.doesNotMatch(story, /our-story-kicker|our-story-divider/);
  const copy = localizedEditableCopy("botanical-ivory", "botanical-ivory", null, "EN");
  assert.equal(copy.greeting, "With warm hearts, we invite you to celebrate the day when two stories choose to walk together.");
  assert.equal(invitationText("EN", "Dua hati, satu cerita yang tumbuh pelan menuju selamanya."), "Two hearts, one story gently growing toward forever.");
  const customer = withEditableCopy("botanical-ivory", { greeting: "Teks pribadi kami." });
  assert.equal(localizedEditableCopy(customer, "botanical-ivory", null, "EN").greeting, "Teks pribadi kami.");
});
