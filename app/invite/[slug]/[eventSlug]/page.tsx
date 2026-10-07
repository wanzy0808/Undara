import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { hasInvitationAccess } from "@/lib/invitations/password";
import { slugifyEvent } from "@/lib/invitations/slug";
import { InvitationLockedState } from "@/components/PublicInvitation/PublicInvitation";
import PublicInvitationRenderer from "@/components/PublicInvitation/PublicInvitationRenderer";
import InvitationPasswordGate from "@/components/PublicInvitation/InvitationPasswordGate";

export default async function EventInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>;
}) {
  const { slug, eventSlug } = await params;
  const baseInvitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!baseInvitation) notFound();

  const eventInvitations = await prisma.invitation.findMany({
    where: {
      ownerId: baseInvitation.ownerId,
      eventConfigured: true,
      id: { not: baseInvitation.id },
    },
    include: { payment: true, assets: true },
    orderBy: { createdAt: "asc" },
  });

  const invitation = eventInvitations.find(
    (item) => slugifyEvent(item.title || "event") === eventSlug,
  );

  if (!invitation) notFound();
  if (
    !invitation.templateKey.trim() ||
    !invitation.isPublished ||
    !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitation.id))
  ) {
    return <InvitationLockedState />;
  }
  if (
    invitation.passwordProtected &&
    !(await hasInvitationAccess(invitation.slug))
  ) {
    return <InvitationPasswordGate slug={invitation.slug} />;
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { viewCount: { increment: 1 } },
  });

  return <PublicInvitationRenderer invitation={invitation} />;
}
