import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invitationQrFilename } from "@/lib/invitations/qr";
import { invitationQrDownloadCard } from "@/lib/invitations/qr-card";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { createGuestQrToken } from "@/lib/usher/qr";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };

export const runtime = "nodejs";

/**
 * Render a named admission ticket for an existing guest of the owned event.
 * Use the same signed payload as Usher issuance so the scanner records that
 * canonical Guest's check-in. Rendering never creates guests or checks them in.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const url = new URL(request.url);
  const invitationId = url.searchParams.get("invitationId")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(invitationId)) {
    return NextResponse.json({ error: "Undangan belum dipilih." }, { status: 400, headers: PRIVATE_HEADERS });
  }
  const guestId = url.searchParams.get("guestId")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(guestId)) {
    return NextResponse.json({ error: "Tamu belum dipilih." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, ownerId: user.id },
      select: { id: true, title: true, payment: { select: { packageKey: true, status: true } } },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
      return NextResponse.json(
        { error: "QR undangan membutuhkan akses Undangan Digital." },
        { status: 402, headers: PRIVATE_HEADERS },
      );
    }

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, invitationId: invitation.id },
      select: { id: true, name: true },
    });
    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan pada acara ini." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const qrBytes = await QRCode.toBuffer(createGuestQrToken(guest.id), {
      type: "png",
      width: 640,
      margin: 4,
      errorCorrectionLevel: "M",
    });
    const download = url.searchParams.get("download") === "1";
    const locale = url.searchParams.get("locale") === "en" ? "en" : "id";
    const bytes = await invitationQrDownloadCard(qrBytes, invitation.title, guest.name, locale);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "image/png",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invitationQrFilename(invitation.title, guest.name)}"`,
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/invitations/qr failed", error);
    return NextResponse.json(
      { error: "QR belum dapat dibuat. Coba lagi." },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}
