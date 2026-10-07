import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { hasInvitationAccess } from "@/lib/invitations/password";
import { InvitationLockedState } from "@/components/PublicInvitation/PublicInvitation";
import PublicInvitationRenderer from "@/components/PublicInvitation/PublicInvitationRenderer";
import InvitationPasswordGate from "@/components/PublicInvitation/InvitationPasswordGate";

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: { payment: true, assets: true },
  });

  if (!invitation) notFound();
  if (
    !invitation.eventConfigured ||
    !invitation.templateKey.trim() ||
    !invitation.isPublished ||
    !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitation.id))
  ) {
    return <InvitationLockedState />;
  }
  if (invitation.passwordProtected && !(await hasInvitationAccess(slug))) {
    return <InvitationPasswordGate slug={slug} />;
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { viewCount: { increment: 1 } },
  });

  return <PublicInvitationRenderer invitation={invitation} />;
}
