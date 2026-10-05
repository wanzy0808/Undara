"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, QrCode, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { controlStyles } from "@/components/ui/control-styles";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import InvitationQrPreview from "@/components/Dashboard/InvitationQrPreview";
import { accessibleInvitationQrOptions, type InvitationQrOption } from "@/components/Dashboard/invitation-qr";
import { displayTitleCase } from "@/lib/text/display-title-case";

export default function InvitationQrMenu({ onManageInvitations }: { onManageInvitations: () => void }) {
  const { d } = useDashboardI18n();
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<InvitationQrOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const selected = invitations.find((invitation) => invitation.id === selectedId);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function loadInvitations() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setFailed(false);
    setSelectedId("");
    setInvitations([]);
    try {
      const response = await fetch("/api/invitations?all=1", { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data?.invitations)) throw new Error("Invitation list unavailable");
      if (!controller.signal.aborted) setInvitations(accessibleInvitationQrOptions(data.invitations));
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) void loadInvitations();
    else requestRef.current?.abort();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="lg" className="dc-dashboard-overview-cta" />}>
        <QrCode className="size-4" aria-hidden="true" />{d("QR Undangan")}
      </DialogTrigger>
      <DialogContent showCloseButton={false} overlayClassName="z-[100]" className="z-[101] max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="sticky top-0 z-10 -mx-6 -mt-6 flex-row items-center justify-between gap-4 bg-popover px-6 py-4">
          <DialogTitle className="font-[family-name:var(--font-undara-heading)] text-xl font-semibold text-primary">{d("QR Undangan")}</DialogTitle>
          <DialogClose render={<Button size="icon-sm" className="shrink-0" aria-label={d("Tutup QR")} />}>
            <X className="size-4" aria-hidden="true" />
          </DialogClose>
        </DialogHeader>
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">{d("Memuat...")}</p>
        ) : failed ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-foreground">{d("Undangan belum dapat dimuat.")}</p>
            <Button onClick={() => void loadInvitations()}><RefreshCw className="size-4" aria-hidden="true" />{d("Coba lagi")}</Button>
          </div>
        ) : !invitations.length ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">{d("Aktifkan akses Undangan Digital untuk melihat QR.")}</p>
            <Button onClick={() => { changeOpen(false); onManageInvitations(); }}>{d("Lihat undangan")}</Button>
          </div>
        ) : (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">{d("Undangan")}</span>
              <span className="relative block">
                <select
                  data-dc-native-chevron="true"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className={`${controlStyles.input} appearance-none pr-10`}
                >
                  <option value="">{d("Pilih undangan")}</option>
                  {invitations.map((invitation) => (
                    <option key={invitation.id} value={invitation.id}>
                      {displayTitleCase(invitation.title.trim() || d("Acara tanpa judul"))}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              </span>
            </label>
            {selected && <InvitationQrPreview key={selected.id} invitationId={selected.id} title={selected.title} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
