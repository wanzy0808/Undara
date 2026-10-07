"use client";

import { type FormEvent, useMemo, useState } from "react";
import { defaultInvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationText } from "@/lib/invitations/language";
import {
  RsvpInputPanel,
  RsvpSuccessPanel,
} from "@/components/InvitationStudio/RsvpPanels";
import {
  buildGoogleCalendarUrl,
  buildWeddingCalendarLinks,
  buildRsvpTicketQrUrl,
} from "@/components/InvitationStudio/rsvp-helpers";
import type {
  RsvpFormProps,
  RsvpFormState,
  RsvpTicketGuest,
} from "@/components/InvitationStudio/rsvp-types";

export default function RsvpForm({
  slug,
  appearance,
  preview = false,
  guestId,
  guestName,
  guestToken,
  invitedPax,
  eventDate,
  venue,
  title,
  start,
  end,
  description,
  eventCategory,
  weddingSessions = [],
  timezone = "Asia/Jakarta",
  rsvpConfig = defaultInvitationRsvpConfig,
}: RsvpFormProps) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const [form, setForm] = useState<RsvpFormState>({
    name: guestName ?? "",
    phone: "",
    status: "ATTENDING",
    plusOnes: "0",
    eventChoice: weddingSessions.length === 1 ? weddingSessions[0].id : "",
    customAnswers: {},
  });
  const [message, setMessage] = useState("");
  const [ticketGuest, setTicketGuest] = useState<RsvpTicketGuest | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ticketUrl = useMemo(() => buildRsvpTicketQrUrl(slug, qrToken), [slug, qrToken]);

  const calendarUrl = useMemo(
    () =>
      buildGoogleCalendarUrl({
        title: title || "Acara",
        eventDate: String(eventDate || ""),
        start,
        end,
        venue,
        description,
      }),
    [title, eventDate, start, end, venue, description],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/invite/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestId,
          guestToken,
          plusOnes: Number(form.plusOnes),
          rsvpEvents: form.eventChoice === "all"
            ? ["ceremony", "reception"]
            : form.eventChoice ? [form.eventChoice] : [],
          rsvpAnswers: form.customAnswers,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(language === "EN" ? tr("RSVP belum dapat disimpan.") : data.error ?? "RSVP belum dapat disimpan.");
        return;
      }

      setTicketGuest(data.guest);
      setQrToken(data.qrToken ?? null);
      setMessage(
        form.status === "ATTENDING"
          ? tr("Konfirmasi hadir berhasil.")
          : tr("Konfirmasi kehadiran tersimpan."),
      );
    } catch {
      setMessage(tr("Koneksi bermasalah. Silakan coba lagi."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section data-studio-native-object="object:rsvp:form-group" className={appearance === "zen" ? "zen-rsvp mx-auto max-w-sm text-left" : "mx-auto max-w-xl border border-[#9b5b51]/20 bg-[#f3ede6] p-6 text-left shadow-sm dark:border-white/10 dark:bg-[#151116]"}>
      {ticketGuest ? (
        <RsvpSuccessPanel
          ticketGuest={ticketGuest}
          ticketUrl={ticketUrl}
          calendarUrl={weddingSessions.length ? "" : calendarUrl}
          calendarLinks={buildWeddingCalendarLinks({ sessions: weddingSessions, selected: ticketGuest.rsvpEvents ?? [], title: title || "Acara", eventDate: String(eventDate || ""), timezone, language })}
        />
      ) : (
        <RsvpInputPanel
          appearance={appearance}
          preview={preview}
          guestId={guestId}
          guestName={guestName}
          invitedPax={invitedPax}
          eventCategory={eventCategory}
          rsvpConfig={rsvpConfig}
          weddingSessions={weddingSessions}
          form={form}
          setForm={setForm}
          message={message}
          submitting={submitting}
          onSubmit={submit}
        />
      )}
    </section>
  );
}
