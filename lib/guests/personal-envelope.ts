import { displayTitleCase } from "@/lib/text/display-title-case";
import type { PersonalInvitationLanguage, RecipientType } from "@/lib/guests/personal-profile";

export type PersonalEnvelopeGuest = {
  name: string;
  personalAddressee?: string | null;
  recipientType?: RecipientType;
  personalEnvelopeEnabled?: boolean;
  personalLanguage?: PersonalInvitationLanguage;
};

export const PERSONAL_SALUTATIONS = ["BAPAK", "IBU", "BAPAK_IBU"] as const;
export type PersonalSalutation = (typeof PERSONAL_SALUTATIONS)[number];

const honorificPrefix = /^(?:bapak|pak|ibu|bu|mr|mrs|ms)\.?(?:\s+|$)/iu;
const sharedHonorificPrefix = /^(?:bapak\s*(?:&|dan)\s*ibu|mr\s*(?:&|and)\s*mrs)\.?(?:\s+|$)/iu;

function cleanPersonalName(value: string) {
  return displayTitleCase(value.replace(honorificPrefix, "").trim());
}

function coupleNames(value: string) {
  const parts = value
    .split(/\s*(?:&|\/|\bdan\b|\band\b)\s*/iu)
    .map((part) => cleanPersonalName(part))
    .filter(Boolean);
  return parts.length === 2 ? parts : [];
}

/** Keep the canonical name separate from its chosen envelope salutation. */
export function buildPersonalGuestAddressee(name: string, salutation: PersonalSalutation) {
  const clean = name.trim().replace(sharedHonorificPrefix, "").replace(honorificPrefix, "").trim();
  if (!clean) return "";
  if (salutation === "BAPAK_IBU") {
    const pair = coupleNames(clean);
    return pair.length === 2
      ? `Bapak ${pair[0]} dan Ibu ${pair[1]}`
      : `Bapak & Ibu ${displayTitleCase(clean)}`;
  }
  return `${salutation === "BAPAK" ? "Bapak" : "Ibu"} ${displayTitleCase(clean)}`;
}

export function getPersonalGuestSalutation(guest: PersonalEnvelopeGuest) {
  if (!guest.personalAddressee) return null;
  return PERSONAL_SALUTATIONS.find((salutation) => buildPersonalGuestAddressee(guest.name, salutation) === guest.personalAddressee?.trim()) ?? null;
}

/** Render-only addressee. Stored Guest names are never rewritten. */
export function formatPersonalEnvelopeAddress(guest: PersonalEnvelopeGuest) {
  if (guest.personalEnvelopeEnabled === false) return "";
  const raw = (guest.personalAddressee || guest.name || "").trim();
  if (!raw) return "";

  const language: PersonalInvitationLanguage = guest.personalLanguage === "EN" ? "EN" : "ID";
  if (sharedHonorificPrefix.test(raw)) {
    const name = cleanPersonalName(raw.replace(sharedHonorificPrefix, ""));
    if (name) return language === "EN" ? `Dear : Mr & Mrs ${name}` : `Kepada Yth : Bapak & Ibu ${name}`;
  }
  if (guest.recipientType === "COUPLE" || /^(?:bapak|pak|mr)\.?\s+.+\s+(?:dan|and|&)\s+(?:ibu|bu|mrs)\.?\s+/iu.test(raw)) {
    const pair = coupleNames(raw);
    if (pair.length === 2) {
      return language === "EN"
        ? `Dear : Mr ${pair[0]} and Mrs ${pair[1]}`
        : `Kepada Yth : Bapak ${pair[0]} dan Ibu ${pair[1]}`;
    }
  }

  const title = raw.match(/^(bapak|pak|ibu|bu|mr|mrs|ms)\.?\s+(.+)$/iu);
  const addressee = title && language === "EN"
    ? `${/^(?:bapak|pak|mr)$/iu.test(title[1]) ? "Mr" : title[1].toLowerCase() === "ms" ? "Ms" : "Mrs"} ${displayTitleCase(title[2])}`
    : displayTitleCase(raw);
  return language === "EN" ? `Dear : ${addressee}` : `Kepada Yth : ${addressee}`;
}
