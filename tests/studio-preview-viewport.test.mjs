import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  isStudioPreviewMessage, postStudioPreviewDraft, readStudioPreviewSnapshot,
  studioPreviewDimension, studioPreviewScale, studioPreviewViewports,
  STUDIO_PREVIEW_CLOSE, STUDIO_PREVIEW_DRAFT, STUDIO_PREVIEW_PATH, STUDIO_PREVIEW_READY,
} from "../components/InvitationStudio/studio-preview-viewport.ts";
import { templateDemoInvitation } from "../data/templates/preview-invitation.ts";
import { invitationDesignStateFromKey } from "../components/InvitationStudio/designer-state.ts";
import { defaultInvitationSections } from "../lib/templates/sections.ts";
import { InvitationLanguageProvider } from "../components/PublicInvitation/InvitationLanguage.tsx";

// Node SSR verifies rendered markup; CSS layout is checked separately in a browser.
const require = createRequire(import.meta.url);
require.extensions[".css"] = () => {};
const [{ default: RomanticRoseModule }, { default: UniversalModule }] = await Promise.all([
  import("../components/PublicInvitation/RomanticRoseTemplate.tsx"),
  import("../components/PublicInvitation/UniversalInvitationTemplate.tsx"),
]);

const origin = "https://undara.example";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const snapshot = () => ({
  invitation: { ...templateDemoInvitation, assets: [] },
  design: invitationDesignStateFromKey("garden-light", ""),
  designKey: "garden-light::hidden=gallery",
  musicUrl: "/api/invitations/media/unsaved-song",
  eventTag: "#DraftSaatIni", dressCode: "Krem", invitationLanguage: "ID",
});

test("device presets have actual phone and desktop viewport dimensions", () => {
  assert.deepEqual(studioPreviewViewports.mobile, { width: 390, height: 844 });
  assert.deepEqual(studioPreviewViewports.desktop, { width: 1440, height: 900 });
  assert.ok(studioPreviewViewports.mobile.width < 640);
  assert.ok(studioPreviewViewports.desktop.width > 1280);
});

test("fit scales the display to either bound without changing the logical viewport", () => {
  const desktop = Object.freeze({ width: 1440, height: 900 });
  assert.equal(studioPreviewScale(desktop, { width: 720, height: 800 }), 0.5);
  assert.equal(studioPreviewScale(desktop, { width: 1600, height: 450 }), 0.5);
  assert.equal(studioPreviewScale(desktop, { width: 1600, height: 1000 }), 1);
  assert.deepEqual(desktop, { width: 1440, height: 900 });
  assert.equal(studioPreviewScale(desktop, { width: 0, height: 0 }), 0);
  assert.equal(studioPreviewScale(desktop, { width: 200, height: 300 }, false), 1);
});

test("viewport editing keeps the previous dimension for invalid text and bounds numeric input", () => {
  for (const value of ["", " ", "bad", "Infinity", "NaN"]) assert.equal(studioPreviewDimension(value, 390), 390);
  assert.equal(studioPreviewDimension("375.6", 390), 376);
  assert.equal(studioPreviewDimension("-100", 390), 240);
  assert.equal(studioPreviewDimension("9000", 390), 3840);
  assert.equal(studioPreviewDimension("1024", 390), 1024);
});

test("preview handshake ignores other frames, origins and malformed message types", () => {
  const source = {};
  for (const type of [STUDIO_PREVIEW_READY, STUDIO_PREVIEW_DRAFT, STUDIO_PREVIEW_CLOSE]) {
    const event = { source, origin, data: { type } };
    assert.equal(isStudioPreviewMessage(event, source, origin, type), true);
    assert.equal(isStudioPreviewMessage({ ...event, source: {} }, source, origin, type), false);
    assert.equal(isStudioPreviewMessage({ ...event, origin: "https://other.example" }, source, origin, type), false);
    assert.equal(isStudioPreviewMessage(event, null, origin, type), false);
    assert.equal(isStudioPreviewMessage({ ...event, data: null }, source, origin, type), false);
    assert.equal(isStudioPreviewMessage({ ...event, data: { type: "other" } }, source, origin, type), false);
  }
});

test("draft delivery is restricted to the authenticated preview URL and exact origin", () => {
  const sent = [];
  const target = { location: { origin, pathname: STUDIO_PREVIEW_PATH }, postMessage: (...args) => sent.push(args) };
  const draft = snapshot();
  postStudioPreviewDraft(target, draft, origin);
  assert.deepEqual(sent, [[{ type: STUDIO_PREVIEW_DRAFT, snapshot: draft }, origin]]);
  target.location.pathname = "/login";
  postStudioPreviewDraft(target, draft, origin);
  target.location.pathname = STUDIO_PREVIEW_PATH;
  target.location.origin = "https://other.example";
  postStudioPreviewDraft(target, draft, origin);
  postStudioPreviewDraft(null, draft, origin);
  postStudioPreviewDraft({ get location() { throw new Error("cross origin"); } }, draft, origin);
  assert.equal(sent.length, 1);
});

test("snapshot transfer retains unsaved text, section visibility, photos and music", () => {
  const draft = snapshot();
  draft.invitation.title = "Judul Belum Disimpan";
  draft.design.sections.gallery = false;
  draft.design.photos.cover = "photo-current";
  const transferred = readStudioPreviewSnapshot(structuredClone(draft));
  assert.deepEqual(transferred, draft);
  assert.equal(readStudioPreviewSnapshot({ ...draft, invitation: null }).invitation, null);
});

test("malformed draft messages never reach the invitation renderer", () => {
  const draft = snapshot();
  for (const invalid of [null, [], {}, { ...draft, design: null }, { ...draft, designKey: {} },
    { ...draft, invitationLanguage: "OTHER" }, { ...draft, invitation: {} },
    { ...draft, invitation: { ...draft.invitation, assets: [{}] } }]) {
    assert.equal(readStudioPreviewSnapshot(invalid), null);
  }
});

for (const [name, module, extra] of [
  ["Romantic Rose", RomanticRoseModule, {}],
  ["Universal", UniversalModule, { templateKey: "garden-light" }],
]) {
  test(`${name} final preview hides disabled sections and editor presentation while retaining preview guards`, () => {
    const Renderer = module.default ?? module;
    const props = {
      ...extra, invitation: { ...templateDemoInvitation, assets: [] },
      sections: { ...defaultInvitationSections, envelope: false, gallery: false, music: false },
      preview: true, editorPreview: false,
    };
    const render = (options) => renderToStaticMarkup(createElement(InvitationLanguageProvider, { language: "ID" }, createElement(Renderer, options)));
    const final = render(props);
    assert.doesNotMatch(final, /data-section-instance-id="gallery"|data-studio-preview-root|undara-section-instance-hidden/);
    assert.match(final, /data-section-instance-id="rsvp"/);
    assert.match(final, /overflow-hidden/);
    assert.match(final, /aria-disabled="true"/);
    const editor = render({ ...props, editorPreview: true });
    assert.match(editor, /data-section-instance-id="gallery"/);
    assert.match(editor, /data-studio-preview-root="true"/);
    assert.match(editor, /undara-section-instance-hidden/);
  });
}

test("iframe has its own viewport and draft stays out of URLs, storage and public data loading", () => {
  const host = read("components/InvitationStudio/StudioPreviewViewport.tsx");
  const frame = read("components/InvitationStudio/StudioPreviewFrame.tsx");
  const page = read("app/studio/preview/page.tsx");
  assert.match(host, /<iframe[\s\S]*?width=\{viewport\.width\}[\s\S]*?height=\{viewport\.height\}/);
  assert.doesNotMatch(host, /max-w-full|key=\{(?:device|viewport)/);
  assert.match(frame, /<InvitationPreview[\s\S]*?editorPreview=\{false\}/);
  assert.match(frame, /event\.key !== "Escape"/);
  assert.match(page, /if \(!await getCurrentUser\(\)\) redirect\("\/login"\)/);
  assert.doesNotMatch(`${host}\n${frame}\n${page}`, /localStorage|sessionStorage|\/api\/invite|prisma\.|JSON\.stringify|searchParams/);
  for (const path of ["components/Layout/Navbar/Navbar.tsx", "components/Layout/Footer.tsx"]) assert.match(read(path), /pathname === STUDIO_PREVIEW_PATH/);
});
