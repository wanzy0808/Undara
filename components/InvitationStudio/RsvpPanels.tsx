"use client";

import type { FormEvent } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationText } from "@/lib/invitations/language";
import { Input } from "@/components/ui/input";
import type {
  RsvpFormState,
  RsvpTicketGuest,
} from "@/components/InvitationStudio/rsvp-types";
import { rsvpElementStyleCss, type InvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import { invitationFieldColors } from "@/lib/templates/visual-colors";

export function RsvpSuccessPanel({ ticketGuest, ticketUrl, calendarUrl }: {
  ticketGuest: RsvpTicketGuest;
  ticketUrl: string;
  calendarUrl: string;
}) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const attending = ticketGuest.rsvpStatus === "ATTENDING";
  return (
    <div className="text-center" role="status" aria-live="polite">
      <CheckCircle2 aria-hidden="true" className="mx-auto h-8 w-8 text-[var(--inv-accent,#7A1C25)]" />
      <h2 className="mt-4 font-[var(--inv-heading,var(--font-cinzel))] text-3xl">
        {language === "EN" ? "Thank you" : "Terima kasih"}, {displayTitleCase(ticketGuest.name)}
      </h2>
      <p className="mt-3 text-sm leading-relaxed opacity-75">
        {tr(attending
          ? "Kehadiran Anda telah berhasil dikonfirmasi. Kami menantikan kehadiran Anda di hari istimewa kami."
          : ticketGuest.rsvpStatus === "NOT_ATTENDING"
            ? "Konfirmasi Anda telah tersimpan. Terima kasih telah memberi kabar bahwa Anda belum dapat hadir."
            : "Konfirmasi Anda telah tersimpan dengan status masih tentatif.")}
      </p>
      {attending && ticketUrl && <>
        <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
          <img src={ticketUrl} alt={tr("QR check-in tamu")} width={280} height={280} className="h-auto max-w-full" />
        </div>
        <Button asChild className="mt-5">
          <a href={`${ticketUrl}&download=1`} download="undara-qr.png">
            <Download aria-hidden="true" className="h-4 w-4" /> {tr("Unduh QR Code")}
          </a>
        </Button>
        <p className="mt-3 text-xs opacity-60">{tr("Simpan QR ini dan tunjukkan kepada petugas saat tiba di acara.")}</p>
      </>}
      {attending && !ticketUrl && <p className="mt-4 text-sm opacity-70">{tr("RSVP Anda sudah tersimpan. QR belum tersedia; hubungi pemilik undangan untuk bantuan.")}</p>}
      {attending && calendarUrl && calendarUrl !== "#" && <div className="mt-3">
        <Button asChild>
          <a href={calendarUrl} target="_blank" rel="noreferrer">
            <CalendarPlus aria-hidden="true" className="h-4 w-4" /> {tr("Tambah ke Kalender")}
          </a>
        </Button>
      </div>}
    </div>
  );
}

export function RsvpInputPanel({
  appearance,
  preview = false,
  guestId,
  guestName,
  invitedPax,
  eventCategory,
  rsvpConfig,
  form,
  setForm,
  message,
  submitting,
  onSubmit,
}: {
  appearance?: "zen";
  preview?: boolean;
  guestId?: string;
  guestName?: string;
  invitedPax?: number;
  eventCategory?: string | null;
  rsvpConfig: InvitationRsvpConfig;
  form: RsvpFormState;
  setForm: (next: RsvpFormState) => void;
  message: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const inputFontSize = rsvpConfig.elementStyles.inputs?.fontSize;
  const inputColor = rsvpConfig.elementStyles.inputs?.color;
  const inputTextStyle = { ...(inputFontSize !== undefined ? { fontSize: `${inputFontSize}px` } : {}), ...(inputColor ? { color: inputColor } : {}) };
  const inputFieldStyle = invitationFieldColors(rsvpElementStyleCss(rsvpConfig, "inputs"));

  return (
    <form onSubmit={onSubmit} className="space-y-4 font-[var(--font-fauna)]">
      {(guestName || invitedPax !== undefined) && (
        <div>
          {guestName && (
            <p className="mt-1 text-sm opacity-70">{tr("Untuk")}: {displayTitleCase(guestName)}</p>
          )}
          {invitedPax !== undefined && (
            <p className="mt-1 text-sm opacity-70">{tr("Kuota undangan")}: {invitedPax} {tr("orang, termasuk penerima.")}</p>
          )}
        </div>
      )}

      <div
        data-studio-rsvp-element="inputs"
        style={rsvpElementStyleCss(rsvpConfig, "inputs")}
        className="space-y-4"
      >
      {!guestId && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium" style={inputTextStyle}>
            {tr("Nama")}
            <Input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="mt-1.5" style={inputFieldStyle}
              placeholder={tr("Nama lengkap")}
              required
            />
          </label>

          <label className="text-xs font-medium" style={inputTextStyle}>
            {tr("No. WhatsApp")}
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              className="mt-1.5" style={inputFieldStyle}
              placeholder="08xxxxxxxxxx"
              required
            />
          </label>
        </div>
      )}

      {eventCategory === "WEDDING" && form.status === "ATTENDING" && (rsvpConfig.ceremony || rsvpConfig.reception) && (
        <label className="block text-xs font-medium" style={inputTextStyle}>
          {tr("Acara yang akan dihadiri")}
          <select
            aria-label={tr("Acara yang akan dihadiri")}
            value={form.eventChoice}
            onChange={(event) => setForm({ ...form, eventChoice: event.target.value as RsvpFormState["eventChoice"] })}
            className="mt-1.5 w-full rounded-md border border-black/10 bg-transparent px-3 py-2.5 text-sm dark:border-white/10"
            style={inputFieldStyle}
            required
          >
            <option value="">{tr("Pilih acara")}</option>
            {rsvpConfig.ceremony && <option value="ceremony">{tr("Upacara Nikah")}</option>}
            {rsvpConfig.reception && <option value="reception">{tr("Resepsi")}</option>}
            {rsvpConfig.attendAll && rsvpConfig.ceremony && rsvpConfig.reception && <option value="all">{tr("Hadiri Semua Acara")}</option>}
          </select>
        </label>
      )}

      {appearance === "zen" ? <fieldset className="zen-status-options">
        <legend className="sr-only">{tr("Status kehadiran")}</legend>
        {([["ATTENDING", "Saya Akan Hadir"], ["TENTATIVE", "Saya Mungkin Hadir"], ["NOT_ATTENDING", "Saya Tidak Dapat Hadir"]] as const).map(([value, label]) => <label key={value} style={inputFieldStyle}>
          <input type="radio" name="attendance" value={value} checked={form.status === value} style={{ accentColor: inputColor }} onChange={() => setForm({ ...form, status: value })} />
          <span style={inputTextStyle}>{tr(label)}</span>
        </label>)}
      </fieldset> : (<select
        aria-label={tr("Status kehadiran")}
        value={form.status}
        onChange={(event) =>
          setForm({ ...form, status: event.target.value })
        }
        className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2.5 text-sm dark:border-white/10"
        style={inputFieldStyle}
      >
        <option value="ATTENDING">{tr("Saya Akan Hadir")}</option>
        <option value="NOT_ATTENDING">{tr("Saya Tidak Hadir")}</option>
        <option value="TENTATIVE">{tr("Saya Masih Tentatif")}</option>
      </select>)}

      {form.status === "ATTENDING" && (invitedPax === undefined || invitedPax > 1) && (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium" style={inputTextStyle}>{tr("Jumlah pendamping")}</legend>
        {invitedPax !== undefined && invitedPax > 2 ? (
          <Input
            type="number"
            min={0}
            max={invitedPax - 1}
            step={1}
            value={form.plusOnes}
            onChange={(event) => setForm({ ...form, plusOnes: event.target.value })}
            className="max-w-28"
            style={inputFieldStyle}
            aria-label={tr("Jumlah pendamping")}
          />
        ) : (
        <>
        <div className="flex gap-5 text-sm" style={inputTextStyle}>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="plusOnes"
              style={{ accentColor: inputColor }}
              value="1"
              checked={form.plusOnes === "1"}
              onChange={(event) =>
                setForm({ ...form, plusOnes: event.target.value })
              }
            />
            {tr("Ya")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="plusOnes"
              style={{ accentColor: inputColor }}
              value="0"
              checked={form.plusOnes === "0"}
              onChange={(event) =>
                setForm({ ...form, plusOnes: event.target.value })
              }
            />
            {tr("Tidak")}
          </label>
        </div>
        </>
        )}
      </fieldset>
      )}

      {rsvpConfig.customFields.length > 0 && (
        <div className="space-y-3">
          {rsvpConfig.customFields.map((field) => (
            <label key={field.id} className="block text-xs font-medium" style={inputTextStyle}>
              {field.label}
              <Input
                value={form.customAnswers[field.id] ?? ""}
                onChange={(event) => setForm({
                  ...form,
                  customAnswers: { ...form.customAnswers, [field.id]: event.target.value },
                })}
                className="mt-1.5" style={inputFieldStyle}
                maxLength={200}
                required={field.required && form.status === "ATTENDING"}
              />
            </label>
          ))}
        </div>
      )}

      </div>

      <Button
        data-studio-rsvp-element="button"
        style={rsvpElementStyleCss(rsvpConfig, "button")}
        type="submit"
        disabled={submitting}
        aria-disabled={submitting || preview}
        className="rounded-xl bg-[#7A1C25] px-5 py-3 font-[var(--font-fauna)] text-xs text-white hover:bg-[#5E141C]"
      >
        {tr(submitting ? "Menyimpan..." : appearance === "zen" ? "Kirim RSVP" : "Konfirmasi Kehadiran")}
      </Button>

      {message && (
        <p
          role="status"
          className="text-sm text-[#5f4a4a] dark:text-white/65"
        >
          {message}
        </p>
      )}
    </form>
  );
}
