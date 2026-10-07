import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { buildPersonalGuestAddressee, getPersonalGuestSalutation } from "./personal-envelope";
import { MAX_GUEST_PARTY_SIZE, minimumInvitedPaxForSalutation } from "./manual-party";
import { seatingBlocksOverlap, seatingPartySize, seatingSeatBlock } from "@/lib/seating/guest-seats";
import { editableGuestWeddingScope, weddingSessionsFor } from "@/lib/events/wedding-sessions";

export const managedGuestSelect = {
  id: true, invitationId: true, name: true, phone: true, category: true, tags: true,
  invitedPax: true, rsvpStatus: true, plusOnes: true, tableId: true, seatNumber: true,
  invitedSessions: true, checkedIn: true,
  source: true, personalAddressee: true,
} as const satisfies Prisma.GuestSelect;

export class GuestPartyUpdateError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}

/** Share the seating event lock; read allowance/placement after acquiring it. */
export async function resizeManagedGuestParty(ownerId: string, invitationId: string, id: string, invitedPax: number, changes: Prisma.GuestUncheckedUpdateInput) {
  if (!Number.isInteger(invitedPax) || invitedPax < 1 || invitedPax > MAX_GUEST_PARTY_SIZE) {
    throw new GuestPartyUpdateError("Jumlah tamu wajib 1–30 orang.", 400);
  }
  return prisma.$transaction(async (tx) => {
    const event = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!event.length) throw new GuestPartyUpdateError("Tamu tidak ditemukan pada acara ini.", 404);
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Guest" WHERE "id" = ${id} AND "invitationId" = ${invitationId} FOR UPDATE`;
    if (!locked.length) throw new GuestPartyUpdateError("Tamu tidak ditemukan pada acara ini.", 404);
    const guest = await tx.guest.findFirst({
      where: { id, invitationId, invitation: { ownerId } },
      include: { invitation: { include: { payment: true } } },
    });
    if (!guest) throw new GuestPartyUpdateError("Tamu tidak ditemukan pada acara ini.", 404);
    if (!(await hasAccountDigitalInvitation(ownerId, guest.invitation.payment, invitationId))) {
      throw new GuestPartyUpdateError("Pengelolaan tamu membutuhkan paket Digital Invitation.", 402);
    }
    const salutation = getPersonalGuestSalutation({ name: guest.name, personalAddressee: guest.personalAddressee });
    if (invitedPax < minimumInvitedPaxForSalutation(salutation ?? "BAPAK")) {
      throw new GuestPartyUpdateError("Bapak & Ibu minimal 2 orang.", 400);
    }
    const status = typeof changes.rsvpStatus === "string" ? changes.rsvpStatus : guest.rsvpStatus;
    const plusOnes = typeof changes.plusOnes === "number" ? changes.plusOnes : guest.plusOnes;
    if (status === "ATTENDING" && plusOnes + 1 > invitedPax) {
      throw new GuestPartyUpdateError("Jumlah orang tidak boleh lebih kecil dari RSVP hadir yang sudah tersimpan.");
    }
    if (guest.checkedIn && ((changes.rsvpStatus !== undefined && status !== guest.rsvpStatus) || (changes.plusOnes !== undefined && plusOnes !== guest.plusOnes))) {
      throw new GuestPartyUpdateError("Tamu sudah check-in. Status RSVP tidak dapat diganti.");
    }
    const tableId = changes.tableId === undefined ? guest.tableId : typeof changes.tableId === "string" ? changes.tableId : null;
    const seatNumber = changes.seatNumber === undefined ? guest.seatNumber : typeof changes.seatNumber === "number" ? changes.seatNumber : null;
    if (tableId) {
      const table = await tx.weddingTable.findFirst({ where: { id: tableId, invitationId } });
      if (!table) throw new GuestPartyUpdateError("Meja tidak ditemukan pada acara ini.", 404);
      const others = await tx.guest.findMany({ where: { invitationId, tableId, id: { not: id } }, select: { id: true, tableId: true, seatNumber: true, invitedPax: true } });
      if (invitedPax > table.capacity || invitedPax + others.reduce((sum, other) => sum + seatingPartySize(other), 0) > table.capacity) {
        throw new GuestPartyUpdateError("Kapasitas meja tidak cukup untuk jumlah orang ini.");
      }
      if (seatNumber !== null) {
        const seats = seatingSeatBlock(seatNumber, invitedPax, table.capacity);
        if (!seats.length || others.some((other) => seatingBlocksOverlap(seats, seatingSeatBlock(other.seatNumber ?? 0, seatingPartySize(other), table.capacity)))) {
          throw new GuestPartyUpdateError("Kursi bersebelahan tidak cukup. Pindahkan tamu terlebih dahulu.");
        }
      }
    }
    const data = { ...changes, invitedPax };
    if (changes.invitedSessions !== undefined) data.invitedSessions = editableGuestWeddingScope(changes.invitedSessions, weddingSessionsFor(guest.invitation), guest);
    if (typeof data.name === "string" && salutation && data.personalAddressee === undefined) {
      data.personalAddressee = buildPersonalGuestAddressee(data.name, salutation);
    }
    return tx.guest.update({ where: { id: guest.id }, data, select: managedGuestSelect });
  });
}
