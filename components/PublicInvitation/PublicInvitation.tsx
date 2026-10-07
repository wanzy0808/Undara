import WeddingSessionSchedule from "./WeddingSessionSchedule";
import { weddingSessionsFor, weddingRsvpConfig } from "@/lib/events/wedding-sessions";
import { displayTitleCase } from "@/lib/text/display-title-case";
import Link from "next/link";
import { CalendarDays, Clock3, LockKeyhole, MapPin } from "lucide-react";
import RsvpForm from "@/components/InvitationStudio/RsvpForm";
import {
  buildEventTitle,
  getEventCategory,
  getIndonesiaTimezone,
  normalizeEventCategory,
} from "@/lib/events/catalog";
import { parseInvitationSections } from "@/lib/templates/sections";
import { parseInvitationRsvpConfig, rsvpElementStyleCss } from "@/lib/templates/rsvp-config";
import { weddingParentLine } from "@/lib/events/parents";

export { weddingParentLine };

export type PublicInvitationData = {
  id: string;
  slug: string;
  title: string;
  eventCategory: string;
  groomName: string;
  brideName: string;
  groomFatherName?: string | null;
  groomMotherName?: string | null;
  groomChildOrder?: number | null;
  groomChildPosition?: string | null;
  brideFatherName?: string | null;
  brideMotherName?: string | null;
  brideChildOrder?: number | null;
  brideChildPosition?: string | null;
  venue: string;
  address: string | null;
  mapUrl: string | null;
  timezone: string;
  eventDate: Date;
  weddingSessions?: unknown;
  ceremonyTime: string | null;
  receptionTime: string | null;
  description: string | null;
  eventNotes?: string | null;
  dressCode?: string | null;
  weddingHashtag?: string | null;
  templateKey: string;
  giftBankName: string | null;
  giftAccountName: string | null;
  giftAccountNumber: string | null;
  assets: {
    id: string;
    type: "IMAGE" | "AUDIO";
    url: string;
    title: string | null;
  }[];
};

function formatDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: timezone || "Asia/Jakarta",
  }).format(date);
}

function formatTime(value: string) {
  return value;
}

export default function PublicInvitation({
  invitation,
}: {
  invitation: PublicInvitationData;
}) {
  const eventCategory = normalizeEventCategory(invitation.eventCategory);
  const category = getEventCategory(eventCategory);
  const timezone = getIndonesiaTimezone(invitation.timezone);
  const sections = parseInvitationSections(invitation.templateKey);
  const sessions = weddingSessionsFor(invitation);
  const rsvpConfig = weddingRsvpConfig(invitation, parseInvitationRsvpConfig(invitation.templateKey));
  const generatedTitle = buildEventTitle(
    eventCategory,
    displayTitleCase(invitation.groomName),
    displayTitleCase(invitation.brideName),
    displayTitleCase(invitation.title),
  );
  const title = displayTitleCase(invitation.title).trim() || generatedTitle || "Undangan Acara";
  const identity =
    category.nameMode === "couple"
      ? [displayTitleCase(invitation.groomName), displayTitleCase(invitation.brideName)].filter(Boolean).join(" & ")
      : category.nameMode === "single"
        ? displayTitleCase(invitation.groomName)
        : "";
  const showIdentity = Boolean(identity && identity !== title);
  const groomParents =
    eventCategory === "WEDDING"
      ? weddingParentLine(
          invitation.groomFatherName,
          invitation.groomMotherName,
          invitation.groomChildOrder,
          "putra",
          invitation.groomChildPosition,
        )
      : "";
  const brideParents =
    eventCategory === "WEDDING"
      ? weddingParentLine(
          invitation.brideFatherName,
          invitation.brideMotherName,
          invitation.brideChildOrder,
          "putri",
          invitation.brideChildPosition,
        )
      : "";
  const startTime = invitation.ceremonyTime;
  const endTime = invitation.receptionTime;
  const timeLabel = startTime
    ? endTime === "END"
      ? `${formatTime(startTime)} - end ${timezone.label}`
      : `${formatTime(startTime)}${endTime ? `–${formatTime(endTime)}` : ""} ${timezone.label}`
    : "";
  const hasGiftDetails = Boolean(
    invitation.giftBankName?.trim() && invitation.giftAccountNumber?.trim(),
  );

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-border bg-background px-6 py-12 text-center shadow-sm md:px-12 md:py-16">
          <p className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-[0.28em] text-primary">
            {category.label} · Digital Invitation
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-cinzel)] text-4xl tracking-wide md:text-6xl">
            {title}
          </h1>
          {showIdentity && (
            <p className="mt-3 font-[family-name:var(--font-cinzel)] text-lg text-primary md:text-xl">
              {identity}
            </p>
          )}
          {eventCategory === "WEDDING" && (groomParents || brideParents) && (
            <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
              {groomParents && (
                <p>
                  <span className="font-semibold text-foreground">{displayTitleCase(invitation.groomName)}</span>
                  <br />
                  {groomParents}
                </p>
              )}
              {brideParents && (
                <p>
                  <span className="font-semibold text-foreground">{displayTitleCase(invitation.brideName)}</span>
                  <br />
                  {brideParents}
                </p>
              )}
            </div>
          )}
          <p className="mx-auto mt-5 max-w-2xl font-[family-name:var(--font-fauna)] text-sm leading-7 text-muted-foreground">
            {invitation.description ||
              "Kami mengundang Anda untuk hadir dan menjadi bagian dari momen istimewa ini."}
          </p>

          <div className="mx-auto mt-8 max-w-xl space-y-3 font-[family-name:var(--font-fauna)] text-sm">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDate(invitation.eventDate, invitation.timezone)}
            </div>
            {sessions.length ? <WeddingSessionSchedule sessions={sessions} timezone={timezone.label} location /> : <>
            {timeLabel && (
              <div className="flex items-center justify-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                {timeLabel}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {invitation.venue}
            </div>
            {invitation.address && (
              <p className="text-xs text-muted-foreground">{invitation.address}</p>
            )}
            {invitation.mapUrl && (
              <a
                href={invitation.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs text-primary underline underline-offset-4"
              >
                Lihat Lokasi
              </a>
            )}
            </>}
          </div>
        </header>

        {sections.rsvp && (
          <section className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-sm md:p-10">
            <h2 style={rsvpElementStyleCss(rsvpConfig, "title")} className="mb-5 font-[family-name:var(--font-cinzel)] text-2xl">{rsvpConfig.title || "Konfirmasi Kehadiran"}</h2>
            <RsvpForm
              slug={invitation.slug}
              eventCategory={invitation.eventCategory}
              rsvpConfig={rsvpConfig}
              weddingSessions={sessions}
              timezone={invitation.timezone}
              eventDate={invitation.eventDate}
              venue={invitation.venue}
              title={title}
              start={startTime}
              description={invitation.description}
            />
          </section>
        )}

        {sections.gift && hasGiftDetails && (
          <section className="mt-8 rounded-2xl border border-border bg-background p-6 text-center shadow-sm md:p-10">
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-[0.2em] text-primary">
              Tanda Kasih
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-cinzel)] text-2xl">
              Gift / E-Angpao
            </h2>
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border p-5 text-left font-[family-name:var(--font-fauna)] text-sm">
              <p className="text-xs text-muted-foreground">{invitation.giftBankName}</p>
              {invitation.giftAccountName && (
                <p className="mt-2 font-semibold">{invitation.giftAccountName}</p>
              )}
              <p className="mt-1 font-semibold">{invitation.giftAccountNumber}</p>
            </div>
          </section>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center font-[family-name:var(--font-dm-mono)] text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Undara</span>
          <span>•</span>
          <Link href="/" className="hover:text-primary">
            Digital Event Invitation
          </Link>
        </footer>
      </div>
    </main>
  );
}

export function InvitationLockedState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center text-foreground">
      <div className="max-w-md rounded-2xl border border-border bg-background p-10 shadow-sm">
        <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-5 font-[family-name:var(--font-cinzel)] text-3xl">
          Undangan belum tersedia
        </h1>
        <p className="mt-3 font-[family-name:var(--font-fauna)] text-sm text-muted-foreground">
          Undangan ini belum dipublikasikan atau belum aktif.
        </p>
      </div>
    </main>
  );
}
