"use client";

import { useCallback, useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StudioPreviewViewport from "@/components/InvitationStudio/StudioPreviewViewport";
import { studioPreviewDimension, studioPreviewViewports, type StudioPreviewSize } from "./studio-preview-viewport";
import type {
  InvitationDesignerInvitation,
  InvitationDesignState,
} from "@/components/InvitationStudio/designer-types";
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
  const [viewport, setViewport] = useState<StudioPreviewSize>(studioPreviewViewports.mobile);
  const [fit, setFit] = useState(true);
  const en = locale === "en";
  const snapshot = useMemo(() => ({
    invitation,
    design: { template: design.template, palette: design.palette, font: design.font, decor: design.decor, sections: design.sections, photos: design.photos },
    designKey, musicUrl, eventTag, dressCode, invitationLanguage,
  }), [invitation, design, designKey, musicUrl, eventTag, dressCode, invitationLanguage]);
  const closePreview = useCallback(() => onOpenChange(false), [onOpenChange]);

  function selectDevice(next: "mobile" | "desktop") {
    setDevice(next);
    setViewport(studioPreviewViewports[next]);
  }

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
                onClick={() => selectDevice("mobile")}
                aria-pressed={device === "mobile"}
              >
                <Smartphone className="h-4 w-4" />
                {en ? "Mobile" : "HP"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "desktop" ? "default" : "outline"}
                onClick={() => selectDevice("desktop")}
                aria-pressed={device === "desktop"}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-sm">
            <Input
              key={`width:${viewport.width}`}
              type="number"
              inputMode="numeric"
              aria-label={en ? "Preview width in pixels" : "Lebar preview dalam pixel"}
              min={240}
              max={3840}
              defaultValue={viewport.width}
              className="h-10 w-20 tabular-nums"
              onBlur={(event) => {
                const width = studioPreviewDimension(event.currentTarget.value, viewport.width);
                event.currentTarget.value = String(width);
                setViewport((size) => ({ ...size, width }));
              }}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
            <span aria-hidden="true">×</span>
            <Input
              key={`height:${viewport.height}`}
              type="number"
              inputMode="numeric"
              aria-label={en ? "Preview height in pixels" : "Tinggi preview dalam pixel"}
              min={240}
              max={3840}
              defaultValue={viewport.height}
              className="h-10 w-20 tabular-nums"
              onBlur={(event) => {
                const height = studioPreviewDimension(event.currentTarget.value, viewport.height);
                event.currentTarget.value = String(height);
                setViewport((size) => ({ ...size, height }));
              }}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
            <span className="text-muted-foreground">px</span>
            <div className="ml-auto flex gap-2" role="group" aria-label={en ? "Preview zoom" : "Zoom preview"}>
              <Button type="button" size="sm" variant={fit ? "default" : "outline"} onClick={() => setFit(true)} aria-pressed={fit}>Fit</Button>
              <Button type="button" size="sm" variant={fit ? "outline" : "default"} onClick={() => setFit(false)} aria-pressed={!fit}>100%</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 rounded-[var(--undara-control-menu-radius)] border border-primary/25 bg-muted/25 p-3 sm:p-5" data-studio-final-preview-device={device}>
          {open && <StudioPreviewViewport snapshot={snapshot} viewport={viewport} fit={fit} locale={locale} onClose={closePreview} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
