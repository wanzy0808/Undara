import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  sanitizeNativeVisualTransforms, parseNativeVisualTransforms,
  withNativeVisualTransforms, nativeVisualStyleSheet, nativeVisualScopeClass, nativeVisualSelector,
  nativeVisualCapabilities, nativeVisualFontFamilies, nativeVisualSupportsAnimation, nativeVisualUsesSystemContent,
  nativeVisualCanHide,
  nativePhotoVisualKey, nativeVisualInstanceId, nativeVisualTransformForKey, defaultNativeVisualTransform,
} from "../lib/templates/native-visual-transforms.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Wishes presentation can be removed while geometry remains scoped and persisted", () => {
  const transforms = {};
  for (const kind of ["input", "button"]) {
    const key = `element:wishes:${kind}:wishes_copy2`;
    transforms[key] = { ...defaultNativeVisualTransform, x: 14, y: -6, scaleX: 1.3, rotation: 8 };
    assert.equal(nativeVisualSelector(key), `[data-section-instance-id="wishes_copy2"] [data-studio-section-element="wishes:${kind}"]`);
    assert.equal(nativeVisualCanHide(key), true);
  }
  assert.deepEqual(parseNativeVisualTransforms(withNativeVisualTransforms("serein", transforms)), transforms);
});

test("cover and partner frame overrides stay independent across duplicated sections", () => {
  const transforms = {};
  for (const [slot, section] of [["cover", "cover"], ["personOne", "identity"], ["personTwo", "identity"]]) {
    for (const [instance, x] of [[section, -16], [`${section}_copy2`, 23]]) {
      const key = nativePhotoVisualKey(slot, "cover", instance);
      transforms[key] = { ...defaultNativeVisualTransform, x, rotation: x };
      assert.equal(nativeVisualInstanceId(key), instance);
      assert.equal(nativeVisualSelector(key), `[data-section-instance-id="${instance}"] [data-invitation-section="${section}"] [data-invitation-photo-slot="${slot}"]`);
    }
  }
  const design = withNativeVisualTransforms("serein", transforms);
  assert.deepEqual(parseNativeVisualTransforms(design), transforms);
  assert.match(nativeVisualStyleSheet(design), /data-section-instance-id="identity_copy2"/);
  assert.equal(nativePhotoVisualKey("cover", "envelope", "envelope"), "photo:envelope:cover");
  assert.equal(nativeVisualInstanceId("photo:envelope:cover"), null);
  assert.equal(nativePhotoVisualKey("gallery", "cover"), null);
  assert.equal(nativePhotoVisualKey("personOne", "cover", 'bad"]{color:red}'), null);
});

test("native controls inherit legacy base overrides and scoped identity transforms can reset geometry", () => {
  const base = { ...defaultNativeVisualTransform, x: 18, scaleX: 1.4, opacity: 0.6 };
  const transforms = {
    "photo:personOne": base,
    "photo:personOne:identity_copy2": { ...defaultNativeVisualTransform },
  };
  const persisted = parseNativeVisualTransforms(withNativeVisualTransforms("serein", transforms));
  assert.deepEqual(persisted, transforms);
  assert.deepEqual(nativeVisualTransformForKey(persisted, "photo:personOne:identity"), base);
  assert.deepEqual(nativeVisualTransformForKey(persisted, "photo:personOne:identity_copy2"), { ...defaultNativeVisualTransform, opacity: 0.6 });
  assert.equal(nativeVisualTransformForKey({}, "photo:personOne:identity"), undefined);
  assert.equal(nativeVisualInstanceId('photo:personOne:bad"]'), null);
});

test("built-in transforms round-trip without changing invitation data", () => {
  const base = "botanical-ivory::pearl::cinzelFauna";
  const transform = { x: 25, y: -10, scaleX: 1.4, scaleY: 0.8, rotation: 32 };
  const key = withNativeVisualTransforms(base, {
    "copy:greeting": transform,
    "heading:envelope": { ...transform, rotation: -15 },
  });
  assert.deepEqual(parseNativeVisualTransforms(key)["copy:greeting"], transform);
  assert.equal(withNativeVisualTransforms(key, {}), base);
  assert.equal(key.split("::").filter((part) => part.startsWith("nativeVisuals=")).length, 1);
  assert.match(nativeVisualStyleSheet(key), /translate:25% -10%;rotate:32deg;scale:1.4 0.8/);
  assert.match(nativeVisualStyleSheet(key), new RegExp(nativeVisualScopeClass(key)));
});

test("built-in transform codec rejects arbitrary CSS keys and bounds geometry", () => {
  const values = sanitizeNativeVisualTransforms({
    "copy:greeting": { x: 9000, y: -9000, scaleX: 99, scaleY: 0, rotation: 500 },
    "copy:greeting\"}{color:red}": { x: 10, y: 10, scaleX: 1, scaleY: 1, rotation: 0 },
    "element:gift:button": { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  });
  assert.deepEqual(values, {
    "copy:greeting": { x: 2000, y: -2000, scaleX: 3, scaleY: 0.25, rotation: 180 },
  });
  assert.doesNotMatch(nativeVisualStyleSheet(withNativeVisualTransforms("rose", values)), /color:red/);
  assert.deepEqual(parseNativeVisualTransforms("rose::nativeVisuals=%BAD"), {});
});

test("Studio and public renderers share the built-in transform contract", () => {
  const designer = read("components/InvitationStudio/InvitationDesigner.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const handles = read("components/InvitationStudio/StudioNativeTransformHandles.tsx");
  assert.match(designer, /<StudioNativeTransformHandles/);
  assert.match(designer, /change\(\{ nativeVisuals: next \}\)/);
  for (const renderer of [universal, rose]) {
    assert.match(renderer, /nativeVisualScopeClass\(activeDesignKey\)/);
    assert.match(renderer, /nativeVisualStyleSheet\(activeDesignKey\)/);
  }
  assert.match(handles, /onPointerDown=\{\(event\) => begin\(event, "rotate"\)\}/);
  assert.match(handles, /onPointerDown=\{\(event\) => begin\(event, handle\)\}/);
  assert.match(handles, /canvas\.scrollTop \+= 14/);
  assert.match(handles, /canvas\.scrollLeft \+= 14/);
  assert.match(handles, /drag\.scrollTop/);
  assert.match(handles, /-2000, 2000/);
  assert.doesNotMatch(handles, /-150, 150/);
  assert.match(handles, /nativeVisualUsesSystemContent\(targetKey\)/);
  assert.match(handles, /undara-studio-native-content-lock/);
});


test("envelope and content photo transforms have separate targets", () => {
  assert.equal(nativeVisualSelector("photo:envelope:cover"),
    '[data-invitation-section="envelope"] [data-invitation-photo-slot="cover"]');
  assert.equal(nativeVisualSelector("photo:cover"),
    '[data-invitation-section="cover"] [data-invitation-photo-slot="cover"]');
  assert.equal(nativeVisualSelector("heading:cover"),
    '[data-invitation-section="cover"] [data-studio-native-heading]');
  assert.equal(nativeVisualSelector("script:arbitrary"), null);
});


test("partner frames keep independent saved transforms on the shared identity renderer", () => {
  const first = { x: -16, y: 7, scaleX: 1.2, scaleY: 0.9, rotation: 8 };
  const second = { x: 23, y: -5, scaleX: 0.8, scaleY: 1.1, rotation: -12 };
  const key = withNativeVisualTransforms("garden-light", { "photo:personOne": first, "photo:personTwo": second });
  assert.deepEqual(parseNativeVisualTransforms(key), { "photo:personOne": first, "photo:personTwo": second });
  for (const slot of ["personOne", "personTwo"]) {
    assert.equal(nativeVisualSelector(`photo:${slot}`), `[data-invitation-section="identity"] [data-invitation-photo-slot="${slot}"]`);
  }
  const css = nativeVisualStyleSheet(key);
  assert.match(css, /photo-slot="personOne"\]\{translate:-16% 7%;rotate:8deg;scale:1\.2 0\.9/);
  assert.match(css, /photo-slot="personTwo"\]\{translate:23% -5%;rotate:-12deg;scale:0\.8 1\.1/);
});

test("gallery visuals are keyed by one safe photo ID", () => {
  assert.equal(nativeVisualSelector("photo:gallery:photo_123"),
    '[data-invitation-photo-slot="gallery"][data-studio-photo-id="photo_123"]');
  assert.equal(nativeVisualSelector('photo:gallery:x"]{color:red}'), null);
  assert.equal(nativeVisualSelector("photo:gallery:photo_123:gallery_copy2"),
    '[data-section-instance-id="gallery_copy2"] [data-invitation-photo-slot="gallery"][data-studio-photo-id="photo_123"]');
  const design = withNativeVisualTransforms("botanical-ivory", {
    "photo:gallery:photo_123": { x: 8, y: 4, scaleX: 1.2, scaleY: 1, rotation: 3 },
  });
  assert.equal(parseNativeVisualTransforms(design)["photo:gallery:photo_123"].x, 8);
  assert.match(read("components/PublicInvitation/UniversalInvitationTemplate.tsx"), /data-studio-photo-id=\{asset\.id\}/);
  assert.match(read("components/PublicInvitation/RomanticRoseTemplate.tsx"), /data-studio-photo-id=\{photo\.id\}/);
});


test("protected link and gift buttons remain inert in Studio preview", () => {
  for (const path of [
    "components/PublicInvitation/UniversalInvitationTemplate.tsx",
    "components/PublicInvitation/RomanticRoseTemplate.tsx",
  ]) {
    const renderer = read(path);
    assert.match(renderer, /onClick=\{preview \? \(event\) => event\.preventDefault\(\) : undefined\}/);
    assert.match(renderer, /if \(preview/);
  }
});


test("context inspector edits native transforms without replacing copy or component settings", () => {
  const selection = read("components/InvitationStudio/StudioSelectionInspector.tsx");
  const inspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  assert.match(selection, /undara-studio-selection-stack/);
  assert.match(selection, /\{nativeControls\}/);
  assert.match(inspector, /scaleX/);
  assert.match(inspector, /scaleY/);
  assert.match(inspector, /rotation/);
  assert.match(inspector, /onChange\(defaultNativeVisualTransform\)/);
});


test("duplicated sections can move one heading or copy without moving its sibling", () => {
  assert.equal(nativeVisualSelector("heading:identity:identity_copy2"),
    '[data-section-instance-id="identity_copy2"] [data-invitation-section="identity"] [data-studio-native-heading]');
  assert.equal(nativeVisualSelector("copy:greeting:greeting_copy2"),
    '[data-section-instance-id="greeting_copy2"] [data-studio-copy-field="greeting"]');
  assert.equal(nativeVisualSelector("element:gift:button:gift_copy2"),
    '[data-section-instance-id="gift_copy2"] [data-studio-section-element="gift:button"]');
  assert.equal(nativeVisualSelector('copy:greeting:x"]{color:red}'), null);
  const key = withNativeVisualTransforms("botanical-ivory", {
    "copy:greeting:greeting_copy2": { x: 14, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  });
  assert.equal(parseNativeVisualTransforms(key)["copy:greeting:greeting_copy2"].x, 14);
  assert.match(read("components/InvitationStudio/studio-canvas-selection.ts"), /instanceId/);
});


test("template-authored native objects use safe selectors and section-instance scope", () => {
  assert.equal(nativeVisualSelector("object:cover:flower-left"),
    '[data-studio-native-object="object:cover:flower-left"]');
  assert.equal(nativeVisualSelector("object:identity:theme-art:identity_copy2"),
    '[data-section-instance-id="identity_copy2"] [data-studio-native-object="object:identity:theme-art"]');
  assert.equal(nativeVisualSelector('object:cover:x"]{color:red}'), null);
  assert.match(read("components/InvitationStudio/studio-canvas-selection.ts"), /data-studio-native-object/);
});

test("theme-authored decorations and special cover headings are selectable in Studio", () => {
  const themeScenes = read("components/PublicInvitation/InvitationThemeScenes.tsx") + read("components/PublicInvitation/EternalBlossomScene.tsx");
  const pencil = read("components/PublicInvitation/PencilReverieScene.tsx");
  const zen = read("components/PublicInvitation/ZenAtelierScene.tsx");
  const pencilArt = read("components/PublicInvitation/PencilReverieArtwork.tsx");
  const zenArt = read("components/PublicInvitation/ZenAtelierArtwork.tsx");
  assert.match(themeScenes, /object:cover:flower-left/);
  assert.match(themeScenes, /object:envelope:open-button/);
  assert.match(pencil, /data-studio-native-heading/);
  assert.match(pencil, /object:cover:main-art/);
  assert.match(pencil, /object:envelope:copy-panel/);
  assert.match(pencil, /object:cover:copy-panel/);
  assert.match(zen, /data-studio-native-heading/);
  assert.match(zen, /object:envelope:mizuhiki/);
  assert.match(zen, /object:envelope:paper-stage/);
  assert.match(zen, /object:envelope:letter/);
  assert.match(pencilArt, /object:\$\{section\}:theme-art/);
  assert.match(zenArt, /object:\$\{section\}:theme-art/);
  assert.match(zenArt, /object:gallery:memory-room/);
  assert.match(zenArt, /object:gallery:memory-gradient/);
  assert.match(zenArt, /object:gallery:memory-cup/);
  assert.match(zenArt, /object:gallery:memory-frame/);
});


test("complex template compositions expose selectable group targets without replacing child targets", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const pencil = read("components/PublicInvitation/PencilReverieScene.tsx");
  const zen = read("components/PublicInvitation/ZenAtelierScene.tsx");

  assert.match(pencil, /object:envelope:illustration-group/);
  assert.match(pencil, /object:cover:illustration-group/);
  assert.match(zen, /object:envelope:atmosphere-group/);
  assert.match(zen, /object:envelope:intro-group/);
  assert.match(zen, /object:cover:copy-group/);
  assert.match(scenes, /object:envelope:card-stage/);
  assert.match(scenes, /object:envelope:copy-panel/);
  assert.match(scenes, /object:cover:media-group/);
  assert.match(scenes, /object:cover:copy-panel/);
  assert.equal(nativeVisualUsesSystemContent("object:cover:copy-group"), false);
});

test("Classic Pearl keeps heirloom artwork granular while protected event content stays protected", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const classic = read("components/PublicInvitation/ClassicPearlScene.tsx");
  const artwork = read("components/PublicInvitation/ClassicPearlArtwork.tsx");
  assert.match(scenes, /ClassicPearlScene/);
  assert.match(classic, /object:envelope:garland-art/);
  assert.match(classic, /object:envelope:candelabra-art/);
  assert.match(classic, /object:cover:ledger-line/);
  assert.match(classic, /object:cover:chandelier-art/);
  assert.match(classic, /object:cover:arch-art/);
  assert.match(classic, /object:cover:garland-art/);
  assert.match(classic, /object:cover:tiara-art/);
  assert.match(classic, /object:cover:copy-panel/);
  assert.match(classic, /object:cover:pearl-trail/);
  assert.match(classic, /object:cover:date/);
  assert.match(artwork, /object:identity:mirror-art/);
  assert.match(artwork, /object:identity:tiara-art/);
  assert.equal(nativeVisualCanHide("object:cover:ledger-line"), true);
  assert.equal(nativeVisualCanHide("object:cover:arch-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:chandelier-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:garland-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:tiara-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:pearl-trail"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
});

test("Golden Art Deco poster artwork stays granular while protected event content remains protected", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const golden = read("components/PublicInvitation/GoldenArtDecoScene.tsx");
  const artwork = read("components/PublicInvitation/GoldenArtDecoArtwork.tsx");
  assert.match(scenes, /GoldenArtDecoScene/);
  assert.match(golden, /object:envelope:rail-left/);
  assert.match(golden, /object:envelope:rail-right/);
  assert.match(golden, /object:envelope:ticket-stage/);
  assert.match(golden, /object:envelope:fan-art/);
  assert.match(golden, /object:cover:rail/);
  assert.match(golden, /object:cover:steps/);
  assert.match(golden, /object:cover:fan-art/);
  assert.match(golden, /object:cover:garland-art/);
  assert.match(golden, /object:cover:arch-art/);
  assert.match(golden, /object:cover:champagne-art/);
  assert.match(golden, /object:cover:copy-panel/);
  assert.match(golden, /object:cover:date/);
  assert.match(artwork, /object:identity:mirror-art/);
  assert.match(artwork, /object:identity:chaise-art/);
  assert.match(artwork, /object:identity:fan-art/);
  assert.equal(nativeVisualCanHide("object:cover:rail"), true);
  assert.equal(nativeVisualCanHide("object:cover:steps"), true);
  assert.equal(nativeVisualCanHide("object:cover:fan-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:arch-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:champagne-art"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
});

test("Paper Cut Botanical card composition is movable without swallowing its cutout layers", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const paper = scenes.split('if (theme === "paper-cut-botanical") return <section')[1]
    ?.split('if (theme === "celestial-ink") return <section')[0];
  assert.ok(paper, "Paper Cut Botanical cover branch must exist");
  for (const object of [
    "paper-left", "paper-right", "leaf-left", "leaf-right", "content-group",
    "kicker", "card", "sun", "subtitle", "date", "ornament",
  ]) assert.ok(paper.includes(`object:cover:${object}`), `missing Paper Cut Botanical ${object}`);
  assert.match(paper, /<Names[^>]*>\{names\}<\/Names>/);
  assert.doesNotMatch(paper, /object:cover:art-group/);
  assert.equal(nativeVisualCanHide("object:cover:paper-left"), true);
  assert.equal(nativeVisualCanHide("object:cover:leaf-right"), true);
  assert.equal(nativeVisualCanHide("object:cover:content-group"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:date"), true);
});

test("shared built-in display nodes expose Studio native-object markers without replacing business data", () => {
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  for (const renderer of [universal, rose]) {
    assert.match(renderer, /object:dateTime:panel/);
    assert.match(renderer, /object:location:venue/);
    assert.match(renderer, /object:gift:account-number/);
    assert.match(renderer, /object:closing:names/);
    assert.match(renderer, /object:footer:rule/);
    assert.match(renderer, /data-studio-section-element="location:button"/);
    assert.match(renderer, /data-studio-section-element="gift:button"/);
  }
  assert.match(universal, /object:\$\{keyName\}:divider/);
  assert.match(rose, /object:envelope:top-fold/);
  assert.match(rose, /section="rsvp"/);
});


test("generic theme envelope and cover artwork expose transform targets for visual parts", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  for (const marker of [
    "object:envelope:frame-border",
    "object:envelope:card",
    "object:envelope:flap",
    "object:envelope:seal",
    "object:envelope:letter-kicker",
    "object:envelope:date",
    "object:cover:photo-frame",
    "object:cover:kicker",
    "object:cover:date",
    "object:cover:starfield",
    "object:cover:card",
  ]) assert.ok(scenes.includes(marker), `missing Studio marker ${marker}`);
  assert.ok(!scenes.includes("<BotanicalSprig /><BotanicalSprig mirrored />"));
  assert.ok(!scenes.includes('<Lines className="mt-9" />'));
});

test("Zen envelope seal participates in native visual transforms", () => {
  const zen = read("components/PublicInvitation/ZenAtelierScene.tsx");
  assert.match(zen, /zen-jp-seal" lang="ja" data-studio-native-object="object:envelope:seal"/);
});


test("template-authored supporting visuals remain directly selectable without section wrappers stealing the click", () => {
  const story = read("components/PublicInvitation/OurStorySection.tsx");
  const zenGallery = read("components/PublicInvitation/ZenAtelierGallery.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const instance = read("components/PublicInvitation/EditableSectionInstance.tsx");

  assert.match(story, /object:identity:our-story-kicker/);
  assert.match(story, /object:identity:our-story-heading/);
  assert.match(story, /object:identity:our-story-divider/);
  assert.match(zenGallery, /data-studio-photo-id=\{photo\.id\}/);
  assert.match(zenGallery, /if \(preview\) \{ event\.preventDefault\(\); return; \}/);
  assert.match(zenGallery, /!preview && <dialog/);
  assert.match(zenGallery, /object:gallery:quote/);
  const pencilGallery = read("components/PublicInvitation/PencilReverieArtwork.tsx");
  assert.match(pencilGallery, /object:gallery:memory-\$\{i \+ 1\}/);
  assert.match(pencilGallery, /if \(preview\) \{ e\.preventDefault\(\); return; \}/);
  assert.match(pencilGallery, /!preview && index!==null/);
  assert.match(rose, /object:envelope:letter-card/);
  assert.match(rose, /object:envelope:card-stack/);
  assert.match(rose, /object:envelope:address/);
  assert.match(rose, /object:cover:background-photo/);
  assert.match(rose, /object:cover:gradient-overlay/);
  assert.match(rose, /object:cover:content-group/);
  assert.match(rose, /object:identity:personOne-group/);
  assert.match(rose, /object:identity:personTwo-group/);
  assert.match(rose, /object:\$\{section\}:heading-group/);
  assert.match(universal, /object:gallery:memory-panel/);
  assert.match(universal, /object:gallery:memory-symbols/);
  assert.match(universal, /object:\$\{keyName\}:heading-group/);
  assert.match(universal, /object:identity:\$\{slot\}-group/);
  assert.match(universal, /object:identity:\$\{slot\}-symbol/);
  assert.match(instance, /\[data-studio-native-object\]/);
  assert.match(instance, /\[data-studio-native-heading\]/);
  assert.match(instance, /\[data-invitation-photo-slot\]/);
  const selection = read("components/InvitationStudio/studio-canvas-selection.ts");
  assert.match(selection, /studioObjectSections\.includes\(sectionName\)/);
});



test("protected fallback messages are selectable visual objects without becoming editable content", () => {
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  for (const renderer of [universal, rose]) {
    assert.match(renderer, /object:gallery:empty-copy/);
    assert.match(renderer, /object:countdown:empty-copy/);
    assert.match(renderer, /object:gift:empty-copy/);
  }
  assert.match(universal, /object:location:empty-copy/);
});

test("shared section internals expose group and child targets without unlocking business values", () => {
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

  for (const renderer of [universal, rose]) {
    assert.match(renderer, /object:gallery:grid/);
    assert.match(renderer, /object:countdown:grid/);
    assert.match(renderer, /object:countdown:\$\{label\.toLowerCase\(\)\}-value/);
    assert.match(renderer, /object:countdown:\$\{label\.toLowerCase\(\)\}-label/);
    assert.match(renderer, /object:location:details-group/);
  }
  assert.match(universal, /object:event:details-group/);
  assert.match(universal, /object:closing:copy-group/);
  assert.match(rose, /object:identity:couple-group/);
  assert.equal(nativeVisualCapabilities("object:countdown:hari-value").typography, true);
  assert.equal(nativeVisualCapabilities("object:countdown:hari-label").typography, true);
  assert.equal(nativeVisualUsesSystemContent("object:countdown:hari-value"), true);
  assert.equal(nativeVisualUsesSystemContent("object:countdown:hari-label"), false);
});

test("protected RSVP and Wishes forms expose whole-block visual targets while internals keep semantic controls", () => {
  const rsvp = read("components/InvitationStudio/RsvpForm.tsx");
  const rsvpPanels = read("components/InvitationStudio/RsvpPanels.tsx");
  const wishes = read("components/PublicInvitation/GuestWishes.tsx");

  assert.match(rsvp, /object:rsvp:form-group/);
  assert.match(rsvpPanels, /data-studio-rsvp-element="inputs"/);
  assert.match(rsvpPanels, /data-studio-rsvp-element="button"/);
  assert.match(wishes, /object:wishes:form-group/);
  assert.match(wishes, /data-studio-section-element="wishes:input"/);
  assert.match(wishes, /data-studio-section-element="wishes:button"/);
  assert.equal(nativeVisualCapabilities("object:rsvp:form-group").typography, false);
  assert.equal(nativeVisualCapabilities("object:wishes:form-group").typography, false);
});

test("native artwork and data presentation can be removed per invitation", () => {
  assert.equal(nativeVisualCanHide("object:cover:flower-left"), true);
  assert.equal(nativeVisualCanHide("object:envelope:seal"), true);
  assert.equal(nativeVisualCanHide("object:event:venue"), true);
  assert.equal(nativeVisualCanHide("heading:cover"), true);
  assert.equal(nativeVisualCanHide("element:gift:button"), true);

  const values = sanitizeNativeVisualTransforms({
    "object:cover:flower-left": { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, hidden: true },
    "object:event:venue": { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, hidden: true },
  });
  assert.equal(values["object:cover:flower-left"]?.hidden, true);
  assert.equal(values["object:event:venue"]?.hidden, true);
  const css = nativeVisualStyleSheet(withNativeVisualTransforms("botanical-ivory", values));
  assert.match(css, /display:none/);
});

test("native visual styling stays inside the validated nativeVisuals contract", () => {
  const values = sanitizeNativeVisualTransforms({
    "object:cover:kicker": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      opacity: 9,
      color: "#ABCDEF",
      background: "red",
      borderColor: "#123456",
      fontSize: 999,
      fontWeight: 557,
      textAlign: "justify",
      letterSpacing: 99,
      lineHeight: 0,
    },
  });
  assert.deepEqual(values["object:cover:kicker"], {
    x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
    opacity: 1,
    color: "#abcdef",
    borderColor: "#123456",
    fontSize: 160,
    fontWeight: 600,
    letterSpacing: 20,
    lineHeight: 0.7,
  });
  const css = nativeVisualStyleSheet(withNativeVisualTransforms("botanical-ivory", values));
  assert.match(css, /opacity:1/);
  assert.match(css, /color:#abcdef/);
  assert.match(css, /border-color:#123456/);
  assert.match(css, /font-size:160px/);
  assert.doesNotMatch(css, /background-color:red|text-align:justify/);
});

test("native visual capabilities avoid duplicating protected component styling", () => {
  assert.deepEqual(nativeVisualCapabilities("heading:cover"), { opacity: true, colors: true, typography: true });
  assert.deepEqual(nativeVisualCapabilities("copy:greeting"), { opacity: true, colors: true, typography: true });
  assert.deepEqual(nativeVisualCapabilities("object:location:venue"), { opacity: true, colors: true, typography: true });
  assert.deepEqual(nativeVisualCapabilities("object:identity:our-story-heading"), { opacity: true, colors: true, typography: true });
  assert.deepEqual(nativeVisualCapabilities("object:envelope:open-button"), { opacity: true, colors: true, typography: true });
  assert.deepEqual(nativeVisualCapabilities("object:cover:flower-left"), { opacity: true, colors: true, typography: false });
  assert.deepEqual(nativeVisualCapabilities("photo:cover"), { opacity: true, colors: false, typography: false });
  assert.deepEqual(nativeVisualCapabilities("element:gift:button"), { opacity: false, colors: false, typography: false });
  assert.deepEqual(nativeVisualCapabilities("rsvp:button"), { opacity: false, colors: false, typography: false });
});

test("system-backed invitation content stays content-locked while native styling remains available", () => {
  assert.equal(nativeVisualUsesSystemContent("object:event:venue"), true);
  assert.equal(nativeVisualUsesSystemContent("object:envelope:address"), true);
  assert.equal(nativeVisualUsesSystemContent("object:gift:account-number"), true);
  assert.equal(nativeVisualUsesSystemContent("object:countdown:hari"), true);
  assert.equal(nativeVisualUsesSystemContent("object:gift:empty-copy"), true);
  assert.equal(nativeVisualUsesSystemContent("heading:cover"), true);
  assert.equal(nativeVisualUsesSystemContent("object:cover:flower-left"), false);
  assert.equal(nativeVisualUsesSystemContent("object:cover:kicker"), false);

  const inspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  const selection = read("components/InvitationStudio/studio-canvas-selection.ts");
  assert.match(inspector, /nativeVisualUsesSystemContent/);
  assert.match(inspector, /Isi dari data acara/);
  assert.match(selection, /\[data-studio-native-heading\]/);
  assert.match(selection, /\[data-invitation-photo-slot\]/);
  assert.match(selection, /\[data-studio-native-object\]/);
});

test("native inspector exposes visual styling without adding functional controls", () => {
  const inspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  assert.match(inspector, /nativeVisualCapabilities/);
  assert.match(inspector, /current\.opacity/);
  assert.match(inspector, /current\.fontSize/);
  assert.match(inspector, /current\.fontWeight/);
  assert.match(inspector, /current\.textAlign/);
  assert.match(inspector, /current\.letterSpacing/);
  assert.match(inspector, /current\.lineHeight/);
  assert.doesNotMatch(inspector, /href|endpoint|required|capacity/i);
});


test("native font overrides use the invitation font catalog and load in public renderers", () => {
  const clean = sanitizeNativeVisualTransforms({
    "object:cover:kicker": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      fontFamily: "Playfair Display",
    },
    "object:cover:date": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      fontFamily: "Arial; color:red",
    },
  });
  assert.equal(clean["object:cover:kicker"].fontFamily, "Playfair Display");
  assert.equal(clean["object:cover:date"], undefined);
  const design = withNativeVisualTransforms("botanical-ivory", clean);
  assert.deepEqual(nativeVisualFontFamilies(design), ["Playfair Display"]);
  assert.match(nativeVisualStyleSheet(design), /font-family:"Playfair Display"/);
  assert.doesNotMatch(nativeVisualStyleSheet(design), /Arial|color:red/);

  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const inspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  assert.match(universal, /nativeVisualFontFamilies\(activeDesignKey\)/);
  assert.match(rose, /nativeVisualFontFamilies\(activeDesignKey\)/);
  assert.match(rose, /<InvitationFonts families=\{nativeVisualFontFamilies\(activeDesignKey\)\} \/>/);
  assert.match(inspector, /nativeFontFamilies/);
  assert.match(inspector, /current\.fontFamily/);
  assert.match(inspector, /<InvitationFonts families=\{current\.fontFamily/);
});


test("native objects reuse the shared entrance animation catalog safely", () => {
  const values = sanitizeNativeVisualTransforms({
    "object:cover:kicker": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      animation: "rise", animationDuration: 9, animationDelay: -2,
    },
    "heading:identity": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      animation: "silk-reveal", animationDuration: 1.1, animationDelay: 0.2,
    },
    "copy:greeting": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      animation: "zoom",
    },
    "photo:cover": {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      animation: "fade",
    },
  });
  assert.equal(values["object:cover:kicker"].animation, "rise");
  assert.equal(values["object:cover:kicker"].animationDuration, 2.5);
  assert.equal(values["object:cover:kicker"].animationDelay, 0);
  assert.equal(values["heading:identity"].animation, "silk-reveal");
  assert.equal(values["copy:greeting"], undefined);
  assert.equal(values["photo:cover"], undefined);
  assert.equal(nativeVisualSupportsAnimation("object:cover:kicker"), true);
  assert.equal(nativeVisualSupportsAnimation("heading:identity"), true);
  assert.equal(nativeVisualSupportsAnimation("element:gift:button"), true);
  assert.equal(nativeVisualSupportsAnimation("rsvp:button"), true);
  assert.equal(nativeVisualSupportsAnimation("copy:greeting"), false);
  assert.equal(nativeVisualSupportsAnimation("photo:cover"), false);
});

test("native animation runtime uses validated selectors and shared reduced-motion-aware entrances", () => {
  const hook = read("components/PublicInvitation/use-native-visual-animations.ts");
  const runtime = read("components/PublicInvitation/entrance-animation-runtime.ts");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const inspector = read("components/InvitationStudio/StudioNativeVisualInspector.tsx");
  assert.match(hook, /parseNativeVisualTransforms\(designKey\)/);
  assert.match(hook, /nativeVisualSelector\(key\)/);
  assert.match(hook, /nativeVisualSupportsAnimation\(key\)/);
  assert.match(hook, /observeInvitationEntranceRoot\(root, collect/);
  assert.match(hook, /finalOpacity: config\.opacity/);
  assert.match(runtime, /finalOpacity\?: number/);
  assert.match(runtime, /frame\.opacity \* finalOpacity/);
  assert.match(universal, /useInvitationNativeVisualAnimations\(rootRef, activeDesignKey, String\(opened\), templateHasDefaultMotion\(key\)/);
  assert.match(rose, /useInvitationNativeVisualAnimations\(rootRef, activeDesignKey, String\(opened\), \{ template: "romantic-rose", sectionStyles \}\)/);
  assert.match(inspector, /sectionAnimationGroups/);
  assert.match(inspector, /sectionAnimationPresets/);
  assert.match(inspector, /Preview animasi/);
  assert.match(inspector, /animationDuration/);
  assert.match(inspector, /animationDelay/);
});


test("theme scene cover branches do not keep unreachable envelope controls", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  assert.doesNotMatch(scenes, /const isEnvelope = false/);
  assert.match(scenes, /if \(stage === "envelope"\) return <ThemeEnvelope/);
  assert.match(scenes, /object:envelope:open-button/);
  assert.doesNotMatch(scenes, /object:cover:open-button/);
});

test("Botanical Ivory keeps its leaf ornament directly editable while shared groups stay selectable", () => {
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const artwork = read("components/PublicInvitation/BotanicalIvoryArtwork.tsx");
  assert.match(universal, /botanical && <BotanicalSectionArt section=\{keyName\}/);
  assert.match(artwork, /object:\$\{section\}:theme-leaf/);
  assert.match(artwork, /data-studio-native-object=\{objectKey\}/);
  assert.equal(nativeVisualCanHide("object:greeting:theme-leaf"), true);
  assert.equal(nativeVisualCapabilities("object:greeting:heading-group").typography, false);
  assert.equal(nativeVisualCapabilities("object:identity:personOne-group").typography, false);
});

test("Eternal Blossom envelope and cover keep granular Studio targets", () => {
  const scenes = read("components/PublicInvitation/EternalBlossomScene.tsx");
  assert.match(scenes, /object:envelope:flower/);
  assert.match(scenes, /object:envelope:address/);
  assert.match(scenes, /object:cover:flower-left/);
  assert.match(scenes, /object:cover:flower-right/);
  assert.match(scenes, /object:cover:photo-frame/);
  assert.match(scenes, /object:cover:photo-window/);
  assert.match(scenes, /object:cover:ornament/);
  assert.equal(nativeVisualCanHide("object:cover:flower-left"), true);
  assert.equal(nativeVisualCanHide("object:cover:flower-right"), true);
  assert.equal(nativeVisualUsesSystemContent("object:envelope:address"), true);
});

test("Modern Maroon decorative blocks and monogram can be hidden without unlocking content", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  assert.match(scenes, /object:cover:block-left/);
  assert.match(scenes, /object:cover:block-right/);
  assert.match(scenes, /object:cover:monogram/);
  assert.match(scenes, /object:cover:media-group/);
  assert.match(scenes, /object:cover:copy-panel/);
  assert.equal(nativeVisualCanHide("object:cover:block-left"), true);
  assert.equal(nativeVisualCanHide("object:cover:block-right"), true);
  assert.equal(nativeVisualCanHide("object:cover:monogram"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
});

test("Garden Light keeps its illuminated props granular while photo content stays protected", () => {
  const garden = read("components/PublicInvitation/GardenLightScene.tsx");
  assert.match(garden, /object:envelope:hanging-lantern-art/);
  assert.match(garden, /object:envelope:birdcage-art/);
  assert.match(garden, /object:envelope:fireflies/);
  assert.match(garden, /object:cover:fireflies/);
  assert.match(garden, /object:cover:arch-art/);
  assert.match(garden, /object:cover:garland-art/);
  assert.match(garden, /object:cover:lantern-art/);
  assert.match(garden, /object:cover:photo-frame/);
  assert.match(garden, /data-invitation-photo-slot="cover"/);
  assert.equal(nativeVisualCanHide("object:cover:fireflies"), true);
  assert.equal(nativeVisualCanHide("object:cover:arch-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:garland-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:lantern-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
});

test("Midnight Romance keeps night-salon artwork granular while photo content stays protected", () => {
  const midnight = read("components/PublicInvitation/MidnightRomanceScene.tsx");
  assert.match(midnight, /object:envelope:night-glow/);
  assert.match(midnight, /object:envelope:chandelier-art/);
  assert.match(midnight, /object:envelope:lantern-art/);
  assert.match(midnight, /object:cover:night-glow/);
  assert.match(midnight, /object:cover:arch-art/);
  assert.match(midnight, /object:cover:chandelier-art/);
  assert.match(midnight, /object:cover:garland-art/);
  assert.match(midnight, /object:cover:photo-frame/);
  assert.match(midnight, /data-invitation-photo-slot="cover"/);
  assert.equal(nativeVisualCanHide("object:cover:night-glow"), true);
  assert.equal(nativeVisualCanHide("object:cover:arch-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:chandelier-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:garland-art"), true);
  assert.equal(nativeVisualCanHide("object:cover:date"), true);
});

test("Pencil Reverie keeps protected recipient data and authored cover groups editable", () => {
  const pencil = read("components/PublicInvitation/PencilReverieScene.tsx");
  assert.match(pencil, /object:envelope:address/);
  assert.match(pencil, /object:cover:heading-group/);
  assert.match(pencil, /object:cover:illustration-group/);
  assert.match(pencil, /object:cover:copy-panel/);
  assert.match(pencil, /object:cover:heart/);
  assert.equal(nativeVisualUsesSystemContent("object:envelope:address"), true);
  assert.equal(nativeVisualCanHide("object:cover:heart"), true);
  assert.equal(nativeVisualCanHide("object:cover:illustration-group"), true);
});

test("Zen Atelier keeps protected recipient data and Japanese decorations independently removable", () => {
  const zen = read("components/PublicInvitation/ZenAtelierScene.tsx");
  assert.match(zen, /object:envelope:address/);
  assert.match(zen, /object:envelope:shoji/);
  assert.match(zen, /object:envelope:mizuhiki/);
  assert.match(zen, /object:cover:blossom/);
  assert.match(zen, /object:cover:mountains/);
  assert.equal(nativeVisualUsesSystemContent("object:envelope:address"), true);
  assert.equal(nativeVisualCanHide("object:envelope:shoji"), true);
  assert.equal(nativeVisualCanHide("object:envelope:mizuhiki"), true);
  assert.equal(nativeVisualCanHide("object:cover:blossom"), true);
  assert.equal(nativeVisualCanHide("object:cover:mountains"), true);
});

test("Celestial Ink keeps orbit layers granular while foreground content can move as one group", () => {
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const celestial = scenes.split('if (theme === "celestial-ink")')[1]?.split("return <section")[0] || scenes.split('if (theme === "celestial-ink") return <section')[1]?.split("return <section")[0] || scenes;
  assert.match(scenes, /object:cover:orbit-outer/);
  assert.match(scenes, /object:cover:orbit-middle/);
  assert.match(scenes, /object:cover:orbit-inner/);
  assert.match(scenes, /object:cover:content-group/);
  assert.match(scenes, /object:cover:star-cluster/);
  assert.equal(nativeVisualCanHide("object:cover:orbit-outer"), true);
  assert.equal(nativeVisualCapabilities("object:cover:content-group").typography, false);
});
