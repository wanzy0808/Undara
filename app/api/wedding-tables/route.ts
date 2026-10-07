import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { createEventTables, type SeatingTableShape } from "@/lib/seating/table-storage";

const ALLOWED_SHAPES = new Set(["ROUND", "RECTANGLE", "SQUARE"]);

async function ownedInvitation(userId: string, invitationId: string) {
  if (!invitationId) return null;
  return prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: userId },
    include: { payment: true },
  });
}

async function ownedTable(userId: string, tableId: string) {
  if (!tableId) return null;
  return prisma.weddingTable.findFirst({
    where: { id: tableId, invitation: { ownerId: userId } },
    include: {
      invitation: { include: { payment: true } },
      _count: { select: { guests: true } },
    },
  });
}

function parseCapacity(value: unknown) {
  const capacity = Number(value);
  return Number.isInteger(capacity) && capacity >= 1 && capacity <= 50 ? capacity : null;
}

function parseShape(value: unknown) {
  const shape = String(value ?? "ROUND").trim().toUpperCase();
  return ALLOWED_SHAPES.has(shape) ? shape : null;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    const invitationId = String(body.invitationId ?? "").trim();
    if (!invitationId) return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });

    const invitation = await ownedInvitation(user.id, invitationId);
    if (!invitation) return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json({ error: "Penempatan Tamu membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const name = String(body.name ?? "").trim();
    const capacity = parseCapacity(body.capacity ?? 8);
    const shape = parseShape(body.shape);
    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Nama meja wajib diisi (maksimal 80 karakter)." }, { status: 400 });
    }
    if (capacity === null) {
      return NextResponse.json({ error: "Kapasitas meja wajib 1–50 kursi." }, { status: 400 });
    }
    if (!shape) {
      return NextResponse.json({ error: "Bentuk meja tidak valid." }, { status: 400 });
    }

    const result = await createEventTables(user.id, invitation.id, { name, capacity, shape: shape as SeatingTableShape });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ table: result.tables![0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wedding-tables failed", error);
    return NextResponse.json({ error: "Meja gagal dibuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "ID meja wajib diisi." }, { status: 400 });

    const current = await ownedTable(user.id, id);
    if (!current) return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
    if (!(await hasAccountDigitalInvitation(user.id, current.invitation.payment, current.invitation.id))) {
      return NextResponse.json({ error: "Penempatan Tamu membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const name = body.name === undefined ? undefined : String(body.name).trim();
    const capacity = body.capacity === undefined ? undefined : parseCapacity(body.capacity);
    const shape = body.shape === undefined ? undefined : parseShape(body.shape);
    if (name !== undefined && (!name || name.length > 80)) {
      return NextResponse.json({ error: "Nama meja wajib diisi (maksimal 80 karakter)." }, { status: 400 });
    }
    if (body.capacity !== undefined && capacity === null) {
      return NextResponse.json({ error: "Kapasitas meja wajib 1–50 kursi." }, { status: 400 });
    }
    if (body.shape !== undefined && !shape) {
      return NextResponse.json({ error: "Bentuk meja tidak valid." }, { status: 400 });
    }
    if (capacity !== undefined && capacity !== null && current._count.guests > capacity) {
      return NextResponse.json(
        { error: `Kapasitas tidak boleh lebih kecil dari ${current._count.guests} tamu yang sudah ditempatkan.` },
        { status: 409 },
      );
    }

    const updated = await prisma.weddingTable.updateMany({
      where: { id: current.id, invitationId: current.invitationId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(capacity !== undefined && capacity !== null ? { capacity } : {}),
        ...(shape !== undefined && shape !== null ? { shape } : {}),
      },
    });
    if (!updated.count) return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/wedding-tables failed", error);
    return NextResponse.json({ error: "Meja gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const id = String(new URL(request.url).searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ error: "ID meja wajib diisi." }, { status: 400 });

    const current = await ownedTable(user.id, id);
    if (!current) return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
    if (!(await hasAccountDigitalInvitation(user.id, current.invitation.payment, current.invitation.id))) {
      return NextResponse.json({ error: "Penempatan Tamu membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const result = await prisma.weddingTable.deleteMany({
      where: { id: current.id, invitationId: current.invitationId },
    });
    if (!result.count) return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/wedding-tables failed", error);
    return NextResponse.json({ error: "Meja gagal dihapus." }, { status: 500 });
  }
}
