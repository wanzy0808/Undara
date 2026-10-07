import { weddingSessionsFor, WeddingSessionError } from "@/lib/events/wedding-sessions";
import { checkInWeddingSession } from "@/lib/usher/wedding-check-in";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountGuestbook } from "@/lib/packages/server-access";
import { verifyGuestQrToken } from "@/lib/usher/qr";

// Legacy Usher endpoint: resolve the event from the canonical Guest.id, never
// from the first invitation belonging to the account.
async function resolveGuest(userId: string, value: string, invitationId = "") {
  const raw = value.trim();
  const guestId = verifyGuestQrToken(raw) ?? raw;
  if (!guestId) return null;
  return prisma.guest.findFirst({
    where: {
      id: guestId,
      invitation: { ownerId: userId },
      ...(invitationId ? { invitationId } : {}),
    },
    include: { table: true, invitation: { include: { payment: true } } },
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }
    const params = new URL(request.url).searchParams;
    const value = params.get("token") ?? params.get("guestId") ?? "";
    if (!value) return NextResponse.json({ error: "QR token wajib diisi." }, { status: 400 });

    const guest = await resolveGuest(user.id, value, params.get("invitationId") ?? "");
    if (!guest) return NextResponse.json({ error: "QR/tamu tidak ditemukan pada acara ini." }, { status: 404 });
    if (!(await hasAccountGuestbook(user.id, guest.invitation.payment))) {
      return NextResponse.json({ error: "Usher App belum aktif untuk acara tamu ini." }, { status: 402 });
    }

    return NextResponse.json({
      guest: {
        id: guest.id,
        invitationId: guest.invitationId,
        name: guest.name,
        phone: guest.phone,
        rsvpStatus: guest.rsvpStatus,
        plusOnes: guest.plusOnes,
        checkedIn: guest.checkedIn,
        checkedInAt: guest.checkedInAt,
        table: guest.table,
      },
    });
  } catch (error) {
    console.error("GET /api/usher failed", error);
    return NextResponse.json({ error: "Verifikasi tamu gagal." }, { status: 500 });
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
    const value = String(body.token ?? body.guestId ?? "").trim();
    if (!value) return NextResponse.json({ error: "QR token wajib diisi." }, { status: 400 });

    const guest = await resolveGuest(user.id, value, String(body.invitationId ?? "").trim());
    if (!guest) return NextResponse.json({ error: "QR/tamu tidak ditemukan pada acara ini." }, { status: 404 });
    if (!(await hasAccountGuestbook(user.id, guest.invitation.payment))) {
      return NextResponse.json({ error: "Usher App belum aktif untuk acara tamu ini." }, { status: 402 });
    }

    if (weddingSessionsFor(guest.invitation).length) return NextResponse.json(await checkInWeddingSession(user.id, guest.invitationId, guest.id, body.session));
    const updatedCount = await prisma.guest.updateMany({
      where: { id: guest.id, invitationId: guest.invitationId, checkedIn: false },
      data: { checkedIn: true, checkedInAt: new Date(), checkedInById: user.id },
    });
    if (!updatedCount.count) {
      return NextResponse.json({ error: "Tamu sudah check-in." }, { status: 409 });
    }
    const checkedIn = await prisma.guest.findUnique({
      where: { id: guest.id },
      select: {
        id: true,
        invitationId: true,
        name: true,
        phone: true,
        rsvpStatus: true,
        plusOnes: true,
        checkedIn: true,
        checkedInAt: true,
        table: true,
      },
    });
    return NextResponse.json({ guest: checkedIn });
  } catch (error) {
    if (error instanceof WeddingSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST /api/usher failed", error);
    return NextResponse.json({ error: "Check-in gagal." }, { status: 500 });
  }
}
