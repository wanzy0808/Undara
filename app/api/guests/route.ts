import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePersonalGuestFields } from "@/lib/guests/personal-profile";
import { findGuestsByContact } from "@/lib/guests/identity";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

async function getInvitation(userId: string, invitationId: string) {
  if (!invitationId) return null;
  return prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: userId },
  });
}

const guestSelect = {
  id: true,
  invitationId: true,
  tableId: true,
  seatNumber: true,
  name: true,
  phone: true,
  category: true,
  tags: true,
  personalAddressee: true,
  recipientType: true,
  invitedPax: true,
  personalGreeting: true,
  personalSharedAt: true,
  source: true,
  rsvpStatus: true,
  plusOnes: true,
  rsvpEvents: true,
  rsvpAnswers: true,
  checkedIn: true,
  checkedInAt: true,
  checkedInById: true,
  waBlastSelected: true,
  waBlastSentAt: true,
  personalToken: true,
  personalPublished: true,
  personalPasswordProtected: true,
  personalViewCount: true,
  createdAt: true,
  updatedAt: true,
  table: true,
} as const;

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((tag: unknown) => String(tag).trim())
    .filter((tag: string) => tag.length > 0);
  return Array.from(new Set<string>(normalized)).slice(0, 20);
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const url = new URL(request.url);
    if (url.searchParams.get("all") === "1") {
      const guests = await prisma.guest.findMany({
        where: { invitation: { ownerId: user.id } },
        select: {
          ...guestSelect,
          invitation: { select: { id: true, title: true, slug: true } },
        },
        orderBy: [{ invitation: { createdAt: "asc" } }, { name: "asc" }],
      });
      return NextResponse.json({ guests, tables: [] });
    }

    const invitationId = url.searchParams.get("invitationId")?.trim() || "";
    if (!invitationId) {
      return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
    }
    const invitation = await getInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    if (!invitation.eventConfigured) {
      return NextResponse.json({ guests: [], tables: [], canManageGuests: false, canUseRsvp: true });
    }

    const [guests, tables] = await Promise.all([
      prisma.guest.findMany({
        where: { invitationId: invitation.id },
        select: guestSelect,
        orderBy: { name: "asc" },
      }),
      prisma.weddingTable.findMany({
        where: { invitationId: invitation.id },
        include: { _count: { select: { guests: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      invitation: { id: invitation.id, title: invitation.title, slug: invitation.slug },
      guests,
      tables,
      canManageGuests: true,
      canUseRsvp: true,
    });
  } catch (error) {
    console.error("GET /api/guests failed", error);
    return NextResponse.json({ error: "Data tamu gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    const invitationId = String(body.invitationId ?? "").trim();
    if (!invitationId) {
      return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
    }
    const invitation = await getInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    if (!invitation.eventConfigured) {
      return NextResponse.json({ error: "Lengkapi acara sebelum menambahkan tamu." }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const tableId = String(body.tableId ?? "").trim() || null;
    const plusOnes = Number(body.plusOnes ?? 0);
    let sharedGuestProfile;
    try {
      sharedGuestProfile = parsePersonalGuestFields(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Data tamu tidak valid." },
        { status: 400 },
      );
    }
    const category = sharedGuestProfile.category ?? (String(body.category ?? "").trim() || null);
    const tags = sharedGuestProfile.tags ?? normalizeTags(body.tags);

    if (!name) return NextResponse.json({ error: "Nama tamu wajib diisi." }, { status: 400 });
    const phone = String(body.phone ?? "").trim() || null;
    if (phone && phone.length > 32) {
      return NextResponse.json({ error: "Nomor WhatsApp maksimal 32 karakter." }, { status: 400 });
    }
    if (!Number.isInteger(plusOnes) || plusOnes < 0) {
      return NextResponse.json({ error: "Jumlah plus one tidak valid." }, { status: 400 });
    }

    if (phone) {
      const matches = await findGuestsByContact(invitation.id, name, phone);
      if (matches.length) {
        return NextResponse.json(
          {
            error: matches.length > 1
              ? "Beberapa tamu dengan nama dan nomor ini sudah ada. Periksa daftar tamu terlebih dahulu."
              : "Nama dan nomor ini sudah terdaftar pada acara ini. Gunakan data tamu yang sudah ada.",
            ...(matches.length === 1 ? { guestId: matches[0].id } : {}),
          },
          { status: 409 },
        );
      }
    }

    if (tableId) {
      const table = await prisma.weddingTable.findFirst({
        where: { id: tableId, invitationId: invitation.id },
        include: { _count: { select: { guests: true } } },
      });
      if (!table) return NextResponse.json({ error: "Meja tidak ditemukan pada acara ini." }, { status: 404 });
      if (table._count.guests >= table.capacity) {
        return NextResponse.json({ error: "Meja sudah penuh. Pilih meja lain atau simpan tamu tanpa meja." }, { status: 409 });
      }
    }

    const guest = await prisma.guest.create({
      data: {
        invitationId: invitation.id,
        name,
        phone,
        ...sharedGuestProfile,
        category: category ?? "REGULAR",
        tags,
        tableId,
        plusOnes,
        source: "MANUAL",
      },
      select: guestSelect,
    });
    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/guests failed", error);
    return NextResponse.json({ error: "Tamu gagal ditambahkan." }, { status: 500 });
  }
}
