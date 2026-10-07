import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { seatingBlocksOverlap, seatingPartySize, seatingSeatBlock } from "@/lib/seating/guest-seats";

function isSeatingEligibleGuest(guest: { source: "RSVP" | "MANUAL"; rsvpStatus: string }) {
  return guest.source === "MANUAL" || guest.rsvpStatus === "ATTENDING";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const { id } = await params;
    const guest = await prisma.guest.findUnique({
      where: { id },
      select: {
        id: true,
        tableId: true,
        invitedPax: true,
        source: true,
        rsvpStatus: true,
        invitation: {
          select: {
            id: true,
            ownerId: true,
            payment: { select: { packageKey: true, status: true } },
          },
        },
      },
    });
    if (!guest || guest.invitation.ownerId !== user.id) {
      return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, guest.invitation.payment))) {
      return NextResponse.json({ error: "Pengelolaan tempat duduk membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const body = await request.json();
    const tableId = body.tableId == null || String(body.tableId).trim() === "" ? null : String(body.tableId).trim();
    const seatNumber = body.seatNumber == null || body.seatNumber === "" ? null : Number(body.seatNumber);

    if (seatNumber !== null && (!Number.isInteger(seatNumber) || seatNumber < 1)) {
      return NextResponse.json({ error: "Nomor kursi tidak valid." }, { status: 400 });
    }
    if (!tableId && seatNumber !== null) {
      return NextResponse.json({ error: "Nomor kursi harus memiliki meja." }, { status: 400 });
    }
    if (!isSeatingEligibleGuest(guest)) {
      return NextResponse.json({ error: "Tamu RSVP yang belum berstatus ATTENDING tidak dapat ditempatkan di denah." }, { status: 409 });
    }

    const invitationId = guest.invitation.id;
    const updated = await prisma.$transaction(async (tx) => {
      if (!tableId) {
        return tx.guest.update({
          where: { id: guest.id },
          data: { tableId: null, seatNumber: null },
          include: { table: true },
        });
      }

      const locked = await tx.$queryRaw<{ id: string }[]>\`SELECT "id" FROM "WeddingTable" WHERE "id" = ${tableId} AND "invitationId" = ${invitationId} FOR UPDATE\`;
      if (!locked.length) throw new PlacementError("Meja tidak ditemukan pada acara ini.", 404);
      const table = await tx.weddingTable.findFirst({ where: { id: tableId, invitationId } });
      if (!table) throw new PlacementError("Meja tidak ditemukan pada acara ini.", 404);
      if (seatNumber !== null && seatNumber > table.capacity) {
        throw new PlacementError(`Nomor kursi melebihi kapasitas meja (${table.capacity}).`, 400);
      }

      const eligibleWhere = {
        invitationId,
        tableId,
        id: { not: guest.id },
        OR: [
          { source: "MANUAL" as const },
          { source: "RSVP" as const, rsvpStatus: "ATTENDING" as const },
        ],
      };
      const others = await tx.guest.findMany({
        where: eligibleWhere,
        select: { id: true, tableId: true, seatNumber: true, invitedPax: true },
      });
      const partySize = seatingPartySize(guest);
      if (partySize > table.capacity) {
        throw new PlacementError(`Rombongan ${partySize} orang melebihi kapasitas meja (${table.capacity}).`, 409);
      }

      if (seatNumber !== null) {
        const requestedSeats = seatingSeatBlock(seatNumber, partySize, table.capacity);
        const conflict = others.some((other) =>
          seatingBlocksOverlap(requestedSeats, seatingSeatBlock(other.seatNumber ?? 0, seatingPartySize(other), table.capacity)),
        );
        if (conflict) {
          throw new PlacementError(`Tidak tersedia ${partySize} kursi bersebelahan dari posisi ini.`, 409);
        }
      } else {
        const occupied = others.reduce((sum, other) => sum + seatingPartySize(other), 0);
        if (occupied + partySize > table.capacity) {
          throw new PlacementError("Kapasitas meja tidak cukup untuk seluruh rombongan tamu.", 409);
        }
      }

      return tx.guest.update({
        where: { id: guest.id },
        data: { tableId, seatNumber },
        include: { table: true },
      });
    });

    return NextResponse.json({ guest: updated });
  } catch (error) {
    if (error instanceof PlacementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("PATCH /api/guests/[id] failed", error);
    return NextResponse.json({ error: "Penempatan tamu gagal disimpan." }, { status: 500 });
  }
}

class PlacementError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}