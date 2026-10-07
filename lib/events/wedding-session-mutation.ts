import type { Prisma } from "@/generated/prisma/client";
import { parseInvitedSessions, weddingSessionsFor, WeddingSessionError, type WeddingSession, type WeddingSessionEvent } from "./wedding-sessions";

export class WeddingScopeConflict extends WeddingSessionError {
  constructor(public guests: { id: string; name: string; invitedSessions: string[] }[]) {
    super("Periksa pilihan sesi setiap tamu sebelum menyimpan perubahan acara.", 409);
  }
}

/** The caller holds the Invitation row lock shared with guest/personal writes. */
export async function reconcileWeddingGuestScopes(tx: Prisma.TransactionClient, invitationId: string, current: WeddingSessionEvent & { eventDate: Date }, next: WeddingSession[] | null, nextDate: Date, assignments: unknown, publishing = false) {
  const previous = weddingSessionsFor(current);
  if (!previous.length && !next?.length) return;
  const dateChanged = current.eventDate.toISOString().slice(0, 10) !== nextDate.toISOString().slice(0, 10);
  const scopeChanged = dateChanged || previous.map((row) => row.id).join() !== (next ?? []).map((row) => row.id).join();
  if (!scopeChanged && assignments === undefined && !publishing) return;
  const guests = await tx.guest.findMany({ where: { invitationId }, select: { id: true, name: true, invitedSessions: true, checkedIn: true, rsvpEvents: true } });
  const choices = new Map<string, unknown>();
  if (assignments !== undefined) {
    if (!Array.isArray(assignments) || assignments.length > guests.length) throw new WeddingSessionError("Pilihan sesi tamu tidak valid.");
    for (const row of assignments) {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || choices.has(row.id) || !guests.some((guest) => guest.id === row.id)) throw new WeddingSessionError("Tamu tidak ditemukan pada acara ini.");
      choices.set(row.id, row.invitedSessions);
    }
  }
  const missing = guests.filter((guest) => {
    if (choices.has(guest.id)) return false;
    if (dateChanged || !next?.length || !previous.length) return true;
    try { parseInvitedSessions(guest.invitedSessions, next); return false; } catch { return true; }
  });
  if (missing.length) throw new WeddingScopeConflict(missing);
  for (const guest of guests) {
    if (!choices.has(guest.id)) continue;
    if (guest.checkedIn) throw new WeddingSessionError("Tamu sudah check-in. Jadwal dan cakupan sesi tidak dapat diubah.", 409);
    const invitedSessions = parseInvitedSessions(choices.get(guest.id), next ?? []);
    if (guest.rsvpEvents.some((id) => !invitedSessions.includes(id as "ceremony" | "reception")) && next?.length) throw new WeddingSessionError("Sesi yang sudah dikonfirmasi RSVP tidak dapat dicabut. Perbarui konfirmasi tamu terlebih dahulu.", 409);
    await tx.guest.update({ where: { id: guest.id }, data: { invitedSessions } });
  }
}
