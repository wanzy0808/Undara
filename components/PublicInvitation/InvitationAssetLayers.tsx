"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Lock, RotateCw } from "lucide-react";
import { type InvitationAssetLayer, type StudioObjectSection } from "@/lib/templates/asset-layers";
import { findSectionAt } from "@/components/InvitationStudio/studio-canvas-dom";
import InvitationFonts from "@/components/PublicInvitation/InvitationFonts";
import { invitationFontFamily } from "@/lib/templates/presentation";
import { resizeObjectFromHandle, type ObjectResizeHandle } from "@/lib/templates/object-resize";
import { useInvitationLayerAnimation } from "@/components/PublicInvitation/use-layer-animation";
import InvitationLayerTextContent from "@/components/PublicInvitation/InvitationLayerTextContent";
import InvitationColorFilters from "@/components/PublicInvitation/InvitationColorFilters";
import { invitationColorFilterCss } from "@/lib/templates/visual-colors";

/** Overlay geometry is relative to its owning invitation section, not the Studio viewport. */
type LayerPatch = Partial<InvitationAssetLayer>;
type GuideState = { x?: number; y?: number };
type Props = {
  layers: InvitationAssetLayer[];
  section?: StudioObjectSection;
  sectionInstanceId?: string;
  editable?: boolean;
  editorMode?: "template" | "customer";
  selectedId?: string | null;
  selectedIds?: string[];
  onSelect?: (id: string, additive?: boolean) => void;
  onUpdate?: (id: string, patch: LayerPatch) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;
function layerShadowFilter(layer: InvitationAssetLayer) {
  const opacity = layer.shadowOpacity ?? 0;
  if (opacity <= 0) return undefined;
  const hex = (layer.shadowColor ?? "#000000").replace("#", "");
  const value = Number.parseInt(hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `drop-shadow(${layer.shadowX ?? 0}px ${layer.shadowY ?? 8}px ${layer.shadowBlur ?? 18}px rgba(${red}, ${green}, ${blue}, ${opacity}))`;
}

function EditableLayer({
  layer, selected, section, sectionInstanceId, editable, siblings, onSelect, onUpdate, onCycleSelect, onGuides,
}: {
  layer: InvitationAssetLayer;
  selected: boolean;
  section: StudioObjectSection;
  sectionInstanceId: string;
  editable: boolean;
  siblings: InvitationAssetLayer[];
  onSelect?: Props["onSelect"];
  onUpdate?: Props["onUpdate"];
  onCycleSelect?: (id: string, clientX: number, clientY: number) => void;
  onGuides?: (guides: GuideState) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<HTMLSpanElement>(null);
  const textEditor = useRef<HTMLSpanElement>(null);
  const textDraft = useRef(layer.text ?? "");
  const [editingText, setEditingText] = useState(false);
  const gesture = useRef<{
    pointer: number; mode: "move" | "resize" | "rotate"; handle?: ObjectResizeHandle; objectWidth: number; objectHeight: number;
    startX: number; startY: number; x: number; y: number; width: number; height: number; rotation: number;
    rect: DOMRect; centerX: number; centerY: number; grabOffsetX: number; grabOffsetY: number;
    initialAngle: number; moved: boolean; additive: boolean;
  } | null>(null);
  const [live, setLive] = useState<LayerPatch>({});
  useEffect(() => { setLive({}); }, [layer.x, layer.y, layer.width, layer.height, layer.rotation, layer.section, layer.sectionInstanceId]);
  useEffect(() => {
    if (!editingText) textDraft.current = layer.text ?? "";
  }, [editingText, layer.text]);
  useEffect(() => {
    if (!editingText || !textEditor.current) return;
    const node = textEditor.current;
    node.focus({ preventScroll: true });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editingText]);
  useEffect(() => {
    if (!selected && editingText) setEditingText(false);
  }, [selected, editingText]);
  const displayed = { ...layer, ...live };
  const shadowFilter = layerShadowFilter(layer);
  useInvitationLayerAnimation(motion, layer);

  function begin(event: PointerEvent<HTMLElement>, mode: "move" | "resize" | "rotate", handle?: ObjectResizeHandle) {
    if (editingText || gesture.current) return;
    if (event.currentTarget.closest<HTMLElement>('.undara-studio-canvas-scroll[data-space-pan="true"], .dc-studio-canvas-scroll[data-space-pan="true"]')) return;
    if (!editable || !root.current || event.button !== 0) return;
    event.stopPropagation();
    onSelect?.(layer.id, event.shiftKey);
    if (layer.locked || !onUpdate) return;
    event.preventDefault();
    const sectionRect = root.current.parentElement?.getBoundingClientRect();
    if (!sectionRect?.width || !sectionRect.height) return;
    const bounds = root.current.getBoundingClientRect();
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    const naturalSectionWidth = root.current.parentElement?.offsetWidth ?? sectionRect.width;
    const height = layer.height ?? root.current.offsetHeight / Math.max(1, naturalSectionWidth) * 100;
    gesture.current = {
      pointer: event.pointerId, mode, handle,
      objectWidth: Math.max(1, sectionRect.width * layer.width / 100),
      objectHeight: Math.max(1, sectionRect.width * height / 100),
      startX: event.clientX, startY: event.clientY,
      x: layer.x, y: layer.y, width: layer.width, height, rotation: layer.rotation ?? 0,
      rect: sectionRect, centerX: cx, centerY: cy,
      grabOffsetX: event.clientX - cx, grabOffsetY: event.clientY - cy,
      initialAngle: Math.atan2(event.clientY - cy, event.clientX - cx),
      moved: false, additive: event.shiftKey,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function calculate(event: PointerEvent<HTMLElement>): LayerPatch {
    const drag = gesture.current;
    if (!drag) return {};
    if (drag.mode === "resize") {
      onGuides?.({});
      return resizeObjectFromHandle({
        handle: drag.handle ?? "bottom-right",
        x: drag.x, y: drag.y, width: drag.width, height: drag.height,
        rotation: drag.rotation, sectionWidth: drag.rect.width,
        sectionHeight: drag.rect.height, objectWidth: drag.objectWidth,
        objectHeight: drag.objectHeight,
      }, event.clientX - drag.startX, event.clientY - drag.startY);
    }
    if (drag.mode === "rotate") {
      onGuides?.({});
      const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX);
      let next = drag.rotation + (angle - drag.initialAngle) * 180 / Math.PI;
      while (next > 180) next -= 360;
      while (next < -180) next += 360;
      return { rotation: round(next) };
    }
    const destination = root.current && findSectionAt(event.clientX, event.clientY, root.current);
    // The section can move underneath the pointer while Studio auto-scrolls. Always read
    // fresh bounds instead of reusing the rectangle captured at pointer-down.
    const owningSection = root.current?.closest<HTMLElement>("[data-invitation-section]");
    const rect = destination?.rect ?? owningSection?.getBoundingClientRect() ?? drag.rect;
    const rawX = clamp((event.clientX - drag.grabOffsetX - rect.left) / rect.width * 100, 0, 100);
    const rawY = clamp((event.clientY - drag.grabOffsetY - rect.top) / rect.height * 100, 0, 100);

    const bounds = root.current?.getBoundingClientRect();
    const halfX = bounds?.width && rect.width ? bounds.width / rect.width * 50 : 0;
    const halfY = bounds?.height && rect.height ? bounds.height / rect.height * 50 : 0;
    const sameSection = !destination || (destination.section === section && destination.instanceId === sectionInstanceId);
    const xCandidates = [
      ...(halfX ? [{ target: halfX, guide: 0 }, { target: 100 - halfX, guide: 100 }] : []),
      { target: 50, guide: 50 },
      ...(sameSection ? siblings.filter((item) => item.id !== layer.id && !item.hidden).map((item) => ({ target: item.x, guide: item.x })) : []),
    ];
    const yCandidates = [
      ...(halfY ? [{ target: halfY, guide: 0 }, { target: 100 - halfY, guide: 100 }] : []),
      { target: 50, guide: 50 },
      ...(sameSection ? siblings.filter((item) => item.id !== layer.id && !item.hidden).map((item) => ({ target: item.y, guide: item.y })) : []),
    ];
    const snap = (value: number, candidates: { target: number; guide: number }[]) => {
      let best: { value: number; guide?: number; distance: number } = { value, distance: 1.4 };
      for (const candidate of candidates) {
        const distance = Math.abs(candidate.target - value);
        if (distance <= best.distance) best = { value: candidate.target, guide: candidate.guide, distance };
      }
      return best;
    };
    const snappedX = snap(rawX, xCandidates);
    const snappedY = snap(rawY, yCandidates);
    onGuides?.({ x: snappedX.guide, y: snappedY.guide });
    return {
      x: round(clamp(snappedX.value, 0, 100)),
      y: round(clamp(snappedY.value, 0, 100)),
      ...(destination && (destination.section !== section || destination.instanceId !== sectionInstanceId)
        ? { section: destination.section, sectionInstanceId: destination.instanceId } : {}),
    };
  }

  function move(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - gesture.current.startX, event.clientY - gesture.current.startY) > 3) {
      gesture.current.moved = true;
    }
    if (gesture.current.mode === "move") {
      const scroller = root.current?.closest<HTMLElement>(".undara-studio-canvas-scroll, .dc-studio-canvas-scroll");
      const viewport = scroller?.getBoundingClientRect();
      if (scroller && viewport) {
        if (event.clientY > viewport.bottom - 42) scroller.scrollTop += 14;
        else if (event.clientY < viewport.top + 42) scroller.scrollTop -= 14;
        if (event.clientX > viewport.right - 42) scroller.scrollLeft += 14;
        else if (event.clientX < viewport.left + 42) scroller.scrollLeft -= 14;
      }
    }
    setLive(calculate(event));
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointer !== event.pointerId) return;
    const currentGesture = gesture.current;
    const patch = calculate(event);
    gesture.current = null;
    setLive({});
    onGuides?.({});
    if (currentGesture.mode === "move" && !currentGesture.moved && selected && !currentGesture.additive) {
      onCycleSelect?.(layer.id, event.clientX, event.clientY);
      return;
    }
    if (Object.keys(patch).some((key) => patch[key as keyof LayerPatch] !== layer[key as keyof InvitationAssetLayer])) {
      onUpdate?.(layer.id, patch);
    }
  }
  function cancel(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointer !== event.pointerId) return;
    gesture.current = null;
    setLive({});
    onGuides?.({});
  }
  function keys(event: KeyboardEvent<HTMLElement>) {
    if (!editable || editingText || layer.locked || !onUpdate || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    onUpdate(layer.id, {
      x: clamp(layer.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), 0, 100),
      y: clamp(layer.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0), 0, 100),
    });
  }

  function beginTextEditing() {
    if (!editable || layer.kind !== "text" || layer.locked || !onUpdate) return;
    onSelect?.(layer.id, false);
    textDraft.current = layer.text ?? "";
    setEditingText(true);
  }

  function normalizeEditableText(node: HTMLElement) {
    return node.innerText.replace(/\r\n?/g, "\n").slice(0, 180);
  }

  function keepCaretAtEnd(node: HTMLElement) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function commitTextEditing() {
    if (!editingText) return;
    const next = (textEditor.current ? normalizeEditableText(textEditor.current) : textDraft.current).slice(0, 180);
    textDraft.current = next;
    setEditingText(false);
    if (next !== (layer.text ?? "")) onUpdate?.(layer.id, { text: next });
  }

  const frameStyle: CSSProperties = {
    backgroundColor: layer.background,
    ...(layer.borderColor ? { border: `${layer.borderWidth ?? 2}px solid ${layer.borderColor}`, boxSizing: "border-box" } : {}),
    borderRadius: layer.radius ? `${layer.radius}px` : undefined,
  };
  const imageVisual = !layer.kind ? (
    <span className={`block w-full ${displayed.height === undefined ? "" : "h-full"}`}
      style={{ ...frameStyle, overflow: "hidden", filter: shadowFilter }}>
      <img src={layer.src} alt="" draggable={false}
        className={`pointer-events-none block w-full select-none ${displayed.height === undefined ? "h-auto" : "h-full object-fill"}`}
        style={{ transform: `scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`, filter: invitationColorFilterCss(layer.color, "tint") }} />
    </span>
  ) : null;

  const shapeVisual = layer.kind === "shape" ? (
    <span
      aria-hidden="true"
      className="pointer-events-none block h-full w-full select-none"
      style={{
        position: layer.shape === "line" ? "absolute" : undefined,
        left: layer.shape === "line" ? 0 : undefined,
        top: layer.shape === "line" ? "50%" : undefined,
        height: layer.shape === "line" ? `${Math.max(1, layer.strokeWidth ?? 2)}px` : "100%",
        background: layer.shape === "line" ? (layer.stroke ?? "#C07A84") : (layer.fill ?? "#C07A84"),
        border: layer.shape !== "line" && (layer.strokeWidth ?? 0) > 0
          ? `${layer.strokeWidth}px solid ${layer.stroke ?? "#C07A84"}`
          : undefined,
        borderRadius: layer.shape === "circle" ? "9999px" : `${layer.radius ?? 0}px`,
        transform: layer.shape === "line"
          ? `translateY(-50%) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`
          : `scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
        filter: shadowFilter,
      }}
    />
  ) : null;

  return (
    <div ref={root} data-studio-design-object={layer.id} className="pointer-events-none absolute" style={{
      left: `${displayed.x}%`, top: `${displayed.y}%`, width: `${displayed.width}%`,
      ...(displayed.height === undefined ? {} : { aspectRatio: `${displayed.width} / ${displayed.height}` }),
      opacity: displayed.opacity, transform: `translate(-50%, -50%) rotate(${displayed.rotation ?? 0}deg)`,
      zIndex: editable && selected ? 40 : undefined,
      transformOrigin: "center", touchAction: "none",
    }}>
      {!layer.kind && layer.color && <InvitationColorFilters filters={[{ color: layer.color, mode: "tint" }]} />}
      {editable ? (
        editingText && layer.kind === "text" ? (
          <div
            className={`pointer-events-auto relative block w-full border-0 bg-transparent p-0 text-inherit outline-none ${displayed.height === undefined ? "" : "h-full"}`}
            data-studio-text-editing="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <span ref={motion} data-studio-layer-motion className={`relative block w-full ${displayed.height === undefined ? "" : "h-full"}`}>
              <span
                ref={textEditor}
                role="textbox"
                aria-multiline="true"
                contentEditable
                suppressContentEditableWarning
                className="block min-h-[1em] w-full whitespace-pre-wrap break-words outline-none"
                style={{
                  fontFamily: layer.fontFamily
                    ? invitationFontFamily(layer.fontFamily)
                    : layer.fontRole === "body" ? "inherit" : "var(--inv-heading, var(--font-undara-heading))",
                  fontSize: layer.fontSize ?? 24,
                  fontWeight: layer.fontWeight ?? 400,
                  textAlign: layer.textAlign ?? "center",
                  letterSpacing: layer.letterSpacing ?? 0,
                  lineHeight: layer.lineHeight ?? 1.2,
                  color: layer.color ?? "#C07A84",
                  ...frameStyle,
                  filter: shadowFilter,
                }}
                onInput={(event) => {
                  const node = event.currentTarget;
                  const next = normalizeEditableText(node);
                  textDraft.current = next;
                  if (node.innerText.length > 180) {
                    node.innerText = next;
                    keepCaretAtEnd(node);
                  }
                }}
                onBlur={commitTextEditing}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              >{layer.text ?? ""}</span>
            </span>
          </div>
        ) : (
          <button type="button" aria-label={layer.kind === "text" ? "Pilih dan geser teks dekoratif. Double-click untuk mengedit." : layer.kind === "shape" ? "Pilih dan geser bentuk" : "Pilih dan geser ilustrasi"}
            aria-pressed={selected}
            className={`pointer-events-auto relative block w-full border-0 bg-transparent p-0 text-inherit outline-none focus-visible:outline-2 focus-visible:outline-primary ${layer.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${displayed.height === undefined ? "" : "h-full"}`}
            style={{ touchAction: "none" }}
            onClick={(event) => { event.stopPropagation(); if (event.detail === 0) onSelect?.(layer.id, event.shiftKey); }}
            onDoubleClick={(event) => {
              if (layer.kind !== "text" || layer.locked) return;
              event.preventDefault();
              event.stopPropagation();
              beginTextEditing();
            }}
            onPointerDown={(event) => begin(event, "move")}
            onPointerMove={move} onPointerUp={end} onPointerCancel={cancel}
            onKeyDown={keys}>
            <span ref={motion} data-studio-layer-motion className={`relative block w-full ${displayed.height === undefined ? "" : "h-full"}`}>
              {layer.kind === "text" ? <span className="block w-full whitespace-pre-wrap break-words" style={{
                fontFamily: layer.fontFamily
                  ? invitationFontFamily(layer.fontFamily)
                  : layer.fontRole === "body" ? "inherit" : "var(--inv-heading, var(--font-undara-heading))",
                fontSize: layer.fontSize ?? 24,
                fontWeight: layer.fontWeight ?? 400,
                textAlign: layer.textAlign ?? "center",
                letterSpacing: layer.letterSpacing ?? 0,
                lineHeight: layer.lineHeight ?? 1.2,
                color: layer.color ?? "#C07A84",
                ...frameStyle,
                filter: shadowFilter,
              }}><InvitationLayerTextContent text={layer.text ?? ""} unit={layer.textAnimationUnit} /></span> : layer.kind === "shape" ? shapeVisual : imageVisual}
            </span>
          </button>
        )
      ) : (
        <span ref={motion} data-invitation-layer-motion aria-hidden="true" className={`relative block w-full ${displayed.height === undefined ? "" : "h-full"}`}>
          {layer.kind === "text" ? <span className="block w-full whitespace-pre-wrap break-words" style={{
            fontFamily: layer.fontFamily
              ? invitationFontFamily(layer.fontFamily)
              : layer.fontRole === "body" ? "inherit" : "var(--inv-heading, var(--font-undara-heading))",
            fontSize: layer.fontSize ?? 24,
            fontWeight: layer.fontWeight ?? 400,
            textAlign: layer.textAlign ?? "center",
            letterSpacing: layer.letterSpacing ?? 0,
            lineHeight: layer.lineHeight ?? 1.2,
            color: layer.color ?? "#C07A84",
            ...frameStyle,
            filter: shadowFilter,
          }}><InvitationLayerTextContent text={layer.text ?? ""} unit={layer.textAnimationUnit} /></span> : layer.kind === "shape" ? shapeVisual : imageVisual}
        </span>
      )}
      {editable && selected && !editingText && <>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 border border-primary" />
        {layer.locked && <span aria-label="Layer terkunci" title="Layer terkunci" className="pointer-events-none absolute -right-2 -top-2 z-30 grid h-6 w-6 place-items-center rounded-full border border-primary bg-background text-primary shadow-sm"><Lock size={13} /></span>}
        {!layer.locked && <button type="button" aria-label="Putar objek" title="Tarik untuk memutar" className="pointer-events-auto absolute -bottom-10 left-1/2 z-20 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-primary bg-background text-primary shadow-sm cursor-grab transition hover:bg-primary hover:text-primary-foreground active:cursor-grabbing"
          style={{ touchAction: "none" }} onPointerDown={(event) => begin(event, "rotate")} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel}><RotateCw aria-hidden="true" size={15} strokeWidth={2} /></button>}
        {!layer.locked && (["top-left", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left"] as const).map((handle) => (
          <button key={handle} type="button" aria-label={`Ubah ukuran dari ${handle}`} title="Tarik untuk mengubah ukuran"
            className={`pointer-events-auto absolute z-20 grid h-8 w-8 place-items-center border-0 bg-transparent p-0 ${handle.includes("top") ? "-top-4" : handle.includes("bottom") ? "-bottom-4" : "top-1/2 -translate-y-1/2"} ${handle.includes("left") ? "-left-4" : handle.includes("right") ? "-right-4" : "left-1/2 -translate-x-1/2"} ${handle === "top" || handle === "bottom" ? "cursor-ns-resize" : handle === "left" || handle === "right" ? "cursor-ew-resize" : handle === "top-left" || handle === "bottom-right" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`}
            style={{ touchAction: "none" }} onPointerDown={(event) => begin(event, "resize", handle)} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel}><span aria-hidden="true" className="pointer-events-none h-2.5 w-2.5 rounded-[2px] border border-primary bg-background" /></button>
        ))}
      </>}
    </div>
  );
}

export default function InvitationAssetLayers({ layers, section = "cover", sectionInstanceId = section, editable = false, editorMode = "customer", selectedId, selectedIds, onSelect, onUpdate }: Props) {
  const visible = layers.filter((layer) => {
    if ((layer.section ?? "cover") !== section || layer.hidden) return false;
    const owner = layer.sectionInstanceId ?? section;
    return owner === sectionInstanceId;
  });
  const [guides, setGuides] = useState<GuideState>({});
  const overlay = useRef<HTMLDivElement>(null);

  function cycleSelection(currentId: string, clientX: number, clientY: number) {
    if (!onSelect) return;
    const hits = visible.filter((layer) => {
      const node = overlay.current?.querySelector<HTMLElement>(`[data-studio-design-object="${CSS.escape(layer.id)}"]`);
      const rect = node?.getBoundingClientRect();
      return Boolean(rect?.width && rect.height && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
    });
    if (hits.length < 2) return;
    const currentIndex = hits.findIndex((layer) => layer.id === currentId);
    const nextIndex = currentIndex <= 0 ? hits.length - 1 : currentIndex - 1;
    onSelect(hits[nextIndex]!.id, false);
  }

  if (!visible.length) return null;
  const textFamilies = visible.flatMap((layer) => layer.kind === "text" && layer.fontFamily ? [layer.fontFamily] : []);
  return (
    <>
      {textFamilies.length > 0 && <InvitationFonts families={textFamilies} />}
      <div ref={overlay} className="pointer-events-none absolute inset-0 z-30 overflow-visible" aria-label={editable ? "Objek desain bagian undangan" : undefined}>
      {editable && guides.x !== undefined && <span aria-hidden="true" className="absolute inset-y-0 z-[60] w-px bg-primary/70" style={{ left: `${guides.x}%` }} />}
      {editable && guides.y !== undefined && <span aria-hidden="true" className="absolute inset-x-0 z-[60] h-px bg-primary/70" style={{ top: `${guides.y}%` }} />}
      {visible.map((layer) => {
        const layerEditable = editable && (editorMode === "template" || (layer.customerAccess !== "locked" && layer.customerAccess !== "content"));
        return <EditableLayer key={layer.id} layer={layer} section={section} selected={layerEditable && ((selectedIds?.includes(layer.id) ?? false) || selectedId === layer.id)}
          editable={layerEditable} sectionInstanceId={sectionInstanceId} siblings={visible}
          onSelect={layerEditable ? onSelect : undefined} onUpdate={layerEditable ? onUpdate : undefined} onCycleSelect={layerEditable ? cycleSelection : undefined} onGuides={setGuides} />;
      })}
      </div>
    </>
  );
}
