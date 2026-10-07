import type { WeddingSession } from "@/lib/events/wedding-sessions";
import type { WeddingChildPosition } from "@/lib/events/parents";
import type { EventCategory } from "@/lib/events/catalog";

export type EventPanelInvitation = {
  id: string;
  type: "WEDDING" | "ADAT_AKAD";
  title: string;
  eventCategory: EventCategory;
  groomName: string;
  brideName: string;
  groomFatherName: string | null;
  groomMotherName: string | null;
  groomChildOrder: number | null;
  groomChildPosition?: WeddingChildPosition | null;
  brideFatherName: string | null;
  brideMotherName: string | null;
  brideChildOrder: number | null;
  brideChildPosition?: WeddingChildPosition | null;
  venue: string;
  address: string | null;
  mapUrl: string | null;
  timezone: string;
  eventDate: string;
  eventConfigured: boolean;
  weddingSessions?: unknown;
  ceremonyTime: string | null;
  receptionTime: string | null;
  description: string | null;
  eventNotes: string | null;
  templateKey: string;
  isPublished: boolean;
  accessPaid: boolean;
  createdAt: string;
};

export type EventPanelProps = {
  accent: string;
  // Present only after successfully CREATING a new configured event.
  onSaved: (created?: { id: string; type: EventPanelInvitation["type"] }) => void;
  selectedTemplate?: string;
};

export type EventEditorMode = "closed" | "new" | "edit";

export type EventForm = {
  weddingSessions: WeddingSession[] | null;
  eventCategory: EventCategory | "";
  customTitle: string;
  groomName: string;
  brideName: string;
  groomFatherName: string;
  groomMotherName: string;
  groomChildOrder: string;
  groomChildPosition: WeddingChildPosition | "";
  brideFatherName: string;
  brideMotherName: string;
  brideChildOrder: string;
  brideChildPosition: WeddingChildPosition | "";
  venue: string;
  address: string;
  mapUrl: string;
  timezone: string;
  eventDate: string;
  ceremonyTime: string;
  receptionTime: string;
  description: string;
  eventNotes: string;
};
