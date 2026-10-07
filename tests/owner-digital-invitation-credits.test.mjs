import assert from "node:assert/strict";
import test from "node:test";
import * as paidAccess from "../lib/packages/access.ts";
import { loadSource } from "./helpers/package-access.mjs";

function fixture(metadata, invitationRows = [
  { id: "paid-first", payment: { packageKey: "INVITATION_BASIC", status: "PAID" } },
  { id: "owner-a", payment: null },
  { id: "owner-b", payment: null },
  { id: "owner-c", payment: null },
]) {
  const writes = [];
  const prisma = {
    auditLog: {
      findFirst: async () => metadata == null ? null : { metadata },
      findMany: async (query) => writes
        .map((entry) => entry.data)
        .filter((entry) => entry.action === query.where.action && entry.entityId === query.where.entityId)
        .map((entry) => ({ metadata: entry.metadata })),
      create: async (query) => { writes.push(query); return query.data; },
    },
    invitation: {
      findMany: async () => invitationRows,
    },
    payment: { findFirst: async () => null },
  };
  const grants = loadSource("lib/packages/owner-grants.ts", {
    "@/lib/prisma": { prisma },
    "@/lib/packages/access": paidAccess,
  });
  const access = loadSource("lib/packages/server-access.ts", {
    "@/lib/prisma": { prisma },
    "@/lib/packages/access": paidAccess,
    "@/lib/packages/owner-grants": grants,
  });
  return { grants, access, writes };
}

test("two Owner Rp150k rights activate exactly two otherwise-unpaid invitations", async () => {
  const f = fixture({ digital: true, digitalCredits: 2, guestbook: false });
  assert.deepEqual(
    [...await f.grants.getOwnerGrantedDigitalInvitationIds("user-a")],
    ["owner-a", "owner-b"],
  );
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "owner-a"), true);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "owner-b"), true);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "owner-c"), false);
  assert.equal(
    await f.access.hasAccountDigitalInvitation(
      "user-a",
      { packageKey: "INVITATION_BASIC", status: "PAID" },
      "owner-c",
    ),
    true,
  );
});

test("an already assigned Owner right stays on the same invitation when another draft becomes eligible later", async () => {
  const invitations = [{ id: "event-b", payment: null }];
  const f = fixture({ digital: true, digitalCredits: 1, guestbook: false }, invitations);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "event-b"), true);

  invitations.unshift({ id: "event-a", payment: null });
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "event-b"), true);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "event-a"), false);
});

test("legacy boolean Owner grant migrates logically to one invitation right", async () => {
  const f = fixture({ digital: true, guestbook: false });
  const grant = await f.grants.getOwnerPackageGrant("user-a");
  assert.equal(grant.digitalCredits, 1);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "owner-a"), true);
  assert.equal(await f.access.hasAccountDigitalInvitation("user-a", null, "owner-b"), false);
});

test("saving Owner rights persists the explicit credit count without recording a sale", async () => {
  const f = fixture(null);
  await f.grants.setOwnerPackageGrant("owner-user", "target-user", {
    digital: true,
    digitalCredits: 4,
    guestbook: false,
  });
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].data.action, "OWNER_PACKAGE_ACCESS_UPDATED");
  assert.equal(f.writes[0].data.entity, "User");
  assert.equal(f.writes[0].data.entityId, "target-user");
  assert.deepEqual(f.writes[0].data.metadata, {
    digital: true,
    digitalCredits: 4,
    guestbook: false,
  });
});
