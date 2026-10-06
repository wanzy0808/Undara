import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hashInvitationPassword } from "@/lib/invitations/password";
import { parsePersonalGuestFields } from "@/lib/guests/personal-profile";
import { findGuestsByContact } from "@/lib/guests/identity";
import { createPersonalBatch, publishPersonalBatch, PersonalBatchError } from "@/lib/guests/personal-batch";

async function getEventInvitation(userId: string, invitationId: string) {
  if (!invitationId) return null;

  return prisma.invitation.findFirst({
    where: {
      id: invitationId,
      ownerId: userId,
      eventConfigured: true,
    },
  });
}

function sanitizeGuest<T extends object>(guest: T) {
  const { personalPasswordHash: _personalPasswordHash, ...safeGuest } = guest as T & {
    personalPasswordHash?: string | null;
  };
  return safeGuest;
}

async function uniqueToken() {
  while (true) {
    const token = randomBytes(18).toString("hex");
    const exists = await prisma.guest.findUnique({
      where: { personalToken: token },
      select: { id: true },
    });
    if (!exists) return token;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const invitationId = new URL(request.url).searchParams.get("invitationId")?.trim() ?? "";
    if (!invitationId) {
      return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
    }

    const invitation = await getEventInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    const guests = await prisma.guest.findMany({
      where: { invitationId: invitation.id, personalToken: { not: null } },
      include: { table: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      invitations: guests.map(sanitizeGuest),
      event: {
        id: invitation.id,
        slug: invitation.slug,
        title: invitation.title,
      },
    });
  } catch (error) {
    console.error("GET /api/personal-invitations failed", error);
    return NextResponse.json({ error: "Personal Invitation gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    const invitationId = String(body.invitationId ?? "").trim();
    if (!invitationId) {
      return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
    }

    if (body.recipients !== undefined) {
      return NextResponse.json(await createPersonalBatch(user.id, invitationId, body.recipients, body.published), { status: 201 });
    }

    const invitation = await getEventInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    if (!invitation.templateKey.trim()) {
      return NextResponse.json({ error: "Simpan desain di Edit undangan terlebih dahulu." }, { status: 409 });
    }
    let profile;
    try {
      profile = parsePersonalGuestFields(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Data undangan personal tidak valid." },
        { status: 400 },
      );
    }

    const guestId = String(body.guestId ?? "").trim();
    const token = await uniqueToken();

    if (guestId) {
      const guest = await prisma.guest.findFirst({
        where: { id: guestId, invitationId: invitation.id },
      });
      if (!guest) {
        return NextResponse.json({ error: "Tamu tidak ditemukan pada acara ini." }, { status: 404 });
      }
      if (profile.invitedPax !== undefined && guest.rsvpStatus === "ATTENDING"
        && profile.invitedPax < guest.plusOnes + 1) {
        return NextResponse.json({ error: "Kuota tidak boleh lebih kecil dari RSVP hadir yang sudah tersimpan." }, { status: 409 });
      }
      const updated = await prisma.guest.update({
        where: { id: guest.id },
        data: { ...profile, personalToken: guest.personalToken || token },
      });
      return NextResponse.json({
        invitation: sanitizeGuest(updated),
        event: { id: invitation.id, slug: invitation.slug, title: invitation.title },
      });
    }

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Nama tamu wajib diisi (maksimal 120 karakter)." }, { status: 400 });
    }
    if (phone && phone.length > 32) {
      return NextResponse.json({ error: "Nomor WhatsApp maksimal 32 karakter." }, { status: 400 });
    }
    if (phone) {
      const matches = await findGuestsByContact(invitation.id, name, phone);
      if (matches.length) {
        return NextResponse.json(
          {
            error: matches.length > 1
              ? "Ada beberapa tamu dengan nama dan nomor ini. Periksa daftar tamu lalu pilih penerima yang benar."
              : "Tamu ini sudah ada. Pilih dari daftar tamu agar RSVP, WA Blast dan meja tetap memakai data yang sama.",
            ...(matches.length === 1 ? { guestId: matches[0].id } : {}),
          },
          { status: 409 },
        );
      }
    }

    const guest = await prisma.guest.create({
      data: {
        invitationId: invitation.id,
        name,
        phone,
        ...profile,
        category: profile.category ?? "REGULAR",
        source: "MANUAL",
        personalToken: token,
      },
    });

    return NextResponse.json(
      {
        invitation: sanitizeGuest(guest),
        event: { id: invitation.id, slug: invitation.slug, title: invitation.title },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PersonalBatchError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST /api/personal-invitations failed", error);
    return NextResponse.json({ error: "Personal Invitation belum dapat dibuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    const invitationId = String(body.invitationId ?? "").trim();
    if (!invitationId) {
      return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
    }

    if (body.ids !== undefined) {
      if (body.published !== true) return NextResponse.json({ error: "Status publikasi tidak valid." }, { status: 400 });
      return NextResponse.json(await publishPersonalBatch(user.id, invitationId, body.ids));
    }

    const invitation = await getEventInvitation(user.id, invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Personal Invitation wajib dipilih." }, { status: 400 });
    }

    const guest = await prisma.guest.findFirst({
      where: {
        id,
        invitationId: invitation.id,
        personalToken: { not: null },
      },
    });
    if (!guest) {
      return NextResponse.json(
        { error: "Personal Invitation tidak ditemukan pada acara ini." },
        { status: 404 },
      );
    }

    const data: {
      name?: string;
      phone?: string | null;
      personalPublished?: boolean;
      personalPasswordProtected?: boolean;
      personalPasswordHash?: string | null;
      personalSharedAt?: Date | null;
      personalAddressee?: string | null;
      recipientType?: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
      invitedPax?: number;
      category?: string | null;
      tags?: string[];
      personalGreeting?: string | null;
      personalEnvelopeEnabled?: boolean;
      personalLanguage?: "ID" | "EN";
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name || name.length > 120) {
        return NextResponse.json({ error: "Nama tamu wajib diisi (maksimal 120 karakter)." }, { status: 400 });
      }
      data.name = name;
    }
    if (typeof body.phone === "string") {
      if (body.phone.trim().length > 32) return NextResponse.json({ error: "Nomor WhatsApp maksimal 32 karakter." }, { status: 400 });
      data.phone = body.phone.trim() || null;
    }
    if (typeof body.published === "boolean") {
      if (body.published && !invitation.isPublished) {
        return NextResponse.json({ error: "Terbitkan undangan acara sebelum membagikan undangan personal." }, { status: 409 });
      }
      data.personalPublished = body.published;
    }
    try {
      Object.assign(data, parsePersonalGuestFields(body));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Data undangan personal tidak valid." },
        { status: 400 },
      );
    }
    if (data.invitedPax !== undefined && guest.rsvpStatus === "ATTENDING"
      && data.invitedPax < guest.plusOnes + 1) {
      return NextResponse.json({ error: "Kuota tidak boleh lebih kecil dari RSVP hadir yang sudah tersimpan." }, { status: 409 });
    }
    if (typeof body.markShared === "boolean") {
      if (body.markShared && !(data.personalPublished ?? guest.personalPublished)) {
        return NextResponse.json({ error: "Terbitkan undangan sebelum menandai tautan telah dibagikan." }, { status: 409 });
      }
      data.personalSharedAt = body.markShared ? new Date() : null;
    }

    if (typeof body.passwordProtected === "boolean") {
      if (!body.passwordProtected) {
        data.personalPasswordProtected = false;
        data.personalPasswordHash = null;
      } else {
        const password = String(body.password ?? "").trim();
        if (!guest.personalPasswordHash && password.length < 6) {
          return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
        }
        data.personalPasswordProtected = true;
        if (password) {
          if (password.length < 6) {
            return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
          }
          data.personalPasswordHash = await hashInvitationPassword(password);
        }
      }
    }

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data,
    });

    return NextResponse.json({
      invitation: sanitizeGuest(updated),
      event: { id: invitation.id, slug: invitation.slug, title: invitation.title },
    });
  } catch (error) {
    if (error instanceof PersonalBatchError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("PATCH /api/personal-invitations failed", error);
    return NextResponse.json({ error: "Personal Invitation belum dapat diperbarui." }, { status: 500 });
  }
}
