import { prisma } from "@/lib/prisma";
import { hasPaidDigitalInvitation } from "@/lib/packages/access";

export type ManualPackageAccess = {
  digital: boolean;
  digitalCredits: number;
  guestbook: boolean;
};

const MAX_OWNER_DIGITAL_CREDITS = 100;
const ASSIGNMENT_ACTION = "OWNER_DIGITAL_INVITATION_ASSIGNED";

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

function assignmentInvitationId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";
  const invitationId = String((metadata as { invitationId?: unknown }).invitationId ?? "").trim();
  return invitationId;
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

async function ensureOwnerDigitalAssignments(
  userId: string,
  includeInvitationId?: string,
  actorId?: string | null,
) {
  const grant = await getOwnerPackageGrant(userId);
  if (grant.digitalCredits <= 0) return new Set<string>();

  const [assignmentLogs, invitations] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: ASSIGNMENT_ACTION,
        entity: "User",
        entityId: userId,
      },
      select: { metadata: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: includeInvitationId
        ? { ownerId: userId, OR: [{ eventConfigured: true }, { id: includeInvitationId }] }
        : { ownerId: userId, eventConfigured: true },
      select: {
        id: true,
        payment: { select: { packageKey: true, status: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);

  const eligible = invitations.filter(
    (invitation) => !hasPaidDigitalInvitation(invitation.payment),
  );
  const eligibleIds = new Set(eligible.map((invitation) => invitation.id));
  const assigned: string[] = [];
  const seen = new Set<string>();

  for (const log of assignmentLogs) {
    const invitationId = assignmentInvitationId(log.metadata);
    if (!invitationId || seen.has(invitationId) || !eligibleIds.has(invitationId)) continue;
    seen.add(invitationId);
    assigned.push(invitationId);
  }

  const active = new Set(assigned.slice(0, grant.digitalCredits));
  if (active.size >= grant.digitalCredits) return active;

  for (const invitation of eligible) {
    if (seen.has(invitation.id)) {
      if (active.size < grant.digitalCredits) active.add(invitation.id);
      continue;
    }
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: ASSIGNMENT_ACTION,
        entity: "User",
        entityId: userId,
        metadata: { invitationId: invitation.id },
      },
    });
    seen.add(invitation.id);
    active.add(invitation.id);
    if (active.size >= grant.digitalCredits) break;
  }

  return active;
}

export async function getOwnerGrantedDigitalInvitationIds(
  userId: string,
  includeInvitationId?: string,
) {
  return ensureOwnerDigitalAssignments(userId, includeInvitationId);
}

export async function hasOwnerDigitalInvitationGrant(
  userId: string,
  invitationId: string,
  includeUnconfigured = false,
) {
  if (!invitationId) return false;
  return (
    await ensureOwnerDigitalAssignments(
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
  const grant = await prisma.auditLog.create({
    data: {
      actorId,
      action: "OWNER_PACKAGE_ACCESS_UPDATED",
      entity: "User",
      entityId: userId,
      metadata: { digital: digitalCredits > 0, digitalCredits, guestbook },
    },
  });
  await ensureOwnerDigitalAssignments(userId, undefined, actorId);
  return grant;
}
