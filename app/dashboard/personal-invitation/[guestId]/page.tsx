import { invitationForWeddingGuest, WeddingSessionError } from "@/lib/events/wedding-sessions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublicInvitationRenderer from "@/components/PublicInvitation/PublicInvitationRenderer";
import { Button } from "@/components/ui/button";

export default async function PersonalInvitationPreviewPage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { guestId } = await params;
  const guest = await prisma.guest.findFirst({
    where: {
      id: guestId,
      personalToken: { not: null },
      invitation: { ownerId: user.id, eventConfigured: true },
    },
    include: {
      invitation: { include: { payment: true, assets: true } },
    },
  });
  if (!guest) notFound();

  const invitation = guest.invitation;
  let scopedInvitation;
  try { scopedInvitation = invitationForWeddingGuest(invitation, guest.invitedSessions); }
  catch (error) { if (error instanceof WeddingSessionError) notFound(); throw error; }

  const content = (
    <PublicInvitationRenderer
      preview
      invitation={scopedInvitation}
      personalGuest={{
        id: guest.id,
        name: guest.name,
        token: guest.personalToken!,
        invitedPax: guest.invitedPax,
        personalAddressee: guest.personalAddressee,
        recipientType: guest.recipientType as "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP",
        personalEnvelopeEnabled: guest.personalEnvelopeEnabled,
        personalLanguage: guest.personalLanguage === "EN" ? "EN" : "ID",
      }}
    />
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button asChild size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Pratinjau Personal Invitation
          </p>
          <p className="truncate text-sm font-medium">
            {invitation.title || "Acara"} · {guest.personalAddressee || guest.name}
          </p>
        </div>
      </div>
      {guest.personalGreeting && (
        <div className="border-b border-border bg-background px-4 py-3 text-center font-[family-name:var(--font-undara-sans)] text-sm">
          <p className="mx-auto max-w-xl whitespace-pre-wrap text-sm text-muted-foreground">{guest.personalGreeting}</p>
        </div>
      )}
      {content}
    </main>
  );
}
