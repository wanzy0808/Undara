import { prisma } from "@/lib/prisma";

export type SeatingTableShape = "ROUND" | "RECTANGLE" | "SQUARE";

/** Both table creation endpoints share the event lock used by layout saves/resets. */
export async function createEventTables(ownerId: string, invitationId: string, input: {
  capacity: number;
  shape: SeatingTableShape;
  name?: string;
  count?: number;
  prefix?: "Meja" | "Table";
}) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!locked.length) return { error: "Acara tidak ditemukan.", status: 404 };
    const existing = await tx.weddingTable.findMany({ where: { invitationId }, select: { name: true } });
    const count = input.count ?? 1;
    if (existing.length + count > 100) return { error: "Maksimal 100 meja per acara.", status: 409 };

    const names = new Set(existing.map((table) => table.name.toLowerCase()));
    let next = existing.reduce((max, table) => {
      const ordinal = Number(/^(?:meja|table)\s+(\d+)$/i.exec(table.name)?.[1] ?? 0);
      return Number.isSafeInteger(ordinal) && ordinal < Number.MAX_SAFE_INTEGER - 300 ? Math.max(max, ordinal) : max;
    }, existing.length) + 1;
    const tables = [];
    for (let index = 0; index < count; index += 1) {
      let name = input.name;
      if (!name) {
        do { name = `${input.prefix ?? "Meja"} ${next++}`; } while (names.has(name.toLowerCase()));
      }
      names.add(name.toLowerCase());
      tables.push(await tx.weddingTable.create({ data: { invitationId, name, capacity: input.capacity, shape: input.shape } }));
    }
    return { tables, status: 201 };
  });
}
