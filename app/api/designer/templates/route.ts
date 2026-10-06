import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvitationTemplate } from "@/lib/templates/catalog";
import { parseDesignKey } from "@/lib/templates/design";
import { editableTemplateStatuses, isEditableTemplateStatus } from "@/lib/templates/template-editing";
import { isTrustedMutationOrigin } from "@/lib/security/request-origin";

async function requireTemplateAuthor() {
  const user = await getCurrentUser();
  return user && ["OWNER", "ADMIN", "DESIGNER", "EDITOR"].includes(user.role) ? user : null;
}

function cleanTags(value: unknown) {
  const source = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(source.map((item) => String(item).trim()).filter(Boolean))].slice(0, 12);
}

function safePublicUrl(value: unknown) {
  const url = String(value ?? "").trim();
  return /^\/(?:api\/|templates\/|template\/|uploads\/|[^/][^?#]*)/.test(url) && !url.includes("..") ? url : "";
}

async function nextTemplateNumber() {
  const latest = await prisma.designerTemplate.findFirst({
    orderBy: { templateNo: "desc" },
    select: { templateNo: true },
  });
  return String(Math.max(0, Number(latest?.templateNo ?? "0")) + 1).padStart(3, "0");
}

const studioInvitationSelect = {
  id: true,
  slug: true,
  type: true,
  title: true,
  eventCategory: true,
  groomName: true,
  brideName: true,
  groomFatherName: true,
  groomMotherName: true,
  groomChildOrder: true,
  groomChildPosition: true,
  brideFatherName: true,
  brideMotherName: true,
  brideChildOrder: true,
  brideChildPosition: true,
  venue: true,
  address: true,
  mapUrl: true,
  timezone: true,
  eventDate: true,
  ceremonyTime: true,
  receptionTime: true,
  description: true,
  weddingHashtag: true,
  dressCode: true,
  eventNotes: true,
  musicUrl: true,
  templateKey: true,
  isPublished: true,
  giftBankName: true,
  giftAccountName: true,
  giftAccountNumber: true,
  updatedAt: true,
  assets: {
    select: { id: true, type: true, url: true, title: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

const customInvitationSummarySelect = {
  id: true,
  title: true,
  eventCategory: true,
  updatedAt: true,
  owner: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} as const;

function customAccessActive(status: string) {
  return status === "DRAFT" || status === "REVIEW";
}

export async function GET(request: Request) {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Akses Template Studio diperlukan." }, { status: 403 });

  const url = new URL(request.url);
  const requestedId = url.searchParams.get("id")?.trim();
  const reviewScope = url.searchParams.get("scope") === "review";
  const reviewer = author.role === "OWNER" || author.role === "ADMIN";

  if (reviewScope) {
    if (!reviewer) return NextResponse.json({ error: "Hanya Owner/Admin yang dapat membuka antrean review." }, { status: 403 });
    const templates = await prisma.designerTemplate.findMany({
      where: { status: { in: [...editableTemplateStatuses] } },
      orderBy: { updatedAt: "asc" },
      include: {
        designer: { select: { id: true, firstName: true, lastName: true, email: true } },
        customInvitation: { select: customInvitationSummarySelect },
      },
    });
    return NextResponse.json({
      templates: templates.map(({ customInvitationId, customInvitation, ...template }) => ({
        ...template,
        isCustom: Boolean(customInvitationId),
        customInvitation: customAccessActive(template.status) ? customInvitation : null,
      })),
    });
  }

  if (requestedId) {
    const template = await prisma.designerTemplate.findFirst({
      where: {
        id: requestedId,
        ...(reviewer ? {} : { designerId: author.id }),
      },
      include: {
        customInvitation: { select: studioInvitationSelect },
      },
    });
    if (!template) return NextResponse.json({ error: "Draft template tidak ditemukan." }, { status: 404 });
    const { customInvitationId, customInvitation, ...safeTemplate } = template;
    return NextResponse.json({
      template: {
        ...safeTemplate,
        isCustom: Boolean(customInvitationId),
        customInvitation: customAccessActive(template.status) ? customInvitation : null,
      },
    });
  }

  const templates = await prisma.designerTemplate.findMany({
    where: { designerId: author.id },
    orderBy: { createdAt: "desc" },
    include: {
      customInvitation: { select: customInvitationSummarySelect },
    },
  });

  const paidOrders = await prisma.paymentOrder.findMany({
    where: {
      status: "PAID",
      packageKey: { in: ["INVITATION_BASIC", "GUESTBOOK_DIGITAL"] },
      invitation: { templateKey: { not: "" } },
    },
    select: {
      invitationId: true,
      amount: true,
      invitation: { select: { templateKey: true } },
    },
  });

  const saleEvents = new Set<string>();
  const templateRows = templates.map((template) => {
    const matching = paidOrders.filter((order) =>
      order.invitation.templateKey.includes(`designer:${template.templateNo}`),
    );
    const invitationIds = new Set(matching.map((order) => order.invitationId));
    invitationIds.forEach((id) => saleEvents.add(id));
    const { customInvitationId, customInvitation, ...safeTemplate } = template;
    return {
      ...safeTemplate,
      isCustom: Boolean(customInvitationId),
      customInvitation: customAccessActive(template.status) ? customInvitation : null,
      salesCount: invitationIds.size,
      orderValue: matching.reduce((sum, order) => sum + order.amount, 0),
    };
  });

  return NextResponse.json({
    templates: templateRows,
    summary: {
      templateCount: templates.length,
      templatesWithSales: templateRows.filter((template) => template.salesCount > 0).length,
      salesCount: saleEvents.size,
      orderValue: templateRows.reduce((sum, template) => sum + template.orderValue, 0),
    },
  });
}

async function createStudioTemplate(request: Request, author: NonNullable<Awaited<ReturnType<typeof requireTemplateAuthor>>>) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const designKey = String(body?.designKey ?? "").trim();
  if (!designKey || designKey.length > 30000) {
    return NextResponse.json({ error: "Design template tidak valid." }, { status: 400 });
  }

  const parsed = parseDesignKey(designKey);
  if (parsed.template === "blank-canvas" && !["OWNER", "DESIGNER"].includes(author.role)) {
    return NextResponse.json({ error: "Canvas kosong hanya untuk Owner dan Designer." }, { status: 403 });
  }
  const baseTemplate = getInvitationTemplate(parsed.template);
  if (!baseTemplate || baseTemplate.key !== parsed.template) {
    return NextResponse.json({ error: "Base template tidak tersedia." }, { status: 400 });
  }

  const requestedName = String(body?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const name = requestedName || `${baseTemplate.name} Studio`;
  const category = String(body?.category ?? baseTemplate.category ?? "Designer").trim().slice(0, 40) || "Designer";
  const description = String(body?.description ?? "").trim().replace(/\s+/g, " ").slice(0, 240)
    || `Varian Studio dari ${baseTemplate.name}.`;
  const tags = cleanTags(body?.tags);
  const previewUrl = safePublicUrl(body?.previewUrl) || baseTemplate.previewImage;
  const usesPhotos = body?.usesPhotos === undefined ? baseTemplate.usesPhotos : body.usesPhotos === true;
  const musicUrl = safePublicUrl(body?.musicUrl) || null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const templateNo = await nextTemplateNumber();
      const created = await prisma.designerTemplate.create({
        data: {
          templateNo,
          name,
          tags,
          previewUrl,
          templateFile: null,
          designKey,
          category,
          description,
          usesPhotos,
          musicUrl,
          status: "DRAFT",
          designerId: author.id,
        },
      });
      return NextResponse.json({ template: created, ready: false }, { status: 201 });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;
      if (code === "P2002") continue;
      throw error;
    }
  }

  return NextResponse.json({ error: "Nomor template sedang dipakai. Coba simpan lagi." }, { status: 409 });
}

export async function PATCH(request: Request) {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Akses Template Studio diperlukan." }, { status: 403 });
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Gunakan data Studio JSON untuk menyimpan draft." }, { status: 415 });
  }

  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Draft template tidak valid." }, { status: 400 });

    const current = await prisma.designerTemplate.findFirst({
      where: {
        id,
        ...((author.role === "OWNER" || author.role === "ADMIN") ? {} : { designerId: author.id }),
      },
    });
    if (!current) return NextResponse.json({ error: "Draft template tidak ditemukan." }, { status: 404 });

    const action = String(body?.action ?? "").trim().toUpperCase();
    const reviewer = author.role === "OWNER" || author.role === "ADMIN";
    if (action === "SUBMIT_REVIEW") {
      if (current.status !== "DRAFT") {
        return NextResponse.json({ error: "Hanya draft yang dapat dikirim untuk review." }, { status: 409 });
      }
      const updated = await prisma.designerTemplate.update({
        where: { id: current.id },
        data: { status: "REVIEW" },
      });
      return NextResponse.json({ template: updated, ready: false });
    }
    if (action === "PUBLISH") {
      if (!reviewer) return NextResponse.json({ error: "Hanya Owner/Admin yang dapat mempublikasikan template." }, { status: 403 });
      if (current.customInvitationId) {
        return NextResponse.json({ error: "Custom request terikat ke satu event user dan tidak boleh dipublish ke katalog. Berikan hasilnya ke user." }, { status: 409 });
      }
      if (current.status !== "REVIEW") {
        return NextResponse.json({ error: "Template harus melalui review sebelum dipublikasikan." }, { status: 409 });
      }
      const updated = await prisma.designerTemplate.update({
        where: { id: current.id },
        data: { status: "PUBLISHED" },
      });
      return NextResponse.json({ template: updated, ready: Boolean(updated.designKey) });
    }
    if (action === "RETURN_DRAFT") {
      if (!reviewer) return NextResponse.json({ error: "Hanya Owner/Admin yang dapat mengembalikan template ke Draft." }, { status: 403 });
      if (current.status !== "REVIEW") {
        return NextResponse.json({ error: "Hanya template yang sedang direview yang dapat dikembalikan." }, { status: 409 });
      }
      const updated = await prisma.designerTemplate.update({
        where: { id: current.id },
        data: { status: "DRAFT" },
      });
      return NextResponse.json({ template: updated, ready: false });
    }

    if (!isEditableTemplateStatus(current.status)) {
      return NextResponse.json({ error: "Template ini sudah tidak dapat diedit." }, { status: 409 });
    }

    const designKey = String(body?.designKey ?? "").trim();
    if (!designKey || designKey.length > 30000) {
      return NextResponse.json({ error: "Design template tidak valid." }, { status: 400 });
    }
    const parsed = parseDesignKey(designKey);
    if (parsed.template === "blank-canvas" && !["OWNER", "DESIGNER"].includes(author.role)) {
      return NextResponse.json({ error: "Canvas kosong hanya untuk Owner dan Designer." }, { status: 403 });
    }
    const baseTemplate = getInvitationTemplate(parsed.template);
    if (!baseTemplate || baseTemplate.key !== parsed.template) {
      return NextResponse.json({ error: "Base template tidak tersedia." }, { status: 400 });
    }

    const requestedName = String(body?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    const name = requestedName || current.name || `${baseTemplate.name} Studio`;
    const category = String(body?.category ?? current.category ?? baseTemplate.category ?? "Designer").trim().slice(0, 40) || "Designer";
    const description = String(body?.description ?? current.description ?? "").trim().replace(/\s+/g, " ").slice(0, 240)
      || `Varian Studio dari ${baseTemplate.name}.`;
    const tags = cleanTags(body?.tags);
    const previewUrl = safePublicUrl(body?.previewUrl) || current.previewUrl || baseTemplate.previewImage;
    const usesPhotos = body?.usesPhotos === undefined ? current.usesPhotos : body.usesPhotos === true;
    const musicUrl = safePublicUrl(body?.musicUrl) || null;

    const updated = await prisma.designerTemplate.update({
      where: {
        id: current.id,
        status: { in: [...editableTemplateStatuses] },
        ...(reviewer ? {} : { designerId: author.id }),
      },
      data: { name, tags, previewUrl, designKey, category, description, usesPhotos, musicUrl },
    });
    return NextResponse.json({ template: updated, ready: updated.status === "PUBLISHED" && Boolean(updated.designKey) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Template ini sudah tidak dapat diedit. Muat ulang Studio." }, { status: 409 });
    }
    console.error("PATCH /api/designer/templates Studio failed", error);
    return NextResponse.json({ error: "Draft template belum dapat disimpan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Akses Template Studio diperlukan." }, { status: 403 });
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Origin permintaan tidak valid." }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "Upload file ZIP/HTML/JSON mentah dinonaktifkan. Simpan template melalui Template Studio." },
      { status: 415 },
    );
  }

  try {
    return await createStudioTemplate(request, author);
  } catch (error) {
    console.error("POST /api/designer/templates Studio failed", error);
    return NextResponse.json({ error: "Template Studio belum dapat disimpan." }, { status: 500 });
  }
}
