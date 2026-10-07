"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Eye,
  PenLine,
  Plus,
  RefreshCw,
  QrCode,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import InvitationQrPreview from "@/components/Dashboard/InvitationQrPreview";
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPage,
  DashboardPageHeader,
  DashboardStatusBadge,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";

type Invitation = {
  id: string;
  slug: string;
  type: "WEDDING" | "ADAT_AKAD";
  title: string;
  venue: string;
  templateKey: string;
  eventConfigured: boolean;
  isPublished: boolean;
  viewCount: number;
  accessPaid: boolean;
  createdAt: string;
};

type Guest = {
  id: string;
  invitationId: string;
  name: string;
  rsvpStatus: string;
  plusOnes: number;
  invitation?: { id: string; title: string; slug: string };
};

type Props = {
  onCreateSequence: () => void;
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_INVITATION_ROOT_DOMAIN || "dcwedding.com";

const responseLabel: Record<string, string> = {
  ATTENDING: "Hadir",
  NOT_ATTENDING: "Tidak hadir",
  TENTATIVE: "Ragu",
};

function sortInvitations(items: Invitation[]) {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function publicUrl(invitation: Invitation) {
  return `https://${invitation.slug}.${ROOT_DOMAIN}/`;
}

export default function InvitationWorkspacePanel({ onCreateSequence }: Props) {
  const { d, locale } = useDashboardI18n();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrOpenId, setQrOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invitationResponse, guestResponse] = await Promise.all([
        fetch("/api/invitations?all=1", { cache: "no-store" }),
        fetch("/api/guests?all=1", { cache: "no-store" }),
      ]);
      const invitationData = await invitationResponse.json().catch(() => null);
      const guestData = await guestResponse.json().catch(() => null);
      if (!invitationResponse.ok) {
        throw new Error(invitationData?.error || d("Undangan belum dapat dimuat."));
      }
      setInvitations(
        sortInvitations((invitationData?.invitations ?? []) as Invitation[]),
      );
      setGuests((guestData?.guests ?? []) as Guest[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Undangan belum dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function publishInvitation(invitation: Invitation) {
    if (invitation.isPublished) {
      setNotice(d("Undangan yang sudah terbit dikunci dan tidak dapat dikembalikan menjadi draft."));
      return;
    }
    if (!invitation.eventConfigured) {
      setNotice(d("Lengkapi dan simpan detail acara sebelum publish."));
      return;
    }
    if (!invitation.templateKey?.trim()) {
      setNotice(d("Pilih dan simpan template undangan sebelum publish."));
      return;
    }

    setBusyId(invitation.id);
    setNotice("");
    try {
      const response = await fetch("/api/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invitation.id, isPublished: true }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Undangan belum dapat dipublish."));
      setInvitations((current) =>
        current.map((item) =>
          item.id === invitation.id ? data.invitation : item,
        ),
      );
      setNotice(d("Undangan berhasil diterbitkan."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Undangan belum dapat dipublish."));
    } finally {
      setBusyId(null);
    }
  }

  const publishedCount = invitations.filter((item) => item.isPublished).length;
  const readyCount = invitations.filter((item) => item.eventConfigured).length;
  const openedCount = invitations.reduce(
    (sum, item) => sum + (item.viewCount || 0),
    0,
  );
  const responders = useMemo(
    () => guests.filter((guest) => guest.rsvpStatus && guest.rsvpStatus !== "PENDING"),
    [guests],
  );

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={d("Undangan Digital")}
        actions={<Button type="button" size="sm" onClick={onCreateSequence}><Plus className="size-4" />{d("Tambah acara")}</Button>}
      />
      {notice && <DashboardNotice className="mb-4">{notice}</DashboardNotice>}

      <DashboardMetricGrid>
        <Metric icon={Users} label={d("Total")} value={String(invitations.length)} />
        <Metric icon={CalendarDays} label={d("Siap desain")} value={String(readyCount)} />
        <Metric icon={Send} label={d("Dipublish")} value={String(publishedCount)} />
        <Metric icon={Eye} label={d("Total dibuka")} value={String(openedCount)} />
      </DashboardMetricGrid>

      <DashboardPanel className="mt-5"
          title={d("Daftar undangan")}
          actions={<Button type="button" size="sm" onClick={() => load()} disabled={loading} aria-label={d("Muat ulang")}><RefreshCw className="size-4" />{d("Muat ulang")}</Button>}
      >

        {invitations.length === 0 ? (
          <DashboardEmptyState
            className="mt-4"
            icon={CalendarDays}
            title={d("Belum ada acara")}
            description={d("Tambah acara untuk mulai mendesain undangan.")}
          />
        ) : (
          <div className="grid gap-3">
            {invitations.map((invitation) => {
              const title = displayTitleCase(invitation.title.trim() || d("Acara tanpa judul"));
              const hasDesign = Boolean(invitation.templateKey?.trim());
              const studioHref = `/dashboard/editor?type=${invitation.type}&invitationId=${encodeURIComponent(invitation.id)}`;
              const purchaseHref = `/packages?package=INVITATION_BASIC&invitationId=${encodeURIComponent(invitation.id)}`;
              const status = invitation.isPublished
                ? d("Terbit · terkunci")
                : !invitation.eventConfigured
                  ? d("Belum lengkap")
                  : hasDesign
                    ? d("Siap publish")
                    : d("Belum desain");
              return (
                <article key={invitation.id} className="undara-dashboard-detail-card rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="undara-ui-name break-words text-base font-semibold text-foreground">{title}</h3>
                      {invitation.venue && <p className="mt-1 truncate text-sm text-muted-foreground">{invitation.venue}</p>}
                    </div>
                    <DashboardStatusBadge active={invitation.isPublished}>{status}</DashboardStatusBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" aria-label={locale === "en" ? `${invitation.viewCount || 0} views` : `${invitation.viewCount || 0} kali dibuka`}>
                      <Eye className="size-4 text-primary" aria-hidden="true" />
                      <span className="tabular-nums">{invitation.viewCount || 0}</span>
                      {d("Dibuka")}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {invitation.eventConfigured ? (
                        <Button asChild size="sm"><Link href={studioHref} aria-label={`${hasDesign ? d("Edit undangan") : d("Buat undangan")} · ${title}`}><PenLine className="size-4" />{hasDesign ? d("Edit undangan") : d("Buat undangan")}</Link></Button>
                      ) : (
                        <Button type="button" size="sm" onClick={onCreateSequence}><CalendarDays className="size-4" />{d("Lengkapi acara")}</Button>
                      )}
                      {invitation.accessPaid && (
                        <Button
                          type="button"
                          size="sm"
                          aria-expanded={qrOpenId === invitation.id}
                          aria-controls={"invitation-qr-" + invitation.id}
                          onClick={() => {
                            setQrOpenId((current) => current === invitation.id ? null : invitation.id);
                          }}
                        >
                          <QrCode className="size-4" aria-hidden="true" />
                          {qrOpenId === invitation.id ? d("Tutup QR") : d("Buat QR")}
                        </Button>
                      )}
                      {invitation.isPublished ? (
                        <Button asChild size="sm"><a href={publicUrl(invitation)} target="_blank" rel="noopener noreferrer" aria-label={`${d("Buka publik")} · ${title}`}><ArrowUpRight className="size-4" />{d("Buka publik")}</a></Button>
                      ) : invitation.eventConfigured && hasDesign ? (
                        invitation.accessPaid ? (
                          <Button type="button" size="sm" disabled={loading || busyId === invitation.id} onClick={() => publishInvitation(invitation)}><Send className="size-4" />{busyId === invitation.id ? d("Menyimpan...") : d("Publish")}</Button>
                        ) : (
                          <Button asChild size="sm"><Link href={purchaseHref}><Send className="size-4" />{d("Beli paket & publish")}</Link></Button>
                        )
                      ) : null}
                    </div>
                  </div>
                  {invitation.accessPaid && qrOpenId === invitation.id && (
                    <div
                      id={"invitation-qr-" + invitation.id}
                      className="mt-4 border-t border-primary/15 pt-4"
                    >
                      <InvitationQrPreview invitationId={invitation.id} title={title} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel className="mt-5"
          title={d("Respons terbaru")}
          actions={<DashboardStatusBadge active>{responders.length} {d("respons")}</DashboardStatusBadge>}
      >

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {responders.length === 0 && (
            <DashboardEmptyState
              title={d("Belum ada respons")}
              description={d("Respons RSVP tamu akan muncul di sini setelah undangan mulai dibagikan.")}
            />
          )}
          {responders.map((guest) => (
            <div
              key={guest.id}
              className="undara-dashboard-detail-card flex flex-wrap items-center justify-between gap-3 rounded-tr-[22px] border border-primary/15 bg-primary/[0.025] px-4 py-3"
            >
              <div className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">
                  {guest.name}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {displayTitleCase(guest.invitation?.title || d("Acara tanpa judul"))}
                </span>
              </div>
              <span className="shrink-0 font-[family-name:var(--font-undara-mono)] text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {d(responseLabel[guest.rsvpStatus] || guest.rsvpStatus)} · {guest.plusOnes + 1} pax
              </span>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </DashboardPage>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Send; label: string; value: string }) {
  return <DashboardMetricCard icon={Icon} label={label} value={value} />;
}
