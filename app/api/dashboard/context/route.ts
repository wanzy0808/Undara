import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackageEntitlements, hasPaidDigitalInvitation } from "@/lib/packages/access";
import { getOwnerGrantedDigitalInvitationIds, getOwnerPackageGrant } from "@/lib/packages/owner-grants";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const ownerGrant = await getOwnerPackageGrant(user.id);

  const [firstInvitation, latestPayment, invitations, guestCount, rsvpCount] =
    await Promise.all([
      prisma.invitation.findFirst({
        where: { ownerId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findFirst({
        where: { userId: user.id, status: "PAID" },
        orderBy: { paidAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { ownerId: user.id, eventConfigured: true },
        select: {
          id: true,
          templateKey: true,
          isPublished: true,
          viewCount: true,
          payment: { select: { packageKey: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.guest.count({
        where: { invitation: { ownerId: user.id, eventConfigured: true } },
      }),
      prisma.guest.count({
        where: {
          invitation: { ownerId: user.id, eventConfigured: true },
          rsvpStatus: { not: "PENDING" },
        },
      }),
    ]);

  const paidEntitlements = getPackageEntitlements(latestPayment);
  const ownerGrantedInvitationIds = await getOwnerGrantedDigitalInvitationIds(user.id);
  const hasDigitalInvitation = ownerGrant.digitalCredits > 0 || paidEntitlements.hasDigitalInvitation;
  const hasGuestbook = ownerGrant.guestbook || paidEntitlements.hasGuestbook;
  const entitlements = {
    ...paidEntitlements,
    hasDigitalInvitation,
    hasGuestbook,
    canPublishInvitation: hasDigitalInvitation,
    canUploadInvitationAssets: hasDigitalInvitation,
    canUseGuestPlacement: hasDigitalInvitation,
    canUseUsherApp: hasGuestbook,
  };
  const invitationsCreated = invitations.length;
  const activeInvitations = invitations.filter(
    (item) => ownerGrantedInvitationIds.has(item.id) || hasPaidDigitalInvitation(item.payment),
  ).length;
  const invitationsShared = invitations.reduce(
    (sum, item) => sum + (item.viewCount ?? 0),
    0,
  );
  const invitationPublished = invitations.some((item) => item.isPublished);

  return NextResponse.json({
    profile: { displayName: user.firstName, email: user.email, avatarUrl: user.avatarUrl },
    wedding: firstInvitation
      ? {
          invitationId: firstInvitation.id,
          groomName: firstInvitation.groomName,
          brideName: firstInvitation.brideName,
          title: firstInvitation.title,
          venue: firstInvitation.venue,
          address: firstInvitation.address,
          mapUrl: firstInvitation.mapUrl,
          timezone: firstInvitation.timezone,
          eventDate: firstInvitation.eventDate,
          ceremonyTime: firstInvitation.ceremonyTime,
          receptionTime: firstInvitation.receptionTime,
          description: firstInvitation.description,
        }
      : {
          invitationId: null,
          groomName: "",
          brideName: "",
          title: "",
          venue: "",
          address: null,
          mapUrl: null,
          timezone: "Asia/Jakarta",
          eventDate: null,
          ceremonyTime: null,
          receptionTime: null,
          description: null,
        },
    package: latestPayment
      ? { key: latestPayment.packageKey, status: latestPayment.status }
      : ownerGrant.guestbook
        ? { key: "GUESTBOOK_DIGITAL", status: "OWNER_GRANTED" }
        : ownerGrant.digitalCredits > 0
          ? { key: "INVITATION_BASIC", status: "OWNER_GRANTED" }
          : { key: null, status: "UNPAID" },
    entitlements,
    overview: {
      invitationsCreated,
      invitationsLimit: null,
      unlimitedInvitations: true,
      activeInvitations,
      totalRsvp: rsvpCount,
      totalGuests: guestCount,
      invitationsShared,
      invitationPublished,
    },
  });
}
