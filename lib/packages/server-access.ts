import { prisma } from "@/lib/prisma";
import { hasPaidDigitalInvitation, hasPaidGuestbook } from "@/lib/packages/access";
import {
  getOwnerPackageGrant,
  hasOwnerDigitalInvitationGrant,
} from "@/lib/packages/owner-grants";

type PaymentLike = { packageKey: string; status: string } | null | undefined;

/**
 * Payment entitlements remain event-scoped.
 * Owner Digital Invitation grants are counted per invitation: one credit covers one configured,
 * otherwise-unpaid invitation. Guestbook remains the existing account-level owner override.
 */
export async function hasAccountDigitalInvitation(
  userId: string,
  directPayment?: PaymentLike,
  invitationId?: string,
) {
  if (hasPaidDigitalInvitation(directPayment)) return true;
  if (invitationId) return hasOwnerDigitalInvitationGrant(userId, invitationId);

  // Backward-compatible account-level capability checks. Sensitive event routes should pass
  // invitationId so one Owner credit can never unlock every invitation.
  const grant = await getOwnerPackageGrant(userId);
  return grant.digitalCredits > 0;
}

export async function hasAccountGuestbook(
  userId: string,
  directPayment?: PaymentLike,
) {
  if (hasPaidGuestbook(directPayment)) return true;

  const grant = await getOwnerPackageGrant(userId);
  if (grant.guestbook) return true;

  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      status: "PAID",
      packageKey: { in: ["GUESTBOOK_DIGITAL", "INVITATION_GUESTBOOK"] },
    },
    select: { packageKey: true, status: true },
    orderBy: { paidAt: "desc" },
  });

  return hasPaidGuestbook(payment);
}
