import type { PersonalInvitationEvent, PersonalInvitationItem } from "@/components/Dashboard/personal-invitation-types";
import { formatPersonalEnvelopeAddress } from "@/lib/guests/personal-envelope";

export const PERSONAL_INVITATION_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_INVITATION_ROOT_DOMAIN || "dcwedding.com";

export function sortPersonalInvitationEvents(
  items: PersonalInvitationEvent[],
) {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function buildPersonalInvitationPublicUrl(
  eventSlug: string,
  token: string,
) {
  if (!eventSlug || !token) return "";
  return `https://${eventSlug}.${PERSONAL_INVITATION_ROOT_DOMAIN}/p/${token}`;
}

export function splitPersonalGuestNames(value: string) {
  const names = value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  if (!names.length || names.some((name) => name.length > 120)) {
    throw new Error("Nama tamu wajib diisi (maksimal 120 karakter).");
  }
  return names;
}

export function buildPersonalInvitationWhatsAppUrl(event: PersonalInvitationEvent, guest: PersonalInvitationItem) {
  const url = buildPersonalInvitationPublicUrl(event.slug, guest.personalToken);
  const message = `${formatPersonalEnvelopeAddress(guest) || guest.name}\n\n${event.title}\n${url}`;
  let phone = (guest.phone ?? "").replace(/\D/g, "");
  if (phone.startsWith("0062")) phone = phone.slice(2);
  else if (phone.startsWith("08")) phone = `62${phone.slice(1)}`;
  else if (phone.startsWith("8")) phone = `62${phone}`;
  if (!/^[1-9]\d{7,14}$/.test(phone)) phone = "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
