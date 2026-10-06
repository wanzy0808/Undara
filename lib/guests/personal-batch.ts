import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";

const MAX_BATCH = 100;
const categories = ["REGULAR", "VIP", "VVIP"];

export class PersonalBatchError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type Recipient = { key: string; name: string; category: string; guestId: string };

function parseRecipients(value: unknown): Recipient[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_BATCH) {
    throw new PersonalBatchError("Isi 1 sampai 100 tamu per proses.");
  }
  const keys = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new PersonalBatchError("Data tamu tidak valid.");
    if ((item.guestId !== undefined && typeof item.guestId !== "string") || (item.category !== undefined && typeof item.category !== "string")) {
      throw new PersonalBatchError("Data tamu tidak valid.");
    }
    const guestId = typeof item.guestId === "string" ? item.guestId.trim() : "";
    const key = guestId || (typeof item.key === "string" ? item.key : "");
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const category = typeof item.category === "string" ? item.category.trim() : "REGULAR";
    if (guestId.length > 120 || (!guestId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))) {
      throw new PersonalBatchError("Identitas tamu tidak valid.");
    }
    if (!guestId && (!name || name.length > 120)) throw new PersonalBatchError("Nama tamu wajib diisi (maksimal 120 karakter).");
    if (!category || category.length > 60 || (!guestId && !categories.includes(category))) throw new PersonalBatchError("Kategori tamu tidak valid.");
    const identity = `${guestId ? "guest" : "new"}:${key}`;
    if (keys.has(identity)) throw new PersonalBatchError("Tamu yang sama dipilih lebih dari sekali.");
    keys.add(identity);
    return { key, name, category, guestId };
  });
}

export function parsePersonalBatchIds(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_BATCH
    || value.some((id) => typeof id !== "string" || !id.trim() || id.length > 120)) {
    throw new PersonalBatchError("Pilih 1 sampai 100 undangan personal per proses.");
  }
  const ids = value.map((id: string) => id.trim());
  if (new Set(ids).size !== ids.length) throw new PersonalBatchError("Tamu yang sama dipilih lebih dari sekali.");
  return ids;
}

// A random per-row UUID makes retries stable without a second recipient table.
function recipientToken(ownerId: string, invitationId: string, key: string) {
  return createHash("sha256").update(JSON.stringify(["undara-personal", ownerId, invitationId, key])).digest("hex").slice(0, 36);
}

export async function createPersonalBatch(ownerId: string, invitationId: string, value: unknown, published: unknown) {
  const recipients = parseRecipients(value);
  if (published !== undefined && typeof published !== "boolean") throw new PersonalBatchError("Status publikasi tidak valid.");
  return mutateBatch(ownerId, invitationId, published === true, async (tx) => {
    const guestIds = recipients.filter((row) => row.guestId).map((row) => row.guestId);
    const saved = await tx.guest.findMany({ where: { invitationId, id: { in: guestIds } } });
    if (saved.length !== guestIds.length) throw new PersonalBatchError("Tamu tidak ditemukan pada acara ini.", 404);
    const savedById = new Map(saved.map((guest) => [guest.id, guest]));
    const tokens = recipients.filter((row) => !row.guestId).map((row) => recipientToken(ownerId, invitationId, row.key));
    const prior = await tx.guest.findMany({ where: { personalToken: { in: tokens } } });
    const priorByToken = new Map(prior.map((guest) => [guest.personalToken, guest]));

    // Validate every row before writing any. Throwing also rolls back DB failures.
    for (const row of recipients) {
      const guest = row.guestId ? savedById.get(row.guestId) : priorByToken.get(recipientToken(ownerId, invitationId, row.key));
      if (row.guestId && !categories.includes(row.category) && row.category !== guest?.category) {
        throw new PersonalBatchError("Kategori tamu tidak valid.");
      }
      if (!row.guestId && guest && (guest.invitationId !== invitationId || guest.name !== row.name || guest.category !== row.category)) {
        throw new PersonalBatchError("Tamu ini sudah disimpan. Muat ulang daftar sebelum mengubahnya.", 409);
      }
    }

    const invitations = [];
    for (const row of recipients) {
      const token = row.guestId ? savedById.get(row.guestId)!.personalToken || randomBytes(18).toString("hex") : recipientToken(ownerId, invitationId, row.key);
      const existing = row.guestId ? savedById.get(row.guestId) : priorByToken.get(token);
      const guest = existing
        ? await tx.guest.update({ where: { id: existing.id }, data: {
          ...(row.guestId ? { category: row.category, personalToken: token } : {}),
          ...(published === true ? { personalPublished: true } : {}),
        } })
        : await tx.guest.create({ data: { invitationId, name: row.name, category: row.category, source: "MANUAL", personalToken: token, personalPublished: published === true } });
      const safe = { ...guest };
      Reflect.deleteProperty(safe, "personalPasswordHash");
      invitations.push(safe);
    }
    return { invitations };
  });
}

export async function publishPersonalBatch(ownerId: string, invitationId: string, value: unknown) {
  const ids = parsePersonalBatchIds(value);
  return mutateBatch(ownerId, invitationId, true, async (tx) => {
    const where = { invitationId, id: { in: ids }, personalToken: { not: null } };
    const guests = await tx.guest.findMany({ where, select: { id: true } });
    if (guests.length !== ids.length) throw new PersonalBatchError("Undangan personal tidak ditemukan pada acara ini.", 404);
    const result = await tx.guest.updateMany({ where, data: { personalPublished: true } });
    if (result.count !== ids.length) throw new PersonalBatchError("Daftar tamu berubah. Muat ulang dan coba lagi.", 409);
    return { count: result.count };
  });
}

async function mutateBatch<T>(ownerId: string, invitationId: string, publish: boolean, write: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!locked.length) throw new PersonalBatchError("Acara tidak ditemukan.", 404);
    const invitation = await tx.invitation.findFirst({ where: { id: invitationId, ownerId, eventConfigured: true }, include: { payment: true } });
    if (!invitation) throw new PersonalBatchError("Acara tidak ditemukan.", 404);
    if (publish && !invitation.isPublished) throw new PersonalBatchError("Terbitkan undangan acara sebelum membagikan undangan personal.", 409);
    if (publish && !(await hasAccountDigitalInvitation(ownerId, invitation.payment))) throw new PersonalBatchError("Aktifkan akses Undangan Digital sebelum publish.", 403);
    return write(tx);
  }, { maxWait: 5000, timeout: 20000 });
}
