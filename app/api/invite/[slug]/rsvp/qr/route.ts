import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { verifyGuestQrToken } from "@/lib/usher/qr";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { checkPublicRateLimit, getClientIp } from "@/lib/security/public-rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
  const { slug } = await params;
  const limit = checkPublicRateLimit(`rsvp-qr:${slug}:${getClientIp(request)}`, 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Coba lagi sebentar lagi." }, {
    status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) },
  });
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    if (!token || token.length > 256) return NextResponse.json({ error: "QR tidak valid." }, { status: 400, headers });
    const guestId = verifyGuestQrToken(token);
    if (!guestId) return NextResponse.json({ error: "QR tidak valid." }, { status: 403, headers });
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, rsvpStatus: "ATTENDING", invitation: { slug } },
      include: { invitation: { include: { payment: true } } },
    });
    if (!guest || !guest.invitation.isPublished || !guest.invitation.eventConfigured
      || !(await hasAccountDigitalInvitation(guest.invitation.ownerId, guest.invitation.payment))) {
      return NextResponse.json({ error: "QR tidak tersedia." }, { status: 404, headers });
    }
    const png = await QRCode.toBuffer(token, { type: "png", width: 840, margin: 4, errorCorrectionLevel: "M" });
    return new Response(new Uint8Array(png), {
      headers: { ...headers, "Content-Type": "image/png",
        "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="undara-qr.png"` },
    });
  } catch {
    return NextResponse.json({ error: "QR belum dapat dimuat." }, { status: 503, headers });
  }
}
