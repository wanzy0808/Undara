"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useMemo, useState } from "react";
import { Copy, FilePlus2, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardEmptyState,
  DashboardNotice,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import {
  fillWaMessage,
  WA_MESSAGE_CATEGORIES,
  WA_MESSAGE_DEFAULTS,
  WA_MESSAGE_PLACEHOLDERS,
  type WaMessageCategory,
  type WaMessageForm,
  type WaMessageTemplate,
} from "@/lib/wa-blast/message-templates";
import type { WaBlastEvent, WaBlastRecipient } from "@/components/Dashboard/wa-blast-types";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_INVITATION_ROOT_DOMAIN || "dcwedding.com";

function categoryName(category: WaMessageCategory, locale: string) {
  const option = WA_MESSAGE_CATEGORIES.find((item) => item.id === category);
  return locale === "en" ? option?.english : option?.label;
}

function eventDate(value: string | undefined, locale: string) {
  if (!value) return locale === "en" ? "Date to be confirmed" : "Tanggal menyusul";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Date to be confirmed" : "Tanggal menyusul";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

type Props = {
  event: WaBlastEvent;
  recipients: WaBlastRecipient[];
};

export default function WaBlastTemplateStudio({ event, recipients }: Props) {
  const { d, locale } = useDashboardI18n();
  const [templates, setTemplates] = useState<WaMessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"idle" | "new" | "edit">("idle");
  const [form, setForm] = useState<WaMessageForm>({ ...WA_MESSAGE_DEFAULTS.INVITATION });
  const [recipientId, setRecipientId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setNotice("");
      setError("");
      setActiveId("");
      setMode("idle");
      setTemplates([]);
      setRecipientId("");
      try {
        const response = await fetch(
          `/api/wa-blast/templates?invitationId=${encodeURIComponent(event.id)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || d("Template belum dapat dimuat."));
        if (!controller.signal.aborted) setTemplates(data?.templates ?? []);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : d("Template belum dapat dimuat."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [event.id]);

  const selectedTemplate = templates.find((item) => item.id === activeId) || null;
  const recipient = recipients.find((item) => item.id === recipientId) || recipients[0] || null;
  const publicLink = event.slug && event.isPublished ? `https://${event.slug}.${ROOT_DOMAIN}/` : "";
  const variables = useMemo(() => ({
    "{nama}": recipient?.name || (locale === "en" ? "Guest name" : "Nama Tamu"),
    "{acara}": event.title?.trim() || d("Acara"),
    "{tanggal}": eventDate(event.eventDate, locale),
    "{lokasi}": event.venue?.trim() || (locale === "en" ? "Venue to be confirmed" : "Lokasi menyusul"),
    "{link}": publicLink || (locale === "en" ? "Invitation link available after publishing" : "Tautan tersedia setelah undangan terbit"),
  }), [recipient?.name, event.title, event.eventDate, event.venue, publicLink, locale, d]);
  const preview = useMemo(() => ({
    title: fillWaMessage(form.title, variables),
    body: fillWaMessage(form.body, variables),
  }), [form.title, form.body, variables]);
  const hasPublicLink = form.title.includes("{link}") || form.body.includes("{link}");
  const canCopy = Boolean(recipient && (!hasPublicLink || publicLink));
  const valid = Boolean(form.name.trim() && form.title.trim() && form.body.trim()
    && form.name.trim().length <= 80 && form.title.trim().length <= 120 && form.body.trim().length <= 3000);

  function newTemplate(category: WaMessageCategory = "INVITATION") {
    setActiveId("");
    setForm({ ...WA_MESSAGE_DEFAULTS[category] });
    setMode("new");
    setError("");
    setNotice("");
  }

  function editTemplate(item: WaMessageTemplate) {
    setActiveId(item.id);
    setForm({ category: item.category, name: item.name, title: item.title, body: item.body });
    setMode("edit");
    setError("");
    setNotice("");
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/wa-blast/templates", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: event.id,
          ...(mode === "edit" ? { id: activeId } : {}),
          ...form,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.template) throw new Error(data?.error || d("Template belum dapat disimpan."));
      const updated = data.template as WaMessageTemplate;
      setTemplates((current) =>
        [updated, ...current.filter((item) => item.id !== updated.id)],
      );
      setActiveId(updated.id);
      setMode("edit");
      setNotice(d("Template tersimpan."));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : d("Template belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedTemplate || saving) return;
    if (!window.confirm(locale === "en" ? "Delete this message template?" : "Hapus template pesan ini?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/wa-blast/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: event.id, id: selectedTemplate.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Template belum dapat dihapus."));
      setTemplates((current) => current.filter((item) => item.id !== selectedTemplate.id));
      setActiveId("");
      setMode("idle");
      setNotice(d("Template dihapus."));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : d("Template belum dapat dihapus."));
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(`${preview.title}\n\n${preview.body}`);
      setNotice(d("Pesan disalin."));
    } catch {
      setError(d("Gagal menyalin pesan. Periksa izin clipboard browser."));
    }
  }

  return (
    <div className="mt-5 grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(235px,0.7fr)_minmax(0,1.4fr)_minmax(260px,0.9fr)]">
      <DashboardPanel
        title={d("Template pesan")}
        actions={
          <Button type="button" size="sm" disabled={loading || saving || templates.length >= 30} onClick={() => newTemplate()}>
            <FilePlus2 className="size-4" aria-hidden="true" />{d("Buat")}
          </Button>
        }
      >
        {loading ? <p className="text-sm text-muted-foreground">{d("Memuat...")}</p> : templates.length ? (
          <div className="grid gap-2">
            {templates.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => editTemplate(item)}
                aria-pressed={mode === "edit" && activeId === item.id}
                className={`undara-dashboard-detail-card min-w-0 rounded-tr-[22px] border px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-primary ${mode === "edit" && activeId === item.id ? "border-primary bg-primary/15" : "border-primary/20 bg-primary/[0.025] hover:border-primary/60 hover:bg-primary/10"}`}
              >
                <span className="block truncate text-sm font-semibold text-foreground">{item.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{categoryName(item.category, locale)}</span>
              </button>
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title={d("Belum ada template")}
            description={d("Buat pesan untuk acara ini.")}
          />
        )}
        <p className="text-xs text-muted-foreground">{templates.length} / 30</p>
      </DashboardPanel>

      <DashboardPanel title={mode === "new" ? d("Template baru") : mode === "edit" ? d("Edit template") : d("Isi pesan")}>
        {notice && <DashboardNotice className="mb-4">{notice}</DashboardNotice>}
        {error && <p role="alert" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>}
        {mode === "idle" ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">{d("Pilih template untuk mengedit, atau buat pesan baru.")}</p>
            <div className="grid gap-2">
              {WA_MESSAGE_CATEGORIES.map((item) => (
                <Button key={item.id} type="button" size="sm" onClick={() => newTemplate(item.id)} disabled={loading}>
                  <FilePlus2 className="size-4" aria-hidden="true" />
                  {locale === "en" ? item.english : item.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4">
            <FloatingField label={d("Jenis pesan")} className="grid gap-1.5 text-sm font-semibold text-foreground">
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as WaMessageCategory }))}
                disabled={saving}
                className="min-h-11 w-full border border-primary/25 bg-background px-4 text-sm font-normal"
              >
                {WA_MESSAGE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{displayTitleCase(locale === "en" ? item.english : item.label)}</option>)}
              </select>
            </FloatingField>
            <FloatingField label={d("Nama template")} className="grid gap-1.5 text-sm font-semibold text-foreground">
              <Input value={form.name} maxLength={80} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={d("Nama template")} />
            </FloatingField>
            <FloatingField label={d("Judul pesan")} className="grid gap-1.5 text-sm font-semibold text-foreground">
              <Input value={form.title} maxLength={120} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={d("Judul pesan")} />
            </FloatingField>
            <div className="grid gap-1.5 text-sm text-foreground">
              <FloatingField label={d("Isi pesan")}>
              <textarea
                value={form.body}
                maxLength={3000}
                disabled={saving}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                rows={10}
                className="min-h-56 w-full resize-y rounded-2xl border border-primary/25 bg-background px-4 py-3 text-sm font-normal leading-6 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
              />
              </FloatingField>
              <span className="text-right text-xs font-normal tabular-nums text-muted-foreground">{form.body.length} / 3000</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WA_MESSAGE_PLACEHOLDERS.map((placeholder) => (
                <Button key={placeholder} type="button" size="xs" onClick={() => setForm((current) => ({ ...current, body: current.body + placeholder }))} disabled={saving || form.body.length + placeholder.length > 3000}>
                  {placeholder}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/15 pt-4">
              {mode === "edit" ? (
                <Button type="button" size="sm" onClick={() => void remove()} disabled={saving}>
                  <Trash2 className="size-4" aria-hidden="true" />{d("Hapus")}
                </Button>
              ) : <span />}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={saving} onClick={() => { setMode("idle"); setActiveId(""); setNotice(""); setError(""); }}>
                  <X className="size-4" aria-hidden="true" />{d("Batal")}
                </Button>
                <Button type="button" size="sm" onClick={() => void save()} disabled={!valid || saving}>
                  <Save className="size-4" aria-hidden="true" />{saving ? d("Menyimpan...") : d("Simpan")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel title={d("Pratinjau pesan")}>
        <FloatingField label={d("Tamu")} className="grid gap-1.5 text-sm font-semibold text-foreground">
          <select
            value={recipient?.id || ""}
            onChange={(event) => setRecipientId(event.target.value)}
            disabled={!recipients.length}
            className="min-h-11 w-full border border-primary/25 bg-background px-4 text-sm font-normal"
          >
            {recipients.length ? recipients.map((item) => <option key={item.id} value={item.id}>{displayTitleCase(item.name)}</option>) : <option value="">{displayTitleCase(d("Contoh · belum ada penerima"))}</option>}
          </select>
        </FloatingField>
        <div className="undara-dashboard-detail-card min-w-0 rounded-tr-[22px] border border-primary/20 bg-primary/[0.055] p-4">
          <p className="break-words text-sm font-semibold text-primary">{preview.title}</p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{preview.body}</p>
        </div>
        {!recipients.length && <p className="text-xs text-muted-foreground">{d("Tambahkan penerima untuk pratinjau dengan nama asli.")}</p>}
        {hasPublicLink && !publicLink && (
          <p className="text-xs text-muted-foreground">{d("Terbitkan undangan agar tautan dapat digunakan.")}</p>
        )}
        <Button type="button" size="sm" onClick={() => void copy()} disabled={!canCopy || mode === "idle"}>
          <Copy className="size-4" aria-hidden="true" />{d("Salin pesan")}
        </Button>
        <p className="text-xs text-muted-foreground">{d("Template tidak dikirim otomatis. Menyalin pesan tidak mengurangi kuota.")}</p>
      </DashboardPanel>
    </div>
  );
}
