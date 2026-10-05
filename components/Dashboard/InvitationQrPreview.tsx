"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { invitationQrImageUrl } from "@/components/Dashboard/invitation-qr";

export default function InvitationQrPreview({
  invitationId,
  title,
}: {
  invitationId: string;
  title: string;
}) {
  const { d, locale } = useDashboardI18n();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const downloadLabel = <><Download className="size-4" aria-hidden="true" />{d("Download QR PNG")}</>;

  return (
    <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
      {status !== "error" && (
        <div className="w-60 max-w-full shrink-0 bg-white p-3">
          {/* The same-origin endpoint returns a private PNG, unsuitable for the image optimizer. */}
          <img
            key={attempt}
            src={invitationQrImageUrl(invitationId)}
            alt={`${d("QR Undangan")} · ${title}`}
            width={240}
            height={240}
            className="block aspect-square h-auto w-full"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </div>
      )}
      <div className="min-w-0 space-y-3">
        {status === "loading" && <p role="status" className="text-sm text-muted-foreground">{d("Memuat QR...")}</p>}
        {status === "error" ? (
          <>
            <p role="alert" className="text-sm text-foreground">{d("QR belum dapat dimuat.")}</p>
            <Button onClick={() => { setStatus("loading"); setAttempt((current) => current + 1); }}>
              <RefreshCw className="size-4" aria-hidden="true" />{d("Coba lagi")}
            </Button>
          </>
        ) : (
          <>
            {status === "ready" ? (
              <Button asChild>
                <a href={invitationQrImageUrl(invitationId, true, locale)} download>
                  {downloadLabel}
                </a>
              </Button>
            ) : <Button disabled>{downloadLabel}</Button>}
          </>
        )}
      </div>
    </div>
  );
}
