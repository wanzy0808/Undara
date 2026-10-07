"use client";

import { WeddingSessionFields, WeddingGuestScopeField, emptyWeddingSession } from "./WeddingSessionFields";
import { parseWeddingSessions, weddingSessionProjection, type WeddingSessionId } from "@/lib/events/wedding-sessions";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  PenLine,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPage,
  DashboardPageHeader,
  DashboardPanel,
  DashboardStatusBadge,
} from "@/components/Dashboard/DashboardPrimitives";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import {
  EventDateField,
  EventField,
  EventTextArea,
  EventTimeField,
  WeddingFamilyFields,
} from "@/components/Dashboard/EventFields";
import {
  displayDateToIso,
  END_TIME_SENTINEL,
  eventInvitationToForm,
  formatEventDateLabel,
  isValidChildOrder,
  isValidTime24,
  isoDateToDisplay,
  EMPTY_EVENT_FORM,
  sortEventInvitations,
} from "@/components/Dashboard/event-panel-helpers";
import type {
  EventEditorMode,
  EventForm,
  EventPanelInvitation,
  EventPanelProps,
} from "@/components/Dashboard/event-panel-types";
import {
  buildEventTitle,
  eventCategoryOptions,
  getEventCategory,
  getIndonesiaTimezone,
  indonesiaTimezones,
  isEventCategory,
} from "@/lib/events/catalog";

export default function EventPanel({ onSaved, selectedTemplate }: EventPanelProps) {
  const { d, locale } = useDashboardI18n();
  const [scopeConflicts, setScopeConflicts] = useState<{ id: string; name: string; invitedSessions: string[] }[]>([]);
  const [scopeChoices, setScopeChoices] = useState<Record<string, WeddingSessionId[]>>({});
  const [events, setEvents] = useState<EventPanelInvitation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [editorMode, setEditorMode] = useState<EventEditorMode>("closed");
  const [form, setForm] = useState<EventForm>(EMPTY_EVENT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const editorRef = useRef<HTMLElement | null>(null);

  function activate(invitation: EventPanelInvitation) {
    if (invitation.isPublished) {
      setNotice(d("Acara yang sudah dipublish tidak dapat diedit."));
      return;
    }
    setActiveId(invitation.id);
    setScopeConflicts([]);
    setScopeChoices({});
    setForm(eventInvitationToForm(invitation));
    setEditorMode(invitation.eventConfigured ? "edit" : "new");
    setNotice("");
  }

  function closeEditor() {
    setActiveId("");
    setForm(EMPTY_EVENT_FORM);
    setScopeConflicts([]);
    setScopeChoices({});
    setEditorMode("closed");
    setNotice("");
  }

  async function load(preferredId?: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/invitations?all=1", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Data acara belum dapat dimuat."));
      const next = sortEventInvitations((data?.invitations ?? []) as EventPanelInvitation[]);
      setEvents(next);
      const targetId = preferredId || activeId;
      const target = targetId ? next.find((item) => item.id === targetId) : null;
      if (target) activate(target);
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Data acara belum dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (editorMode === "closed") return;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeId, editorMode]);

  function field(name: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startNewEvent() {
    if (saving || deletingId) return;
    setActiveId("");
    setForm(EMPTY_EVENT_FORM);
    setScopeConflicts([]);
    setScopeChoices({});
    setEditorMode("new");
    setNotice("");
  }

  function selectCategory(value: string) {
    if (!isEventCategory(value)) return;
    const mode = getEventCategory(value).nameMode;
    setForm((current) => ({
      ...current,
      eventCategory: value,
      weddingSessions: value === "WEDDING" ? current.weddingSessions ?? (editorMode === "new" ? [emptyWeddingSession("ceremony")] : null) : null,
      customTitle: value === "OTHER" ? current.customTitle : "",
      brideName: mode === "couple" ? current.brideName : "",
      groomName: mode === "optional" ? "" : current.groomName,
      groomFatherName: value === "WEDDING" ? current.groomFatherName : "",
      groomMotherName: value === "WEDDING" ? current.groomMotherName : "",
      groomChildOrder: value === "WEDDING" ? current.groomChildOrder : "",
      groomChildPosition: value === "WEDDING" ? current.groomChildPosition : "",
      brideFatherName: value === "WEDDING" ? current.brideFatherName : "",
      brideMotherName: value === "WEDDING" ? current.brideMotherName : "",
      brideChildOrder: value === "WEDDING" ? current.brideChildOrder : "",
      brideChildPosition: value === "WEDDING" ? current.brideChildPosition : "",
    }));
  }

  async function save() {
    if (!form.eventCategory) return setNotice(d("Pilih jenis acara."));
    const category = getEventCategory(form.eventCategory);
    if (category.nameMode === "couple" && (!form.groomName.trim() || !form.brideName.trim())) {
      return setNotice(d("Lengkapi kedua nama."));
    }
    if (category.nameMode === "single" && !form.groomName.trim()) {
      return setNotice(d("Nama utama wajib diisi."));
    }
    if (form.eventCategory === "OTHER" && !form.customTitle.trim()) {
      return setNotice(d("Nama event wajib diisi."));
    }
    if (!isValidChildOrder(form.groomChildOrder) || !isValidChildOrder(form.brideChildOrder)) {
      return setNotice(d("Anak keberapa harus berupa angka lebih dari 0."));
    }
    const eventDateIso = displayDateToIso(form.eventDate);
    if (!eventDateIso) return setNotice(d("Tanggal harus menggunakan format dd/mm/yyyy yang valid."));
    let sessionDetails = {};
    try { sessionDetails = weddingSessionProjection(parseWeddingSessions(form.weddingSessions, form.eventCategory) ?? []); }
    catch (error) { return setNotice(error instanceof Error ? error.message : d("Data acara belum dapat disimpan.")); }
    if (scopeConflicts.length && form.weddingSessions?.length !== 1 && scopeConflicts.some((guest) => scopeChoices[guest.id] === undefined || (form.weddingSessions && !scopeChoices[guest.id].length))) {
      return setNotice(locale === "en" ? "Review each guest’s invited sessions before saving." : "Periksa sesi undangan setiap tamu sebelum menyimpan.");
    }
    if (!form.weddingSessions && !isValidTime24(form.ceremonyTime)) {
      return setNotice(d("Waktu mulai harus menggunakan format HH:mm."));
    }
    if (
      !form.weddingSessions && form.receptionTime &&
      form.receptionTime !== END_TIME_SENTINEL &&
      !isValidTime24(form.receptionTime)
    ) {
      return setNotice(d("Waktu selesai harus menggunakan format HH:mm atau opsi - end."));
    }
    if (!form.weddingSessions && !form.venue.trim()) return setNotice(d("Nama tempat wajib diisi."));

    setSaving(true);
    setNotice(d("Menyimpan..."));
    try {
      const title = buildEventTitle(
        form.eventCategory,
        form.groomName,
        form.brideName,
        form.customTitle,
      );
      const creatingNew = editorMode === "new" && !activeId;
      const response = await fetch("/api/invitations", {
        method: creatingNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(activeId ? { id: activeId } : {}),
          eventCategory: form.eventCategory,
          title,
          groomName: form.groomName,
          brideName: form.brideName,
          groomFatherName: form.groomFatherName,
          groomMotherName: form.groomMotherName,
          groomChildOrder: form.groomChildPosition === "NUMBER" ? form.groomChildOrder : "",
          groomChildPosition: form.groomChildPosition || null,
          brideFatherName: form.brideFatherName,
          brideMotherName: form.brideMotherName,
          brideChildOrder: form.brideChildPosition === "NUMBER" ? form.brideChildOrder : "",
          brideChildPosition: form.brideChildPosition || null,
          venue: form.venue,
          address: form.address,
          mapUrl: form.mapUrl,
          timezone: form.timezone,
          eventDate: eventDateIso,
          ceremonyTime: form.ceremonyTime,
          receptionTime: form.receptionTime,
          description: form.description,
          eventNotes: form.eventNotes,
          eventConfigured: true,
          weddingSessions: form.weddingSessions,
          ...sessionDetails,
          ...(scopeConflicts.length ? { weddingGuestScopes: scopeConflicts.map((guest) => ({ id: guest.id, invitedSessions: form.weddingSessions?.length === 1 ? [form.weddingSessions[0].id] : scopeChoices[guest.id] ?? [] })) } : {}),
        }),
      });
      const data = await response.json().catch(() => null);
      if (Array.isArray(data?.guestsRequiringScope)) {
        setScopeConflicts(data.guestsRequiringScope);
      }
      if (!response.ok || !data?.invitation?.id) {
        throw new Error(data?.error || d("Data acara belum dapat disimpan."));
      }
      setScopeConflicts([]);
      setScopeChoices({});
      await load(String(data.invitation.id));
      setNotice(d("Tersimpan."));
      onSaved(editorMode === "new" ? { id: String(data.invitation.id), type: data.invitation.type === "ADAT_AKAD" ? "ADAT_AKAD" : "WEDDING" } : undefined);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Data acara belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(invitation: EventPanelInvitation) {
    if (saving || deletingId) return;
    if (invitation.isPublished) {
      setNotice(d("Acara yang sudah dipublish tidak dapat dihapus."));
      return;
    }

    const label = displayTitleCase(invitation.title?.trim() || d("Acara baru"));
    const confirmed = window.confirm(
      locale === "en"
        ? `Delete “${label}”?\n\nThe event, invitation design, guest list, and related unpublished data will also be deleted.`
        : `Hapus “${label}”?\n\nAcara, desain undangan, daftar tamu, dan data terkait yang belum dipublish akan ikut dihapus.`,
    );
    if (!confirmed) return;

    setDeletingId(invitation.id);
    setNotice(d("Menghapus acara..."));
    try {
      const response = await fetch(
        `/api/invitations?id=${encodeURIComponent(invitation.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || d("Acara belum dapat dihapus."));
      }
      if (activeId === invitation.id) closeEditor();
      await load();
      setNotice(d("Acara dihapus."));
      onSaved();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Acara belum dapat dihapus."));
    } finally {
      setDeletingId("");
    }
  }

  const category = form.eventCategory ? getEventCategory(form.eventCategory) : null;
  const active = events.find((item) => item.id === activeId) || null;
  const timezone = getIndonesiaTimezone(form.timezone);
  const draftCount = events.filter((event) => !event.eventConfigured).length;
  const designedCount = events.filter((event) => Boolean(event.templateKey?.trim())).length;
  const publishedCount = events.filter((event) => event.isPublished).length;

  return (
    <DashboardPage>
      <DashboardPageHeader
            title={d("Rangkaian Acara")}
            actions={
              <Button
                type="button"
                size="sm"
                onClick={startNewEvent}
                disabled={saving || Boolean(deletingId)}
              >
                <Plus className="h-4 w-4" />
                {d("Tambah acara")}
              </Button>
            }
          />

      <DashboardMetricGrid className="mt-4">
        <DashboardMetricCard icon={CalendarDays} label={d("Total")} value={String(events.length)} />
        <DashboardMetricCard icon={PenLine} label={d("Draft")} value={String(draftCount)} />
        <DashboardMetricCard icon={Save} label={d("Sudah desain")} value={String(designedCount)} />
        <DashboardMetricCard icon={Send} label={d("Terbit")} value={String(publishedCount)} />
      </DashboardMetricGrid>

      {editorMode === "closed" && notice && (
        <DashboardNotice className="mt-4">{notice}</DashboardNotice>
      )}

      {events.length > 0 && (
        <DashboardPanel className="mt-6" title={d("Daftar acara")}>
          <div className="grid gap-3">
            {events.map((event) => {
              const draft = !event.eventConfigured;
              const hasDesign = Boolean(event.templateKey?.trim());
              const status = event.isPublished
                ? d("Terbit")
                : hasDesign
                  ? d("Siap")
                  : draft
                    ? d("Draft")
                    : d("Belum desain");
              return (
                <article key={event.id} className="dc-dashboard-detail-card rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold text-foreground">
                        {displayTitleCase(draft ? d("Acara baru") : event.title || d("Acara tanpa judul"))}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />{event.eventDate ? isoDateToDisplay(event.eventDate) : "—"}</span>
                        <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate">{draft ? d("Belum dilengkapi") : event.venue || "—"}</span></span>
                      </p>
                    </div>
                    <DashboardStatusBadge active={event.isPublished || hasDesign}>{status}</DashboardStatusBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary/15 pt-4 sm:justify-end">
                    {!event.isPublished && (
                      <>
                        <Button type="button" size="sm" onClick={() => activate(event)}>
                          <PenLine className="size-4" />{d("Edit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => removeEvent(event)}
                          disabled={saving || Boolean(deletingId)}
                        >
                          <Trash2 className="size-4" />
                          {deletingId === event.id ? d("Menghapus...") : d("Hapus")}
                        </Button>
                      </>
                    )}
                    {!draft && (
                      <Button asChild size="sm">
                        <Link href={`/dashboard/editor?type=${event.type}&invitationId=${encodeURIComponent(event.id)}${selectedTemplate ? `&template=${encodeURIComponent(selectedTemplate)}` : ""}`}>
                          <PenLine className="size-4" />
                          {hasDesign ? d("Undangan") : d("Buat undangan")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </DashboardPanel>
      )}

      {!loading && !events.length && editorMode === "closed" && (
        <DashboardPanel className="mt-5" title={d("Daftar acara")}>
          <DashboardEmptyState
            icon={CalendarDays}
            title={d("Belum ada acara")}
          />
        </DashboardPanel>
      )}

      {editorMode !== "closed" && (editorMode === "new" || active) && (
        <section
          ref={editorRef}
          className="dc-dashboard-surface mt-5 scroll-mt-24 rounded-[24px] border border-primary/20 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {editorMode === "new" ? d("Acara baru") : d("Edit acara")}
            </p>
            <Button type="button" size="sm" onClick={closeEditor} disabled={saving}>
              <X className="h-4 w-4" />
              {d("Tutup")}
            </Button>
          </div>

          <div className="mt-6 grid gap-x-10 gap-y-8 xl:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{d("Detail")}</h3>
              <FloatingField label={d("Jenis acara")} className="mt-4 block">
                <select
                  value={form.eventCategory}
                  onChange={(event) => selectCategory(event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">{displayTitleCase(d("Pilih jenis acara"))}</option>
                  {eventCategoryOptions.map((item) => (
                    <option key={item.key} value={item.key}>{displayTitleCase(locale === "en" ? ({ WEDDING: "Wedding", SILVER_WEDDING: "Silver Wedding", GOLDEN_WEDDING: "Golden Wedding", BIRTHDAY: "Birthday", BABY_SHOWER: "Baby Shower", OTHER: "Other Event" } as Record<string, string>)[item.key] || item.label : item.label)}</option>
                  ))}
                </select>
              </FloatingField>

              {category && (
                <div className="mt-4 space-y-4">
                  {category.nameMode === "couple" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <EventField
                        label={form.eventCategory === "WEDDING" ? d("Nama pengantin pria") : d("Nama pasangan 1")}
                        value={form.groomName}
                        onChange={(value) => field("groomName", value)}
                        placeholder={d("Nama lengkap")}
                      />
                      <EventField
                        label={form.eventCategory === "WEDDING" ? d("Nama pengantin wanita") : d("Nama pasangan 2")}
                        value={form.brideName}
                        onChange={(value) => field("brideName", value)}
                        placeholder={d("Nama lengkap")}
                      />
                    </div>
                  )}

                  {form.eventCategory === "WEDDING" && (
                    <div className="grid gap-6 border-t border-border/70 pt-5 sm:grid-cols-2">
                      <WeddingFamilyFields
                        title={d("Pengantin pria")}
                        kind="putra"
                        father={form.groomFatherName}
                        mother={form.groomMotherName}
                        order={form.groomChildOrder}
                        position={form.groomChildPosition}
                        onPosition={(position) => setForm((current) => ({ ...current, groomChildPosition: position, groomChildOrder: position === "NUMBER" ? current.groomChildOrder : "" }))}
                        onFather={(value) => field("groomFatherName", value)}
                        onMother={(value) => field("groomMotherName", value)}
                        onOrder={(value) => field("groomChildOrder", value)}
                      />
                      <WeddingFamilyFields
                        title={d("Pengantin wanita")}
                        kind="putri"
                        father={form.brideFatherName}
                        mother={form.brideMotherName}
                        order={form.brideChildOrder}
                        position={form.brideChildPosition}
                        onPosition={(position) => setForm((current) => ({ ...current, brideChildPosition: position, brideChildOrder: position === "NUMBER" ? current.brideChildOrder : "" }))}
                        onFather={(value) => field("brideFatherName", value)}
                        onMother={(value) => field("brideMotherName", value)}
                        onOrder={(value) => field("brideChildOrder", value)}
                      />
                    </div>
                  )}

                  {category.nameMode === "single" && (
                    <EventField
                      label={form.eventCategory === "BIRTHDAY" ? d("Nama yang berulang tahun") : d("Nama keluarga / calon bayi")}
                      value={form.groomName}
                      onChange={(value) => field("groomName", value)}
                      placeholder={d("Nama")}
                    />
                  )}

                  {category.nameMode === "optional" && (
                    <EventField
                      label={d("Nama utama (opsional)")}
                      value={form.groomName}
                      onChange={(value) => field("groomName", value)}
                    />
                  )}

                  {form.eventCategory === "OTHER" && (
                    <EventField
                      label={d("Nama event")}
                      value={form.customTitle}
                      onChange={(value) => field("customTitle", value)}
                    />
                  )}
                </div>
              )}
            </div>

            {category && (
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{d("Waktu & tempat")}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <EventDateField label={d("Tanggal")} value={form.eventDate} onChange={(value) => field("eventDate", value)} />
                  {!form.weddingSessions && <><EventTimeField label={`${d("Mulai")} (${timezone.label})`} value={form.ceremonyTime} onChange={(value) => field("ceremonyTime", value)} />
                  <div>
                    <EventTimeField
                      label={`${d("Selesai")} (${timezone.label})`}
                      value={form.receptionTime === END_TIME_SENTINEL ? "" : form.receptionTime}
                      onChange={(value) => field("receptionTime", value)}
                      disabled={form.receptionTime === END_TIME_SENTINEL}
                    />
                    <label className="mt-2 flex min-h-8 cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={form.receptionTime === END_TIME_SENTINEL}
                        onChange={(event) =>
                          field(
                            "receptionTime",
                            event.target.checked ? END_TIME_SENTINEL : "",
                          )
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span>{d("Tampilkan “- end” di undangan")}</span>
                    </label>
                  </div>
                  </>}
                </div>

                <FloatingField label={d("Zona waktu")} className="mt-4 block">
                  <select
                    value={form.timezone}
                    onChange={(event) => field("timezone", event.target.value)}
                    className="h-11 w-full rounded-[10px] border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {indonesiaTimezones.map((item) => (
                      <option key={item.value} value={item.value}>
                        {displayTitleCase(item.label)} · {displayTitleCase(item.description)}
                      </option>
                    ))}
                  </select>
                </FloatingField>

                {form.eventCategory === "WEDDING" && <WeddingSessionFields value={form.weddingSessions} onChange={(weddingSessions) => setForm((current) => ({ ...current, weddingSessions }))} disabled={saving} timezone={timezone.label} />}
                {scopeConflicts.length > 0 && <fieldset className="mt-5 space-y-3" disabled={saving}>
                  <legend className="text-sm font-semibold">{locale === "en" ? "Review guest sessions" : "Periksa sesi tamu"}</legend>
                  {scopeConflicts.map((guest) => <div key={guest.id} className="grid gap-2 sm:grid-cols-2 sm:items-center">
                    <p className="break-words text-sm">{displayTitleCase(guest.name)}</p>
                    {form.weddingSessions ? <WeddingGuestScopeField sessions={form.weddingSessions} value={scopeChoices[guest.id]} onChange={(value) => setScopeChoices((current) => ({ ...current, [guest.id]: value }))} disabled={saving} /> : <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={scopeChoices[guest.id] !== undefined} onChange={(event) => setScopeChoices((current) => { const next = { ...current }; if (event.target.checked) next[guest.id] = []; else delete next[guest.id]; return next; })} />{locale === "en" ? "Use the event schedule" : "Gunakan jadwal acara"}</label>}
                  </div>)}
                </fieldset>}
                {(!form.weddingSessions && (form.eventDate || form.ceremonyTime)) && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{form.eventDate ? formatEventDateLabel(form.eventDate, locale) : d("Tanggal")}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{form.ceremonyTime || "--:--"}{form.receptionTime === END_TIME_SENTINEL ? " - end" : form.receptionTime ? `–${form.receptionTime}` : ""} {timezone.label}</span>
                  </div>
                )}

                {!form.weddingSessions && <div className="mt-4 space-y-4">
                  <EventField label={d("Nama tempat")} value={form.venue} onChange={(value) => field("venue", value)} />
                  <EventField label={d("Alamat")} value={form.address} onChange={(value) => field("address", value)} />
                  <EventField label={d("Google Maps")} value={form.mapUrl} onChange={(value) => field("mapUrl", value)} />
                </div>}
              </div>
            )}
          </div>

          {category && (
            <details className="mt-7 border-t border-border/70 pt-4">
              <summary className="cursor-pointer text-xs font-semibold">{locale === "en" ? "Additional details" : "Tambahan"}</summary>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <EventTextArea label={d("Deskripsi")} value={form.description} onChange={(value) => field("description", value)} />
                <EventTextArea label={d("Catatan")} value={form.eventNotes} onChange={(value) => field("eventNotes", value)} />
              </div>
            </details>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-xs text-muted-foreground" role="status">{notice}</p>
            <Button disabled={saving || !category} onClick={save} size="sm">
              <Save className="h-4 w-4" />
              {saving ? d("Menyimpan...") : d("Simpan")}
            </Button>
          </div>
        </section>
      )}
    </DashboardPage>
  );
}
