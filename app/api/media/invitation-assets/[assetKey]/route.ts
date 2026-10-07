import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasInvitationAccess } from "@/lib/invitations/password";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { hasPaidDigitalInvitation } from "@/lib/packages/access";
import { prisma } from "@/lib/prisma";
import {
  parsePrivateInvitationAssetKey,
  privateInvitationAssetPath,
  privateInvitationAssetUrl,
} from "@/lib/storage/private-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: NO_STORE_HEADERS });
}

function sameOriginPersonalToken(request: Request, slug: string) {
  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    const source = new URL(referer);
    const target = new URL(request.url);
    if (source.origin !== target.origin) return null;

    const parts = source.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));

    if (parts.length < 4 || parts[0] !== "invite" || parts[1] !== slug || parts[2] !== "p") {
      return null;
    }

    const token = parts[3];
    return token && token.length <= 256 ? token : null;
  } catch {
    return null;
  }
}

async function hasPersonalInvitationMediaAccess(
  request: Request,
  invitationId: string,
  slug: string,
) {
  const token = sameOriginPersonalToken(request, slug);
  if (!token) return false;

  const guest = await prisma.guest.findFirst({
    where: {
      invitationId,
      personalToken: token,
      personalPublished: true,
    },
    select: {
      personalPasswordProtected: true,
      personalPasswordHash: true,
    },
  });
  if (!guest) return false;
  if (!guest.personalPasswordProtected) return true;
  if (!guest.personalPasswordHash) return false;

  return hasInvitationAccess(`personal-${token}`);
}

function parseRange(rangeHeader: string | null, size: number) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return false;

  const [, startText, endText] = match;
  if (!startText && !endText) return false;

  let start: number;
  let end: number;

  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return false;
    if (start < 0 || end < start || start >= size) return false;
    end = Math.min(end, size - 1);
  }

  return { start, end };
}

async function serve(
  request: Request,
  params: Promise<{ assetKey: string }>,
  headOnly = false,
) {
  const { assetKey } = await params;
  const parsed = parsePrivateInvitationAssetKey(assetKey);
  if (!parsed) return notFound();

  const expectedUrl = privateInvitationAssetUrl(assetKey);
  const asset = await prisma.invitationAsset.findUnique({
    where: { id: parsed.assetId },
    select: {
      id: true,
      invitationId: true,
      ownerId: true,
      type: true,
      url: true,
      invitation: {
        select: {
          ownerId: true,
          slug: true,
          eventConfigured: true,
          isPublished: true,
          passwordProtected: true,
          payment: true,
        },
      },
    },
  });

  if (!asset || asset.url !== expectedUrl) return notFound();
  if (asset.type === "IMAGE" && parsed.extension !== ".webp") return notFound();
  if (asset.type === "AUDIO" && parsed.extension === ".webp") return notFound();

  const user = await getCurrentUser();
  const ownerAccess = Boolean(user && user.id === asset.ownerId);
  let customStaffAccess = false;

  if (
    user &&
    !ownerAccess &&
    (user.role === "OWNER" || user.role === "ADMIN" || user.role === "DESIGNER")
  ) {
    const activeCustom = await prisma.designerTemplate.findFirst({
      where: {
        customInvitationId: asset.invitationId,
        status: { in: ["DRAFT", "REVIEW"] },
        ...(user.role === "DESIGNER" ? { designerId: user.id } : {}),
      },
      select: { id: true },
    });
    customStaffAccess = Boolean(activeCustom);
  }

  const authenticatedPrivateAccess = ownerAccess || customStaffAccess;

  if (!authenticatedPrivateAccess) {
    const invitation = asset.invitation;
    if (
      !invitation.eventConfigured ||
      !invitation.isPublished ||
      !(await hasAccountDigitalInvitation(invitation.ownerId, invitation.payment, invitation.id))
    ) {
      return notFound();
    }

    if (invitation.passwordProtected) {
      const baseAccess = await hasInvitationAccess(invitation.slug);
      const personalAccess = baseAccess
        ? false
        : await hasPersonalInvitationMediaAccess(
            request,
            asset.invitationId,
            invitation.slug,
          );
      if (!baseAccess && !personalAccess) return notFound();
    }
  }

  let filePath: string;
  try {
    filePath = privateInvitationAssetPath(asset.invitationId, assetKey);
  } catch (error) {
    console.error("Private media storage is not configured", error);
    return new NextResponse("Media storage unavailable", {
      status: 503,
      headers: NO_STORE_HEADERS,
    });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error("Private invitation media read failed", error);
    }
    return notFound();
  }

  const range = parseRange(request.headers.get("range"), bytes.byteLength);
  if (range === false) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Range": `bytes */${bytes.byteLength}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  const publicCacheable = !authenticatedPrivateAccess && !asset.invitation.passwordProtected && hasPaidDigitalInvitation(asset.invitation.payment);
  const headers = new Headers({
    "Content-Type": parsed.contentType,
    "Cache-Control": publicCacheable
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });

  let status = 200;
  let body = bytes;

  if (range) {
    status = 206;
    body = bytes.subarray(range.start, range.end + 1);
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes.byteLength}`);
  }

  headers.set("Content-Length", String(body.byteLength));

  let responseBody: ArrayBuffer | null = null;
  if (!headOnly) {
    // Copy into an ArrayBuffer-backed view so NextResponse receives a standard
    // BodyInit even when Node's Buffer is typed with ArrayBufferLike.
    const responseBytes = new Uint8Array(body.byteLength);
    responseBytes.set(body);
    responseBody = responseBytes.buffer;
  }

  return new NextResponse(responseBody, { status, headers });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetKey: string }> },
) {
  return serve(request, params);
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ assetKey: string }> },
) {
  return serve(request, params, true);
}
