import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServicePackage } from "@/lib/packages/catalog";
import { getOwnerPackageGrant } from "@/lib/packages/owner-grants";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

const invitationKey = "INVITATION_BASIC";
const guestbookKey = "GUESTBOOK_DIGITAL";
const legacyBundleKey = "INVITATION_GUESTBOOK";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
  }

  try {
    const ownerGrant = await getOwnerPackageGrant(user.id);
    const body = await request.json();
    const invitationId = String(body.invitationId ?? "").trim();
    const requestedKey = String(body.packageKey ?? "");
    const selected = getServicePackage(requestedKey);

    if (!invitationId) {
      return NextResponse.json({ error: "Pilih acara yang akan diaktifkan." }, { status: 400 });
    }
    if (!selected || ![invitationKey, guestbookKey].includes(requestedKey)) {
      return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 400 });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, ownerId: user.id },
      include: { payment: true },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }

    const currentPaidKey = invitation.payment?.status === "PAID" ? invitation.payment.packageKey : null;

    if (ownerGrant.guestbook) {
      return NextResponse.json({ error: "Paket Guest Book sudah diaktifkan oleh Owner untuk akun ini." }, { status: 409 });
    }
    if (
      requestedKey === invitationKey &&
      (await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))
    ) {
      return NextResponse.json({ error: "Undangan Digital sudah diaktifkan untuk acara ini." }, { status: 409 });
    }

    if (currentPaidKey === guestbookKey || currentPaidKey === legacyBundleKey) {
      return NextResponse.json({ error: "Paket Guest Book sudah aktif dan sudah mencakup Undangan Digital." }, { status: 409 });
    }

    const packageKey = currentPaidKey === invitationKey && requestedKey === guestbookKey
      ? guestbookKey
      : requestedKey;

    const packageData = getServicePackage(packageKey);
    if (!packageData) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 400 });

    const proofUrl = String(body.proofUrl ?? "").trim() || null;
    const payment = await prisma.payment.upsert({
      where: { invitationId: invitation.id },
      update: {
        userId: user.id,
        packageKey,
        amount: packageData.price,
        proofUrl,
        status: "PENDING",
        confirmedAt: null,
        confirmedById: null,
      },
      create: {
        userId: user.id,
        invitationId: invitation.id,
        packageKey,
        amount: packageData.price,
        proofUrl,
      },
    });

    return NextResponse.json({ payment, package: packageData, invitationId: invitation.id });
  } catch (error) {
    console.error("POST /api/packages failed", error);
    return NextResponse.json({ error: "Paket belum dapat dipilih." }, { status: 500 });
  }
}
