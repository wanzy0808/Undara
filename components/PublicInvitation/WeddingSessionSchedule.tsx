"use client";

import { useInvitationLanguage } from "./InvitationLanguage";
import { weddingSessionLabel, type WeddingSession } from "@/lib/events/wedding-sessions";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { getIndonesiaTimezone } from "@/lib/events/catalog";

/** Shared web content inside the template's existing date/location sections. */
export default function WeddingSessionSchedule({ sessions, timezone, date, location = false, preview = false }: {
  sessions: WeddingSession[];
  timezone: string;
  date?: string;
  location?: boolean;
  preview?: boolean;
}) {
  const language = useInvitationLanguage();
  const timezoneLabel = timezone.startsWith("Asia/") ? getIndonesiaTimezone(timezone).label : timezone;
  const object = (session: WeddingSession, field: string) => `object:${location ? "location" : "dateTime"}:${session.id}-${field}`;
  return <div data-studio-native-object={location ? "object:location:details-group" : "object:dateTime:panel"} className="mx-auto max-w-md space-y-6 text-sm leading-relaxed">
    {date && <p data-studio-native-object="object:dateTime:date" className="text-lg">{date}</p>}
    {sessions.map((session) => <div key={session.id} data-wedding-session={session.id} className="min-w-0 space-y-2 break-words">
      <h3 data-studio-native-object={object(session, "label")} className="text-base font-semibold">{displayTitleCase(weddingSessionLabel(session, language))}</h3>
      <p data-studio-native-object={object(session, "start")}>{session.start}{session.end === "END" ? " – end" : session.end ? ` – ${session.end}` : ""} · {timezoneLabel}</p>
      {location && <>
        <p data-studio-native-object={object(session, "venue")} className="font-medium">{displayTitleCase(session.venue)}</p>
        {session.address && <p data-studio-native-object={object(session, "address")}>{session.address}</p>}
        {session.mapUrl && <a data-studio-native-object={object(session, "button")} href={session.mapUrl} target="_blank" rel="noopener noreferrer" onClick={preview ? (event) => event.preventDefault() : undefined} className="inline-flex min-h-11 items-center px-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">{language === "EN" ? "View location" : "Lihat Lokasi"}</a>}
      </>}
    </div>)}
  </div>;
}
