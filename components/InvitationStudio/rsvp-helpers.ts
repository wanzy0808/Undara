import { weddingSessionLabel, type WeddingSession } from "@/lib/events/wedding-sessions";
export function buildGoogleCalendarUrl({
  title,
  eventDate,
  start,
  end,
  venue,
  description,
  timezone,
}: {
  title: string;
  eventDate: string;
  start?: string | null;
  end?: string | null;
  venue?: string | null;
  description?: string | null;
  timezone?: string;
}) {
  const date = eventDate ? new Date(eventDate) : null;
  if (!date || Number.isNaN(date.getTime())) return "#";

  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  const time = (value?: string | null) =>
    value && /^\d{2}:\d{2}$/.test(value)
      ? value.replace(":", "") + "00"
      : "000000";

  const dates = `${ymd}T${time(start)}/${ymd}T${time(end || start)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Acara",
    dates,
    location: venue || "",
    details: description || "",
  });

  if (timezone) params.set("ctz", timezone);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildRsvpTicketQrUrl(slug: string, qrToken: string | null) {
  return qrToken
    ? `/api/invite/${encodeURIComponent(slug)}/rsvp/qr?token=${encodeURIComponent(qrToken)}`
    : "";
}

export function buildWeddingCalendarLinks({ sessions, selected, title, eventDate, timezone, language = "ID" }: { sessions: WeddingSession[]; selected: string[]; title: string; eventDate: string; timezone: string; language?: "ID" | "EN" }) {
  return sessions.filter((session) => selected.includes(session.id)).map((session) => ({ label: weddingSessionLabel(session, language), url: buildGoogleCalendarUrl({ title: `${title} · ${weddingSessionLabel(session, language)}`, eventDate, start: session.start, end: session.end === "END" ? null : session.end, venue: session.venue, description: session.address, timezone }) }));
}
