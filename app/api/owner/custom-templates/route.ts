import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvitationTemplate, isInvitationTemplateCompatible } from "@/lib/templates/catalog";
import { parseDesignKey } from "@/lib/templates/design";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

async function requireOwner() {
  const user = await getCurrentUser();
  return user?.role === "OWNER" ? user : null;
}

function cleanCustomName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

async function nextTemplateNumber() {
  const latest = await prisma.designerTemplate.findFirst({
    orderBy: { templateNo: "desc" },
    select: { templateNo: true },
  });
  return String(Math.max(0, Number(latest?.templateNo ?? "0")) + 1).padStart(3, "0");
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner) {
    return NextResponse.json({ error: "Akses Owner diperlukan." }, { status: 403 });
  }

  const [users, designers] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        invitations: {
          where: { isPublished: false },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            eventCategory: true,
            groomName: true,
            brideName: true,
            templateKey: true,
            eventConfigured: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "DESIGNER" },
      orderBy: [{ firstName: "asc" }, { email: "asc" }],
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    }),
  ]);

  return NextResponse.json({
    users,
    authors: [
      {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: owner.role,
      },
      ...designers,
    ],
  });
}

async function createCustomRequest(
  owner: NonNullable<Awaited<ReturnType<typeof requireOwner>>>,
  body: Record<string, unknown>,
) {
  const userId = String(body.userId ?? "").trim();
  const invitationId = String(body.invitationId ?? "").trim();
  const authorId = String(body.authorId ?? "").trim();

  if (!userId || !invitationId || !authorId) {
    return NextResponse.json(
      { error: "Pilih user, event, dan Owner/Designer yang menangani custom." },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: userId, role: "USER" },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "User tujuan tidak ditemukan." }, { status: 404 });
  }

  const assignedAuthor = authorId === owner.id
    ? {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: owner.role,
      }
    : await prisma.user.findFirst({
        where: { id: authorId, role: "DESIGNER" },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
  if (!assignedAuthor) {
    return NextResponse.json({ error: "Designer yang dipilih tidak tersedia." }, { status: 404 });
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: targetUser.id, isPublished: false },
    select: {
      id: true,
      title: true,
      eventConfigured: true,
      templateKey: true,
      musicUrl: true,
    },
  });
  if (!invitation) {
    return NextResponse.json(
      { error: "Event tujuan tidak ditemukan atau sudah dipublish." },
      { status: 404 },
    );
  }
  if (!invitation.eventConfigured) {
    return NextResponse.json(
      { error: "Lengkapi data event user terlebih dahulu sebelum membuat custom request." },
      { status: 409 },
    );
  }
  if (!invitation.templateKey.trim()) {
    return NextResponse.json(
      { error: "User perlu memilih dan menyimpan template awal sebelum custom request dibuat." },
      { status: 409 },
    );
  }

  const parsed = parseDesignKey(invitation.templateKey);
  const baseTemplate = getInvitationTemplate(parsed.template);
  if (!baseTemplate || baseTemplate.key !== parsed.template) {
    return NextResponse.json(
      { error: "Template awal event user tidak lagi tersedia." },
      { status: 409 },
    );
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const templateNo = await nextTemplateNumber();
      const created = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitation.id} FOR UPDATE`;

        const active = await tx.designerTemplate.findFirst({
          where: {
            customInvitationId: invitation.id,
            status: { in: ["DRAFT", "REVIEW"] },
          },
          select: { id: true, templateNo: true },
        });
        if (active) {
          throw new Error(`Event ini sudah punya custom request aktif (#${active.templateNo}).`);
        }

        const template = await tx.designerTemplate.create({
          data: {
            templateNo,
            name: cleanCustomName(`Custom · ${invitation.title || "Undangan"}`),
            tags: [baseTemplate.category || "Designer", "custom"],
            previewUrl: baseTemplate.previewImage,
            templateFile: null,
            designKey: invitation.templateKey,
            category: "Custom",
            description: `Custom request berbasis ${baseTemplate.name} untuk satu event user.`,
            usesPhotos: baseTemplate.usesPhotos,
            musicUrl: invitation.musicUrl,
            status: "DRAFT",
            designerId: assignedAuthor.id,
            customInvitationId: invitation.id,
          },
          include: {
            designer: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: owner.id,
            action: "CUSTOM_TEMPLATE_REQUEST_CREATED",
            entity: "DesignerTemplate",
            entityId: template.id,
            metadata: {
              templateNo: template.templateNo,
              designerId: assignedAuthor.id,
              targetUserId: targetUser.id,
              targetUserEmail: targetUser.email,
              invitationId: invitation.id,
            },
          },
        });

        return template;
      });

      return NextResponse.json(
        {
          template: created,
          message: "Custom request dibuat. Owner/Designer yang ditugaskan sekarang dapat memakai foto event user di Template Studio.",
        },
        { status: 201 },
      );
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;
      if (code === "P2002") continue;
      throw error;
    }
  }

  return NextResponse.json(
    { error: "Nomor template sedang dipakai. Coba buat custom request lagi." },
    { status: 409 },
  );
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) {
    return NextResponse.json({ error: "Akses Owner diperlukan." }, { status: 403 });
  }
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Data custom request tidak valid." }, { status: 400 });
    }

    const action = String(body.action ?? "ASSIGN_TO_USER").trim().toUpperCase();
    if (action === "CREATE_REQUEST") {
      return createCustomRequest(owner, body);
    }

    const templateId = String(body.templateId ?? "").trim();
    const userId = String(body.userId ?? "").trim();
    const invitationId = String(body.invitationId ?? "").trim();

    if (!templateId || !userId || !invitationId) {
      return NextResponse.json(
        { error: "Pilih template, user, dan event tujuan." },
        { status: 400 },
      );
    }

    const template = await prisma.designerTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        templateNo: true,
        name: true,
        designKey: true,
        musicUrl: true,
        status: true,
        designerId: true,
        customInvitationId: true,
      },
    });
    if (!template || !template.designKey) {
      return NextResponse.json({ error: "Template custom tidak ditemukan atau belum memiliki desain." }, { status: 404 });
    }

    const assignable =
      template.status === "REVIEW" ||
      (template.status === "DRAFT" && template.designerId === owner.id);
    if (!assignable) {
      return NextResponse.json(
        { error: "Template harus menunggu review Owner, atau merupakan Draft yang dibuat Owner sendiri." },
        { status: 409 },
      );
    }

    if (template.customInvitationId && template.customInvitationId !== invitationId) {
      return NextResponse.json(
        { error: "Custom request ini terikat ke event user lain dan tidak dapat dipindahkan." },
        { status: 409 },
      );
    }

    const parsed = parseDesignKey(template.designKey);
    const baseTemplate = getInvitationTemplate(parsed.template);
    if (!baseTemplate || baseTemplate.key !== parsed.template) {
      return NextResponse.json({ error: "Desain template custom tidak lagi tersedia." }, { status: 409 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, role: "USER" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User tujuan tidak ditemukan." }, { status: 404 });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, ownerId: targetUser.id, isPublished: false },
      select: { id: true, title: true, templateKey: true, musicUrl: true, eventCategory: true },
    });
    if (!invitation) {
      return NextResponse.json(
        { error: "Event tujuan tidak ditemukan atau sudah dipublish. Pilih event draft milik user." },
        { status: 404 },
      );
    }

    if (!isInvitationTemplateCompatible(template.designKey, invitation.eventCategory)) {
      return NextResponse.json({ error: "Template tidak sesuai dengan kategori acara tujuan." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitation.id} FOR UPDATE`;
      const current = await tx.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
      if (current.isPublished || !isInvitationTemplateCompatible(template.designKey!, current.eventCategory)) {
        throw new Error("Kategori atau status acara berubah. Muat ulang sebelum memberikan template.");
      }
      const archived = await tx.designerTemplate.updateMany({
        where: { id: template.id, status: template.status },
        data: { status: "ARCHIVED" },
      });
      if (archived.count !== 1) {
        throw new Error("Template sudah diproses oleh Owner lain. Muat ulang panel.");
      }

      const updatedInvitation = await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          templateKey: template.designKey!,
          ...(template.musicUrl ? { musicUrl: template.musicUrl } : {}),
        },
        select: {
          id: true,
          ownerId: true,
          title: true,
          templateKey: true,
          musicUrl: true,
          isPublished: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: owner.id,
          action: "CUSTOM_TEMPLATE_ASSIGNED",
          entity: "Invitation",
          entityId: updatedInvitation.id,
          metadata: {
            templateId: template.id,
            templateNo: template.templateNo,
            templateName: template.name,
            designerId: template.designerId,
            targetUserId: targetUser.id,
            targetUserEmail: targetUser.email,
            previousTemplateKey: invitation.templateKey,
            customInvitationId: template.customInvitationId,
          },
        },
      });

      return updatedInvitation;
    });

    return NextResponse.json({
      invitation: result,
      assignment: {
        templateId: template.id,
        templateNo: template.templateNo,
        userId: targetUser.id,
        invitationId: result.id,
      },
      message: "Template custom sudah diberikan ke user sebagai desain draft undangannya. Akses media Designer otomatis ditutup.",
    });
  } catch (error) {
    console.error("POST /api/owner/custom-templates failed", error);
    const message = error instanceof Error ? error.message : "Template custom belum dapat diproses.";
    const conflict = /sudah punya custom request aktif|sudah diproses|Kategori atau status acara berubah/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 500 });
  }
}
