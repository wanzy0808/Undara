import { slugifyEvent } from "@/lib/invitations/slug";

/**
 * Legacy invitation-sharing destination. Previously downloaded /q links keep
 * resolving the current published slug; the admission-ticket menu uses the
 * signed Guest payload from lib/usher/qr instead.
 */
export function invitationQrTarget(appOrigin: string, invitationId: string): string {
  const base = new URL(appOrigin);
  const id = invitationId.trim();
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new Error("Invalid invitation ID.");
  }
  return new URL(`/q/${encodeURIComponent(id)}`, base.origin).toString();
}

export function invitationQrFilename(title: string | null | undefined, guestName: string): string {
  const eventName = slugifyEvent(title?.trim() || "acara").slice(0, 80).replace(/-+$/, "");
  const guest = slugifyEvent(guestName.trim() || "tamu").slice(0, 50).replace(/-+$/, "");
  return `undara-tiket-masuk-${eventName}-${guest}.png`;
}
