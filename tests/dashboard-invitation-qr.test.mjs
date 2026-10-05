import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import MenuModule from "../components/Dashboard/InvitationQrMenu.tsx";
import PreviewModule from "../components/Dashboard/InvitationQrPreview.tsx";
import { invitationQrImageUrl, accessibleInvitationQrOptions } from "../components/Dashboard/invitation-qr.ts";

const InvitationQrMenu = MenuModule.default ?? MenuModule;
const InvitationQrPreview = PreviewModule.default ?? PreviewModule;
const render = (element, locale = "id") => renderToStaticMarkup(createElement(LanguageProvider, { initialLocale: locale }, element));

test("QR choices follow server access, including paid drafts and manual Owner grants", () => {
  const invitations = [
    { id: "paid-draft", title: "Draft", isPublished: false, eventConfigured: false, accessPaid: true, payment: { packageKey: "INVITATION_BASIC", status: "PAID" } },
    { id: "paid-guestbook", title: "Guestbook", isPublished: true, accessPaid: true, payment: { packageKey: "GUESTBOOK_DIGITAL", status: "PAID" } },
    { id: "paid-bundle", title: "Bundle", isPublished: true, accessPaid: true, payment: { packageKey: "INVITATION_GUESTBOOK", status: "PAID" } },
    { id: "unpaid", title: "Unpaid", isPublished: false, accessPaid: false, payment: { packageKey: "INVITATION_BASIC", status: "PENDING" } },
    { id: "wrong-package", title: "WA", isPublished: true, accessPaid: false, payment: { packageKey: "WA_BLAST", status: "PAID" } },
    { id: "account-grant", title: "Grant", isPublished: false, accessPaid: true, payment: null },
    { id: "no-payment", title: "Missing", isPublished: false },
    { id: "revoked", title: "Revoked", isPublished: true, accessPaid: false },
    { id: "flag-not-true", title: "Bad Flag", isPublished: true, accessPaid: "true" },
  ];
  const original = structuredClone(invitations);
  assert.deepEqual(accessibleInvitationQrOptions(invitations).map(({ id }) => id), ["paid-draft", "paid-guestbook", "paid-bundle", "account-grant"]);
  assert.deepEqual(invitations, original);
  assert.deepEqual(accessibleInvitationQrOptions([]), []);
});

test("preview and download stay on the app and identify the same selected invitation", () => {
  for (const id of ["invitation-a", "invitation-b", "id&download=1?x=2"]) {
    const preview = new URL(invitationQrImageUrl(id), "https://undara.example.test");
    const download = new URL(invitationQrImageUrl(id, true), preview.origin);
    assert.equal(preview.origin, "https://undara.example.test");
    assert.equal(preview.pathname, "/api/invitations/qr");
    assert.equal(preview.searchParams.get("invitationId"), id);
    assert.equal(preview.searchParams.has("download"), false);
    assert.equal(download.searchParams.get("invitationId"), id);
    assert.equal(download.searchParams.get("download"), "1");
    assert.equal(download.searchParams.size, 2);
  }
  assert.notEqual(invitationQrImageUrl("invitation-a"), invitationQrImageUrl("invitation-b"));
});

test("Beranda QR menu renders a localized dialog trigger without loading an invitation automatically", () => {
  for (const [locale, label] of [["id", "QR Undangan"], ["en", "Invitation QR"]]) {
    const html = render(createElement(InvitationQrMenu, { onManageInvitations() {} }), locale);
    assert.ok(html.includes(label));
    assert.match(html, /aria-haspopup="dialog"/);
    assert.match(html, /data-slot="dialog-trigger"/);
    assert.doesNotMatch(html, /<img|invitationId=/);
  }
});

test("card preview and download use the same dashboard locale without allowing ID query injection", () => {
  const id = "invitation-a&locale=en";
  const english = new URL(invitationQrImageUrl(id, true, "en"), "https://undara.example.test");
  assert.equal(english.searchParams.get("invitationId"), id);
  assert.equal(english.searchParams.get("download"), "1");
  assert.equal(english.searchParams.get("locale"), "en");
  assert.equal(english.searchParams.size, 3);
  const indonesian = new URL(invitationQrImageUrl(id, true, "id"), english.origin);
  assert.equal(indonesian.searchParams.has("locale"), false);
  const preview = new URL(invitationQrImageUrl(id, false, "en"), english.origin);
  assert.equal(preview.searchParams.get("invitationId"), id);
  assert.equal(preview.searchParams.get("locale"), "en");
  assert.equal(preview.searchParams.has("download"), false);
  assert.equal(preview.searchParams.size, 2);
  english.searchParams.delete("download");
  assert.equal(preview.href, english.href);
  const source = readFileSync(new URL("../components/Dashboard/InvitationQrPreview.tsx", import.meta.url), "utf8");
  assert.match(source, /invitationQrImageUrl\(invitationId, false, locale\)/);
  assert.match(source, /invitationQrImageUrl\(invitationId, true, locale\)/);
});

test("QR preview loads the selected invitation and disables download until the image is ready", () => {
  const html = render(createElement(InvitationQrPreview, { invitationId: "paid-draft", title: "Acara Keluarga" }));
  assert.match(html, /src="\/api\/invitations\/qr\?invitationId=paid-draft"/);
  assert.match(html, /alt="QR Undangan · Acara Keluarga"/);
  assert.match(html, /<img[^>]*width="900"[^>]*height="1320"/);
  assert.ok(html.indexOf("<img") < html.indexOf("<button"));
  assert.match(html, /role="status"/);
  assert.match(html, /<button[^>]*disabled/);
  assert.doesNotMatch(html, /<a[^>]*download/);
});

test("QR preview uses English feedback and escapes the invitation title", () => {
  const html = render(createElement(InvitationQrPreview, { invitationId: "paid-public", title: '<script>alert("x")</script>' }), "en");
  assert.ok(html.includes("Loading QR..."));
  assert.ok(html.includes("Invitation QR"));
  assert.match(html, /src="\/api\/invitations\/qr\?invitationId=paid-public&amp;locale=en"/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
