import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { parseSeatingPlan, SEATING_MAX_BODY_BYTES } from "@/lib/seating/plan";

const privateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });

async function ownedEvent(userId: string, id: string) {
  return prisma.invitation.findFirst({ where: { id, ownerId: userId }, include: { payment: true } });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Belum login." }, 401);
    const id = new URL(request.url).searchParams.get("invitationId")?.trim();
    if (!id) return json({ error: "Acara wajib dipilih." }, 400);
    const invitation = await ownedEvent(user.id, id);
    if (!invitation) return json({ error: "Acara tidak ditemukan." }, 404);
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment))) return json({ error: "Denah membutuhkan akses Undangan Digital." }, 402);
    const plan = await prisma.seatingPlan.findUnique({ where: { invitationId: id } });
    return json({ layout: plan?.layout ?? null, updatedAt: plan?.updatedAt.toISOString() ?? null });
  } catch (error) {
    console.error("GET /api/seating-plan failed", error);
    return json({ error: "Denah belum dapat dimuat. Coba lagi." }, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Belum login." }, 401);
    if (!isTrustedMutationOrigin(request)) return json({ error: "Origin permintaan tidak valid." }, 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Data denah harus JSON." }, 415);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > SEATING_MAX_BODY_BYTES) return json({ error: "Denah terlalu besar." }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "Data denah tidak valid." }, 400); }
    const id = typeof body?.invitationId === "string" ? body.invitationId.trim() : "";
    const layout = parseSeatingPlan(body?.layout);
    const revision = body?.updatedAt;
    if (!id || !layout || !(revision === null || (typeof revision === "string" && Number.isFinite(Date.parse(revision))))) return json({ error: "Data denah tidak valid." }, 400);
    const invitation = await ownedEvent(user.id, id);
    if (!invitation) return json({ error: "Acara tidak ditemukan." }, 404);
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment))) return json({ error: "Denah membutuhkan akses Undangan Digital." }, 402);

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${id} AND "ownerId" = ${user.id} FOR UPDATE`;
      if (!locked.length) return { error: "Acara tidak ditemukan.", status: 404 };
      const tables = await tx.weddingTable.findMany({ where: { invitationId: id }, select: { id: true } });
      const tableIds = new Set(tables.map((table) => table.id));
      if (Object.keys(layout.tables).some((tableId) => !tableIds.has(tableId))) return { error: "Daftar meja berubah. Muat ulang denah sebelum menyimpan.", status: 409 };
      const current = await tx.seatingPlan.findUnique({ where: { invitationId: id } });
      if ((current?.updatedAt.toISOString() ?? null) !== revision) return { error: "Denah telah diperbarui di sesi lain. Muat ulang sebelum menyimpan.", status: 409 };
      const plan = await tx.seatingPlan.upsert({ where: { invitationId: id }, create: { invitationId: id, layout }, update: { layout } });
      return { layout: plan.layout, updatedAt: plan.updatedAt.toISOString(), status: 200 };
    });
    const { status, ...data } = result;
    return json(data, status);
  } catch (error) {
    console.error("PUT /api/seating-plan failed", error);
    return json({ error: "Denah belum tersimpan. Coba lagi." }, 500);
  }
}
