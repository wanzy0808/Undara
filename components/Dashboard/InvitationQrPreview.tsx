"use client";

import { FloatingField } from "@/components/ui/floating-field";

import { useEffect, useState } from "react";
import { ChevronDown, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { controlStyles } from "@/components/ui/control-styles";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { invitationQrGuestOptions, invitationQrImageUrl, type InvitationQrGuest } from "@/components/Dashboard/invitation-qr";

type InvitationQrPreviewProps = {
  invitationId: string;
  title: string;
};

export default function InvitationQrPreview(props: InvitationQrPreviewProps) {
  return <InvitationQrGuestPicker key={props.invitationId} {...props} />;
}

function InvitationQrGuestPicker({ invitationId, title }: InvitationQrPreviewProps) {
  const { d } = useDashboardI18n();
  const [guests, setGuests] = useState<InvitationQrGuest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const selected = guests.find((guest) => guest.id === selectedId);

  useEffect(() => {
    const controller = new AbortController();
    async function loadGuests() {
      try {
        const response = await fetch(`/api/guests?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data?.guests)) throw new Error("Guest list unavailable");
        if (!controller.signal.aborted) setGuests(invitationQrGuestOptions(data.guests, invitationId));
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadGuests();
    return () => controller.abort();
  }, [invitationId, attempt]);

  if (loading) return <p role="status" className="text-sm text-muted-foreground">{d("Memuat tamu...")}</p>;
  if (failed) return (
    <div className="space-y-3">
      <p role="alert" className="text-sm text-foreground">{d("Daftar tamu belum dapat dimuat.")}</p>
      <Button onClick={() => { setLoading(true); setFailed(false); setAttempt((current) => current + 1); }}>
        <RefreshCw className="size-4" aria-hidden="true" />{d("Coba lagi")}
      </Button>
    </div>
  );
  if (!guests.length) return <p className="text-sm text-muted-foreground">{d("Tambahkan tamu di Manajemen Tamu untuk membuat tiket masuk.")}</p>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <FloatingField label={d("Tamu")}>
          <select data-dc-native-chevron="true" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className={`${controlStyles.input} appearance-none pr-10`}>
            <option value="">{d("Pilih tamu")}</option>
            {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name}{guest.phone ? ` · ${guest.phone}` : ""}</option>)}
          </select>
        </FloatingField>
        <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+4px)] size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
      </div>
      {selected && <InvitationQrGuestCard invitationId={invitationId} title={title} guestId={selected.id} guestName={selected.name} />}
    </div>
  );
}

export function InvitationQrGuestCard(props: InvitationQrPreviewProps & { guestId: string; guestName: string }) {
  const { locale } = useDashboardI18n();
  // Reset image readiness and retry state when the displayed card changes.
  return <InvitationQrCardPreview key={`${props.invitationId}:${props.guestId}:${locale}`} {...props} />;
}

function InvitationQrCardPreview({ invitationId, title, guestId, guestName }: InvitationQrPreviewProps & { guestId: string; guestName: string }) {
  const { d, locale } = useDashboardI18n();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const downloadLabel = <><Download className="size-4" aria-hidden="true" />{d("Download QR PNG")}</>;

  return (
    <div className="flex min-w-0 flex-col items-center gap-4">
      {status !== "error" && (
        <div className="flex w-full max-w-md justify-center" aria-busy={status === "loading"}>
          {/* The same-origin endpoint returns a private PNG, unsuitable for the image optimizer. */}
          <img
            key={attempt}
            src={invitationQrImageUrl(invitationId, guestId, false, locale)}
            alt={`${d("QR tiket masuk")} · ${guestName} · ${title}`}
            width={900}
            height={1320}
            className="block h-auto max-h-[70dvh] w-auto max-w-full shadow-sm"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </div>
      )}
      <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center">
        {status === "loading" && <p role="status" className="text-sm text-muted-foreground">{d("Memuat QR...")}</p>}
        {status === "error" ? (
          <>
            <p role="alert" className="text-sm text-foreground">{d("QR belum dapat dimuat.")}</p>
            <Button className="w-full sm:w-auto" onClick={() => { setStatus("loading"); setAttempt((current) => current + 1); }}>
              <RefreshCw className="size-4" aria-hidden="true" />{d("Coba lagi")}
            </Button>
          </>
        ) : (
          <>
            {status === "ready" ? (
              <Button className="w-full sm:w-auto" asChild>
                <a href={invitationQrImageUrl(invitationId, guestId, true, locale)} download>
                  {downloadLabel}
                </a>
              </Button>
            ) : <Button className="w-full sm:w-auto" disabled>{downloadLabel}</Button>}
          </>
        )}
      </div>
    </div>
  );
}
