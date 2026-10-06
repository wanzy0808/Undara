"use client";

import { createElement, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

function PrintReady({ children, onReady }: { children?: ReactNode; onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return children;
}

/** Render just the current private plan. Keep one frame until the next print/unmount,
 * because some browsers fire afterprint before their print preview closes. */
export async function printSeatingPlan(content: ReactNode, title: string, source = document, renderRoot = createRoot, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Print cancelled", "AbortError");
  const frame = source.createElement("iframe");
  frame.title = title; frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1100px;height:900px;border:0;";
  source.body.appendChild(frame);
  const target = frame.contentDocument, printer = frame.contentWindow;
  if (!target || !printer) { frame.remove(); throw new Error("Cetak belum dapat dibuka. Coba lagi."); }
  const rootNode = target.createElement("div"); target.body.appendChild(rootNode);
  let root: ReturnType<typeof createRoot> | undefined;
  let disposed = false;
  let cancelWait: (error: Error) => void = () => {};
  const cancellation = new Promise<never>((_, reject) => { cancelWait = reject; });
  const dispose = () => {
    if (disposed) return;
    disposed = true; signal?.removeEventListener("abort", cancel);
    try { root?.unmount(); } finally { frame.remove(); }
  };
  const cancel = () => { dispose(); cancelWait(new DOMException("Print cancelled", "AbortError")); };
  const wait = <T,>(pending: Promise<T>) => signal ? Promise.race([pending, cancellation]) : pending;
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    root = renderRoot(rootNode);
    target.title = title;
    const base = target.createElement("base"); base.href = source.baseURI; target.head.appendChild(base);
    const fontStyle = target.createElement("style");
    const fontRules: string[] = [];
    for (const sheet of Array.from(source.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule.type === 5) fontRules.push(rule.cssText.replace(/url\(["']?([^"')]+)["']?\)/g, (_, url) => `url("${new URL(url, sheet.href || source.baseURI).href}")`));
        }
      } catch { /* A cross-origin stylesheet cannot be inspected. */ }
    }
    fontStyle.textContent = fontRules.join("\n"); target.head.appendChild(fontStyle);
    target.body.style.fontFamily = source.defaultView?.getComputedStyle(source.body).fontFamily || "Roboto, sans-serif";
    const mountedRoot = root;
    await wait(new Promise<void>((resolve) => mountedRoot.render(createElement(PrintReady, { onReady: resolve }, content))));
    const logo = target.createElement("img"); logo.style.display = "none"; logo.src = new URL("/assets/brand/undara/logo.webp", source.baseURI).href; target.body.appendChild(logo);
    await wait(Promise.all([target.fonts?.ready, logo.decode()]));
    await wait(new Promise<void>((resolve) => printer.requestAnimationFrame(() => resolve())));
    if (signal?.aborted) throw new DOMException("Print cancelled", "AbortError");
    printer.focus(); printer.print();
    return dispose;
  } catch (error) {
    dispose();
    if (signal?.aborted) throw error;
    throw new Error("Cetak belum dapat dibuka. Coba lagi.");
  }
}
