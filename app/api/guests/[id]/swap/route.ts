import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { seatingBlocksOverlap, seatingPartySize, seatingSeatBlock } from "@/lib/seating/guest-seats";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const { id } = await params;
    const sourceOwner = await prisma.guest.findUnique({
      where: { id },
      select: {
        invitation: {
          select: {
            id: true,
            ownerId: true,
            payment: { select: { packageKey: true, status: true } },
          },
        },
      },
    });
    if (!sourceOwner || sourceOwner.invitation.ownerId !== user.id) {
      return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, sourceOwner.invitation.payment))) {
      return NextResponse.json({ error: "Pengelolaan tempat duduk membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const body = await request.json();
    const targetGuestId = typeof body.targetGuestId === "string" ? body.targetGuestId.trim() : "";
    if (!targetGuestId || targetGuestId === id) {
      return NextResponse.json({ error: "Tamu tujuan tukar posisi tidak valid." }, { status: 400 });
    }

    const invitationId = sourceOwner.invitation.id;
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} AND "ownerId" = ${user.id} FOR UPDATE`;
      if (!event.length) throw new SwapError("Tamu tidak ditemukan pada acara ini.", 404);
      const [source, target] = await Promise.all([
        tx.guest.findFirst({
          where: { id, invitationId },
          select: { id: true, name: true, tableId: true, seatNumber: true, invitedPax: true, source: true, rsvpStatus: true },
        }),
        tx.guest.findFirst({
          where: { id: targetGuestId, invitationId },
          select: { id: true, name: true, tableId: true, seatNumber: true, invitedPax: true, source: true, rsvpStatus: true },
        }),
      ]);

      if (!source || !target) throw new SwapError("Tamu tidak ditemukan pada acara ini.", 404);
      if (source.source !== "MANUAL" && !(source.source === "RSVP" && source.rsvpStatus === "ATTENDING")) {
        throw new SwapError("Tamu sumber tidak termasuk roster seating.", 409);
      }
      if (target.source !== "MANUAL" && !(target.source === "RSVP" && target.rsvpStatus === "ATTENDING")) {
        throw new SwapError("Tamu tujuan tidak termasuk roster seating.", 409);
      }
      if (!source.tableId || !source.seatNumber || !target.tableId || !target.seatNumber) {
        throw new SwapError("Kedua tamu harus sudah memiliki meja dan kursi untuk ditukar.", 400);
      }

      const sourceTableId = source.tableId;
      const sourceSeatNumber = source.seatNumber;
      const targetTableId = target.tableId;
      const targetSeatNumber = target.seatNumber;
      const tableIds = Array.from(new Set([sourceTableId, targetTableId])).sort();
      for (const lockedTableId of tableIds) {
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "WeddingTable" WHERE "id" = ${lockedTableId} AND "invitationId" = ${invitationId} FOR UPDATE`;
        if (!locked.length) throw new SwapError("Meja tidak ditemukan pada acara ini.", 404);
      }
      const tables = await tx.weddingTable.findMany({ where: { invitationId, id: { in: tableIds } } });
      const tableById = new Map(tables.map((table) => [table.id, table]));
      const sourceTable = tableById.get(sourceTableId);
      const targetTable = tableById.get(targetTableId);
      if (!sourceTable || !targetTable) throw new SwapError("Meja tidak ditemukan pada acara ini.", 404);

      const nextSourceSeats = seatingSeatBlock(targetSeatNumber, seatingPartySize(source), targetTable.capacity);
      const nextTargetSeats = seatingSeatBlock(sourceSeatNumber, seatingPartySize(target), sourceTable.capacity);
      if (!nextSourceSeats.length || !nextTargetSeats.length) {
        throw new SwapError("Ukuran rombongan tidak muat di meja tujuan.", 409);
      }
      if (sourceTableId === targetTableId && seatingBlocksOverlap(nextSourceSeats, nextTargetSeats)) {
        throw new SwapError("Rombongan tidak dapat ditukar karena blok kursinya saling bertumpuk.", 409);
      }
      const others = await tx.guest.findMany({
        where: {
          invitationId,
          tableId: { in: tableIds },
          id: { notIn: [source.id, target.id] },
          OR: [
            { source: "MANUAL" as const },
            { source: "RSVP" as const, rsvpStatus: "ATTENDING" as const },
          ],
        },
        select: { id: true, tableId: true, seatNumber: true, invitedPax: true },
      });
      const hasConflict = (tableId: string, seats: number[], capacity: number) =>
        others.some((other) => other.tableId === tableId
          && seatingBlocksOverlap(seats, seatingSeatBlock(other.seatNumber ?? 0, seatingPartySize(other), capacity)));
      if (hasConflict(targetTableId, nextSourceSeats, targetTable.capacity)
        || hasConflict(sourceTableId, nextTargetSeats, sourceTable.capacity)) {
        throw new SwapError("Kursi bersebelahan untuk salah satu rombongan tidak tersedia.", 409);
      }

      await tx.guest.updateMany({
        where: { id: { in: [source.id, target.id] }, invitationId },
        data: { tableId: null, seatNumber: null },
      });
      const updatedSource = await tx.guest.update({
        where: { id: source.id },
        data: { tableId: targetTableId, seatNumber: targetSeatNumber },
        include: { table: true },
      });
      const updatedTarget = await tx.guest.update({
        where: { id: target.id },
        data: { tableId: sourceTableId, seatNumber: sourceSeatNumber },
        include: { table: true },
      });
      return { guests: [updatedSource, updatedTarget] };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SwapError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST /api/guests/[id]/swap failed", error);
    return NextResponse.json({ error: "Tukar posisi tamu gagal disimpan." }, { status: 500 });
  }
}

class SwapError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
