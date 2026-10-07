/** Shared Guest fields for the personal invitation flow.
 * There is NO second recipient table: invitations, RSVP, WA Blast and seating
 * continue to reference the same Guest.id. plusOnes is RSVP attendance, NOT
 * the invitedPax invitation limit.
 */
export const RECIPIENT_TYPES = ["INDIVIDUAL", "COUPLE", "FAMILY", "GROUP"] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];
export const PERSONAL_INVITATION_LANGUAGES = ["ID", "EN"] as const;
export type PersonalInvitationLanguage = (typeof PERSONAL_INVITATION_LANGUAGES)[number];

export type PersonalGuestFields = {
  personalAddressee?: string | null;
  recipientType?: RecipientType;
  invitedPax?: number;
  invitedSessions?: ("ceremony" | "reception")[];
  category?: string | null;
  tags?: string[];
  personalGreeting?: string | null;
  personalEnvelopeEnabled?: boolean;
  personalLanguage?: PersonalInvitationLanguage;
};

export function parsePersonalGuestFields(body: Record<string, unknown>): PersonalGuestFields {
  const data: PersonalGuestFields = {};
  if (body.invitedSessions !== undefined) {
    if (!Array.isArray(body.invitedSessions) || body.invitedSessions.length > 2 || new Set(body.invitedSessions).size !== body.invitedSessions.length || body.invitedSessions.some((id) => id !== "ceremony" && id !== "reception")) throw new Error("Pilihan sesi tamu tidak valid.");
    data.invitedSessions = body.invitedSessions;
  }
  if (body.personalAddressee !== undefined) {
    if (typeof body.personalAddressee !== "string" || body.personalAddressee.trim().length > 160) {
      throw new Error("Nama di amplop maksimal 160 karakter.");
    }
    data.personalAddressee = body.personalAddressee.trim() || null;
  }
  if (body.recipientType !== undefined) {
    if (typeof body.recipientType !== "string" || !RECIPIENT_TYPES.some((type) => type === body.recipientType)) {
      throw new Error("Jenis penerima tidak valid.");
    }
    data.recipientType = body.recipientType as RecipientType;
  }
  if (body.invitedPax !== undefined) {
    const value = Number(body.invitedPax);
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      throw new Error("Kuota undangan harus 1 sampai 30 orang.");
    }
    data.invitedPax = value;
  }
  if (body.category !== undefined) {
    if (typeof body.category !== "string" || body.category.trim().length > 60) {
      throw new Error("Kategori tamu maksimal 60 karakter.");
    }
    data.category = body.category.trim() || null;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== "string")) {
      throw new Error("Kelompok tamu tidak valid.");
    }
    const normalized = body.tags.map((tag: string) => tag.trim()).filter(Boolean);
    if (normalized.some((tag: string) => tag.length > 60) || normalized.length > 10) {
      throw new Error("Maksimal 10 kelompok dengan nama maksimal 60 karakter.");
    }
    data.tags = Array.from(new Set(normalized));
  }
  if (body.personalGreeting !== undefined) {
    if (typeof body.personalGreeting !== "string" || body.personalGreeting.trim().length > 280) {
      throw new Error("Pesan pribadi maksimal 280 karakter.");
    }
    data.personalGreeting = body.personalGreeting.trim() || null;
  }
  if (body.personalEnvelopeEnabled !== undefined) {
    if (typeof body.personalEnvelopeEnabled !== "boolean") {
      throw new Error("Pengaturan nama di amplop tidak valid.");
    }
    data.personalEnvelopeEnabled = body.personalEnvelopeEnabled;
  }
  if (body.personalLanguage !== undefined) {
    if (typeof body.personalLanguage !== "string"
      || !PERSONAL_INVITATION_LANGUAGES.some((language) => language === body.personalLanguage)) {
      throw new Error("Bahasa amplop tidak valid.");
    }
    data.personalLanguage = body.personalLanguage as PersonalInvitationLanguage;
  }
  return data;
}
