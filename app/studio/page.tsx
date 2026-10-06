import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudioEntrySection from "@/components/InvitationStudio/StudioEntrySection";
import { PENDING_TEMPLATE_COOKIE, isSelectableTemplate } from "@/lib/templates/template-intent";
import { getInvitationTemplate, invitationTemplates, templateSupportsEventCategory } from "@/lib/templates/catalog";

/**
 * Marketing CTA gateway. Studio needs an existing, configured event and its ID;
 * never open the editor without one or create an event as a side effect.
 */
export default async function StudioEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = typeof params.template === "string" ? params.template : undefined;
  const stored = (await cookies()).get(PENDING_TEMPLATE_COOKIE)?.value;
  const selectedTemplate = isSelectableTemplate(requested) ? requested : !requested && isSelectableTemplate(stored) ? stored : undefined;
  const studioUrl = selectedTemplate ? `/studio?template=${encodeURIComponent(selectedTemplate)}` : "/studio";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(studioUrl)}`);
  if (user.role === "OWNER") redirect("/owner");
  if (user.role === "ADMIN" || user.role === "FINANCE") redirect("/admin");
  if (user.role === "DESIGNER" || user.role === "EDITOR") redirect("/designer");

  let selectedTheme = invitationTemplates.find((item) => item.key === selectedTemplate);
  if (selectedTemplate?.startsWith("designer:")) {
    const designer = await prisma.designerTemplate.findUnique({
      where: { templateNo: selectedTemplate.slice("designer:".length) },
      select: { status: true, designKey: true },
    });
    if (designer?.status === "PUBLISHED" && designer.designKey) {
      const baseKey = designer.designKey.split("::")[0];
      const base = getInvitationTemplate(baseKey);
      if (base.key === baseKey) selectedTheme = base;
    }
  }
  const availableEvents = await prisma.invitation.findMany({
    where: { ownerId: user.id, eventConfigured: true },
    select: { id: true, title: true, type: true, eventCategory: true },
    orderBy: { updatedAt: "desc" },
  });
  const events = selectedTemplate
    ? availableEvents.filter((event) => selectedTheme && templateSupportsEventCategory(selectedTheme, event.eventCategory))
    : availableEvents;

  if (events.length === 1) {
    const event = events[0];
    redirect(`/dashboard/editor?invitationId=${encodeURIComponent(event.id)}&type=${event.type}${selectedTemplate ? `&template=${encodeURIComponent(selectedTemplate)}` : ""}`);
  }

  return <StudioEntrySection events={events} selectedTemplate={selectedTemplate} />;
}
