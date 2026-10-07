import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { findGuestsByContact } from "@/lib/guests/identity";

async function getOwnedInvitation(userId: string, invitationId: string) {
  if (!invitationId) return null;
  return prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: userId },
    include: { payment: true },
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const invitationId = new URL(request.url).searchParams.get("invitationId")?.trim() || "";
    const invitation = await getOwnedInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Pilih acara untuk membuka WA Blast." }, { status: 400 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json({ error: "Undangan Digital untuk acara ini belum aktif." }, { status: 402 });
    }

    const selected = await prisma.guest.findMany({
      where: { invitationId: invitation.id, waBlastSelected: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        waBlastSelected: true,
        waBlastSentAt: true,
      },
    });

    return NextResponse.json({
      invitation: { id: invitation.id, title: invitation.title },
      quota: invitation.waBlastQuota,
      selected,
      selectedCount: selected.length,
      remaining: Math.max(0, invitation.waBlastQuota - selected.length),
      canSelectRecipients: invitation.waBlastQuota > 0,
    });
  } catch (error) {
    console.error("GET /api/wa-blast failed", error);
    return NextResponse.json({ error: "Data WA Blast gagal dimuat." }, { status: 500 });
  }
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
    const invitation = await getOwnedInvitation(user.id, invitationId);
    if (!invitation || !(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json({ error: "Undangan Digital untuk acara ini belum aktif." }, { status: 402 });
    }
    if (invitation.waBlastQuota <= 0) {
      return NextResponse.json({ error: "Beli add-on WA Blast 50 untuk mulai memilih penerima." }, { status: 402 });
    }

    const selectedCount = await prisma.guest.count({
      where: { invitationId: invitation.id, waBlastSelected: true },
    });
    if (selectedCount >= invitation.waBlastQuota) {
      return NextResponse.json({ error: "Kuota WA Blast sudah penuh." }, { status: 409 });
    }

    const guestId = String(body.guestId ?? "").trim();
    if (guestId) {
      const guest = await prisma.guest.findFirst({
        where: { id: guestId, invitationId: invitation.id },
      });
      if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
      if (!guest.phone) return NextResponse.json({ error: "Nomor WhatsApp tamu belum tersedia." }, { status: 400 });
      const updated = await prisma.guest.update({
        where: { id: guest.id },
        data: { waBlastSelected: true },
        select: { id: true, name: true, phone: true, waBlastSelected: true, waBlastSentAt: true },
      });
      return NextResponse.json({ guest: updated });
    }

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Nama tamu wajib diisi (maksimal 120 karakter)." }, { status: 400 });
    }
    if (!phone || phone.length > 32) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib diisi (maksimal 32 karakter)." }, { status: 400 });
    }

    const matches = await findGuestsByContact(invitation.id, name, phone);
    if (matches.length > 1) {
      return NextResponse.json(
        { error: "Beberapa tamu dengan nama dan nomor ini sudah terdaftar. Pilih penerima dari daftar tamu." },
        { status: 409 },
      );
    }
    if (matches.length === 1) {
      const existing = matches[0];
      if (existing.waBlastSelected) {
        return NextResponse.json(
          { error: "Tamu ini sudah ada dalam daftar WA Blast.", guestId: existing.id },
          { status: 409 },
        );
      }
      const updated = await prisma.guest.update({
        where: { id: existing.id },
        data: { waBlastSelected: true },
        select: { id: true, name: true, phone: true, waBlastSelected: true, waBlastSentAt: true },
      });
      return NextResponse.json({ guest: updated, reusedGuest: true });
    }

    const guest = await prisma.guest.create({
      data: {
        invitationId: invitation.id,
        name,
        phone,
        source: "MANUAL",
        waBlastSelected: true,
      },
      select: { id: true, name: true, phone: true, waBlastSelected: true, waBlastSentAt: true },
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wa-blast failed", error);
    return NextResponse.json({ error: "Tamu WA Blast belum dapat disimpan." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const url = new URL(request.url);
    const invitationId = url.searchParams.get("invitationId")?.trim() || "";
    const guestId = url.searchParams.get("guestId")?.trim() || "";
    const invitation = await getOwnedInvitation(user.id, invitationId);
    if (!invitation || !(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json({ error: "Undangan Digital untuk acara ini belum aktif." }, { status: 402 });
    }
    if (!guestId) return NextResponse.json({ error: "Tamu wajib dipilih." }, { status: 400 });

    const guest = await prisma.guest.findFirst({ where: { id: guestId, invitationId: invitation.id } });
    if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });

    await prisma.guest.update({ where: { id: guest.id }, data: { waBlastSelected: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/wa-blast failed", error);
    return NextResponse.json({ error: "Tamu belum dapat dihapus dari daftar WA Blast." }, { status: 500 });
  }
}
