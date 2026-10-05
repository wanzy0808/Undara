"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { Lock, RotateCcw, RotateCw } from "lucide-react";
import { observeStudioNativeTarget } from "./studio-native-target";
import { resizeNativeVisual, type NativeResizeHandle } from "@/lib/templates/native-visual-resize";
import {
  defaultNativeVisualTransform, nativeVisualSelector, nativeVisualUsesSystemContent,
  type NativeVisualTransform,
} from "@/lib/templates/native-visual-transforms";

type Handle = "move" | "rotate" | NativeResizeHandle;
type Box = { left: number; top: number; width: number; height: number };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

export default function StudioNativeTransformHandles({
  canvasRef, targetKey, transform, zoom, revision, onCommit, locked = false, disabled = false,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  targetKey: string | null;
  transform?: NativeVisualTransform;
  zoom: number;
  revision: string;
  onCommit: (key: string, value: NativeVisualTransform) => void;
  locked?: boolean;
  disabled?: boolean;
}) {
  const [box, setBox] = useState<Box | null>(null);
  const gesture = useRef<{
    pointer: number; handle: Handle; startX: number; startY: number;
    start: NativeVisualTransform; rect: DOMRect; node: HTMLElement;
    scrollLeft: number; scrollTop: number; initialAngle: number; moved: boolean;
  } | null>(null);

  const target = useCallback(() => {
    const selector = targetKey && nativeVisualSelector(targetKey);
    return selector ? canvasRef.current?.querySelector<HTMLElement>(`.undara-studio-preview-surface ${selector}`) ?? null : null;
  }, [canvasRef, targetKey]);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const node = target();
    if (!canvas || !node) { setBox(null); return; }
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height || transform?.hidden) { setBox(null); return; }
    const origin = canvas.getBoundingClientRect();
    setBox({
      left: rect.left - origin.left + canvas.scrollLeft,
      top: rect.top - origin.top + canvas.scrollTop,
      width: rect.width,
      height: rect.height,
    });
  }, [canvasRef, target, transform?.hidden]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const selector = targetKey && nativeVisualSelector(targetKey);
    if (!canvas || !selector) return;
    return observeStudioNativeTarget(canvas, `.undara-studio-preview-surface ${selector}`, measure);
  // The revision and transform trigger a remeasure when the renderer changes.
  }, [canvasRef, targetKey, measure, zoom, revision, transform?.x, transform?.y, transform?.scaleX, transform?.scaleY, transform?.rotation, transform?.hidden]);

  function apply(node: HTMLElement, next: NativeVisualTransform) {
    node.style.translate = `${next.x}% ${next.y}%`;
    node.style.rotate = `${next.rotation}deg`;
    node.style.scale = `${next.scaleX} ${next.scaleY}`;
  }

  function clear(node: HTMLElement) {
    node.style.removeProperty("translate");
    node.style.removeProperty("rotate");
    node.style.removeProperty("scale");
  }

  function calculate(event: PointerEvent<HTMLElement>) {
    const drag = gesture.current;
    if (!drag) return null;
    const canvas = canvasRef.current;
    const dx = event.clientX - drag.startX + ((canvas?.scrollLeft ?? drag.scrollLeft) - drag.scrollLeft);
    const dy = event.clientY - drag.startY + ((canvas?.scrollTop ?? drag.scrollTop) - drag.scrollTop);
    const start = drag.start;
    if (drag.handle === "move") return {
      ...start,
      x: round(clamp(start.x + dx / Math.max(1, drag.node.offsetWidth * zoom) * 100, -2000, 2000)),
      y: round(clamp(start.y + dy / Math.max(1, drag.node.offsetHeight * zoom) * 100, -2000, 2000)),
    };
    if (drag.handle === "rotate") {
      const angle = Math.atan2(event.clientY - drag.rect.top - drag.rect.height / 2,
        event.clientX - drag.rect.left - drag.rect.width / 2);
      let rotation = start.rotation + (angle - drag.initialAngle) * 180 / Math.PI;
      while (rotation > 180) rotation -= 360;
      while (rotation < -180) rotation += 360;
      return { ...start, rotation: round(rotation) };
    }
    return resizeNativeVisual(start, drag.handle, drag.node.offsetWidth * zoom, drag.node.offsetHeight * zoom, dx, dy);
  }

  function begin(event: PointerEvent<HTMLButtonElement>, handle: Handle) {
    if (!targetKey || locked || disabled || event.button !== 0 || gesture.current) return;
    if (canvasRef.current?.dataset.spacePan === "true") return;
    const node = target();
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    canvasRef.current?.focus({ preventScroll: true });
    const rect = node.getBoundingClientRect();
    gesture.current = {
      pointer: event.pointerId, handle, startX: event.clientX, startY: event.clientY,
      start: { ...defaultNativeVisualTransform, ...transform }, rect, node,
      scrollLeft: canvasRef.current?.scrollLeft ?? 0,
      scrollTop: canvasRef.current?.scrollTop ?? 0,
      initialAngle: Math.atan2(event.clientY - rect.top - rect.height / 2,
        event.clientX - rect.left - rect.width / 2),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (locked || disabled) { end(event, true); return; }
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 2) drag.moved = true;
    const canvas = canvasRef.current;
    const viewport = canvas?.getBoundingClientRect();
    if (canvas && viewport) {
      if (event.clientY > viewport.bottom - 42) canvas.scrollTop += 14;
      else if (event.clientY < viewport.top + 42) canvas.scrollTop -= 14;
      if (event.clientX > viewport.right - 42) canvas.scrollLeft += 14;
      else if (event.clientX < viewport.left + 42) canvas.scrollLeft -= 14;
    }
    const next = calculate(event);
    if (!next) return;
    apply(drag.node, next);
    measure();
  }

  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    const next = calculate(event);
    gesture.current = null;
    if (!cancelled && !locked && !disabled && drag.moved && next && targetKey) onCommit(targetKey, next);
    requestAnimationFrame(() => { clear(drag.node); measure(); });
  }

  if (!box || !targetKey) return null;
  const handles = ["top-left", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left"] as const;
  return (
    <div className="undara-studio-native-transform" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      aria-label="Transformasi elemen bawaan">
      {(locked || nativeVisualUsesSystemContent(targetKey)) && (
        <span className="undara-studio-native-content-lock" title={locked ? "Elemen dikunci" : "Isi dari data acara terkunci; styling tetap editable"} aria-label={locked ? "Elemen dikunci" : "Isi data acara terkunci"}>
          <Lock size={12} />
        </span>
      )}
      {!locked && <>
      <button type="button" disabled={disabled} className="undara-studio-native-move" aria-label="Geser elemen" title="Tarik untuk menggeser"
        onPointerDown={(event) => begin(event, "move")} onPointerMove={move} onPointerUp={end}
        onPointerCancel={(event) => end(event, true)} onLostPointerCapture={(event) => end(event, true)} />
      {handles.map((handle) => (
        <button key={handle} type="button" disabled={disabled} className={`undara-studio-native-handle undara-studio-native-handle--${handle}`}
          aria-label={`Ubah ukuran dari ${handle}`} title={`Tarik untuk mengubah ukuran dari ${handle}`}
          onPointerDown={(event) => begin(event, handle)} onPointerMove={move} onPointerUp={end}
          onPointerCancel={(event) => end(event, true)} onLostPointerCapture={(event) => end(event, true)} />
      ))}
      {transform && <button type="button" disabled={disabled} className="undara-studio-native-reset" aria-label="Reset posisi ukuran dan rotasi elemen"
        title="Reset transformasi" onClick={(event) => { event.stopPropagation(); onCommit(targetKey, { ...transform, ...defaultNativeVisualTransform }); canvasRef.current?.focus({ preventScroll: true }); }}>
        <RotateCcw size={14} />
      </button>}
      <button type="button" disabled={disabled} className="undara-studio-native-rotate" aria-label="Putar elemen"
        title="Tarik untuk memutar" onPointerDown={(event) => begin(event, "rotate")}
        onPointerMove={move} onPointerUp={end} onPointerCancel={(event) => end(event, true)} onLostPointerCapture={(event) => end(event, true)}>
        <RotateCw size={15} />
      </button>
      </>}
    </div>
  );
}
