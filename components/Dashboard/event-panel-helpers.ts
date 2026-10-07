import { parseWeddingSessions } from "@/lib/events/wedding-sessions";
import { isEventCategory } from "@/lib/events/catalog";
import type {
  EventForm,
  EventPanelInvitation,
} from "@/components/Dashboard/event-panel-types";

export const EMPTY_EVENT_FORM: EventForm = {
  weddingSessions: null,
  eventCategory: "",
  customTitle: "",
  groomName: "",
  brideName: "",
  groomFatherName: "",
  groomMotherName: "",
  groomChildOrder: "",
  groomChildPosition: "",
  brideFatherName: "",
  brideMotherName: "",
  brideChildOrder: "",
  brideChildPosition: "",
  venue: "",
  address: "",
  mapUrl: "",
  timezone: "Asia/Jakarta",
  eventDate: "",
  ceremonyTime: "",
  receptionTime: "",
  description: "",
  eventNotes: "",
};

export const END_TIME_SENTINEL = "END";

export function sortEventInvitations(items: EventPanelInvitation[]) {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function isBlankEventDraft(invitation: EventPanelInvitation) {
  return (
    !invitation.eventConfigured &&
    !invitation.title.trim() &&
    !invitation.venue.trim() &&
    !invitation.groomName.trim() &&
    !invitation.brideName.trim()
  );
}

export function isoDateToDisplay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function displayDateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidTime24(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function isValidChildOrder(value: string) {
  if (!value.trim()) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

export function eventInvitationToForm(
  invitation: EventPanelInvitation,
): EventForm {
  const blankDraft = isBlankEventDraft(invitation);
  const category = isEventCategory(invitation.eventCategory)
    ? invitation.eventCategory
    : "OTHER";

  return {
    eventCategory: blankDraft ? "" : category,
    weddingSessions: parseWeddingSessions(invitation.weddingSessions, category),
    customTitle:
      !blankDraft && category === "OTHER" ? invitation.title || "" : "",
    groomName: invitation.groomName || "",
    brideName: invitation.brideName || "",
    groomFatherName: invitation.groomFatherName || "",
    groomMotherName: invitation.groomMotherName || "",
    groomChildOrder: invitation.groomChildOrder
      ? String(invitation.groomChildOrder)
      : "",
    groomChildPosition: invitation.groomChildPosition ?? (invitation.groomChildOrder ? "NUMBER" : ""),
    brideFatherName: invitation.brideFatherName || "",
    brideMotherName: invitation.brideMotherName || "",
    brideChildOrder: invitation.brideChildOrder
      ? String(invitation.brideChildOrder)
      : "",
    brideChildPosition: invitation.brideChildPosition ?? (invitation.brideChildOrder ? "NUMBER" : ""),
    venue: invitation.venue || "",
    address: invitation.address || "",
    mapUrl: invitation.mapUrl || "",
    timezone: invitation.timezone || "Asia/Jakarta",
    eventDate:
      invitation.eventConfigured && invitation.eventDate
        ? isoDateToDisplay(invitation.eventDate)
        : "",
    ceremonyTime: invitation.ceremonyTime || "",
    receptionTime: invitation.receptionTime || "",
    description: invitation.description || "",
    eventNotes: invitation.eventNotes || "",
  };
}

export function formatEventDateLabel(value: string, locale: "id" | "en") {
  const iso = displayDateToIso(value);
  if (!iso) {
    return locale === "en" ? "Invalid date" : "Tanggal belum valid";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${iso}T12:00:00+07:00`));
}
