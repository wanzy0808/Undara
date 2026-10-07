import type { EventScopeOption } from "@/components/Dashboard/EventScopePicker";

export type DashboardContext = {
  profile: { displayName: string; email: string; avatarUrl: string | null };
  wedding: {
    invitationId: string | null;
    groomName: string;
    brideName: string;
    title: string;
    venue: string;
    address: string | null;
    mapUrl: string | null;
    timezone: string;
    eventDate: string | null;
    ceremonyTime: string | null;
    receptionTime: string | null;
    description: string | null;
  };
  package: { key: string | null; status: string };
  overview: {
    invitationsCreated: number;
    invitationsLimit: number | null;
    unlimitedInvitations: boolean;
    activeInvitations: number;
    totalRsvp: number;
    totalGuests: number;
    invitationsShared: number;
    invitationPublished: boolean;
  };
  entitlements: {
    hasDigitalInvitation: boolean;
    hasGuestbook: boolean;
    canPublishInvitation: boolean;
    canUploadInvitationAssets: boolean;
    canUseGuestPlacement: boolean;
    canUseUsherApp: boolean;
  };
};

export type DashboardEvent = EventScopeOption & {
  type: "WEDDING" | "ADAT_AKAD";
  slug: string;
  templateKey?: string;
  eventCategory?: string;
  weddingSessions?: unknown;
  eventConfigured: boolean;
  accessPaid: boolean;
  createdAt: string;
};

export type DashboardTable = {
  id: string;
  name: string;
  shape: string;
  capacity: number;
  _count?: { guests: number };
};

export type DashboardGuest = {
  id: string;
  name: string;
  category?: string | null;
  tags?: string[];
  phone: string | null;
  personalAddressee?: string | null;
  recipientType?: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
  invitedPax?: number;
  invitedSessions?: ("ceremony" | "reception")[];
  personalGreeting?: string | null;
  personalSharedAt?: string | null;
  source?: "RSVP" | "MANUAL";
  rsvpStatus: string;
  plusOnes: number;
  rsvpEvents?: string[];
  rsvpAnswers?: Record<string, string> | null;
  checkedIn?: boolean;
  table?: { id: string; name: string; shape: string; capacity: number } | null;
  tableId?: string | null;
  seatNumber?: number | null;
};

export type DashboardTab =
  | "overview"
  | "profile"
  | "events"
  | "invitation"
  | "waBlast"
  | "personalInvitation"
  | "rsvp"
  | "placement"
  | "usher";

export type EventGuestData = {
  guests: DashboardGuest[];
  tables: DashboardTable[];
};
