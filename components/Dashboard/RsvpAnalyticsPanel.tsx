"use client";

import { weddingSessionLabel, type WeddingSession } from "@/lib/events/wedding-sessions";

import { FloatingField } from "@/components/ui/floating-field";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  CheckCircle2,
  Download,
  QrCode,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { usherQrImageUrl } from "@/components/Usher/utils";
import { confirmedRsvpPax, rsvpCsvCell } from "@/lib/guests/rsvp";
import { defaultInvitationRsvpConfig, type InvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import {
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";

export type RsvpGuest = {
  id: string;
  name: string;
  phone: string | null;
  category?: string | null;
  tags?: string[];
  personalAddressee?: string | null;
  invitedPax?: number;
  personalSharedAt?: string | null;
  rsvpStatus: string;
  plusOnes: number;
  rsvpEvents?: string[];
  rsvpAnswers?: Record<string, string> | null;
  checkedIn?: boolean;
  table?: { id: string; name: string; shape: string; capacity: number } | null;
  tableId?: string | null;
};

type Props = {
  guests: RsvpGuest[];
  slug: string;
  accent: string;
  embedded?: boolean;
  onRefresh?: () => Promise<void> | void;
  rsvpConfig?: InvitationRsvpConfig;
  weddingSessions?: WeddingSession[];
};
type SortKey = "name" | "status" | "pax" | "checkedIn";

const statusLabel: Record<string, string> = {
  ATTENDING: "Hadir",
  NOT_ATTENDING: "Tidak Hadir",
  TENTATIVE: "Ragu",
};

const sortLabel: Record<SortKey, string> = {
  name: "Nama",
  status: "RSVP",
  pax: "Pax",
  checkedIn: "Check-in",
};

export default function RsvpAnalyticsPanel({
  guests,
  slug,
  embedded = false,
  onRefresh,
  rsvpConfig = defaultInvitationRsvpConfig,
  weddingSessions = [],
}: Props) {
  const { d, locale } = useDashboardI18n();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [ascending, setAscending] = useState(true);
  const [qr, setQr] = useState<{ name: string; token: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const eventNames = (guest: RsvpGuest) => (guest.rsvpEvents ?? []).flatMap((event) => {
    const session = weddingSessions.find((session) => session.id === event);
    if (session) return [weddingSessionLabel(session, locale === "en" ? "EN" : "ID")];
    return event === "ceremony" ? [d("Upacara Nikah")] : event === "reception" ? [d("Resepsi")] : [];
  }).join(", ");
  const answer = (guest: RsvpGuest, id: string) => typeof guest.rsvpAnswers?.[id] === "string" ? guest.rsvpAnswers[id] : "";

  const stats = useMemo(
    () => ({
      total: guests.length,
      attending: guests.filter((guest) => guest.rsvpStatus === "ATTENDING").length,
      pax: guests.reduce((sum, guest) => sum + confirmedRsvpPax(guest), 0),
      checkedIn: guests.filter((guest) => guest.checkedIn).length,
    }),
    [guests],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = guests.filter(
      (guest) =>
        !q ||
        guest.name.toLowerCase().includes(q) ||
        (guest.phone ?? "").includes(q),
    );

    return [...rows].sort((a, b) => {
      const av =
        sortKey === "name"
          ? a.name.toLowerCase()
          : sortKey === "status"
            ? (statusLabel[a.rsvpStatus] ?? a.rsvpStatus)
            : sortKey === "pax"
              ? confirmedRsvpPax(a)
              : a.checkedIn
                ? 1
                : 0;
      const bv =
        sortKey === "name"
          ? b.name.toLowerCase()
          : sortKey === "status"
            ? (statusLabel[b.rsvpStatus] ?? b.rsvpStatus)
            : sortKey === "pax"
              ? confirmedRsvpPax(b)
              : b.checkedIn
                ? 1
                : 0;

      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
  }, [ascending, guests, query, sortKey]);

  function exportCsv() {
    const header =
      locale === "en"
        ? ["Guest Name", "Phone", "RSVP Status", "Pax", "Check In", "Table", "Events attending"]
        : ["Nama Tamu", "Telepon", "Status RSVP", "Pax", "Check In", "Meja", "Acara yang dihadiri"];
    header.push(...rsvpConfig.customFields.map((field) => field.label));
    const lines = [
      header,
      ...filtered.map((guest) => [
        guest.name,
        guest.phone || "",
        d(statusLabel[guest.rsvpStatus] ?? guest.rsvpStatus),
        confirmedRsvpPax(guest),
        guest.checkedIn ? d("Checked In") : d("Belum Check In"),
        guest.table?.name || d("Belum ditempatkan"),
        eventNames(guest),
        ...rsvpConfig.customFields.map((field) => answer(guest, field.id)),
      ]),
    ];
    const csv = lines
      .map((row) =>
        row
          .map(rsvpCsvCell)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "undara-rsvp.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function showQr(guest: RsvpGuest) {
    setBusyId(guest.id);
    setNotice("");
    try {
      const response = await fetch("/api/usher/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || d("QR gagal dibuat."));
      setQr({ name: guest.name, token: data.token });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("QR gagal dibuat."));
    } finally {
      setBusyId(null);
    }
  }

  async function manualCheckIn(guest: RsvpGuest) {
    if (
      guest.checkedIn ||
      !confirm(
        locale === "en"
          ? `Manually check in ${guest.name}?`
          : `Check-in manual ${guest.name}?`,
      )
    )
      return;
    setBusyId(guest.id);
    setNotice("");
    try {
      const response = await fetch("/api/usher/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || d("Check-in gagal."));
      setNotice(locale === "en" ? `${guest.name} checked in successfully.` : `${guest.name} berhasil check-in.`);
      if (onRefresh) await onRefresh();
      else window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Check-in gagal."));
    } finally {
      setBusyId(null);
    }
  }

  const metrics = [
    { label: d("RSVP"), value: stats.total, icon: Users },
    { label: d("Hadir"), value: stats.attending, icon: CheckCircle2 },
    { label: d("Total pax"), value: stats.pax, icon: Users },
    { label: d("Check-in"), value: stats.checkedIn, icon: QrCode },
  ];

  return (
    <div
      className={
        embedded
          ? "min-w-0 overflow-x-clip text-foreground"
          : "undara-dashboard-page mx-auto w-[80vw] max-w-full min-w-0 overflow-x-clip pb-16 pt-7 text-foreground sm:pt-8"
      }
    >
      {notice && (
        <DashboardNotice className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{notice}</span>
        </DashboardNotice>
      )}

      <DashboardMetricGrid className="min-w-0">
        {metrics.map(({ label, value, icon: Icon }) => (
          <DashboardMetricCard key={label} icon={Icon} label={label} value={String(value)} />
        ))}
      </DashboardMetricGrid>

      <DashboardPanel
        className="mt-5 min-w-0"
        title={d("Daftar tamu")}
        actions={<span className="text-sm font-semibold tabular-nums text-primary">{filtered.length} / {guests.length}</span>}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,12rem)_auto_auto] sm:items-center">
          <div className="relative min-w-0">
            <FloatingField label={d("Cari nama / telepon")} className="[&_.undara-floating-label]:left-8">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={d("Cari nama / telepon")}
              className="w-full min-w-0 pl-9"
            />
            </FloatingField>
            <Search className="pointer-events-none absolute left-3 top-[calc(50%+4px)] size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          </div>
          <FloatingField label={d("Urutkan tamu")}>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="min-h-10 w-full min-w-0 border border-primary/25 bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
              aria-label={d("Urutkan tamu")}
            >
            {(Object.keys(sortLabel) as SortKey[]).map((key) => (
              <option key={key} value={key}>{displayTitleCase(d(sortLabel[key]))}</option>
            ))}
            </select>
          </FloatingField>
          <Button
            type="button"
            size="sm"
            onClick={() => setAscending((value) => !value)}
            aria-label={ascending ? d("Ubah ke urutan turun") : d("Ubah ke urutan naik")}
            title={ascending ? d("Ubah ke urutan turun") : d("Ubah ke urutan naik")}
          >
            <ArrowDownUp className="size-4" aria-hidden="true" />
            {ascending ? d("Urutan naik") : d("Urutan turun")}
          </Button>
          <Button type="button" onClick={exportCsv} size="sm" title={d("Export daftar RSVP sebagai CSV")}>
            <Download className="size-4" aria-hidden="true" />
            {d("Export CSV")}
          </Button>
        </div>

        {filtered.length ? (
          <div className="grid min-w-0 gap-3">
            {filtered.map((guest) => (
              <article key={guest.id} className="undara-dashboard-detail-card min-w-0 rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-foreground">{guest.name}</h3>
                    {guest.phone && <p className="mt-1 break-all text-sm text-muted-foreground">{guest.phone}</p>}
                    {(guest.category || guest.tags?.length || guest.invitedPax) && (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {[guest.category || d("Reguler"), ...(guest.tags ?? []),
                          guest.invitedPax ? `${d("Diundang")} ${guest.invitedPax} pax` : ""]
                          .filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {d(statusLabel[guest.rsvpStatus] ?? guest.rsvpStatus)}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-primary/15 py-3 text-sm">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">{d("Pax")}</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-foreground">{confirmedRsvpPax(guest)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">{d("Check-in")}</dt>
                    <dd className="mt-1 font-semibold text-foreground">{guest.checkedIn ? d("Sudah") : d("Belum")}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">{d("Meja")}</dt>
                    <dd className="mt-1 break-words font-semibold text-foreground">{guest.table?.name || "—"}</dd>
                  </div>
                </dl>
                {(eventNames(guest) || rsvpConfig.customFields.some((field) => answer(guest, field.id))) && (
                  <dl className="mt-3 space-y-2 text-sm">
                    {eventNames(guest) && <div><dt className="text-muted-foreground">{d("Acara yang dihadiri")}</dt><dd className="mt-1 text-foreground">{eventNames(guest)}</dd></div>}
                    {rsvpConfig.customFields.filter((field) => answer(guest, field.id)).map((field) => (
                      <div key={field.id}><dt className="break-words text-muted-foreground">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-foreground">{answer(guest, field.id)}</dd></div>
                    ))}
                  </dl>
                )}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    title={locale === "en" ? `Create QR for ${guest.name}` : `Buat QR untuk ${guest.name}`}
                    aria-label={locale === "en" ? `Create QR for ${guest.name}` : `Buat QR untuk ${guest.name}`}
                    disabled={busyId === guest.id}
                    onClick={() => showQr(guest)}
                  >
                    <QrCode className="size-4" aria-hidden="true" />
                    {d("Buat QR")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    title={guest.checkedIn ? (locale === "en" ? `${guest.name} is checked in` : `${guest.name} sudah check-in`) : (locale === "en" ? `Manual check-in ${guest.name}` : `Check-in manual ${guest.name}`)}
                    aria-label={guest.checkedIn ? (locale === "en" ? `${guest.name} is checked in` : `${guest.name} sudah check-in`) : (locale === "en" ? `Manual check-in ${guest.name}` : `Check-in manual ${guest.name}`)}
                    disabled={busyId === guest.id || Boolean(guest.checkedIn)}
                    onClick={() => manualCheckIn(guest)}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {guest.checkedIn ? d("Sudah check-in") : d("Check-in")}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="undara-dashboard-detail-card rounded-tr-[22px] border border-dashed border-primary/25 bg-primary/[0.035] px-5 py-8 text-sm text-muted-foreground">
            {guests.length ? d("Tidak ada tamu yang cocok.") : d("Belum ada data RSVP untuk acara ini.")}
          </p>
        )}

        {slug && (
          <p className="mt-3 rounded-lg bg-background px-3 py-2 font-[family-name:var(--font-undara-mono)] text-[11px] text-muted-foreground">
            /invite/{slug}
          </p>
        )}
      </DashboardPanel>

      {qr && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"
          onClick={() => setQr(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 text-center text-foreground shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="icon-sm"
              onClick={() => setQr(null)}
              className="absolute right-3 top-3"
              aria-label={d("Tutup QR ticket")}
              title={d("Tutup QR ticket")}
            >
              <X className="h-4 w-4" />
            </Button>
            <p className="pr-10 font-[family-name:var(--font-undara-heading)] text-lg font-semibold text-primary">
              {qr.name}
            </p>
            <div className="mx-auto mt-5 w-fit border border-border bg-white p-3">
              <img
                className="h-56 w-56"
                alt="QR guest ticket"
                src={usherQrImageUrl(qr.token)}
              />
            </div>
            <p className="mt-4 break-all font-[family-name:var(--font-undara-mono)] text-[11px] leading-4 text-muted-foreground">
              {qr.token}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
