import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { createGuestQrToken, verifyGuestQrToken } from "@/lib/usher/qr";

export const runtime = "nodejs";

const IMAGE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

/** Render an existing signed ticket for its event owner without an external QR service. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401, headers: IMAGE_HEADERS });

    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    if (!token || token.length > 256) {
      return NextResponse.json({ error: "QR tidak valid." }, { status: 400, headers: IMAGE_HEADERS });
    }
    const guestId = verifyGuestQrToken(token);
    if (!guestId) return NextResponse.json({ error: "QR tidak valid." }, { status: 403, headers: IMAGE_HEADERS });

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, invitation: { ownerId: user.id } },
      include: { invitation: { include: { payment: true } } },
    });
    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak terdaftar pada acara ini." }, { status: 404, headers: IMAGE_HEADERS });
    }
    if (!(await hasAccountDigitalInvitation(user.id, guest.invitation.payment, guest.invitation.id))) {
      return NextResponse.json({ error: "QR tamu membutuhkan paket Undangan Digital." }, { status: 402, headers: IMAGE_HEADERS });
    }

    const png = await QRCode.toBuffer(token, { type: "png", width: 640, margin: 4, errorCorrectionLevel: "M" });
    return new Response(new Uint8Array(png), {
      headers: {
        ...IMAGE_HEADERS,
        "Content-Type": "image/png",
        "Content-Length": String(png.byteLength),
        "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="undara-tamu-qr.png"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "QR belum dapat dimuat." }, { status: 503, headers: IMAGE_HEADERS });
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
    const guestId = String(body.guestId ?? "").trim();
    if (!guestId) return NextResponse.json({ error: "Tamu belum dipilih." }, { status: 400 });

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { invitation: { include: { payment: true } } },
    });
    if (!guest || guest.invitation.ownerId !== user.id) {
      return NextResponse.json({ error: "Tamu tidak terdaftar pada acara ini." }, { status: 404 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, guest.invitation.payment, guest.invitation.id))) {
      return NextResponse.json({ error: "QR tamu membutuhkan paket Undangan Digital." }, { status: 402 });
    }

    const token = createGuestQrToken(guest.id);
    return NextResponse.json({
      guest: {
        id: guest.id,
        invitationId: guest.invitationId,
        name: guest.name,
        phone: guest.phone,
        rsvpStatus: guest.rsvpStatus,
        plusOnes: guest.plusOnes,
      },
      token,
    });
  } catch (error) {
    console.error("POST /api/usher/qr failed", error);
    return NextResponse.json({ error: "QR tamu gagal dibuat." }, { status: 500 });
  }
}
