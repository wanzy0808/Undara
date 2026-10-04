"use client";

import { useEffect, useRef, useState } from "react";
import {
  isStudioPreviewMessage, postStudioPreviewDraft, studioPreviewDeviceBounds,
  studioPreviewScale, studioPreviewViewports,
  STUDIO_PREVIEW_CLOSE, STUDIO_PREVIEW_PATH, STUDIO_PREVIEW_READY,
  type StudioPreviewDevice, type StudioPreviewSize, type StudioPreviewSnapshot,
} from "./studio-preview-viewport";
import styles from "./studio-preview-device.module.css";

export default function StudioPreviewViewport({ snapshot, device, locale, onClose }: {
  snapshot: StudioPreviewSnapshot;
  device: StudioPreviewDevice;
  locale: string;
  onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState<StudioPreviewSize>({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const en = locale === "en";
  const viewport = studioPreviewViewports[device];
  const bounds = studioPreviewDeviceBounds(device);
  const scale = studioPreviewScale(bounds, {
    width: Math.min(available.width, 1040),
    height: Math.min(available.height, 560),
  });

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
    <div ref={host} className={styles.viewport}>
      <div className={styles.display} style={{ width: bounds.width * scale, height: bounds.height * scale }}>
        <div className={styles.device} data-device={device} style={{ width: bounds.width, height: bounds.height, transform: `scale(${scale})` }}>
          <div className={styles.body} style={{ left: bounds.bodyLeft, width: bounds.bodyWidth, height: bounds.bodyHeight }}>
            <div className={styles.screen} style={{ left: bounds.screenLeft, top: bounds.screenTop, width: viewport.width, height: viewport.height }}>
              {(!ready || failed) && (
                <div className={styles.status} role={failed ? "alert" : "status"}>
                  {failed ? (en ? "Preview could not load. Refresh Studio and try again." : "Preview belum bisa dimuat. Refresh Studio lalu coba lagi.") : (en ? "Loading preview…" : "Memuat preview…")}
                </div>
              )}
              <iframe
                ref={frame}
                src={STUDIO_PREVIEW_PATH}
                title={en ? "Responsive invitation preview" : "Preview undangan responsif"}
                className={styles.iframe}
                width={viewport.width}
                height={viewport.height}
                style={{ width: viewport.width, height: viewport.height }}
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
          <div className={styles.base} aria-hidden="true" style={{ top: bounds.bodyHeight - 2, height: bounds.baseHeight }} />
        </div>
      </div>
    </div>
  );
}
