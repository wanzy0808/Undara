import WeddingSessionSchedule from "./WeddingSessionSchedule";
import { weddingSessionsFor, weddingRsvpConfig } from "@/lib/events/wedding-sessions";
import { parseInvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { MapPin } from "lucide-react";
import RsvpForm from "@/components/InvitationStudio/RsvpForm";
import {
  weddingParentLine,
  type PublicInvitationData,
} from "@/components/PublicInvitation/PublicInvitation";
import {
  buildEventTitle,
  getEventCategory,
  getIndonesiaTimezone,
  normalizeEventCategory,
} from "@/lib/events/catalog";
import { parseInvitationSections } from "@/lib/templates/sections";
import { photoCropStyle, resolveInvitationPhotos } from "@/lib/templates/photo-slots";

function Divider() {
  return (
    <div className="flex w-full items-center justify-center gap-3 py-1 text-[#a8a29e]">
      <span className="h-px w-14 bg-[#a8a29e]" />
      <span className="grid h-4 w-4 place-items-center rounded-full border border-[#a8a29e] text-[7px]">◆</span>
      <span className="h-px w-14 bg-[#a8a29e]" />
    </div>
  );
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8a29e]">
        {label}
      </p>
      <h2 className="font-[Cormorant_Garamond,serif] text-4xl font-normal leading-none text-[#27272a]">
        {title}
      </h2>
      {description && (
        <p className="font-sans text-xs leading-5 text-[#a8a29e]">
          {description}
        </p>
      )}
    </div>
  );
}

function initials(value: string) {
  const letters = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
  return letters || "U";
}

function formatTime(value: string | null, timezoneLabel: string) {
  if (value === "END") return "- end";
  return value ? `${value} ${timezoneLabel}` : "Waktu akan diumumkan";
}

export default function ClassicInvitationTemplate({
  invitation,
}: {
  invitation: PublicInvitationData;
}) {
  const photo = resolveInvitationPhotos(invitation.assets ?? [], invitation.templateKey);
  const image = photo.cover;
  const eventCategory = normalizeEventCategory(invitation.eventCategory);
  const category = getEventCategory(eventCategory);
  const timezone = getIndonesiaTimezone(invitation.timezone);
  const sessions = weddingSessionsFor(invitation);
  const rsvpConfig = weddingRsvpConfig(invitation, parseInvitationRsvpConfig(invitation.templateKey));
  const sections = parseInvitationSections(invitation.templateKey);
  const date = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: invitation.timezone || "Asia/Jakarta",
  }).format(invitation.eventDate);
  const generatedTitle = buildEventTitle(
    eventCategory,
    displayTitleCase(invitation.groomName),
    displayTitleCase(invitation.brideName),
    displayTitleCase(invitation.title),
  );
  const eventTitle = displayTitleCase(invitation.title).trim() || generatedTitle || category.label;
  const couple = category.nameMode === "couple";
  const single = category.nameMode === "single";
  const identityTitle = couple
    ? [displayTitleCase(invitation.groomName), displayTitleCase(invitation.brideName)].filter(Boolean).join(" & ")
    : single
      ? displayTitleCase(invitation.groomName)
      : eventTitle;
  const monogram = couple
    ? `${displayTitleCase(invitation.groomName).slice(0, 1).toUpperCase()}&${displayTitleCase(invitation.brideName).slice(0, 1).toUpperCase()}`
    : initials(identityTitle);
  const firstLabel =
    eventCategory === "WEDDING"
      ? "Pengantin pria"
      : eventCategory === "BIRTHDAY"
        ? "Yang berulang tahun"
        : eventCategory === "BABY_SHOWER"
          ? "Keluarga / calon bayi"
          : "Nama utama";
  const secondLabel = eventCategory === "WEDDING" ? "Pengantin wanita" : "Pasangan";
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
  const rsvpTitle = eventTitle || identityTitle || "Acara";
  const hasGiftDetails = Boolean(
    invitation.giftBankName?.trim() && invitation.giftAccountNumber?.trim(),
  );

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-800">
      <div className="mx-auto w-full max-w-md border border-stone-400 p-2">
        <section className="flex flex-col items-center gap-14 pt-8">
          <div className="flex w-full flex-col items-center gap-6 px-2 pb-4">
            <div className="grid h-14 w-14 place-items-center rounded-[28px] border border-stone-400">
              <span className="font-[Cormorant_Garamond,serif] text-2xl">{monogram}</span>
            </div>
            <div className="w-full">
              <p className="text-center font-sans text-xs font-semibold uppercase text-stone-400">
                {category.label}
              </p>
              <h1 className="mt-2 text-center font-[Cormorant_Garamond,serif] text-5xl font-normal leading-none">
                {identityTitle || eventTitle}
              </h1>
            </div>
            <div className="h-80 w-60 overflow-hidden rounded-t-[120px] border border-stone-400 p-0.5">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full rounded-t-[118px] object-cover"
                  style={photoCropStyle(photo.assignment, "cover")}
                />
              ) : (
                <div className="h-full w-full rounded-t-[118px] bg-stone-200" />
              )}
            </div>
            <div className="w-full">
              <p className="text-center font-[Cormorant_Garamond,serif] text-lg">{date}</p>
              <p className="mt-1 text-center font-sans text-xs text-stone-400">
                {invitation.venue}
              </p>
            </div>
          </div>

          <Divider />

          <section className="flex w-full flex-col items-center gap-10 px-2 text-center">
            <div className="flex flex-col gap-4">
              <p className="font-[Cormorant_Garamond,serif] text-base leading-6 text-stone-400">
                “Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di momen istimewa ini.”
              </p>
              <p className="font-sans text-xs leading-5">
                {invitation.description ||
                  "Kehadiran Anda akan menjadi bagian berarti dari acara ini. Kami berharap dapat berbagi momen bahagia bersama."}
              </p>
            </div>

            {couple && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <h2 className="font-[Cormorant_Garamond,serif] text-3xl font-normal">
                    {displayTitleCase(invitation.groomName)}
                  </h2>
                  <p className="font-sans text-xs text-stone-400">{firstLabel}</p>
                  {groomParents && (
                    <p className="max-w-xs font-sans text-[11px] leading-5 text-stone-500">
                      {groomParents}
                    </p>
                  )}
                </div>
                <p className="font-[Cormorant_Garamond,serif] text-2xl text-stone-400">&amp;</p>
                <div className="flex flex-col items-center gap-2">
                  <h2 className="font-[Cormorant_Garamond,serif] text-3xl font-normal">
                    {displayTitleCase(invitation.brideName)}
                  </h2>
                  <p className="font-sans text-xs text-stone-400">{secondLabel}</p>
                  {brideParents && (
                    <p className="max-w-xs font-sans text-[11px] leading-5 text-stone-500">
                      {brideParents}
                    </p>
                  )}
                </div>
              </>
            )}

            {single && (
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-[Cormorant_Garamond,serif] text-4xl font-normal">
                  {displayTitleCase(invitation.groomName)}
                </h2>
                <p className="font-sans text-xs text-stone-400">{firstLabel}</p>
              </div>
            )}

            {!couple && !single && (
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-[Cormorant_Garamond,serif] text-4xl font-normal">
                  {eventTitle}
                </h2>
                <p className="font-sans text-xs text-stone-400">Event Invitation</p>
              </div>
            )}
          </section>

          <Divider />

          <section className="flex w-full flex-col items-center gap-8 px-2">
            <SectionHeading
              label="Save The Date"
              title="Waktu & Lokasi"
              description="Detail acara untuk membantu Anda mempersiapkan kehadiran."
            />
            {sessions.length ? <WeddingSessionSchedule sessions={sessions} timezone={timezone.label} date={date} location /> : <>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="w-full rounded-xl border border-stone-400 bg-stone-200 p-6 text-center">
                <h3 className="font-[Cormorant_Garamond,serif] text-xl">Mulai</h3>
                <div className="mx-auto my-4 h-px w-10 bg-stone-400" />
                <p className="font-sans text-sm font-semibold">
                  {formatTime(invitation.ceremonyTime, timezone.label)}
                </p>
              </div>
              <div className="w-full rounded-xl bg-zinc-800 p-6 text-center text-stone-50">
                <h3 className="font-[Cormorant_Garamond,serif] text-xl">Selesai</h3>
                <div className="mx-auto my-4 h-px w-10 bg-stone-400" />
                <p className="font-sans text-sm font-semibold">
                  {formatTime(invitation.receptionTime, timezone.label)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-stone-200 text-stone-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="font-[Cormorant_Garamond,serif] text-2xl">{invitation.venue}</h3>
              {invitation.address && (
                <p className="font-sans text-xs leading-5 text-stone-400">{invitation.address}</p>
              )}
              {invitation.mapUrl && (
                <a
                  href={invitation.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-xs underline underline-offset-4"
                >
                  Lihat Lokasi
                </a>
              )}
            </div>
            </>}
          </section>

          {sections.rsvp && (
            <>
              <Divider />
              <section className="w-full px-2 pb-6">
                <SectionHeading
                  label="Kehadiran"
                  title="Konfirmasi RSVP"
                  description="Silakan isi konfirmasi kehadiran Anda untuk membantu persiapan acara."
                />
                <div className="mt-8">
                  <RsvpForm
                    slug={invitation.slug}
                    eventCategory={invitation.eventCategory}
                    rsvpConfig={rsvpConfig}
                    weddingSessions={sessions}
                    timezone={invitation.timezone}
                    eventDate={invitation.eventDate}
                    venue={invitation.venue}
                    title={rsvpTitle}
                    start={invitation.ceremonyTime}
                    description={invitation.description}
                  />
                </div>
              </section>
            </>
          )}

          {sections.gift && hasGiftDetails && (
            <>
              <Divider />
              <section className="w-full px-2 pb-6">
                <SectionHeading
                  label="Tanda Kasih"
                  title="Gift / E-Angpao"
                  description="Jika berkenan, informasi berikut dapat digunakan untuk mengirimkan tanda kasih."
                />
                <div className="mt-8 w-full rounded-xl border border-stone-400 bg-stone-200 p-6">
                  <h3 className="text-center font-[Cormorant_Garamond,serif] text-xl">Transfer Bank</h3>
                  <div className="mx-auto my-4 h-px w-10 bg-stone-400" />
                  <div className="space-y-3 font-sans text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase text-stone-400">Bank</p>
                      <p className="font-semibold">{invitation.giftBankName}</p>
                    </div>
                    {invitation.giftAccountName && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-stone-400">Nama Pemilik</p>
                        <p className="font-semibold">{invitation.giftAccountName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-stone-400">Nomor Rekening</p>
                      <p className="font-semibold">{invitation.giftAccountNumber}</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <Divider />

          <footer className="w-full px-4 pb-8 text-center">
            <p className="font-sans text-xs leading-5 text-stone-400">
              Terima kasih telah menjadi bagian dari momen ini. Kehadiran dan doa baik Anda sangat berarti bagi kami.
            </p>
            <p className="mt-6 font-[Cormorant_Garamond,serif] text-xl">Sampai bertemu di acara,</p>
            <p className="mt-4 font-[Cormorant_Garamond,serif] text-2xl">
              {identityTitle || eventTitle}
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
