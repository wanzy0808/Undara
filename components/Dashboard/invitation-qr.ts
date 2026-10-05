export type InvitationQrOption = {
  id: string;
  title: string;
  isPublished: boolean;
  accessPaid?: boolean;
};

export function accessibleInvitationQrOptions(invitations: InvitationQrOption[]) {
  return invitations.filter((invitation) => invitation.accessPaid === true);
}

export type InvitationQrGuest = {
  id: string;
  invitationId: string;
  name: string;
  phone?: string | null;
};

export function invitationQrGuestOptions(guests: InvitationQrGuest[], invitationId: string) {
  return guests.filter((guest) => guest.invitationId === invitationId && typeof guest.id === "string" && !!guest.id && typeof guest.name === "string");
}

export function invitationQrImageUrl(invitationId: string, guestId: string, download = false, locale: "id" | "en" = "id") {
  return `/api/invitations/qr?invitationId=${encodeURIComponent(invitationId)}&guestId=${encodeURIComponent(guestId)}${download ? "&download=1" : ""}${locale === "en" ? "&locale=en" : ""}`;
}
