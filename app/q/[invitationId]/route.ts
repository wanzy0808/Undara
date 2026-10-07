import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";

/**
 * Stable public destination for an invitation-share QR.
 * An invitation may change slug while still a draft, but its QR must not.
 * Never treat this as an individual guest ticket or Usher check-in token.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const { invitationId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(invitationId)) {
    return new Response("Undangan tidak ditemukan.", { status: 404 });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: {
        ownerId: true,
        slug: true,
        eventConfigured: true,
        templateKey: true,
        isPublished: true,
        payment: { select: { packageKey: true, status: true } },
      },
    });
    if (
      !invitation ||
      !invitation.eventConfigured ||
      !invitation.templateKey.trim() ||
      !invitation.isPublished ||
      !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitationId))
    ) {
      return new Response("Undangan belum tersedia.", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const rootDomain = (process.env.INVITATION_ROOT_DOMAIN || "dcwedding.com").trim().toLowerCase();
    if (!/^[a-z0-9.-]+$/.test(rootDomain)) {
      throw new Error("Invalid invitation root domain");
    }
    const destination = new URL(`https://${invitation.slug}.${rootDomain}/`);
    const response = NextResponse.redirect(destination, { status: 302 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("GET /q/[invitationId] failed", error);
    return new Response("Undangan belum dapat dibuka.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
