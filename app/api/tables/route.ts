import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { createEventTables, type SeatingTableShape } from "@/lib/seating/table-storage";

const ALLOWED_SHAPES = new Set(["ROUND", "RECTANGLE", "SQUARE"]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Data meja tidak valid." }, { status: 400 });
    const invitationId = String(body.invitationId ?? "").trim();
    const invitation = await prisma.invitation.findFirst({
      where: invitationId
        ? { id: invitationId, ownerId: user.id }
        : { ownerId: user.id, type: "WEDDING" },
      include: { payment: true },
      orderBy: invitationId ? undefined : { createdAt: "asc" },
    });
    if (!invitation || !(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json({ error: "Table arrangement membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    const name = String(body.name ?? "").trim();
    const count = body.count === undefined ? undefined : Number(body.count);
    const capacity = Number(body.capacity ?? 8);
    const shape = String(body.shape ?? "ROUND").trim().toUpperCase();

    if ((count === undefined && (!name || name.length > 80)) || !Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      return NextResponse.json({ error: "Nama dan kapasitas meja wajib valid (1–50 kursi)." }, { status: 400 });
    }
    if (!ALLOWED_SHAPES.has(shape)) {
      return NextResponse.json({ error: "Bentuk meja tidak valid." }, { status: 400 });
    }
    if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > 100)) {
      return NextResponse.json({ error: "Jumlah meja wajib 1–100." }, { status: 400 });
    }

    const result = await createEventTables(user.id, invitation.id, {
      ...(count === undefined ? { name } : { count, prefix: body.locale === "en" ? "Table" : "Meja" }),
      shape: shape as SeatingTableShape, capacity,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(count === undefined ? { table: result.tables![0] } : { tables: result.tables }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tables failed", error);
    return NextResponse.json({ error: "Meja gagal dibuat." }, { status: 500 });
  }
}
