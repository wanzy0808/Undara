import type { PersonalSalutation } from "@/lib/guests/personal-envelope";
import type { RecipientType } from "@/lib/guests/personal-profile";

export const MAX_GUEST_PARTY_SIZE = 30;

export function minimumInvitedPaxForSalutation(salutation: PersonalSalutation) {
  return salutation === "BAPAK_IBU" ? 2 : 1;
}

export function recipientTypeForManualParty(
  salutation: PersonalSalutation,
  invitedPax: number,
): RecipientType {
  if (salutation === "BAPAK_IBU") return invitedPax === 2 ? "COUPLE" : "FAMILY";
  return invitedPax === 1 ? "INDIVIDUAL" : "GROUP";
}
