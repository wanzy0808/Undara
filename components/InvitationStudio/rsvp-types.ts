import type { WeddingSession } from "@/lib/events/wedding-sessions";
import type { InvitationRsvpConfig } from "@/lib/templates/rsvp-config";

export type PersonalRsvpGuest = {
  id: string;
  name: string;
  token: string;
  invitedPax: number;
  personalAddressee?: string | null;
  recipientType?: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
  personalEnvelopeEnabled?: boolean;
  personalLanguage?: "ID" | "EN";
};

export type RsvpFormProps = {
  appearance?: "zen";
  preview?: boolean;
  slug: string;
  guestId?: string;
  guestName?: string;
  guestToken?: string;
  invitedPax?: number;
  eventDate?: string | Date;
  venue?: string | null;
  title?: string | null;
  start?: string | null;
  end?: string | null;
  description?: string | null;
  eventCategory?: string | null;
  rsvpConfig?: InvitationRsvpConfig;
  weddingSessions?: WeddingSession[];
  timezone?: string;
};

export type RsvpFormState = {
  name: string;
  phone: string;
  status: string;
  plusOnes: string;
  eventChoice: "" | "ceremony" | "reception" | "all";
  customAnswers: Record<string, string>;
};

export type RsvpTicketGuest = {
  rsvpStatus: "ATTENDING" | "NOT_ATTENDING" | "TENTATIVE";
  id: string;
  name: string;
  phone?: string | null;
  plusOnes: number;
  rsvpEvents?: string[];
  rsvpAnswers?: Record<string, string> | null;
};
