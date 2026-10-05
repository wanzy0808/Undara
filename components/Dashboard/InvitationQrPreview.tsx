"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { invitationQrImageUrl } from "@/components/Dashboard/invitation-qr";

type InvitationQrPreviewProps = {
  invitationId: string;
  title: string;
};

export default function InvitationQrPreview(props: InvitationQrPreviewProps) {
  const { locale } = useDashboardI18n();
  // Reset image readiness and retry state when the displayed card changes.
  return <InvitationQrCardPreview key={`${props.invitationId}:${locale}`} {...props} />;
}

function InvitationQrCardPreview({ invitationId, title }: InvitationQrPreviewProps) {
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
            src={invitationQrImageUrl(invitationId, false, locale)}
            alt={`${d("QR Undangan")} · ${title}`}
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
                <a href={invitationQrImageUrl(invitationId, true, locale)} download>
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
