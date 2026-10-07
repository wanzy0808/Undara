import { weddingSessionsFor, weddingRsvpConfig, parseInvitedSessions, WeddingSessionError } from "@/lib/events/wedding-sessions";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { createGuestQrToken } from "@/lib/usher/qr";
import { findGuestsByContact } from "@/lib/guests/identity";
import { checkPublicRateLimit, getClientIp } from "@/lib/security/public-rate-limit";
import { normalizeRsvpEvents, parseInvitationRsvpConfig, sanitizeRsvpAnswers } from "@/lib/templates/rsvp-config";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const clientIp = getClientIp(request);
    const rateLimit = checkPublicRateLimit(`rsvp:${slug}:${clientIp}`, 5, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan RSVP. Silakan coba lagi sebentar lagi." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: { payment: true },
    });
    if (
      !invitation ||
      !invitation.eventConfigured ||
      !invitation.isPublished ||
      !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitation.id))
    ) {
      return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const status = String(body.status ?? "PENDING");
    if (!["ATTENDING", "NOT_ATTENDING", "TENTATIVE"].includes(status)) {
      return NextResponse.json({ error: "Status kehadiran tidak valid." }, { status: 400 });
    }

    const guestId = String(body.guestId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const plusOnes = Number(body.plusOnes ?? 0);
    if (!Number.isInteger(plusOnes) || plusOnes < 0 || plusOnes > 29) {
      return NextResponse.json({ error: "Jumlah pendamping tidak valid." }, { status: 400 });
    }

    const sessions = weddingSessionsFor(invitation);
    const rsvpConfig = weddingRsvpConfig(invitation, parseInvitationRsvpConfig(invitation.templateKey));
    if (sessions.length && status === "ATTENDING" && (!Array.isArray(body.rsvpEvents) || new Set(body.rsvpEvents).size !== body.rsvpEvents.length || body.rsvpEvents.some((id: unknown) => !sessions.some((session) => session.id === id)))) {
      return NextResponse.json({ error: "Pilih sesi kehadiran yang aktif." }, { status: 400 });
    }
    const rsvpEvents = normalizeRsvpEvents(body.rsvpEvents, rsvpConfig);
    const rsvpAnswers = sanitizeRsvpAnswers(body.rsvpAnswers, rsvpConfig);
    if (
      status === "ATTENDING" &&
      invitation.eventCategory === "WEDDING" &&
      (rsvpConfig.ceremony || rsvpConfig.reception) &&
      rsvpEvents.length === 0
    ) {
      return NextResponse.json({ error: "Pilih acara yang akan dihadiri." }, { status: 400 });
    }
    if (status === "ATTENDING") {
      const missingRequired = rsvpConfig.customFields.find((field) => field.required && !rsvpAnswers[field.id]);
      if (missingRequired) {
        return NextResponse.json({ error: `${missingRequired.label} wajib diisi.` }, { status: 400 });
      }
    }

    // RSVP attendance is separate from the invitation allowance. A decline or
    // tentative reply must never leave phantom companions in attendee counts.
    const confirmedPlusOnes = status === "ATTENDING" ? plusOnes : 0;
    const rsvpStatus = status as "ATTENDING" | "NOT_ATTENDING" | "TENTATIVE";
    // Serialize with scope edits and session check-in. Token/scopes are read again
    // under the same parent lock, so a concurrent edit cannot revoke a saved RSVP.
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitation.id} FOR UPDATE`;
      let guest;
      if (guestId) {
        guest = await tx.guest.findFirst({ where: { id: guestId, invitationId: invitation.id } });
        if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
        // Only the personalized token can update an existing personal recipient.
        if (!guest.personalToken || !guest.personalPublished
          || String(body.guestToken ?? "") !== guest.personalToken) {
          return NextResponse.json({ error: "Tautan tamu tidak valid." }, { status: 403 });
        }
        if (sessions.length) {
          const allowed = parseInvitedSessions(guest.invitedSessions, sessions);
          if (status === "ATTENDING" && (!Array.isArray(body.rsvpEvents) || body.rsvpEvents.some((id: unknown) => !allowed.some((session) => session === id)))) return NextResponse.json({ error: "Sesi ini tidak termasuk dalam undangan tamu." }, { status: 403 });
          if (guest.checkedIn && JSON.stringify([...guest.rsvpEvents].sort()) !== JSON.stringify([...rsvpEvents].sort())) return NextResponse.json({ error: "Tamu sudah check-in. Perubahan sesi RSVP perlu dibantu admin acara." }, { status: 409 });
        }
        if (status === "ATTENDING" && confirmedPlusOnes + 1 > guest.invitedPax) {
          return NextResponse.json(
            { error: `Kuota undangan ini maksimal ${guest.invitedPax} orang, termasuk penerima.` },
            { status: 400 },
          );
        }
        if (guest.checkedIn && (guest.rsvpStatus !== status || guest.plusOnes !== confirmedPlusOnes)) {
          return NextResponse.json(
            { error: "Tamu sudah check-in. Perubahan RSVP perlu dibantu admin acara." },
            { status: 409 },
          );
        }
        // Quota edits and check-in may commit after the initial token lookup.
        // Evaluate these guards in the same write that saves the attendance.
        const saved = await tx.guest.updateMany({
          where: {
            id: guest.id, invitationId: invitation.id,
            personalToken: guest.personalToken, personalPublished: true,
            ...(sessions.length ? { invitedSessions: { equals: guest.invitedSessions } } : {}),
            ...(status === "ATTENDING" ? { invitedPax: { gte: confirmedPlusOnes + 1 } } : {}),
            OR: [{ checkedIn: false }, { checkedIn: true, rsvpStatus, plusOnes: confirmedPlusOnes, ...(sessions.length ? { rsvpEvents: { equals: rsvpEvents } } : {}) }],
          },
          data: {
            source: "RSVP",
            rsvpStatus,
            plusOnes: confirmedPlusOnes,
            rsvpEvents: status === "ATTENDING" ? rsvpEvents : [],
            rsvpAnswers,
          },
        });
        if (saved.count !== 1) {
          return NextResponse.json({ error: "Data tamu berubah. Muat ulang dan coba lagi." }, { status: 409 });
        }
        guest = await tx.guest.findFirst({ where: { id: guest.id, invitationId: invitation.id } });
        if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan." }, { status: 404 });
      } else {
        if (status === "ATTENDING" && confirmedPlusOnes > 10) {
          return NextResponse.json({ error: "Jumlah pendamping maksimal 10 orang." }, { status: 400 });
        }
        if (!name || !phone || name.length > 120 || phone.length > 32) {
          return NextResponse.json(
            { error: "Nama (maksimal 120 karakter) dan WhatsApp (maksimal 32 karakter) wajib diisi." },
            { status: 400 },
          );
        }
        const matches = await findGuestsByContact(invitation.id, name, phone);
        if (matches.length > 1) {
          return NextResponse.json(
            { error: "Data penerima tidak dapat dibedakan. Hubungi admin acara untuk konfirmasi." },
            { status: 409 },
          );
        }
        if (matches.length === 1) {
          // Name + phone are NOT proof of ownership. Do not overwrite the
          // canonical guest's RSVP from a public generic link (personal or not).
          return NextResponse.json(
            { error: "Nama dan WhatsApp ini sudah terdaftar. Gunakan tautan undangan personal atau hubungi admin acara untuk memperbarui RSVP." },
            { status: 409 },
          );
        }
        guest = await tx.guest.create({
          data: {
            invitationId: invitation.id,
            name,
            phone,
            source: "RSVP",
            rsvpStatus,
            plusOnes: confirmedPlusOnes,
            rsvpEvents: status === "ATTENDING" ? rsvpEvents : [],
            rsvpAnswers,
            invitedPax: Math.max(1, confirmedPlusOnes + 1),
            invitedSessions: sessions.map((session) => session.id),
          },
        });
      }

      // A missing signing configuration must not turn a committed RSVP into a failure.
      let qrToken: string | null = null;
      if (status === "ATTENDING") {
        try { qrToken = createGuestQrToken(guest.id); }
        catch { console.error("RSVP saved, but QR signing is unavailable."); }
      }
      return NextResponse.json(
        {
          guest: {
            id: guest.id,
            name: guest.name,
            phone: guest.phone,
            plusOnes: guest.plusOnes,
            rsvpStatus: guest.rsvpStatus,
            rsvpEvents: guest.rsvpEvents,
            rsvpAnswers: guest.rsvpAnswers,
            invitedPax: guest.invitedPax,
          },
          qrToken,
        },
        {
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        },
      );
    });
  } catch (error) {
    if (error instanceof WeddingSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST /api/invite/[slug]/rsvp failed", error);
    return NextResponse.json({ error: "RSVP belum dapat disimpan." }, { status: 500 });
  }
}
