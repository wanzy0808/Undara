import { prisma } from "@/lib/prisma";
import { hasPaidDigitalInvitation } from "@/lib/packages/access";

export type ManualPackageAccess = {
  digital: boolean;
  digitalCredits: number;
  guestbook: boolean;
};

const MAX_OWNER_DIGITAL_CREDITS = 100;

function normalizeCredits(value: unknown, legacyDigital: unknown) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0) {
    return Math.min(numeric, MAX_OWNER_DIGITAL_CREDITS);
  }
  return legacyDigital === true ? 1 : 0;
}

function parseAccess(metadata: unknown): ManualPackageAccess {
  if (!metadata || typeof metadata !== "object") {
    return { digital: false, digitalCredits: 0, guestbook: false };
  }
  const value = metadata as { digital?: unknown; digitalCredits?: unknown; guestbook?: unknown };
  const guestbook = value.guestbook === true;
  const digitalCredits = Math.max(
    normalizeCredits(value.digitalCredits, value.digital),
    guestbook ? 1 : 0,
  );
  return {
    digital: digitalCredits > 0,
    digitalCredits,
    guestbook,
  };
}

export async function getOwnerPackageGrant(userId: string): Promise<ManualPackageAccess> {
  const latest = await prisma.auditLog.findFirst({
    where: {
      action: "OWNER_PACKAGE_ACCESS_UPDATED",
      entity: "User",
      entityId: userId,
    },
    select: { metadata: true },
    orderBy: { createdAt: "desc" },
  });
  return parseAccess(latest?.metadata);
}

export async function getOwnerGrantedDigitalInvitationIds(
  userId: string,
  includeInvitationId?: string,
) {
  const grant = await getOwnerPackageGrant(userId);
  if (grant.digitalCredits <= 0) return new Set<string>();

  const invitations = await prisma.invitation.findMany({
    where: includeInvitationId
      ? { ownerId: userId, OR: [{ eventConfigured: true }, { id: includeInvitationId }] }
      : { ownerId: userId, eventConfigured: true },
    select: {
      id: true,
      payment: { select: { packageKey: true, status: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return new Set(
    invitations
      .filter((invitation) => !hasPaidDigitalInvitation(invitation.payment))
      .slice(0, grant.digitalCredits)
      .map((invitation) => invitation.id),
  );
}

export async function hasOwnerDigitalInvitationGrant(
  userId: string,
  invitationId: string,
  includeUnconfigured = false,
) {
  if (!invitationId) return false;
  return (
    await getOwnerGrantedDigitalInvitationIds(
      userId,
      includeUnconfigured ? invitationId : undefined,
    )
  ).has(invitationId);
}

export async function setOwnerPackageGrant(
  actorId: string,
  userId: string,
  access: ManualPackageAccess,
) {
  const guestbook = access.guestbook === true;
  const digitalCredits = Math.max(
    normalizeCredits(access.digitalCredits, access.digital),
    guestbook ? 1 : 0,
  );
  return prisma.auditLog.create({
    data: {
      actorId,
      action: "OWNER_PACKAGE_ACCESS_UPDATED",
      entity: "User",
      entityId: userId,
      metadata: { digital: digitalCredits > 0, digitalCredits, guestbook },
    },
  });
}
