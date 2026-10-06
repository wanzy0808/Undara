import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInvitationTemplate, invitationTemplates } from "@/lib/templates/catalog";
import { parseDesignKey } from "@/lib/templates/design";

export const dynamic = "force-dynamic";

/**
 * Single public catalog endpoint for /template-design, /d-invitation and Studio.
 * Studio-authored templates are ready when their persisted renderer has exactly
 * one event category. Unclassified blank-canvas masters and legacy uploads stay
 * preview-only; they must not become a choice in every event category.
 */
export async function GET() {
  const builtIn = invitationTemplates.map((item) => ({
    ...item,
    source: "built-in" as const,
    ready: true as const,
  }));

  try {
    const uploaded = await prisma.designerTemplate.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { templateNo: "asc" },
      select: {
        templateNo: true,
        name: true,
        tags: true,
        previewUrl: true,
        designKey: true,
        category: true,
        description: true,
        usesPhotos: true,
        musicUrl: true,
      },
    });

    const designer = uploaded.map((item) => {
      const parsed = item.designKey ? parseDesignKey(item.designKey) : null;
      const base = parsed ? getInvitationTemplate(parsed.template) : null;
      const ready = Boolean(item.designKey && base && base.key === parsed?.template && base.eventCategories.length === 1);

      return {
        key: `designer:${item.templateNo}`,
        name: item.name,
        description: item.description || item.tags.join(" · ") || "Template Designer",
        previewImage: item.previewUrl,
        assetPath: base?.assetPath ?? "",
        category: item.category || item.tags[0] || "Designer",
        eventCategories: ready ? (base?.eventCategories ?? []) : [],
        previewType: ready ? ("studio" as const) : ("image" as const),
        source: "designer" as const,
        ready,
        designKey: item.designKey ?? undefined,
        musicUrl: item.musicUrl,
        usesPhotos: ready ? item.usesPhotos : false,
        photoSlots: ready ? (base?.photoSlots ?? []) : [],
        preset: ready && base && parsed
          ? {
              ...base.preset,
              palette: parsed.palette,
              font: parsed.font,
            }
          : undefined,
      };
    });

    return NextResponse.json(
      { templates: [...builtIn, ...designer] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { templates: builtIn, designerCatalogUnavailable: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
