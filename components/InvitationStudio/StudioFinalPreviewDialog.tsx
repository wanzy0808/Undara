"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvitationPreview } from "@/components/InvitationStudio/InvitationPreview";
import type {
  InvitationDesignerInvitation,
  InvitationDesignState,
} from "@/components/InvitationStudio/designer-types";
import { invitationFonts, invitationPalettes } from "@/lib/templates/design";
import type { InvitationLanguage } from "@/lib/invitations/language";

export default function StudioFinalPreviewDialog({
  open,
  onOpenChange,
  invitation,
  design,
  designKey,
  musicUrl,
  eventTag,
  dressCode,
  locale,
  invitationLanguage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: InvitationDesignerInvitation | null;
  design: InvitationDesignState;
  designKey: string;
  musicUrl: string;
  eventTag: string;
  dressCode: string;
  locale: string;
  invitationLanguage: InvitationLanguage;
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const en = locale === "en";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[94dvh] w-[96vw] max-w-[1100px] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden p-4 sm:max-w-[1100px] sm:p-5">
        <DialogHeader className="pr-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle>{en ? "Final invitation preview" : "Preview hasil undangan"}</DialogTitle>
              <DialogDescription className="mt-1">
                {en
                  ? "This uses the current draft, including unsaved changes."
                  : "Menggunakan draft saat ini, termasuk yang belum disimpan."}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label={en ? "Preview viewport" : "Ukuran preview"}>
              <Button
                type="button"
                size="sm"
                variant={device === "mobile" ? "default" : "outline"}
                onClick={() => setDevice("mobile")}
                aria-pressed={device === "mobile"}
              >
                <Smartphone className="h-4 w-4" />
                {en ? "Mobile" : "HP"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "desktop" ? "default" : "outline"}
                onClick={() => setDevice("desktop")}
                aria-pressed={device === "desktop"}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-auto overscroll-contain rounded-[var(--undara-control-menu-radius)] border border-primary/25 bg-muted/25 p-3 sm:p-5">
          <div
            className={device === "mobile" ? "mx-auto w-[390px] max-w-full" : "mx-auto w-[760px] max-w-full"}
            data-studio-final-preview-device={device}
          >
            <InvitationPreview
              allowEnvelopeOpen
              invitationLanguage={invitationLanguage}
              previewRecipientLine={invitationLanguage === "EN" ? "Dear : Mr [Name] and Mrs [Name]" : "Kepada Yth : Bapak [Nama] dan Ibu [Nama]"}
              key={`${device}:${designKey}`}
              invitation={invitation}
              templateKey={design.template}
              palette={invitationPalettes[design.palette]}
              fontPair={invitationFonts[design.font]}
              decorUrl={design.decor}
              sections={design.sections}
              photoAssignments={design.photos}
              designKey={designKey}
              musicUrl={musicUrl}
              eventTag={eventTag}
              dressCode={dressCode}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
