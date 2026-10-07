"use client";

import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { FloatingField } from "@/components/ui/floating-field";
import { displayTitleCase } from "@/lib/text/display-title-case";
import type { PersonalInvitationGuest } from "@/components/Dashboard/personal-invitation-types";
import { PERSONAL_SALUTATIONS, type PersonalSalutation } from "@/lib/guests/personal-envelope";

export type GuestInvitationForm = {
  recipientType: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
  invitedPax: number;
  invitedSessions: ("ceremony" | "reception")[];
  category: string;
  groupText: string;
  personalAddressee: string;
  personalGreeting: string;
  personalEnvelopeEnabled: boolean;
  personalLanguage: "ID" | "EN";
};

export const emptyGuestInvitationForm: GuestInvitationForm = {
  recipientType: "INDIVIDUAL",
  invitedPax: 1,
  invitedSessions: [],
  category: "REGULAR",
  groupText: "",
  personalAddressee: "",
  personalGreeting: "",
  personalEnvelopeEnabled: true,
  personalLanguage: "ID",
};

export function guestInvitationFormFrom(guest: PersonalInvitationGuest): GuestInvitationForm {
  return {
    recipientType: guest.recipientType ?? "INDIVIDUAL",
    invitedPax: guest.invitedPax ?? 1,
    invitedSessions: guest.invitedSessions ?? [],
    category: guest.category || "REGULAR",
    groupText: (guest.tags ?? []).join(", "),
    personalAddressee: guest.personalAddressee || "",
    personalGreeting: guest.personalGreeting || "",
    personalEnvelopeEnabled: guest.personalEnvelopeEnabled !== false,
    personalLanguage: guest.personalLanguage === "EN" ? "EN" : "ID",
  };
}

/** Category and grouping reuse Guest.category and Guest.tags, not new tables. */
export function guestInvitationProfilePayload(value: GuestInvitationForm) {
  return {
    recipientType: value.recipientType,
    invitedPax: value.invitedPax,
    invitedSessions: value.invitedSessions,
    category: value.category,
    tags: Array.from(new Set(value.groupText.split(",").map((item) => item.trim()).filter(Boolean))),
    personalAddressee: value.personalAddressee.trim(),
    personalGreeting: value.personalGreeting.trim(),
    personalEnvelopeEnabled: value.personalEnvelopeEnabled,
    personalLanguage: value.personalLanguage,
  };
}

export function PersonalInvitationSalutationField({
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: {
  value: PersonalSalutation;
  onChange: (next: PersonalSalutation) => void;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  const { d } = useDashboardI18n();
  const labels = { BAPAK: "Bapak", IBU: "Ibu", BAPAK_IBU: "Bapak & Ibu" };
  const select = (
      <select
        value={value}
        aria-label={!showLabel ? d("Sapaan") : undefined}
        onChange={(event) => onChange(event.target.value as PersonalSalutation)}
        disabled={disabled}
        className="min-h-11 w-full border border-primary/25 bg-background px-3 text-sm text-foreground"
      >
        {PERSONAL_SALUTATIONS.map((salutation) => <option key={salutation} value={salutation}>{d(labels[salutation])}</option>)}
      </select>
  );
  return showLabel ? <FloatingField label={d("Sapaan")}>{select}</FloatingField> : select;
}

export function PersonalInvitationGuestFields({
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: {
  value: GuestInvitationForm;
  onChange: (next: GuestInvitationForm) => void;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  const { d } = useDashboardI18n();

  const select = (
      <select
        value={value.category}
        aria-label={!showLabel ? d("Kategori tamu") : undefined}
        onChange={(event) => onChange({ ...value, category: event.target.value })}
        disabled={disabled}
        className="min-h-11 w-full border border-primary/25 bg-background px-3 text-sm text-foreground"
      >
        {value.category && !["REGULAR", "VIP", "VVIP"].includes(value.category) && (
          <option value={value.category} disabled>{displayTitleCase(value.category)}</option>
        )}
        <option value="REGULAR">{d("Reguler")}</option>
        <option value="VIP">VIP</option>
        <option value="VVIP">VVIP</option>
      </select>
  );
  return showLabel ? <FloatingField label={d("Kategori tamu")}>{select}</FloatingField> : select;
}
