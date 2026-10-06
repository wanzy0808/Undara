import type { EventScopeOption } from "@/components/Dashboard/EventScopePicker";
import type { GuestInvitationForm } from "@/components/Dashboard/PersonalInvitationGuestFields";
import type { PersonalSalutation } from "@/lib/guests/personal-envelope";

export type PersonalInvitationDraft = {
  key: string;
  name: string;
  category: string;
  salutation?: PersonalSalutation;
  guestId?: string;
  invitationId?: string;
  profile?: GuestInvitationForm;
};

export type PersonalInvitationGuest = {
  id: string;
  name: string;
  phone: string | null;
  category?: string | null;
  tags?: string[];
  recipientType?: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
  invitedPax?: number;
  personalAddressee?: string | null;
  personalGreeting?: string | null;
  personalEnvelopeEnabled?: boolean;
  personalLanguage?: "ID" | "EN";
  personalSharedAt?: string | null;
  rsvpStatus?: "ATTENDING" | "NOT_ATTENDING" | "TENTATIVE" | "PENDING";
  plusOnes?: number;
  checkedIn?: boolean;
  table?: { id: string; name: string } | null;
  personalToken?: string | null;
  personalPublished?: boolean;
  personalPasswordProtected?: boolean;
  personalViewCount?: number;
};

export type PersonalInvitationItem = PersonalInvitationGuest & {
  personalToken: string;
  personalPublished: boolean;
  personalPasswordProtected: boolean;
  personalViewCount: number;
};

export type PersonalInvitationEvent = EventScopeOption & {
  slug: string;
  templateKey: string;
  eventConfigured: boolean;
  accessPaid: boolean;
  createdAt: string;
};
