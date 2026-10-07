import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { hasInvitationAccess } from "@/lib/invitations/password";
import { InvitationLockedState } from "@/components/PublicInvitation/PublicInvitation";
import PublicInvitationRenderer from "@/components/PublicInvitation/PublicInvitationRenderer";
import PersonalInvitationPasswordGate from "@/components/PublicInvitation/PersonalInvitationPasswordGate";

export default async function PersonalInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: { payment: true, assets: true },
  });
  if (!invitation) notFound();

  const guest = await prisma.guest.findFirst({
    where: {
      invitationId: invitation.id,
      personalToken: token,
    },
  });
  if (!guest) notFound();

  if (!invitation.isPublished || !guest.personalPublished || !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitation.id))) {
    return <InvitationLockedState />;
  }

  if (
    guest.personalPasswordProtected &&
    !(await hasInvitationAccess(`personal-${token}`))
  ) {
    return (
      <PersonalInvitationPasswordGate
        slug={slug}
        token={token}
        guestName={guest.personalAddressee || guest.name}
      />
    );
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { personalViewCount: { increment: 1 } },
  });

  const content = <PublicInvitationRenderer invitation={invitation} personalGuest={{
    id: guest.id,
    name: guest.name,
    token,
    invitedPax: guest.invitedPax,
    personalAddressee: guest.personalAddressee,
    recipientType: guest.recipientType as "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP",
    personalEnvelopeEnabled: guest.personalEnvelopeEnabled,
    personalLanguage: guest.personalLanguage === "EN" ? "EN" : "ID",
  }} />;

  return (
    <>
      {guest.personalGreeting && (
        <div className="border-b border-primary/15 bg-primary/[0.045] px-4 py-3 text-center font-sans text-sm text-foreground">
          <p className="mx-auto max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{guest.personalGreeting}</p>
        </div>
      )}
      {content}
    </>
  );
}
