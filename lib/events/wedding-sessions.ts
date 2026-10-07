import type { InvitationRsvpConfig } from "@/lib/templates/rsvp-config";

export const WEDDING_SESSION_IDS = ["ceremony", "reception"] as const;
export type WeddingSessionId = (typeof WEDDING_SESSION_IDS)[number];
export type WeddingCeremonyKind = "AKAD" | "BLESSING" | "CEREMONY";
export type WeddingSession = {
  id: WeddingSessionId;
  kind: WeddingCeremonyKind | null;
  label: string;
  start: string;
  end: string | null;
  venue: string;
  address: string | null;
  mapUrl: string | null;
};
export type WeddingSessionEvent = { eventCategory?: string | null; weddingSessions?: unknown };

export class WeddingSessionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** null means the existing one-schedule event, never inferred from legacy times. */
export function parseWeddingSessions(value: unknown, eventCategory: string): WeddingSession[] | null {
  if (value == null) return null;
  if (eventCategory !== "WEDDING") throw new WeddingSessionError("Sesi pernikahan hanya tersedia untuk acara Pernikahan.");
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) throw new WeddingSessionError("Pilih minimal satu sesi pernikahan.");
  const ids = new Set<string>();
  const text = (value: unknown, limit: number, label: string) => {
    if (value == null) return "";
    if (typeof value !== "string" || value.trim().length > limit) throw new WeddingSessionError(`${label} tidak valid (maksimal ${limit} karakter).`);
    return value.trim();
  };
  return value.map((raw): WeddingSession => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new WeddingSessionError("Data sesi tidak valid.");
    const row = raw as Record<string, unknown>;
    if (Object.hasOwn(row, "date") || Object.hasOwn(row, "eventDate")) throw new WeddingSessionError("Tanggal berbeda harus memakai dua acara dan dua paket Undangan Digital.");
    if (!WEDDING_SESSION_IDS.some((id) => id === row.id) || ids.has(String(row.id))) throw new WeddingSessionError("Pilihan sesi tidak valid atau duplikat.");
    ids.add(String(row.id));
    const id = row.id as WeddingSessionId;
    const kind = id === "ceremony" ? row.kind : null;
    if (id === "ceremony" && !["AKAD", "BLESSING", "CEREMONY"].includes(String(kind))) throw new WeddingSessionError("Pilih jenis prosesi pernikahan.");
    const start = text(row.start, 5, "Waktu mulai");
    const end = text(row.end, 5, "Waktu selesai") || null;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || (end && end !== "END" && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end))) throw new WeddingSessionError("Waktu sesi harus menggunakan format HH:mm.");
    if (end && end !== "END" && end <= start) throw new WeddingSessionError("Waktu selesai harus setelah mulai pada tanggal yang sama.");
    const venue = text(row.venue, 240, "Nama tempat");
    if (!venue) throw new WeddingSessionError("Nama tempat wajib diisi untuk setiap sesi aktif.");
    const mapUrl = text(row.mapUrl, 2048, "Tautan peta") || null;
    if (mapUrl) {
      let url: URL;
      try { url = new URL(mapUrl); } catch { throw new WeddingSessionError("Tautan peta harus berupa URL http atau https."); }
      if (!["http:", "https:"].includes(url.protocol)) throw new WeddingSessionError("Tautan peta harus berupa URL http atau https.");
    }
    return { id, kind: kind as WeddingCeremonyKind | null, label: text(row.label, 60, "Nama sesi"), start, end, venue, address: text(row.address, 1000, "Alamat") || null, mapUrl };
  }).sort((a, b) => WEDDING_SESSION_IDS.indexOf(a.id) - WEDDING_SESSION_IDS.indexOf(b.id));
}

export function weddingSessionsFor(invitation: WeddingSessionEvent) {
  return parseWeddingSessions(invitation.weddingSessions, invitation.eventCategory || "OTHER") ?? [];
}

export function weddingSessionLabel(session: Pick<WeddingSession, "id" | "kind" | "label">, language: "ID" | "EN" = "ID") {
  if (session.label) return session.label;
  if (session.id === "reception") return language === "EN" ? "Reception" : "Resepsi";
  if (session.kind === "AKAD") return language === "EN" ? "Akad Nikah" : "Akad Nikah";
  if (session.kind === "BLESSING") return language === "EN" ? "Wedding Blessing" : "Pemberkatan Pernikahan";
  return language === "EN" ? "Wedding Ceremony" : "Prosesi Pernikahan";
}

export function parseInvitedSessions(value: unknown, sessions: WeddingSession[], existing?: unknown): WeddingSessionId[] {
  if (!sessions.length) {
    if (value !== undefined && (!Array.isArray(value) || value.length)) throw new WeddingSessionError("Acara ini tidak memakai pilihan sesi pernikahan.");
    return [];
  }
  const source = value === undefined ? (existing ?? (sessions.length === 1 ? [sessions[0].id] : undefined)) : value;
  if (!Array.isArray(source) || !source.length || source.length > 2 || new Set(source).size !== source.length
    || source.some((id) => !sessions.some((session) => session.id === id))) throw new WeddingSessionError("Pilih sesi undangan tamu yang masih aktif.");
  return WEDDING_SESSION_IDS.filter((id) => source.includes(id));
}

export function weddingSessionProjection(sessions: WeddingSession[]) {
  const first = sessions[0];
  return first ? { venue: first.venue, address: first.address, mapUrl: first.mapUrl, ceremonyTime: first.start, receptionTime: first.end } : {};
}

export function editableGuestWeddingScope(value: unknown, sessions: WeddingSession[], guest: { invitedSessions?: string[]; checkedIn?: boolean; rsvpEvents?: string[] }) {
  const invited = parseInvitedSessions(value, sessions, guest.invitedSessions);
  if (guest.checkedIn && JSON.stringify(invited) !== JSON.stringify(guest.invitedSessions ?? [])) throw new WeddingSessionError("Tamu sudah check-in. Cakupan sesi tidak dapat diubah.", 409);
  if (sessions.length && guest.rsvpEvents?.some((id) => !invited.some((session) => session === id))) throw new WeddingSessionError("Sesi yang sudah dikonfirmasi RSVP tidak dapat dicabut. Perbarui konfirmasi tamu terlebih dahulu.", 409);
  return invited;
}

/** Call on the server before passing a personalized invitation to any client. */
export function invitationForWeddingGuest<T extends WeddingSessionEvent>(invitation: T, invitedSessions: unknown): T {
  const sessions = weddingSessionsFor(invitation);
  if (!sessions.length) return invitation;
  const allowed = parseInvitedSessions(invitedSessions, sessions);
  const visible = sessions.filter((session) => allowed.includes(session.id));
  return { ...invitation, weddingSessions: visible, ...weddingSessionProjection(visible) };
}

export function weddingRsvpConfig(invitation: WeddingSessionEvent, config: InvitationRsvpConfig): InvitationRsvpConfig {
  const sessions = weddingSessionsFor(invitation);
  if (!sessions.length) return config;
  return { ...config, ceremony: sessions.some((session) => session.id === "ceremony"), reception: sessions.some((session) => session.id === "reception"), attendAll: sessions.length === 2 };
}
