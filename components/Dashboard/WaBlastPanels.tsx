"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import {
  DashboardEmptyState,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";
import type { WaBlastGuest, WaBlastRecipient } from "@/components/Dashboard/wa-blast-types";

export function WaBlastAddRecipients({
  availableGuests,
  existingGuestId,
  setExistingGuestId,
  name,
  setName,
  phone,
  setPhone,
  busy,
  canAddRecipients,
  onAddExisting,
  onAddNew,
}: {
  availableGuests: WaBlastGuest[];
  existingGuestId: string;
  setExistingGuestId: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  busy: boolean;
  canAddRecipients: boolean;
  onAddExisting: () => void;
  onAddNew: () => void;
}) {
  const { d } = useDashboardI18n();

  return (
    <DashboardPanel
      title={d("Tambah penerima")}
    >
      <div className="undara-dashboard-detail-card rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] p-4">
        <p className="text-xs font-semibold text-foreground">{d("Dari daftar tamu")}</p>
        <FloatingField label={d("Pilih tamu")} className="mt-2">
          <select
            value={existingGuestId}
            onChange={(event) => setExistingGuestId(event.target.value)}
            className="mt-2 w-full px-3 text-sm"
            disabled={busy || !canAddRecipients}
          >
          <option value="">{displayTitleCase(d("Pilih tamu"))}</option>
          {availableGuests.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {displayTitleCase(guest.name)} · {guest.phone}
            </option>
          ))}
          </select>
        </FloatingField>
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full"
          disabled={!existingGuestId || busy || !canAddRecipients}
          onClick={onAddExisting}
        >
          <Plus className="h-4 w-4" />
          {d("Tambahkan penerima")}
        </Button>
      </div>

      <div className="undara-dashboard-detail-card rounded-tr-[22px] border border-border/70 bg-background p-3">
        <p className="text-xs font-semibold text-foreground">{d("Tamu belum ada")}</p>
        <div className="mt-2 space-y-2">
          <FloatingField label={d("Nama tamu")}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={d("Nama tamu")}
              disabled={busy || !canAddRecipients}
            />
          </FloatingField>
          <FloatingField label={d("Nomor WhatsApp")}>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={d("Nomor WhatsApp")}
              disabled={busy || !canAddRecipients}
            />
          </FloatingField>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!name.trim() || !phone.trim() || busy || !canAddRecipients}
            onClick={onAddNew}
          >
            <Plus className="h-4 w-4" />
            {d("Tambah tamu & penerima")}
          </Button>
        </div>
      </div>
    </DashboardPanel>
  );
}

export function WaBlastRecipientQueue({
  selected,
  busy,
  onReload,
  onRemove,
}: {
  selected: WaBlastRecipient[];
  busy: boolean;
  onReload: () => void;
  onRemove: (id: string) => void;
}) {
  const { d } = useDashboardI18n();

  return (
    <DashboardPanel
      title={d("Tamu yang akan diblast")}
      actions={
        <Button type="button" size="sm" onClick={onReload} disabled={busy}>
          <RefreshCw className="h-4 w-4" />
          {d("Muat ulang")}
        </Button>
      }
    >
      {selected.length === 0 ? (
        <DashboardEmptyState icon={Users} title={d("Belum ada penerima")} />
      ) : (
        <div className="grid gap-3">
          {selected.map((guest) => (
            <article key={guest.id} className="undara-dashboard-detail-card flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-tr-[22px] border border-primary/20 bg-primary/[0.025] px-4 py-3">
              <div className="min-w-0">
                <h3 className="break-words text-sm font-semibold text-foreground">{guest.name}</h3>
                <p className="mt-1 break-all text-sm text-muted-foreground">{guest.phone || d("Nomor belum ada")}</p>
                {(guest.category || guest.tags?.length || guest.invitedPax) && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {[guest.category || d("Reguler"), ...(guest.tags ?? []), guest.invitedPax ? `${guest.invitedPax} ${d("orang diundang")}` : ""].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="icon-sm"
                onClick={() => onRemove(guest.id)}
                disabled={busy}
                title={d("Hapus dari daftar WA Blast")}
                aria-label={`${d("Hapus")} ${guest.name} · WA Blast`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </article>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
