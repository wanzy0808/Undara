import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnerPackageGrant, setOwnerPackageGrant, type ManualPackageAccess } from "@/lib/packages/owner-grants";
import { sendOwnerAccountActionEmail } from "@/lib/notifications/email";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

const roles = ["USER", "DESIGNER", "ADMIN", "SUPPORT"] as const;
const digitalKeys = new Set(["INVITATION_BASIC", "GUESTBOOK_DIGITAL", "INVITATION_GUESTBOOK"]);
const guestbookKeys = new Set(["GUESTBOOK_DIGITAL", "INVITATION_GUESTBOOK"]);

async function requireOwner() {
  const user = await getCurrentUser();
  return user?.role === "OWNER" ? user : null;
}

function purchasedAccess(orders: Array<{ packageKey: string; status: string }>) {
  const paid = orders.filter((order) => order.status === "PAID");
  const guestbook = paid.some((order) => guestbookKeys.has(order.packageKey));
  const digitalCount = paid.filter((order) => digitalKeys.has(order.packageKey)).length;
  return { digital: digitalCount > 0, digitalCount, guestbook };
}

function normalizeAccess(value: unknown): ManualPackageAccess {
  if (!value || typeof value !== "object") {
    return { digital: false, digitalCredits: 0, guestbook: false };
  }
  const input = value as { digital?: unknown; digitalCredits?: unknown; guestbook?: unknown };
  const guestbook = input.guestbook === true;
  const numericCredits = Number(input.digitalCredits);
  const digitalCredits = Number.isInteger(numericCredits) && numericCredits >= 0
    ? Math.min(numericCredits, 100)
    : input.digital === true
      ? 1
      : 0;
  const effectiveCredits = Math.max(digitalCredits, guestbook ? 1 : 0);
  return { digital: effectiveCredits > 0, digitalCredits: effectiveCredits, guestbook };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Akses Owner diperlukan." }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: { in: [...roles] } },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      orders: {
        where: { status: "PAID" },
        select: { packageKey: true, status: true },
      },
      _count: { select: { invitations: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = await Promise.all(users.map(async (user) => {
    const purchased = purchasedAccess(user.orders);
    const granted = await getOwnerPackageGrant(user.id);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: user._count,
      packageAccess: {
        digital: purchased.digital || granted.digital,
        guestbook: purchased.guestbook || granted.guestbook,
        purchasedDigital: purchased.digital,
        purchasedDigitalCount: purchased.digitalCount,
        purchasedGuestbook: purchased.guestbook,
        grantedDigital: granted.digital,
        grantedDigitalCredits: granted.digitalCredits,
        grantedGuestbook: granted.guestbook,
      },
    };
  }));

  return NextResponse.json({ users: rows });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Akses Owner diperlukan." }, { status: 403 });
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const firstName = email.split("@")[0]?.trim() || "User";
    const role = roles.includes(body.role) ? body.role : "USER";
    const password = String(body.password ?? "");

    if (!email || password.length < 8) {
      return NextResponse.json({ error: "Email dan password minimal 8 karakter wajib diisi." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName: null,
        role,
        emailVerifiedAt: new Date(),
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: { id: true, email: true, role: true },
    });

    const access = normalizeAccess(body.packageAccess);
    if (access.digital || access.guestbook) {
      await setOwnerPackageGrant(owner.id, user.id, access);
    }

    await prisma.auditLog.create({
      data: {
        actorId: owner.id,
        action: "ACCOUNT_CREATED",
        entity: "User",
        entityId: user.id,
        metadata: { role, email },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/owner/users failed", error);
    return NextResponse.json({ error: "Akun belum dapat dibuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Akses Owner diperlukan." }, { status: 403 });
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });

  try {
    const body = await request.json();
    const userId = String(body.userId ?? "");
    const action = String(body.action ?? "PROFILE");
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    if (action === "PASSWORD") {
      const password = String(body.password ?? "");
      if (password.length < 8) {
        return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.accountActionToken.deleteMany({ where: { userId: target.id, action: "PASSWORD_CHANGE" } });
      await prisma.accountActionToken.create({
        data: {
          tokenHash,
          userId: target.id,
          action: "PASSWORD_CHANGE",
          payload: { passwordHash },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      const confirmationEmail = process.env.OWNER_CONFIRMATION_EMAIL ?? owner.email;
      const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
      const confirmationUrl = `${baseUrl}/owner/account-confirmation?token=${encodeURIComponent(token)}`;
      await sendOwnerAccountActionEmail({
        to: confirmationEmail,
        actionLabel: "perubahan password",
        targetEmail: target.email,
        confirmationUrl,
      });

      return NextResponse.json({ message: `Konfirmasi perubahan password dikirim ke ${confirmationEmail}.` });
    }

    const email = String(body.email ?? target.email).trim().toLowerCase();
    const role = roles.includes(body.role) ? body.role : target.role;
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { email, role },
      select: { id: true, email: true, role: true, emailVerifiedAt: true, createdAt: true },
    });

    if (body.packageAccess && typeof body.packageAccess === "object") {
      await setOwnerPackageGrant(owner.id, target.id, normalizeAccess(body.packageAccess));
    }

    await prisma.auditLog.create({
      data: {
        actorId: owner.id,
        action: "ACCOUNT_UPDATED",
        entity: "User",
        entityId: target.id,
        metadata: { email, role },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/owner/users failed", error);
    return NextResponse.json({ error: "Data akun belum dapat diubah." }, { status: 500 });
  }
}
