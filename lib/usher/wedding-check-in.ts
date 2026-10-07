import { prisma } from "@/lib/prisma";
import { parseInvitedSessions, weddingSessionsFor, WeddingSessionError } from "@/lib/events/wedding-sessions";

/** One signed Guest ticket; admission and duplicate detection are per active session. */
export async function checkInWeddingSession(ownerId: string, invitationId: string, guestId: string, requestedSession: unknown) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!locked.length) throw new WeddingSessionError("Acara tidak ditemukan.", 404);
    const guest = await tx.guest.findFirst({ where: { id: guestId, invitationId }, include: { invitation: true, sessionCheckIns: true } });
    if (!guest) throw new WeddingSessionError("Tamu tidak ditemukan pada acara ini.", 404);
    const sessions = weddingSessionsFor(guest.invitation);
    const selected = requestedSession ?? (sessions.length === 1 ? sessions[0].id : undefined);
    if (!sessions.some((session) => session.id === selected)) throw new WeddingSessionError("Pilih sesi check-in yang aktif.");
    const invitedSessions = parseInvitedSessions(guest.invitedSessions, sessions);
    if (!invitedSessions.some((id) => id === selected)) throw new WeddingSessionError("Tamu tidak diundang ke sesi ini.", 403);
    if (guest.sessionCheckIns.some((entry) => entry.session === selected)) throw new WeddingSessionError(`${guest.name} sudah check-in pada sesi ini.`, 409);
    const entry = await tx.guestSessionCheckIn.create({ data: { guestId, session: String(selected), checkedInById: ownerId } });
    const updated = await tx.guest.update({ where: { id: guestId }, data: { checkedIn: true, ...(!guest.checkedIn ? { checkedInAt: entry.checkedInAt, checkedInById: ownerId } : {}) }, select: { id: true, invitationId: true, name: true, phone: true, rsvpStatus: true, plusOnes: true, invitedSessions: true, checkedIn: true, checkedInAt: true, updatedAt: true, sessionCheckIns: { select: { session: true, checkedInAt: true } } } });
    return { guest: updated, checkedInAt: entry.checkedInAt };
  });
}
