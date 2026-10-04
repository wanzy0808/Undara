"use client";

import { useEffect, useRef, useState } from "react";
import {
  isStudioPreviewMessage, postStudioPreviewDraft, studioPreviewScale,
  STUDIO_PREVIEW_CLOSE, STUDIO_PREVIEW_PATH, STUDIO_PREVIEW_READY,
  type StudioPreviewSize, type StudioPreviewSnapshot,
} from "./studio-preview-viewport";

export default function StudioPreviewViewport({ snapshot, viewport, fit, locale, onClose }: {
  snapshot: StudioPreviewSnapshot;
  viewport: StudioPreviewSize;
  fit: boolean;
  locale: string;
  onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState<StudioPreviewSize>({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const en = locale === "en";
  const scale = studioPreviewScale(viewport, available, fit);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setAvailable({ width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const origin = window.location.origin;
    function receive(event: MessageEvent) {
      const target = frame.current?.contentWindow ?? null;
      if (isStudioPreviewMessage(event, target, origin, STUDIO_PREVIEW_READY)) {
        setReady(true);
        postStudioPreviewDraft(target, snapshot, origin);
      } else if (isStudioPreviewMessage(event, target, origin, STUDIO_PREVIEW_CLOSE)) {
        onClose();
      }
    }
    window.addEventListener("message", receive);
    postStudioPreviewDraft(frame.current?.contentWindow ?? null, snapshot, origin);
    return () => window.removeEventListener("message", receive);
  }, [snapshot, onClose]);

  return (
    <div ref={host} className="relative h-full w-full overflow-auto overscroll-contain">
      {(!ready || failed) && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-background/90 p-4 text-center text-sm text-muted-foreground" role={failed ? "alert" : "status"}>
          {failed ? (en ? "Preview could not load. Refresh Studio and try again." : "Preview belum bisa dimuat. Refresh Studio lalu coba lagi.") : (en ? "Loading preview…" : "Memuat preview…")}
        </div>
      )}
      <div className="relative mx-auto overflow-hidden rounded-sm bg-background shadow-sm" style={{ width: viewport.width * scale, height: viewport.height * scale }}>
        <iframe
          ref={frame}
          src={STUDIO_PREVIEW_PATH}
          title={en ? "Responsive invitation preview" : "Preview undangan responsif"}
          className="absolute left-0 top-0 block border-0"
          width={viewport.width}
          height={viewport.height}
          style={{ width: viewport.width, height: viewport.height, transform: `scale(${scale})`, transformOrigin: "top left" }}
          onLoad={() => {
            const target = frame.current?.contentWindow;
            try {
              setFailed(target?.location.pathname !== STUDIO_PREVIEW_PATH);
              postStudioPreviewDraft(target ?? null, snapshot, window.location.origin);
            } catch {
              setFailed(true);
            }
          }}
        />
      </div>
    </div>
  );
}
