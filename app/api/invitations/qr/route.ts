import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invitationQrFilename, invitationQrTarget } from "@/lib/invitations/qr";
import { invitationQrDownloadCard } from "@/lib/invitations/qr-card";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export const runtime = "nodejs";

/**
 * Generate/download one QR per owned invitation with active Digital access.
 * It encodes an app-hosted permanent invitation ID redirect, NOT a guest's
 * signed QR ticket. The PNG is generated in memory on this application server.
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

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, ownerId: user.id },
      select: { id: true, title: true, payment: { select: { packageKey: true, status: true } } },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    if (!(await hasAccountDigitalInvitation(user.id, invitation.payment))) {
      return NextResponse.json(
        { error: "QR undangan membutuhkan akses Undangan Digital." },
        { status: 402, headers: PRIVATE_HEADERS },
      );
    }

    // APP_URL is the canonical, publicly reachable application origin in
    // production. During local development fall back to the current request.
    const appOrigin = process.env.APP_URL?.trim() || url.origin;
    const qrTarget = invitationQrTarget(appOrigin, invitation.id);
    const qrBytes = await QRCode.toBuffer(qrTarget, {
      type: "png",
      width: 640,
      margin: 4,
      errorCorrectionLevel: "M",
    });
    const download = url.searchParams.get("download") === "1";
    const locale = url.searchParams.get("locale") === "en" ? "en" : "id";
    const bytes = download ? await invitationQrDownloadCard(qrBytes, invitation.title, locale) : qrBytes;
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "image/png",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invitationQrFilename(invitation.title)}"`,
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
