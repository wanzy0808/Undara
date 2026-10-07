"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  Mail,
  MessageSquareHeart,
  QrCode,
  RefreshCw,
  Users,
} from "lucide-react";
import EventScopePicker from "@/components/Dashboard/EventScopePicker";
import RsvpAnalyticsPanel from "@/components/Dashboard/RsvpAnalyticsPanel";
import SeatingChart from "@/components/Dashboard/SeatingChart";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { Button } from "@/components/ui/button";
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardPage as DashboardPageShell,
  DashboardPageHeader,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusBadge,
  DashboardSurface,
} from "@/components/Dashboard/DashboardPrimitives";
import type {
  DashboardContext,
  DashboardEvent,
  DashboardGuest,
  DashboardTable,
  DashboardTab,
} from "@/components/Dashboard/dashboard-types";
import ReferralCodePanel from "@/components/Dashboard/ReferralCodePanel";
import InvitationQrMenu from "@/components/Dashboard/InvitationQrMenu";
import { parseInvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import { displayTitleCase } from "@/lib/text/display-title-case";

function formatEventDate(value: string, locale: "id" | "en" = "id") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function WorkspaceOverview({
  ctx,
  events,
  onGo,
}: {
  ctx: DashboardContext | null;
  events: DashboardEvent[];
  onGo: (id: DashboardTab) => void;
}) {
  const { d, locale } = useDashboardI18n();
  const overview = ctx?.overview;
  const active = events.filter((event) => event.accessPaid).length;
  const published = events.filter((event) => event.isPublished).length;
  const totalGuests = overview?.totalGuests ?? 0;
  const totalRsvp = overview?.totalRsvp ?? 0;
  const pendingRsvp = Math.max(totalGuests - totalRsvp, 0);
  const rsvpCoverage = totalGuests
    ? Math.min(100, Math.round((totalRsvp / totalGuests) * 100))
    : 0;
  const publishRate = events.length
    ? Math.min(100, Math.round((published / events.length) * 100))
    : 0;

  const stats = [
    { label: d("Total acara"), value: events.length, icon: CalendarDays },
    { label: d("Undangan aktif"), value: active, icon: Mail },
    { label: d("Total RSVP"), value: totalRsvp, icon: MessageSquareHeart },
    { label: d("Total tamu"), value: totalGuests, icon: Users },
  ];

  return (
    <DashboardPageShell className="dc-dashboard-overview">
      <section className="dc-dashboard-overview-hero relative flex min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-tr-[28px] px-6 py-7 sm:flex-row sm:items-center sm:px-8">
        <div className="relative z-[1] min-w-0">
          <h1 className="break-words font-[family-name:var(--font-undara-heading)] text-2xl font-semibold leading-tight text-white sm:text-[30px]">
            {d("Halo")}, {ctx?.profile.displayName?.trim() || d("Akun")}
          </h1>
        </div>
        <div className="relative z-[1] flex max-w-full flex-wrap gap-2 self-start sm:self-auto sm:justify-end">
          <ReferralCodePanel />
          <InvitationQrMenu onManageInvitations={() => onGo("invitation")} />
          <Button type="button" size="lg" onClick={() => onGo("events")} className="dc-dashboard-overview-cta">
            <CalendarDays className="size-4" />
            {d("Tambah acara")}
          </Button>
        </div>
      </section>

      <DashboardMetricGrid className="mt-5">
        {stats.map((item, index) => (
          <DashboardMetricCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={String(item.value)}
            className={index === 0 ? "dc-dashboard-metric--featured" : ""}
          />
        ))}
      </DashboardMetricGrid>

      <section className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <DashboardSurface className="dc-dashboard-overview-events min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-5 py-5 sm:px-6">
            <h2 className="font-[family-name:var(--font-undara-heading)] text-xl font-semibold text-primary">
              {d("Terbaru")}
            </h2>
            <Button type="button" size="sm" onClick={() => onGo("events")}>
              {d("Lihat semua")}
              <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />
            </Button>
          </div>
          {events.length ? (
            <div className="dc-dashboard-event-list divide-y divide-primary/10 px-4 py-1 sm:px-5">
              {events.slice(0, 5).map((event) => (
                <article key={event.id} className="flex min-w-0 flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="dc-ui-name break-words text-base font-semibold leading-snug text-foreground">
                      {displayTitleCase(event.title || d("Acara tanpa judul"))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatEventDate(event.eventDate, locale)}
                      {event.venue ? ` · ${event.venue}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <DashboardStatusBadge active={event.isPublished}>
                      {event.isPublished ? d("Terbit") : event.accessPaid ? d("Aktif") : d("Draft")}
                    </DashboardStatusBadge>
                    <Button asChild size="sm">
                      <Link href={`/dashboard/editor?type=${event.type}&invitationId=${event.id}`}>
                        {d("Undangan")}
                        <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-8">
              <CalendarDays className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{d("Belum ada acara")}</p>
            </div>
          )}
        </DashboardSurface>

        <DashboardSurface className="dc-dashboard-overview-progress min-w-0 overflow-hidden">
          <div className="border-b border-primary/10 px-5 py-5 sm:px-6">
            <h2 className="font-[family-name:var(--font-undara-heading)] text-xl font-semibold text-primary">
              {d("RSVP")} &amp; {d("Publikasi")}
            </h2>
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-6">
              <figure
                className="relative size-28 shrink-0"
                aria-label={locale === "en" ? `RSVP response rate ${totalGuests ? rsvpCoverage + "%" : "not available"}` : `Cakupan RSVP ${totalGuests ? rsvpCoverage + "%" : "belum tersedia"}`}
              >
                <svg viewBox="0 0 42 42" className="size-28 -rotate-90" aria-hidden="true">
                  <circle cx="21" cy="21" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3.8" className="text-primary/10" />
                  {totalGuests > 0 && (
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeDasharray={`${rsvpCoverage} ${100 - rsvpCoverage}`} className="text-primary" />
                  )}
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-2xl font-semibold leading-none text-foreground">{totalGuests ? `${rsvpCoverage}%` : "—"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">RSVP</p>
                  </div>
                </div>
              </figure>
              <dl className="min-w-[130px] flex-1 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d("Sudah merespons")}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{totalRsvp}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d("Belum merespons")}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{pendingRsvp}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d("Total tamu")}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{totalGuests}</dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-primary/10 pt-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">{d("Publikasi")}</p>
                <p className="font-[family-name:var(--font-undara-mono)] text-sm font-semibold text-primary">{events.length ? `${publishRate}%` : "—"}</p>
              </div>
              <div
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/10"
                role="progressbar"
                aria-label={d("Publikasi")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={publishRate}
              >
                <div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${publishRate}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "en" ? `${published} of ${events.length} published` : `${published} dari ${events.length} terbit`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-primary/10 pt-5">
              <Button type="button" size="sm" onClick={() => onGo("rsvp")} className="w-full">
                <MessageSquareHeart className="size-4" />
                RSVP
              </Button>
              <Button type="button" size="sm" onClick={() => onGo("placement")} className="w-full">
                <Users className="size-4" />
                {d("Tamu")}
              </Button>
            </div>
          </div>
        </DashboardSurface>
      </section>
    </DashboardPageShell>
  );
}

export function RsvpWorkspace({
  events,
  selectedId,
  onSelect,
  selectedEvent,
  guests,
  loading,
  onRefresh,
  accent,
}: {
  events: DashboardEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  selectedEvent: DashboardEvent | null;
  guests: DashboardGuest[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  accent: string;
}) {
  const { d } = useDashboardI18n();
  return (
    <DashboardPageShell>
      <DashboardPageHeader title={d("RSVP")}>
        <EventScopePicker
          events={events}
          value={selectedId}
          onChange={onSelect}
          disabled={loading}
        />
      </DashboardPageHeader>
      {selectedEvent && (
        <div className="mt-4">
          {loading ? (
            <LoadingSurface />
          ) : (
            <RsvpAnalyticsPanel
              key={selectedEvent.id}
              guests={guests}
              slug={selectedEvent.slug}
              rsvpConfig={parseInvitationRsvpConfig(selectedEvent.templateKey ?? "")}
              accent={accent}
              embedded
              onRefresh={onRefresh}
            />
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}

export function PlacementWorkspace({
  events,
  selectedId,
  onSelect,
  selectedEvent,
  guests,
  tables,
  loading,
  accent,
  onRefresh,
}: {
  events: DashboardEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  selectedEvent: DashboardEvent | null;
  guests: DashboardGuest[];
  tables: DashboardTable[];
  loading: boolean;
  accent: string;
  onRefresh: () => Promise<void>;
}) {
  const { d } = useDashboardI18n();
  return (
    <DashboardPageShell>
      <DashboardPageHeader title={d("Pengaturan Meja")}>
        <EventScopePicker
          events={events}
          value={selectedId}
          onChange={onSelect}
          disabled={loading}
        />
      </DashboardPageHeader>
      {selectedEvent && (
        <div className="mt-4">
          {loading ? (
            <LoadingSurface />
          ) : (
            <PlacementPanel
              invitationId={selectedId}
              title={selectedEvent.title}
              guests={guests}
              tables={tables}
              accent={accent}
              onRefresh={onRefresh}
            />
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}

function PlacementPanel({
  invitationId,
  title,
  guests,
  tables,
  accent,
  onRefresh,
}: {
  invitationId: string;
  title: string;
  guests: DashboardGuest[];
  tables: DashboardTable[];
  accent: string;
  onRefresh: () => Promise<void>;
}) {
  const { d } = useDashboardI18n();
  const assigned = guests.filter((guest) => guest.tableId).length;

  const assignGuest = async (
    guestId: string,
    tableId: string,
    seatNumber: number,
  ) => {
    const response = await fetch(`/api/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ tableId, seatNumber }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || d("Penempatan tamu gagal disimpan."));
    }
    await onRefresh();
  };

  return (
    <div className="space-y-4">
        <DashboardSectionHeader
          title={d("Penempatan")}
          actions={
            <Button onClick={onRefresh} size="sm" title={d("Muat ulang data tamu dan meja")}>
              <RefreshCw className="h-4 w-4" />
              {d("Muat ulang")}
            </Button>
          }
        />
        <DashboardMetricGrid className="mt-4 xl:grid-cols-3">
          <DashboardMetricCard icon={Users} label={d("Tamu")} value={String(guests.length)} />
          <DashboardMetricCard icon={LayoutGrid} label={d("Meja")} value={String(tables.length)} />
          <DashboardMetricCard icon={CheckCircle2} label={d("Ditempatkan")} value={`${assigned} / ${guests.length}`} />
        </DashboardMetricGrid>
        <SeatingChart
          key={invitationId}
          invitationId={invitationId}
          title={title}
          guests={guests}
          tables={tables}
          accent={accent}
          onAssigned={assignGuest}
          onTablesChanged={onRefresh}
        />
    </div>
  );
}

function LoadingSurface() {
  const { d } = useDashboardI18n();
  return (
    <DashboardSurface className="p-5 font-[family-name:var(--font-undara-mono)] text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      {d("Memuat data acara...")}
    </DashboardSurface>
  );
}

export function UsherPanel({
  events,
  selectedId,
  onSelect,
  guests,
  onRefresh,
}: {
  events: DashboardEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  guests: DashboardGuest[];
  onRefresh: () => void | Promise<void>;
}) {
  const { d } = useDashboardI18n();
  const checked = guests.filter((guest) => guest.checkedIn).length;
  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title={d("Check-in")}
        actions={
          <>
            <Button type="button" onClick={onRefresh} size="sm" title={d("Muat ulang status check-in")}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {d("Muat ulang")}
            </Button>
            <Button asChild size="sm">
              <Link href={selectedId ? `/dashboard/usher?invitationId=${encodeURIComponent(selectedId)}` : "/dashboard/usher"}><QrCode className="size-4" aria-hidden="true" />{d("Buka Usher App")}</Link>
            </Button>
          </>
        }
      >
        <EventScopePicker events={events} value={selectedId} onChange={onSelect} />
      </DashboardPageHeader>
      <DashboardMetricGrid className="xl:grid-cols-2">
        <DashboardMetricCard icon={Users} label={d("Total tamu")} value={String(guests.length)} />
        <DashboardMetricCard icon={CheckCircle2} label={d("Check-in")} value={String(checked)} />
      </DashboardMetricGrid>
      <DashboardPanel className="mt-5" title={d("Daftar tamu")}>
        {guests.length === 0 ? (
          <DashboardEmptyState icon={Users} title={d("Belum ada tamu")} />
        ) : (
          <div className="grid gap-3">
            {guests.map((guest) => (
              <article key={guest.id} className="dc-dashboard-detail-card flex min-w-0 flex-col gap-3 rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <h3 className="dc-ui-name break-words text-base font-semibold text-foreground">{guest.name}</h3>
                  {guest.phone && <p className="mt-1 break-all text-sm text-muted-foreground">{guest.phone}</p>}
                  {(guest.category || guest.tags?.length || guest.invitedPax) && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {[guest.category || d("Reguler"), ...(guest.tags ?? []), guest.invitedPax ? `${guest.invitedPax} ${d("orang diundang")}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <DashboardStatusBadge active={guest.checkedIn}>
                  {guest.checkedIn ? d("Check-in") : d("Belum check-in")}
                </DashboardStatusBadge>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}
