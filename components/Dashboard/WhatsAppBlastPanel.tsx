"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, MessageCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import {
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardNotice,
  DashboardPage,
  DashboardPageHeader,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";
import { WaBlastAddRecipients, WaBlastRecipientQueue } from "@/components/Dashboard/WaBlastPanels";
import WaBlastTemplateStudio from "@/components/Dashboard/WaBlastTemplateStudio";
import type { WaBlastEvent, WaBlastGuest, WaBlastRecipient } from "@/components/Dashboard/wa-blast-types";

export default function WhatsAppBlastPanel({
  selectedEventId,
  onSelectEvent,
}: {
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}) {
  const { d } = useDashboardI18n();
  const [events, setEvents] = useState<WaBlastEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [guests, setGuests] = useState<WaBlastGuest[]>([]);
  const [selected, setSelected] = useState<WaBlastRecipient[]>([]);
  const [quota, setQuota] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [existingGuestId, setExistingGuestId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadEvents() {
    const response = await fetch("/api/invitations?all=1", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || d("Daftar acara belum dapat dimuat."));
    const available = ((data?.invitations ?? []) as WaBlastEvent[]).filter(
      (event) => event.eventConfigured && event.accessPaid,
    );
    setEvents(available);
    setEventId((current) => {
      if (selectedEventId && available.some((event) => event.id === selectedEventId)) {
        return selectedEventId;
      }
      return available.some((event) => event.id === current) ? current : available[0]?.id || "";
    });
  }

  async function loadEventData(targetId: string) {
    if (!targetId) {
      setGuests([]);
      setSelected([]);
      setQuota(0);
      setRemaining(0);
      return;
    }

    setBusy(true);
    try {
      const [queueResponse, guestResponse] = await Promise.all([
        fetch(`/api/wa-blast?invitationId=${encodeURIComponent(targetId)}`, {
          cache: "no-store",
        }),
        fetch(`/api/guests?invitationId=${encodeURIComponent(targetId)}`, {
          cache: "no-store",
        }),
      ]);
      const queueData = await queueResponse.json().catch(() => null);
      const guestData = await guestResponse.json().catch(() => null);
      if (!queueResponse.ok) throw new Error(queueData?.error || d("WA Blast belum dapat dimuat."));
      setQuota(queueData?.quota ?? 0);
      setRemaining(queueData?.remaining ?? 0);
      setSelected((queueData?.selected ?? []) as WaBlastRecipient[]);
      setGuests((guestData?.guests ?? []) as WaBlastGuest[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("WA Blast belum dapat dimuat."));
      setGuests([]);
      setSelected([]);
      setQuota(0);
      setRemaining(0);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setBusy(true);
    loadEvents()
      .catch((error) => {
        setNotice(error instanceof Error ? error.message : d("Daftar acara belum dapat dimuat."));
      })
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    if (selectedEventId && events.some((event) => event.id === selectedEventId)) {
      setEventId(selectedEventId);
    }
  }, [selectedEventId, events]);

  useEffect(() => {
    setExistingGuestId("");
    setNotice("");
    loadEventData(eventId).catch(() => undefined);
  }, [eventId]);

  const selectedIds = useMemo(() => new Set(selected.map((guest) => guest.id)), [selected]);
  const availableGuests = useMemo(
    () => guests.filter((guest) => guest.phone && !selectedIds.has(guest.id)),
    [guests, selectedIds],
  );
  const canAddRecipients = Boolean(eventId && quota > 0 && remaining > 0);

  async function purchaseAddon() {
    if (!eventId) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKey: "WA_BLAST_50", invitationId: eventId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Pesanan kuota belum dapat dibuat."));
      if (data?.invoiceUrl) window.location.href = data.invoiceUrl;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Pesanan kuota belum dapat dibuat."));
      setBusy(false);
    }
  }

  async function addExisting() {
    if (!existingGuestId || !eventId) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/wa-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: eventId, guestId: existingGuestId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Tamu belum dapat ditambahkan."));
      setExistingGuestId("");
      await loadEventData(eventId);
      setNotice(d("Tamu ditambahkan ke daftar WA Blast."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Tamu belum dapat ditambahkan."));
      setBusy(false);
    }
  }

  async function addNew() {
    if (!name.trim() || !phone.trim() || !eventId) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/wa-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: eventId,
          name: name.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Tamu belum dapat ditambahkan."));
      setName("");
      setPhone("");
      await loadEventData(eventId);
      setNotice(data?.reusedGuest
        ? d("Tamu yang sudah ada ditambahkan ke daftar WA Blast.")
        : d("Tamu baru ditambahkan ke daftar WA Blast."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Tamu belum dapat ditambahkan."));
      setBusy(false);
    }
  }

  async function removeGuest(id: string) {
    if (!eventId) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/wa-blast?invitationId=${encodeURIComponent(eventId)}&guestId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || d("Tamu belum dapat dihapus."));
      await loadEventData(eventId);
      setNotice(d("Tamu dihapus dari daftar WA Blast."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : d("Tamu belum dapat dihapus."));
      setBusy(false);
    }
  }

  return (
    <DashboardPage>
      {notice && <DashboardNotice className="mb-4">{notice}</DashboardNotice>}

      <DashboardPageHeader
          title={d("WA Blast")}
          actions={
            eventId && quota > 0 ? (
              <Button type="button" size="sm" onClick={purchaseAddon} disabled={busy}>
                <CreditCard className="h-4 w-4" />
                {d("Beli 50 quota · Rp75.000")}
              </Button>
            ) : null
          }
        >

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <FloatingField label={d("Undangan aktif")} className="block min-w-0 flex-1 sm:max-w-md">
            <select
              value={eventId}
              onChange={(event) => { setEventId(event.target.value); onSelectEvent(event.target.value); }}
              disabled={busy || events.length === 0}
              className="w-full px-3 text-sm outline-none"
              aria-label={d("Pilih acara untuk WA Blast")}
            >
              {events.length === 0 ? (
                <option value="">{displayTitleCase(d("Belum ada undangan aktif"))}</option>
              ) : (
                events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {displayTitleCase(event.title || d("Acara tanpa judul"))}
                  </option>
                ))
              )}
            </select>
          </FloatingField>

        </div>

        {events.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {d("Aktifkan minimal satu Undangan Digital untuk membeli kuota WA Blast.")}
          </p>
        )}
      </DashboardPageHeader>

      {eventId && (
        <>
          <DashboardMetricGrid className="mt-4 xl:grid-cols-3">
            <Metric icon={MessageCircle} label={d("Kuota")} value={String(quota)} />
            <Metric icon={Users} label={d("Dipilih")} value={String(selected.length)} />
            <Metric icon={Plus} label={d("Sisa")} value={String(remaining)} />
          </DashboardMetricGrid>

          <WaBlastTemplateStudio
            key={eventId}
            event={events.find((event) => event.id === eventId)!}
            recipients={selected}
          />

          {quota === 0 ? (
            <DashboardPanel className="mt-5"
                title={d("WA Blast belum aktif")}
                description={d("WA Blast tidak termasuk dalam harga Undangan Digital. Setiap pembelian menambah 50 kuota ke pilihan saat ini.")}
                actions={
                  <Button type="button" size="sm" onClick={purchaseAddon} disabled={busy}>
                    <CreditCard className="h-4 w-4" />
                    {d("Beli 50 quota · Rp75.000")}
                  </Button>
                }
            />
          ) : (
            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
              <WaBlastAddRecipients
                availableGuests={availableGuests}
                existingGuestId={existingGuestId}
                setExistingGuestId={setExistingGuestId}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                busy={busy}
                canAddRecipients={canAddRecipients}
                onAddExisting={addExisting}
                onAddNew={addNew}
              />
              <WaBlastRecipientQueue
                selected={selected}
                busy={busy}
                onReload={() => void loadEventData(eventId)}
                onRemove={(id) => void removeGuest(id)}
              />
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof MessageCircle; label: string; value: string }) {
  return <DashboardMetricCard icon={Icon} label={label} value={value} />;
}
