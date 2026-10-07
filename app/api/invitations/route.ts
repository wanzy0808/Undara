import { parseWeddingSessions, weddingSessionProjection, WeddingSessionError } from "@/lib/events/wedding-sessions";
import { reconcileWeddingGuestScopes, WeddingScopeConflict } from "@/lib/events/wedding-session-mutation";
import { Prisma } from "@/generated/prisma/client";
import { isWeddingChildPosition } from "@/lib/events/parents";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";
import { hasPaidDigitalInvitation } from "@/lib/packages/access";
import { getOwnerGrantedDigitalInvitationIds } from "@/lib/packages/owner-grants";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { assertInvitationMusicAsset, MissingMusicAssetError } from "@/lib/invitations/music-selection";
import { canContinueInvitationTemplate, isInvitationTemplateCompatible } from "@/lib/templates/catalog";
import {
  buildEventTitle,
  getEventCategory,
  normalizeEventCategory,
  normalizeIndonesiaTimezone,
} from "@/lib/events/catalog";
import {
  END_TIME_SENTINEL,
  hasEventDetailMutation,
  isValidReceptionTime,
  isValidTime24,
  optionalName,
  optionalPositiveInt,
} from "@/lib/invitations/event-input";
import {
  findOwnedInvitation,
  findReusableDraft,
  getOrCreateLegacyInvitation,
  makeEventSlug,
  normalizeType,
  resolveLegacyCoupleSlug,
  studioInvitationId,
  type InvitationType,
} from "@/lib/invitations/legacy-queries";

function sanitizeInvitation<T extends object>(invitation: T) {
  const { passwordHash: _passwordHash, ...safeInvitation } = invitation as T & {
    passwordHash?: string | null;
  };
  return safeInvitation;
}

class IncompatibleTemplateError extends Error {
  constructor() {
    super("Template tidak sesuai dengan kategori acara. Pilih template yang sesuai di Studio.");
  }
}

function assertTemplateCategory(
  templateKey: string,
  eventCategory: string,
  current: { templateKey: string; isPublished: boolean },
  wantsPublish: boolean,
) {
  if (!templateKey || isInvitationTemplateCompatible(templateKey, eventCategory)) return;
  // Keep assigned designs editable, including after a draft event changes category.
  if (canContinueInvitationTemplate(templateKey, current.templateKey, eventCategory)
    && (!wantsPublish || current.isPublished)) return;
  throw new IncompatibleTemplateError();
}

function databaseFailure(error: unknown, fallback: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return NextResponse.json(
      {
        error:
          "Database server belum sinkron dengan versi aplikasi terbaru. Jalankan pnpm db:deploy di server lalu coba simpan lagi.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("all") === "1") {
      const invitations = await prisma.invitation.findMany({
        where: { ownerId: user.id },
        include: { assets: { orderBy: { createdAt: "asc" } }, payment: true },
        orderBy: { createdAt: "asc" },
      });

      const ownerGrantedIds = await getOwnerGrantedDigitalInvitationIds(user.id);
      return NextResponse.json({
        invitations: invitations.map((invitation) => ({
          ...sanitizeInvitation(invitation),
          accessPaid: ownerGrantedIds.has(invitation.id) || hasPaidDigitalInvitation(invitation.payment),
        })),
        unlimited: true,
      });
    }

    const requestedType = normalizeType(url.searchParams.get("type"));
    const requestedId = studioInvitationId(
      request,
      url.searchParams.get("id"),
      requestedType,
    );
    if (requestedId) {
      const invitation = await findOwnedInvitation(user.id, requestedId);
      if (!invitation) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
      return NextResponse.json({
        invitation: {
          ...sanitizeInvitation(invitation),
          accessPaid: await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id),
        },
      });
    }

    const invitation = await getOrCreateLegacyInvitation(user, requestedType);
    return NextResponse.json({
      invitation: {
        ...sanitizeInvitation(invitation),
        accessPaid: await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id),
      },
    });
  } catch (error) {
    console.error("GET /api/invitations failed", error);
    return databaseFailure(error, "Data acara belum dapat dimuat.");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => null);
    const reusableDraft = await findReusableDraft(user.id);

    if (body?.eventConfigured === true) {
      const type = normalizeType(body.type);
      const eventCategory = normalizeEventCategory(body.eventCategory);
      const category = getEventCategory(eventCategory);
      const groomName = String(body.groomName ?? "").trim();
      const brideName = String(body.brideName ?? "").trim();
      const wedding = eventCategory === "WEDDING";
      const groomFatherName = wedding ? optionalName(body.groomFatherName) : null;
      const groomMotherName = wedding ? optionalName(body.groomMotherName) : null;
      const groomChildOrder = wedding ? optionalPositiveInt(body.groomChildOrder) : null;
      const groomChildPosition = wedding && isWeddingChildPosition(body.groomChildPosition) ? body.groomChildPosition : null;
      const brideFatherName = wedding ? optionalName(body.brideFatherName) : null;
      const brideMotherName = wedding ? optionalName(body.brideMotherName) : null;
      const brideChildOrder = wedding ? optionalPositiveInt(body.brideChildOrder) : null;
      const brideChildPosition = wedding && isWeddingChildPosition(body.brideChildPosition) ? body.brideChildPosition : null;
      const weddingSessions = parseWeddingSessions(body.weddingSessions, eventCategory);
      const sessionDetails = weddingSessionProjection(weddingSessions ?? []);
      const venue = sessionDetails.venue ?? String(body.venue ?? "").trim();
      const address = weddingSessions ? sessionDetails.address! : (String(body.address ?? "").trim() || null);
      const mapUrl = weddingSessions ? sessionDetails.mapUrl! : (String(body.mapUrl ?? "").trim() || null);
      const timezone = normalizeIndonesiaTimezone(body.timezone);
      const eventDate = new Date(String(body.eventDate ?? ""));
      const ceremonyTime = sessionDetails.ceremonyTime ?? (String(body.ceremonyTime ?? "").trim() || null);
      const receptionTime = weddingSessions ? sessionDetails.receptionTime! : (String(body.receptionTime ?? "").trim() || null);
      const requestedTitle = String(body.title ?? "").trim();
      const title = buildEventTitle(eventCategory, groomName, brideName, requestedTitle);

      if (!title) {
        return NextResponse.json({ error: "Nama acara wajib diisi." }, { status: 400 });
      }
      if (category.nameMode === "couple" && (!groomName || !brideName)) {
        return NextResponse.json(
          { error: "Nama pengantin pria dan wanita wajib diisi untuk acara ini." },
          { status: 400 },
        );
      }
      if (category.nameMode === "single" && !groomName) {
        return NextResponse.json({ error: "Nama utama acara wajib diisi." }, { status: 400 });
      }
      if (wedding && body.groomChildPosition != null && body.groomChildPosition !== "" && !isWeddingChildPosition(body.groomChildPosition)) {
        return NextResponse.json({ error: "Pilihan urutan anak pengantin pria tidak valid." }, { status: 400 });
      }
      if (wedding && groomChildPosition === "NUMBER" && !groomChildOrder) {
        return NextResponse.json({ error: "Isi angka urutan anak pengantin pria." }, { status: 400 });
      }
      if (wedding && String(body.groomChildOrder ?? "").trim() && !groomChildOrder) {
        return NextResponse.json({ error: "Anak keberapa pengantin pria harus berupa angka lebih dari 0." }, { status: 400 });
      }
      if (wedding && body.brideChildPosition != null && body.brideChildPosition !== "" && !isWeddingChildPosition(body.brideChildPosition)) {
        return NextResponse.json({ error: "Pilihan urutan anak pengantin wanita tidak valid." }, { status: 400 });
      }
      if (wedding && brideChildPosition === "NUMBER" && !brideChildOrder) {
        return NextResponse.json({ error: "Isi angka urutan anak pengantin wanita." }, { status: 400 });
      }
      if (wedding && String(body.brideChildOrder ?? "").trim() && !brideChildOrder) {
        return NextResponse.json({ error: "Anak keberapa pengantin wanita harus berupa angka lebih dari 0." }, { status: 400 });
      }
      if (Number.isNaN(eventDate.getTime())) {
        return NextResponse.json({ error: "Tanggal acara wajib diisi." }, { status: 400 });
      }
      if (!ceremonyTime) {
        return NextResponse.json({ error: "Waktu mulai wajib diisi." }, { status: 400 });
      }
      if (!isValidTime24(ceremonyTime) || !isValidReceptionTime(receptionTime)) {
        return NextResponse.json(
          { error: "Waktu acara harus menggunakan format 24 jam HH:mm (00:00–23:59)." },
          { status: 400 },
        );
      }
      if (!venue) {
        return NextResponse.json({ error: "Nama tempat wajib diisi." }, { status: 400 });
      }

      const data = {
        type,
        eventCategory,
        title,
        groomName,
        brideName,
        groomFatherName,
        groomMotherName,
        groomChildOrder: groomChildPosition === "ELDEST" || groomChildPosition === "YOUNGEST" ? null : groomChildOrder,
        groomChildPosition,
        brideFatherName,
        brideMotherName,
        brideChildOrder: brideChildPosition === "ELDEST" || brideChildPosition === "YOUNGEST" ? null : brideChildOrder,
        brideChildPosition,
        venue,
        address,
        mapUrl,
        timezone,
        eventDate,
        ceremonyTime,
        receptionTime,
        description: String(body.description ?? "").trim() || null,
        eventNotes: String(body.eventNotes ?? "").trim() || null,
        eventConfigured: true,
        weddingSessions: weddingSessions === null ? Prisma.DbNull : weddingSessions,
      };

      const invitation = reusableDraft
        ? await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${reusableDraft.id} AND "ownerId" = ${user.id} FOR UPDATE`;
            const current = await tx.invitation.findUniqueOrThrow({ where: { id: reusableDraft.id } });
            if (current.isPublished || current.eventConfigured) throw new WeddingSessionError("Draft acara berubah. Muat ulang daftar acara.", 409);
            await reconcileWeddingGuestScopes(tx, current.id, current, weddingSessions, eventDate, body.weddingGuestScopes);
            return tx.invitation.update({
            where: { id: reusableDraft.id },
            data,
            include: { assets: { orderBy: { createdAt: "asc" } }, payment: true },
            });
          })
        : await prisma.invitation.create({
            data: {
              ownerId: user.id,
              slug: await makeEventSlug(
                user.firstName,
                user.id,
                (await prisma.invitation.count({ where: { ownerId: user.id } })) + 1,
              ),
              templateKey: "",
              waBlastQuota: 0,
              ...data,
            },
            include: { assets: { orderBy: { createdAt: "asc" } }, payment: true },
          });

      return NextResponse.json(
        {
          invitation: {
            ...sanitizeInvitation(invitation),
            accessPaid: await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id),
          },
          unlimited: true,
          reused: Boolean(reusableDraft),
        },
        { status: reusableDraft ? 200 : 201 },
      );
    }

    if (reusableDraft) {
      return NextResponse.json({
        invitation: {
          ...sanitizeInvitation(reusableDraft),
          accessPaid: await hasAccountDigitalInvitation(user.id, reusableDraft.payment, reusableDraft.id),
        },
        unlimited: true,
        reused: true,
      });
    }

    const count = await prisma.invitation.count({ where: { ownerId: user.id } });
    const invitation = await prisma.invitation.create({
      data: {
        ownerId: user.id,
        slug: await makeEventSlug(user.firstName, user.id, count + 1),
        type: "WEDDING",
        templateKey: "",
        title: "",
        eventCategory: "OTHER",
        groomName: "",
        brideName: "",
        venue: "",
        timezone: "Asia/Jakarta",
        description: null,
        eventConfigured: false,
        waBlastQuota: 0,
      },
      include: { assets: { orderBy: { createdAt: "asc" } }, payment: true },
    });

    return NextResponse.json(
      { invitation: { ...sanitizeInvitation(invitation), accessPaid: false }, unlimited: true },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof WeddingScopeConflict) return NextResponse.json({ error: error.message, guestsRequiringScope: error.guests }, { status: 409 });
    if (error instanceof WeddingSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST /api/invitations failed", error);
    return databaseFailure(error, "Acara baru belum dapat dibuat.");
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const fallbackType = normalizeType(body.type);
    const requestedId = studioInvitationId(request, body.id, fallbackType);
    const invitation = requestedId
      ? await findOwnedInvitation(user.id, requestedId)
      : await getOrCreateLegacyInvitation(user, fallbackType);

    if (!invitation) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });

    if (
      invitation.isPublished &&
      (hasEventDetailMutation(body as Record<string, unknown>) || body.isPublished === false)
    ) {
      return NextResponse.json(
        {
          error:
            "Acara yang sudah dipublish terkunci dan tidak dapat diedit atau dikembalikan menjadi draft.",
        },
        { status: 409 },
      );
    }

    const eventCategory = normalizeEventCategory(body.eventCategory ?? invitation.eventCategory);
    const category = getEventCategory(eventCategory);
    const groomName = String(body.groomName ?? invitation.groomName).trim();
    const brideName = String(body.brideName ?? invitation.brideName).trim();
    const wedding = eventCategory === "WEDDING";
    const groomFatherName = wedding
      ? optionalName(body.groomFatherName ?? invitation.groomFatherName)
      : null;
    const groomMotherName = wedding
      ? optionalName(body.groomMotherName ?? invitation.groomMotherName)
      : null;
    const groomChildOrder = wedding
      ? optionalPositiveInt(body.groomChildOrder ?? invitation.groomChildOrder)
      : null;
    const groomChildPosition = wedding
      ? (body.groomChildPosition === null || body.groomChildPosition === "" ? null : isWeddingChildPosition(body.groomChildPosition) ? body.groomChildPosition : invitation.groomChildPosition)
      : null;
    const brideFatherName = wedding
      ? optionalName(body.brideFatherName ?? invitation.brideFatherName)
      : null;
    const brideMotherName = wedding
      ? optionalName(body.brideMotherName ?? invitation.brideMotherName)
      : null;
    const brideChildOrder = wedding
      ? optionalPositiveInt(body.brideChildOrder ?? invitation.brideChildOrder)
      : null;
    const brideChildPosition = wedding
      ? (body.brideChildPosition === null || body.brideChildPosition === "" ? null : isWeddingChildPosition(body.brideChildPosition) ? body.brideChildPosition : invitation.brideChildPosition)
      : null;
    const weddingSessions = parseWeddingSessions(body.weddingSessions === undefined ? (wedding ? invitation.weddingSessions : null) : body.weddingSessions, eventCategory);
    const sessionDetails = weddingSessionProjection(weddingSessions ?? []);
    const venue = sessionDetails.venue ?? String(body.venue ?? invitation.venue).trim();
    const address = weddingSessions ? sessionDetails.address! : (String(body.address ?? invitation.address ?? "").trim() || null);
    const mapUrl = weddingSessions ? sessionDetails.mapUrl! : (String(body.mapUrl ?? invitation.mapUrl ?? "").trim() || null);
    const timezone = normalizeIndonesiaTimezone(body.timezone ?? invitation.timezone);
    const rawEventDate = String(body.eventDate ?? invitation.eventDate);
    const eventDate = new Date(rawEventDate);
    const ceremonyTime = weddingSessions ? sessionDetails.ceremonyTime! : (String(body.ceremonyTime ?? invitation.ceremonyTime ?? "").trim() || null);
    const receptionTime = weddingSessions ? sessionDetails.receptionTime! : (String(body.receptionTime ?? invitation.receptionTime ?? "").trim() || null);
    const templateKey = String(body.templateKey ?? invitation.templateKey).trim();
    const requestedTemplateBase = templateKey.split("::", 1)[0];
    const persistedTemplateBase = invitation.templateKey.split("::", 1)[0];
    const continuesAssignedBlankCanvas =
      requestedTemplateBase === "blank-canvas" && persistedTemplateBase === "blank-canvas";
    if (
      requestedTemplateBase === "blank-canvas" &&
      !continuesAssignedBlankCanvas &&
      !["OWNER", "DESIGNER"].includes(user.role)
    ) {
      return NextResponse.json({ error: "Canvas kosong hanya tersedia di Studio Owner dan Designer." }, { status: 403 });
    }
    const requestedTitle = String(body.title ?? invitation.title).trim();
    const title = buildEventTitle(eventCategory, groomName, brideName, requestedTitle);
    const wantsPublish = body.isPublished === undefined ? invitation.isPublished : Boolean(body.isPublished);
    const eventConfigured = body.eventConfigured === true ? Boolean(title) : invitation.eventConfigured;
    const canPublish = await hasAccountDigitalInvitation(
      user.id,
      invitation.payment,
      invitation.id,
      eventConfigured,
    );
    assertTemplateCategory(templateKey, eventCategory, invitation, wantsPublish);

    if (body.eventConfigured === true) {
      if (!title) {
        return NextResponse.json({ error: "Nama acara wajib diisi." }, { status: 400 });
      }
      if (category.nameMode === "couple" && (!groomName || !brideName)) {
        return NextResponse.json(
          { error: "Nama pengantin pria dan wanita wajib diisi untuk acara ini." },
          { status: 400 },
        );
      }
      if (category.nameMode === "single" && !groomName) {
        return NextResponse.json({ error: "Nama utama acara wajib diisi." }, { status: 400 });
      }
      if (wedding && body.groomChildPosition !== undefined && body.groomChildPosition !== null && body.groomChildPosition !== "" && !isWeddingChildPosition(body.groomChildPosition)) {
        return NextResponse.json({ error: "Pilihan urutan anak pengantin pria tidak valid." }, { status: 400 });
      }
      if (wedding && groomChildPosition === "NUMBER" && !groomChildOrder) {
        return NextResponse.json({ error: "Isi angka urutan anak pengantin pria." }, { status: 400 });
      }
      if (wedding && body.groomChildOrder !== undefined && String(body.groomChildOrder ?? "").trim() && !groomChildOrder) {
        return NextResponse.json({ error: "Anak keberapa pengantin pria harus berupa angka lebih dari 0." }, { status: 400 });
      }
      if (wedding && body.brideChildPosition !== undefined && body.brideChildPosition !== null && body.brideChildPosition !== "" && !isWeddingChildPosition(body.brideChildPosition)) {
        return NextResponse.json({ error: "Pilihan urutan anak pengantin wanita tidak valid." }, { status: 400 });
      }
      if (wedding && brideChildPosition === "NUMBER" && !brideChildOrder) {
        return NextResponse.json({ error: "Isi angka urutan anak pengantin wanita." }, { status: 400 });
      }
      if (wedding && body.brideChildOrder !== undefined && String(body.brideChildOrder ?? "").trim() && !brideChildOrder) {
        return NextResponse.json({ error: "Anak keberapa pengantin wanita harus berupa angka lebih dari 0." }, { status: 400 });
      }
      if (Number.isNaN(eventDate.getTime())) {
        return NextResponse.json({ error: "Tanggal acara wajib diisi." }, { status: 400 });
      }
      if (!ceremonyTime) {
        return NextResponse.json({ error: "Waktu mulai wajib diisi." }, { status: 400 });
      }
      if (!isValidTime24(ceremonyTime) || !isValidReceptionTime(receptionTime)) {
        return NextResponse.json(
          { error: "Waktu acara harus menggunakan format 24 jam HH:mm (00:00–23:59)." },
          { status: 400 },
        );
      }
      if (!venue) {
        return NextResponse.json({ error: "Nama tempat wajib diisi." }, { status: 400 });
      }
    }

    if (wantsPublish && !eventConfigured) {
      return NextResponse.json({ error: "Lengkapi dan simpan acara sebelum publish." }, { status: 400 });
    }
    if (wantsPublish && (!title || !venue || Number.isNaN(eventDate.getTime()))) {
      return NextResponse.json({ error: "Nama acara, tempat, dan tanggal wajib diisi sebelum publish." }, { status: 400 });
    }
    if (wantsPublish && !templateKey) {
      return NextResponse.json({ error: "Pilih dan simpan template sebelum publish." }, { status: 400 });
    }
    if (wantsPublish && !canPublish) {
      return NextResponse.json({ error: "Aktifkan Undangan Digital Rp150.000 untuk acara ini sebelum publish." }, { status: 402 });
    }

    const slug = await resolveLegacyCoupleSlug(
      invitation.id,
      groomName,
      brideName,
      invitation.slug,
    );

    const updated = await prisma.$transaction(async (tx) => {
      // Share the upload/delete lock so an old editor cannot restore a removed file.
      await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitation.id} FOR UPDATE`;
      const current = await tx.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
      if (current.isPublished && (hasEventDetailMutation(body) || body.isPublished === false)) throw new WeddingSessionError("Acara yang sudah dipublish terkunci.", 409);
      const latestEventCategory = body.eventCategory === undefined ? normalizeEventCategory(current.eventCategory) : eventCategory;
      const currentSessions = parseWeddingSessions(body.weddingSessions === undefined ? (latestEventCategory !== "WEDDING" ? null : current.weddingSessions) : body.weddingSessions, latestEventCategory);
      await reconcileWeddingGuestScopes(tx, invitation.id, current, currentSessions, body.eventDate === undefined ? current.eventDate : eventDate, body.weddingGuestScopes, wantsPublish);
      assertTemplateCategory(templateKey, latestEventCategory, current, wantsPublish);
      const musicUrl = String(body.musicUrl ?? current.musicUrl ?? "").trim() || null;
      await assertInvitationMusicAsset(musicUrl, invitation.id, user.id, (where) =>
        tx.invitationAsset.findFirst({ where }),
      );
      return tx.invitation.update({
        where: { id: invitation.id },
        data: {
          slug,
          eventCategory: latestEventCategory,
          ...(body.weddingSessions !== undefined || body.eventCategory !== undefined ? { weddingSessions: currentSessions === null ? Prisma.DbNull : currentSessions } : {}),
          groomName,
          brideName,
          groomFatherName,
          groomMotherName,
          groomChildOrder: groomChildPosition === "ELDEST" || groomChildPosition === "YOUNGEST" ? null : groomChildOrder,
          groomChildPosition,
          brideFatherName,
          brideMotherName,
          brideChildOrder: brideChildPosition === "ELDEST" || brideChildPosition === "YOUNGEST" ? null : brideChildOrder,
          brideChildPosition,
          venue,
          address,
          mapUrl,
          timezone,
          eventDate: Number.isNaN(eventDate.getTime()) ? invitation.eventDate : eventDate,
          eventConfigured,
          ceremonyTime,
          receptionTime,
          ...(currentSessions ? weddingSessionProjection(currentSessions) : {}),
          title,
          templateKey,
          description: String(body.description ?? invitation.description ?? "").trim() || null,
          weddingHashtag: String(body.weddingHashtag ?? invitation.weddingHashtag ?? "").trim() || null,
          dressCode: String(body.dressCode ?? invitation.dressCode ?? "").trim() || null,
          liveStreamUrl: String(body.liveStreamUrl ?? invitation.liveStreamUrl ?? "").trim() || null,
          eventNotes: String(body.eventNotes ?? invitation.eventNotes ?? "").trim() || null,
          giftBankName: String(body.giftBankName ?? invitation.giftBankName ?? "").trim() || null,
          giftAccountName: String(body.giftAccountName ?? invitation.giftAccountName ?? "").trim() || null,
          giftAccountNumber: String(body.giftAccountNumber ?? invitation.giftAccountNumber ?? "").trim() || null,
          musicUrl,
          isPublished: wantsPublish || current.isPublished,
        },
        include: { assets: { orderBy: { createdAt: "asc" } }, payment: true },
      });
    });

    const accessPaid = await hasAccountDigitalInvitation(user.id, updated.payment, updated.id);
    return NextResponse.json({
      invitation: {
        ...sanitizeInvitation(updated),
        accessPaid,
      },
      accessPaid,
    });
  } catch (error) {
    if (error instanceof WeddingScopeConflict) return NextResponse.json({ error: error.message, guestsRequiringScope: error.guests }, { status: 409 });
    if (error instanceof WeddingSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof IncompatibleTemplateError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof MissingMusicAssetError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("PUT /api/invitations failed", error);
    return databaseFailure(error, "Undangan belum dapat disimpan.");
  }
}


export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json({ error: "Acara belum dipilih." }, { status: 400 });
    }

    const invitation = await findOwnedInvitation(user.id, id);
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    if (invitation.isPublished) {
      return NextResponse.json(
        { error: "Acara yang sudah dipublish tidak dapat dihapus." },
        { status: 409 },
      );
    }

    await prisma.invitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ deleted: true, id: invitation.id });
  } catch (error) {
    console.error("DELETE /api/invitations failed", error);
    return databaseFailure(error, "Acara belum dapat dihapus.");
  }
}
