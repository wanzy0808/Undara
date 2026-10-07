import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { findGuestsByContact } from "@/lib/guests/identity";
import { parsePersonalGuestFields } from "@/lib/guests/personal-profile";
import { buildPersonalGuestAddressee, getPersonalGuestSalutation } from "@/lib/guests/personal-envelope";
import { GuestPartyUpdateError, managedGuestSelect, resizeManagedGuestParty } from "@/lib/guests/party-update";

// Resolve the event FROM the guest being edited, never from the account's first
// event. Personal Invitation, RSVP, WA Blast and seating share this Guest.id.
async function ownedGuest(userId: string, id: string) {
  return prisma.guest.findFirst({
    where: { id, invitation: { ownerId: userId } },
    include: { invitation: { include: { payment: true } } },
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "ID tamu wajib diisi." }, { status: 400 });
    const guest = await ownedGuest(user.id, id);
    if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan pada akun ini." }, { status: 404 });
    if (body.invitationId !== undefined && body.invitationId !== guest.invitationId) {
      return NextResponse.json({ error: "Tamu tidak ditemukan pada acara ini." }, { status: 404 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, guest.invitation.payment))) {
      return NextResponse.json({ error: "Pengelolaan tamu membutuhkan paket Digital Invitation." }, { status: 402 });
    }

    let profile;
    try {
      profile = parsePersonalGuestFields(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Data tamu tidak valid." },
        { status: 400 },
      );
    }
    const data: Prisma.GuestUncheckedUpdateInput = { ...profile };
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name || name.length > 120) {
        return NextResponse.json({ error: "Nama tamu wajib diisi (maksimal 120 karakter)." }, { status: 400 });
      }
      data.name = name;
      const salutation = getPersonalGuestSalutation({ name: guest.name, personalAddressee: guest.personalAddressee });
      if (profile.invitedPax === undefined && salutation && profile.personalAddressee === undefined) {
        data.personalAddressee = buildPersonalGuestAddressee(name, salutation);
      }
    }
    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (phone.length > 32) {
        return NextResponse.json({ error: "Nomor WhatsApp maksimal 32 karakter." }, { status: 400 });
      }
      data.phone = phone || null;
    }
    const nextName = (data.name as string | undefined) ?? guest.name;
    const nextPhone = data.phone === undefined ? guest.phone : (data.phone as string | null);
    if (nextPhone) {
      const matches = await findGuestsByContact(guest.invitationId, nextName, nextPhone);
      if (matches.some((match) => match.id !== id)) {
        return NextResponse.json(
          { error: "Nama dan nomor ini sudah dipakai tamu lain pada acara yang sama." },
          { status: 409 },
        );
      }
    }

    if (body.tableId !== undefined) {
      const tableId = String(body.tableId ?? "").trim() || null;
      if (tableId) {
        const table = await prisma.weddingTable.findFirst({
          where: { id: tableId, invitationId: guest.invitationId },
          include: { _count: { select: { guests: true } } },
        });
        if (!table) return NextResponse.json({ error: "Meja tidak ditemukan pada acara tamu ini." }, { status: 404 });
        if (tableId !== guest.tableId && table._count.guests >= table.capacity) {
          return NextResponse.json({ error: "Meja sudah penuh." }, { status: 409 });
        }
      }
      data.tableId = tableId;
      if (tableId !== guest.tableId) data.seatNumber = null;
    }
    if (body.rsvpStatus !== undefined) {
      const value = String(body.rsvpStatus);
      if (!["PENDING", "ATTENDING", "NOT_ATTENDING", "TENTATIVE"].includes(value)) {
        return NextResponse.json({ error: "Status RSVP tidak valid." }, { status: 400 });
      }
      data.rsvpStatus = value as "PENDING" | "ATTENDING" | "NOT_ATTENDING" | "TENTATIVE";
    }
    if (body.plusOnes !== undefined) {
      const count = Number(body.plusOnes);
      if (!Number.isInteger(count) || count < 0 || count > 29) {
        return NextResponse.json({ error: "Jumlah pendamping harus 0 sampai 29." }, { status: 400 });
      }
      data.plusOnes = count;
    }
    const nextStatus = (data.rsvpStatus as string | undefined) ?? guest.rsvpStatus;
    const nextPlusOnes = nextStatus === "ATTENDING"
      ? ((data.plusOnes as number | undefined) ?? guest.plusOnes)
      : 0;
    if (nextStatus !== "ATTENDING" && (data.rsvpStatus !== undefined || data.plusOnes !== undefined)) {
      data.plusOnes = 0;
    }
    if (profile.invitedPax === undefined && nextStatus === "ATTENDING" && nextPlusOnes + 1 > guest.invitedPax) {
      return NextResponse.json(
        { error: "Jumlah RSVP hadir melebihi kuota undangan. Ubah kuota terlebih dahulu." },
        { status: 409 },
      );
    }
    if (profile.invitedPax === undefined && guest.checkedIn && (
      (data.rsvpStatus !== undefined && data.rsvpStatus !== guest.rsvpStatus)
      || (data.plusOnes !== undefined && data.plusOnes !== guest.plusOnes)
    )) {
      return NextResponse.json({ error: "Tamu sudah check-in. Status RSVP tidak dapat diganti." }, { status: 409 });
    }

    const updated = profile.invitedPax !== undefined
      ? await resizeManagedGuestParty(user.id, guest.invitationId, guest.id, profile.invitedPax, data)
      : await prisma.guest.update({
        where: { id: guest.id },
        data,
        select: managedGuestSelect,
      });
    return NextResponse.json({ ok: true, guest: updated });
  } catch (error) {
    if (error instanceof GuestPartyUpdateError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("PATCH /api/guests/manage failed", error);
    return NextResponse.json({ error: "Data tamu gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    if (!isTrustedMutationOrigin(request)) {
      return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
    }
    const query = new URL(request.url).searchParams;
    const id = String(query.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ error: "ID tamu wajib diisi." }, { status: 400 });
    const guest = await ownedGuest(user.id, id);
    if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan pada akun ini." }, { status: 404 });
    if (query.has("invitationId") && query.get("invitationId") !== guest.invitationId) {
      return NextResponse.json({ error: "Tamu tidak ditemukan pada acara ini." }, { status: 404 });
    }
    if (!(await hasAccountDigitalInvitation(user.id, guest.invitation.payment))) {
      return NextResponse.json({ error: "Pengelolaan tamu membutuhkan paket Digital Invitation." }, { status: 402 });
    }
    if (guest.personalToken || guest.checkedIn) {
      return NextResponse.json({
        error: "Tamu ini sudah mempunyai undangan personal atau catatan check-in. Data bersama tidak dapat dihapus dari daftar biasa.",
      }, { status: 409 });
    }
    const removed = await prisma.guest.deleteMany({
      where: { id: guest.id, invitationId: guest.invitationId, invitation: { ownerId: user.id }, personalToken: null, checkedIn: false },
    });
    if (removed.count !== 1) {
      return NextResponse.json({ error: "Data tamu berubah. Muat ulang dan coba lagi." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/guests/manage failed", error);
    return NextResponse.json({ error: "Tamu gagal dihapus." }, { status: 500 });
  }
}
