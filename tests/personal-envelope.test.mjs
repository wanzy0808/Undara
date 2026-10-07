import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPersonalGuestAddressee, formatPersonalEnvelopeAddress, getPersonalGuestSalutation } from "../lib/guests/personal-envelope.ts";
import { parsePersonalGuestFields } from "../lib/guests/personal-profile.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("short salutations preserve names, avoid repeated titles and render both shared and separate couple names in ID/EN", () => {
  for (const [name, salutation, addressee, english] of [
    ["andi", "BAPAK", "Bapak Andi", "Mr Andi"],
    ["ibu rina", "IBU", "Ibu Rina", "Mrs Rina"],
    ["Bapak Andi", "IBU", "Ibu Andi", "Mrs Andi"],
    ["andi", "BAPAK_IBU", "Bapak & Ibu Andi", "Mr & Mrs Andi"],
    ["Bapak & Ibu Andi", "BAPAK_IBU", "Bapak & Ibu Andi", "Mr & Mrs Andi"],
    ["bapak andi & ibu sari", "BAPAK_IBU", "Bapak Andi dan Ibu Sari", "Mr Andi and Mrs Sari"],
    ["andi dan sari", "BAPAK_IBU", "Bapak Andi dan Ibu Sari", "Mr Andi and Mrs Sari"],
  ]) {
    const guest = { name, personalAddressee: buildPersonalGuestAddressee(name, salutation) };
    assert.equal(guest.name, name);
    assert.equal(guest.personalAddressee, addressee);
    assert.equal(getPersonalGuestSalutation(guest), salutation);
    assert.equal(formatPersonalEnvelopeAddress(guest), `Kepada Yth : ${addressee}`);
    assert.equal(formatPersonalEnvelopeAddress({ ...guest, personalLanguage: "EN" }), `Dear : ${english}`);
    assert.equal(formatPersonalEnvelopeAddress({ ...guest, personalEnvelopeEnabled: false }), "");
  }
  for (const name of ["", "Bapak", "Ibu", "Bapak & Ibu"]) assert.equal(buildPersonalGuestAddressee(name, "BAPAK_IBU"), "");
  assert.equal(getPersonalGuestSalutation({ name: "Andi", personalAddressee: "Keluarga Wijaya" }), null);
});

test("personal envelope formats Indonesian and English couple greetings with Title Case", () => {
  assert.equal(formatPersonalEnvelopeAddress({
    name: "andi & sari",
    recipientType: "COUPLE",
    personalEnvelopeEnabled: true,
    personalLanguage: "ID",
  }), "Kepada Yth : Bapak Andi dan Ibu Sari");

  assert.equal(formatPersonalEnvelopeAddress({
    name: "guest fallback",
    personalAddressee: "mr budi and mrs rina",
    recipientType: "COUPLE",
    personalEnvelopeEnabled: true,
    personalLanguage: "EN",
  }), "Dear : Mr Budi and Mrs Rina");

  assert.equal(formatPersonalEnvelopeAddress({
    name: "keluarga wijaya",
    recipientType: "FAMILY",
    personalEnvelopeEnabled: true,
    personalLanguage: "ID",
  }), "Kepada Yth : Keluarga Wijaya");

  assert.equal(formatPersonalEnvelopeAddress({
    name: "andi & sari",
    recipientType: "COUPLE",
    personalEnvelopeEnabled: false,
    personalLanguage: "ID",
  }), "");
});

test("personal invitation profile validates envelope toggle and language", () => {
  assert.deepEqual(parsePersonalGuestFields({
    personalEnvelopeEnabled: false,
    personalLanguage: "EN",
  }), {
    personalEnvelopeEnabled: false,
    personalLanguage: "EN",
  });
  assert.throws(() => parsePersonalGuestFields({ personalEnvelopeEnabled: "yes" }), /amplop/);
  assert.throws(() => parsePersonalGuestFields({ personalLanguage: "JP" }), /Bahasa amplop/);
});

test("Personal Invitation dashboard previews and directly toggles the exact envelope addressee", () => {
  const panels = read("components/Dashboard/PersonalInvitationPanels.tsx");
  const i18n = read("components/Dashboard/useDashboardI18n.ts");

  assert.match(panels, /formatPersonalEnvelopeAddress\(item\)/);
  assert.match(panels, /personalEnvelopeEnabled: item\.personalEnvelopeEnabled === false/);
  assert.match(panels, /Aktifkan nama amplop/);
  assert.match(panels, /Matikan nama amplop/);
  assert.match(i18n, /"Amplop personal": "Personal envelope"/);
});

test("dashboard and every ready envelope path receive the personal recipient line", () => {
  const fields = read("components/Dashboard/PersonalInvitationGuestFields.tsx");
  const panels = read("components/Dashboard/PersonalInvitationPanels.tsx");
  const publicPage = read("app/invite/[slug]/p/[token]/page.tsx");
  const previewPage = read("app/dashboard/personal-invitation/[guestId]/page.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const scenes = read("components/PublicInvitation/InvitationThemeScenes.tsx");
  const pencil = read("components/PublicInvitation/PencilReverieScene.tsx");
  const zen = read("components/PublicInvitation/ZenAtelierScene.tsx");

  assert.match(fields, /personalEnvelopeEnabled/);
  assert.match(fields, /personalLanguage/);
  assert.match(panels, /formatPersonalEnvelopeAddress\(/);
  assert.match(panels, /name: selectedGuest\?\.name \?\? name/);
  assert.match(publicPage, /personalEnvelopeEnabled: guest\.personalEnvelopeEnabled/);
  assert.match(previewPage, /<PublicInvitationRenderer/);
  assert.match(universal, /formatPersonalEnvelopeAddress\(\{ \.\.\.personalGuest, personalLanguage: language \}\)/);
  assert.match(universal, /recipientLine=\{personalEnvelopeAddress\}/);
  assert.match(rose, /data-personal-envelope-address/);
  assert.match(scenes, /data-personal-envelope-address/);
  assert.match(pencil, /data-personal-envelope-address/);
  assert.match(zen, /data-personal-envelope-address/);
});

test("Studio previews a sample addressee while real guest lines remain authoritative", () => {
  const designer = read("components/InvitationStudio/InvitationDesigner.tsx");
  const preview = read("components/InvitationStudio/InvitationPreview.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

  assert.match(designer, /previewRecipientLine=\{invitationLanguage === "EN"/);
  assert.match(preview, /previewRecipientLine=\{previewRecipientLine\}/);
  for (const renderer of [universal, rose]) {
    assert.match(renderer, /personalGuest \? formatPersonalEnvelopeAddress\(\{ \.\.\.personalGuest, personalLanguage: language \}\) : preview \? previewRecipientLine/);
  }
});

test("personal drafts are editable before payment, but guest publication requires the parent invitation", () => {
  const api = read("app/api/personal-invitations/route.ts");
  const panel = read("components/Dashboard/PersonalInvitationPanel.tsx");
  const publicPage = read("app/invite/[slug]/p/[token]/page.tsx");

  assert.doesNotMatch(api, /hasAccountDigitalInvitation/);
  assert.doesNotMatch(panel, /if \(!selectedEvent\.accessPaid\)/);
  assert.match(api, /body\.published && !invitation\.isPublished/);
  assert.match(publicPage, /await hasAccountDigitalInvitation\(invitation\.ownerId, invitation\.payment, invitation\.id\)/);
});
