"use client";

import { useCallback, useMemo, useState } from "react";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import StudioPreviewViewport from "@/components/InvitationStudio/StudioPreviewViewport";
import type { StudioPreviewDevice } from "./studio-preview-viewport";
import type {
  InvitationDesignerInvitation,
  InvitationDesignState,
} from "@/components/InvitationStudio/designer-types";
import type { InvitationLanguage } from "@/lib/invitations/language";

const deviceButtonClassName = "min-h-10 px-2 text-xs shadow-none hover:translate-y-0 hover:shadow-none active:shadow-none aria-[pressed=false]:border-transparent aria-[pressed=false]:bg-transparent aria-[pressed=false]:text-primary aria-[pressed=false]:hover:bg-primary/10 sm:px-3 sm:text-sm";

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
  const [device, setDevice] = useState<StudioPreviewDevice>("mobile");
  const en = locale === "en";
  const snapshot = useMemo(() => ({
    invitation,
    design: { template: design.template, palette: design.palette, font: design.font, decor: design.decor, sections: design.sections, photos: design.photos },
    designKey, musicUrl, eventTag, dressCode, invitationLanguage,
  }), [invitation, design, designKey, musicUrl, eventTag, dressCode, invitationLanguage]);
  const closePreview = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="pointer-events-none h-dvh w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-none bg-transparent p-4 text-foreground ring-0 sm:max-w-none sm:p-6"
        overlayClassName="bg-black/70 supports-backdrop-filter:backdrop-blur-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{en ? "Invitation preview" : "Preview undangan"}</DialogTitle>
        <div className="pointer-events-auto grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2">
          <span aria-hidden="true" />
          <div
            className="flex min-w-0 items-center justify-self-center gap-1 rounded-[var(--undara-control-radius)] border border-primary/40 bg-background p-1 shadow-sm"
            role="group"
            aria-label={en ? "Preview device" : "Perangkat preview"}
          >
            <Button type="button" size="sm" className={deviceButtonClassName} onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"}>
              <Monitor className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              Desktop
            </Button>
            <Button type="button" size="sm" className={deviceButtonClassName} onClick={() => setDevice("tablet")} aria-pressed={device === "tablet"}>
              <Tablet className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              Tablet
            </Button>
            <Button type="button" size="sm" className={deviceButtonClassName} onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"}>
              <Smartphone className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              {en ? "Mobile" : "HP"}
            </Button>
          </div>
          <DialogClose render={<Button type="button" size="icon" className="h-10 w-10" />} aria-label={en ? "Close preview" : "Tutup preview"}>
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="min-h-0 min-w-0 p-2 sm:p-4" data-studio-final-preview-device={device}>
          {open && <StudioPreviewViewport snapshot={snapshot} device={device} locale={locale} onClose={closePreview} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
