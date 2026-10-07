"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { Input } from "@/components/ui/input";
import { EventField, EventTimeField } from "./EventFields";
import { useDashboardI18n } from "./useDashboardI18n";
import { weddingSessionLabel, type WeddingSession, type WeddingSessionId } from "@/lib/events/wedding-sessions";

export function emptyWeddingSession(id: WeddingSessionId): WeddingSession {
  return { id, kind: id === "ceremony" ? "CEREMONY" : null, label: "", start: "", end: null, venue: "", address: null, mapUrl: null };
}

export function WeddingGuestScopeField({ sessions, value = [], onChange, disabled = false }: {
  sessions: WeddingSession[];
  value?: string[];
  onChange: (value: WeddingSessionId[]) => void;
  disabled?: boolean;
}) {
  const { locale } = useDashboardI18n();
  if (!sessions.length) return null;
  const language = locale === "en" ? "EN" : "ID";
  const choice = sessions.length === 1 ? sessions[0].id : value.length === 2 ? "all" : value[0] ?? "";
  return <FloatingField label={language === "EN" ? "Invited sessions" : "Sesi undangan"} className="min-w-0 max-w-sm">
    <select value={choice} disabled={disabled || sessions.length === 1} required
      onChange={(event) => onChange(event.target.value === "all" ? sessions.map((session) => session.id) : event.target.value ? [event.target.value as WeddingSessionId] : [])}
      className="min-h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
      <option value="">{language === "EN" ? "Choose sessions" : "Pilih sesi"}</option>
      {sessions.map((session) => <option key={session.id} value={session.id}>{weddingSessionLabel(session, language)}</option>)}
      {sessions.length === 2 && <option value="all">{language === "EN" ? "Both sessions" : "Keduanya"}</option>}
    </select>
  </FloatingField>;
}

export function WeddingSessionFields({ value, onChange, disabled = false, timezone }: {
  value: WeddingSession[] | null;
  onChange: (value: WeddingSession[] | null) => void;
  disabled?: boolean;
  timezone: string;
}) {
  const { locale, d } = useDashboardI18n();
  const en = locale === "en";
  const patch = (id: WeddingSessionId, change: Partial<WeddingSession>) => onChange((value ?? []).map((row) => row.id === id ? { ...row, ...change } : row));
  return <fieldset disabled={disabled} className="mt-4 min-w-0 space-y-4">
    <legend className="text-sm font-semibold">{en ? "Wedding sessions" : "Sesi pernikahan"}</legend>
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input type="checkbox" checked={value !== null} onChange={(event) => onChange(event.target.checked ? [emptyWeddingSession("ceremony")] : null)} className="size-4 accent-[var(--primary)]" />
      {en ? "Separate session schedules" : "Pisahkan jadwal sesi"}
    </label>
    {value !== null && <>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {(["ceremony", "reception"] as const).map((id) => {
          const selected = value.some((row) => row.id === id);
          return <label key={id} className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={selected} disabled={disabled || (selected && value.length === 1)} className="size-4 accent-[var(--primary)]"
              onChange={(event) => onChange(event.target.checked ? [...value, emptyWeddingSession(id)] : value.filter((row) => row.id !== id))} />
            {id === "reception" ? en ? "Reception" : "Resepsi" : en ? "Wedding ceremony" : "Prosesi Pernikahan"}
          </label>;
        })}
      </div>
      {value.map((session) => <div key={session.id} className="min-w-0 space-y-3 border-t border-border/70 pt-4">
        <p className="text-sm font-semibold">{weddingSessionLabel(session, en ? "EN" : "ID")}</p>
        {session.id === "ceremony" && <FloatingField label={en ? "Ceremony type" : "Jenis prosesi"}>
          <select value={session.kind ?? "CEREMONY"} onChange={(event) => patch(session.id, { kind: event.target.value as WeddingSession["kind"] })} className="min-h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary">
            <option value="AKAD">Akad Nikah</option>
            <option value="BLESSING">{en ? "Wedding Blessing" : "Pemberkatan Pernikahan"}</option>
            <option value="CEREMONY">{en ? "Wedding Ceremony" : "Prosesi Pernikahan"}</option>
          </select>
        </FloatingField>}
        <FloatingField label={en ? "Session name (optional)" : "Nama sesi (opsional)"}><Input value={session.label} maxLength={60} onChange={(event) => patch(session.id, { label: event.target.value })} /></FloatingField>
        <div className="grid gap-3 sm:grid-cols-2">
          <EventTimeField label={`${d("Mulai")} (${timezone})`} value={session.start} onChange={(start) => patch(session.id, { start })} disabled={disabled} />
          <div><EventTimeField label={`${d("Selesai")} (${timezone})`} value={session.end === "END" ? "" : session.end ?? ""} onChange={(end) => patch(session.id, { end: end || null })} disabled={disabled || session.end === "END"} />
            <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={session.end === "END"} className="size-4 accent-[var(--primary)]" onChange={(event) => patch(session.id, { end: event.target.checked ? "END" : null })} />{en ? "Until the event ends" : "Sampai selesai"}</label>
          </div>
        </div>
        <EventField label={d("Nama tempat")} value={session.venue} onChange={(venue) => patch(session.id, { venue })} />
        <EventField label={d("Alamat")} value={session.address ?? ""} onChange={(address) => patch(session.id, { address: address || null })} />
        <EventField label={d("Google Maps")} value={session.mapUrl ?? ""} onChange={(mapUrl) => patch(session.id, { mapUrl: mapUrl || null })} />
      </div>)}
      <p className="text-sm text-muted-foreground">{en ? "Both sessions use this event’s date. Different dates need separate events and Digital Invitation packages." : "Kedua sesi memakai tanggal acara ini. Tanggal berbeda perlu acara dan paket Undangan Digital terpisah."}</p>
    </>}
  </fieldset>;
}
