"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { createSeatingPathGesture } from "@/lib/seating/editor";
import { seatingCanvasColors } from "@/lib/seating/appearance";
import { seatingGuestAtSeat, seatingGuestSeatLabel, seatingPartySize, seatingSeatBlock } from "@/lib/seating/guest-seats";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { clampSeatingPoint, seatingPointFromClient, SEATING_TABLE_MARGIN, SEATING_WIDTH, type SeatingPlan, type SeatingPoint } from "@/lib/seating/plan";
import { seatingSeatLabelLayout, seatingSeatPoint, seatingTableBounds, seatingTableCenter, SEATING_SEAT_RADIUS, SEATING_STAGE_HEIGHT, SEATING_TABLE_BODY_RADIUS } from "./seating-chart-geometry";
import type { SeatingGuest, SeatingSeatTarget, SeatingTable } from "./seating-chart-types";

const noPoints: number[] = [];
export default function SeatingPlanCanvas({
  layout, tables, guests, tool, dark, busy, draggedGuestId, hoverTarget, selectedTableId,
  onTableSelect, onTableMove, onPath, onDrawingChange, onExitDraw, onGuestStart, onGuestHover, onGuestDrop, onGuestRelease, onGuestSelect, onGuestCancel, onUndo, onRedo, label, emptyLabel, pageOffset = 0,
}: {
  layout: SeatingPlan; tables: SeatingTable[]; guests: SeatingGuest[]; tool: "move" | "draw";
  dark: boolean; busy: boolean; draggedGuestId: string | null; hoverTarget: SeatingSeatTarget | null; selectedTableId: string;
  onTableSelect: (id: string) => void; onTableMove: (id: string, point: SeatingPoint) => void; onPath: (points: number[]) => void;
  onDrawingChange: (drawing: boolean) => void; onGuestStart: (id: string) => void; onGuestHover: (point: SeatingPoint) => void;
  onExitDraw: () => void;
  onGuestDrop: (id: string, point: SeatingPoint) => Promise<void>; onUndo: () => void; onRedo: () => void;
  onGuestCancel?: () => void;
  onGuestSelect?: (id: string) => void;
  onGuestRelease?: (id: string) => Promise<void>;
  label: string; emptyLabel: string; pageOffset?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const preview = useRef<Konva.Arrow>(null);
  const gesture = useRef(createSeatingPathGesture());
  const [width, setWidth] = useState(1100);
  const colors = seatingCanvasColors(dark);
  const scale = width / SEATING_WIDTH;
  const height = Math.min(SEATING_STAGE_HEIGHT, layout.height);
  const offset = Math.max(0, Math.min(pageOffset, layout.height - height));
  const draggedGuest = draggedGuestId ? guests.find((guest) => guest.id === draggedGuestId) ?? null : null;

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(800, entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cancelPath = useCallback(() => {
    const pointer = gesture.current.pointerId;
    gesture.current.cancel();
    preview.current?.visible(false);
    if (pointer !== null) {
      if (container.current?.hasPointerCapture(pointer)) container.current.releasePointerCapture(pointer);
      onDrawingChange(false);
    }
  }, [onDrawingChange]);
  useEffect(() => {
    cancelPath();
    container.current?.scrollTo({ top: 0 });
  }, [offset, cancelPath]);
  useEffect(() => {
    const activeGesture = gesture.current;
    window.addEventListener("blur", cancelPath);
    return () => { window.removeEventListener("blur", cancelPath); activeGesture.cancel(); };
  }, [cancelPath]);

  function pointAt(event: { clientX: number; clientY: number }) {
    const bounds = stage.current?.container().getBoundingClientRect();
    const point = bounds ? seatingPointFromClient({ x: event.clientX, y: event.clientY }, bounds, height) : null;
    return point ? { x: point.x, y: point.y + offset } : null;
  }
  function guestPointAt(node: Konva.Node, event: KonvaEventObject<DragEvent>) {
    const native = event.evt as unknown as { clientX?: number; clientY?: number; changedTouches?: ArrayLike<{ clientX: number; clientY: number }> } | undefined;
    const pointer = native?.changedTouches?.[0] ?? native;
    if (typeof pointer?.clientX === "number" && typeof pointer.clientY === "number") {
      const bounds = container.current?.getBoundingClientRect();
      if (bounds && (pointer.clientX < bounds.left || pointer.clientX > bounds.right || pointer.clientY < bounds.top || pointer.clientY > bounds.bottom)) return null;
      return pointAt({ clientX: pointer.clientX, clientY: pointer.clientY });
    }
    const point = node.getStage()?.getRelativePointerPosition();
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > SEATING_WIDTH || point.y < 0 || point.y > height) return null;
    return { x: point.x, y: point.y + offset };
  }
  function startPath(event: React.PointerEvent<HTMLDivElement>) {
    if (busy) return;
    if (tool !== "draw") { container.current?.focus({ preventScroll: true }); return; }
    if (event.button !== 0) return;
    const point = pointAt(event);
    if (!point || !gesture.current.start(event.pointerId, point, layout.height)) return;
    container.current?.focus({ preventScroll: true });
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onDrawingChange(true);
  }
  function movePath(event: React.PointerEvent<HTMLDivElement>) {
    const point = pointAt(event);
    if (!point) return;
    const points = gesture.current.move(event.pointerId, point);
    if (points) { event.preventDefault(); preview.current?.points(points); preview.current?.visible(points.length >= 4); }
  }
  function endPath(event: React.PointerEvent<HTMLDivElement>) {
    if (gesture.current.pointerId !== event.pointerId) return;
    const point = pointAt(event);
    if (point) gesture.current.move(event.pointerId, point, true);
    const points = gesture.current.end(event.pointerId);
    preview.current?.visible(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onDrawingChange(false);
    if (points) onPath(points);
  }
  function finishTableDrag(id: string, event: KonvaEventObject<DragEvent>) {
    if (event.target !== event.currentTarget) return;
    const point = clampSeatingPoint({ x: event.target.x(), y: event.target.y() }, layout.height, SEATING_TABLE_MARGIN);
    event.target.position(point);
    onTableMove(id, point);
  }

  return (
    <div ref={container} tabIndex={0} role="group" aria-label={label}
      className="max-h-[70dvh] min-w-0 overflow-auto rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ touchAction: tool === "draw" ? "none" : "auto", cursor: tool === "draw" ? "crosshair" : "default" }}
      onPointerDown={startPath} onPointerMove={movePath} onPointerUp={endPath}
      onPointerCancel={(event) => { if (event.pointerId === gesture.current.pointerId) cancelPath(); }}
      onLostPointerCapture={(event) => { if (event.pointerId === gesture.current.pointerId) cancelPath(); }}
      onDragOver={(event) => {
        if (tool !== "move" || busy || !draggedGuestId) return;
        event.preventDefault(); event.dataTransfer.dropEffect = "move";
        const point = pointAt(event); if (point) onGuestHover(point);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (tool !== "move" || busy || !draggedGuestId) return;
        const point = pointAt(event); if (point) void onGuestDrop(draggedGuestId, point);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { cancelPath(); onExitDraw(); onGuestSelect?.(""); return; }
        if (busy) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
          event.preventDefault(); cancelPath(); if (event.shiftKey) onRedo(); else onUndo(); return;
        }
        const index = tables.findIndex((table) => table.id === selectedTableId);
        const offset = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (tool !== "move" || index < 0 || !offset) return;
        event.preventDefault();
        const center = seatingTableCenter(selectedTableId, index, tables.length, layout);
        const step = event.shiftKey ? 50 : 10;
        onTableMove(selectedTableId, clampSeatingPoint({ x: center.x + offset[0] * step, y: center.y + offset[1] * step }, layout.height, SEATING_TABLE_MARGIN));
      }}
    >
      <Stage ref={stage} width={width} height={height * scale} scaleX={scale} scaleY={scale}>
        <Layer y={-offset}>
          <Rect width={SEATING_WIDTH} height={layout.height} fill={colors.background} listening={false} />
          {layout.paths.map((points, index) => <Arrow key={index} points={points} stroke={colors.table} fill={colors.table} strokeWidth={4} dash={[10, 7]} pointerLength={12} pointerWidth={10} lineCap="round" lineJoin="round" listening={false} />)}
        </Layer>
        <Layer y={-offset}>
          {tables.map((table, index) => {
            const center = seatingTableCenter(table.id, index, tables.length, layout);
            const tableBodyBounds = table.shape === "ROUND"
              ? { x: -SEATING_TABLE_BODY_RADIUS, y: -SEATING_TABLE_BODY_RADIUS, width: SEATING_TABLE_BODY_RADIUS * 2, height: SEATING_TABLE_BODY_RADIUS * 2 }
              : seatingTableBounds(table.shape);
            const highlightedSeats = new Set(
              hoverTarget?.table.id === table.id && draggedGuest
                ? seatingSeatBlock(hoverTarget.seat, seatingPartySize(draggedGuest), table.capacity)
                : [],
            );
            return (
              <Group key={table.id} x={center.x} y={center.y} draggable={tool === "move" && !busy}
                onClick={() => onTableSelect(table.id)} onTap={() => onTableSelect(table.id)}
                onDragStart={(event) => { if (event.target === event.currentTarget) onTableSelect(table.id); }}
                onDragEnd={(event) => finishTableDrag(table.id, event)}>
                {table.shape === "ROUND"
                  ? <Circle radius={SEATING_TABLE_BODY_RADIUS} fill={colors.table} stroke={selectedTableId === table.id ? colors.tableText : undefined} strokeWidth={3} />
                  : <Rect {...seatingTableBounds(table.shape)} cornerRadius={8} fill={colors.table} stroke={selectedTableId === table.id ? colors.tableText : undefined} strokeWidth={3} />}
                <Text {...tableBodyBounds} align="center" verticalAlign="middle" text={displayTitleCase(table.name)} fontSize={13} fontFamily="Roboto" fontStyle="bold" fill={colors.tableText} listening={false} />
                {Array.from({ length: table.capacity }, (_, seatIndex) => {
                  const seat = seatIndex + 1, point = seatingSeatPoint({ x: 0, y: 0 }, seatIndex, table.capacity);
                  const guest = seatingGuestAtSeat(guests, table.id, seat, table.capacity);
                  const label = guest ? seatingSeatLabelLayout(seatingGuestSeatLabel(guest, seat, table.capacity), seatIndex, table.capacity) : null;
                  const highlighted = highlightedSeats.has(seat);
                  return <Group key={seat} x={point.x} y={point.y} draggable={Boolean(guest) && tool === "move" && !busy}
                      onClick={(event) => { if (guest && tool === "move" && !busy) { event.cancelBubble = true; onTableSelect(table.id); onGuestSelect?.(guest.id); } }}
                      onTap={(event) => { if (guest && tool === "move" && !busy) { event.cancelBubble = true; onTableSelect(table.id); onGuestSelect?.(guest.id); } }}
                      onDragStart={(event) => { event.cancelBubble = true; if (guest) { onTableSelect(table.id); onGuestStart(guest.id); } }}
                      onDragMove={(event) => { event.cancelBubble = true; const point = guestPointAt(event.target, event); if (point) onGuestHover(point); }}
                      onDragEnd={(event) => {
                        event.cancelBubble = true;
                        const dropPoint = guestPointAt(event.target, event);
                        event.target.position(point);
                        if (!event.evt || event.evt.type === "touchcancel" || event.evt.type === "pointercancel") { onGuestCancel?.(); return; }
                        if (guest && dropPoint) void onGuestDrop(guest.id, dropPoint);
                        else if (guest && onGuestRelease) void onGuestRelease(guest.id);
                        else onGuestCancel?.();
                      }}>
                    <Circle radius={highlighted ? SEATING_SEAT_RADIUS + 5 : SEATING_SEAT_RADIUS} fill={guest ? colors.seatOccupied : colors.seatEmpty}
                      stroke={colors.seatStroke} strokeWidth={highlighted ? 5 : 2} />
                    <Text x={-12} y={-6} width={24} align="center" text={String(seat)} fontSize={10} fill={guest ? "#321B1B" : colors.seatStroke} listening={false} />
                    {label && <Text x={label.x} y={label.y} align={label.align} text={label.lines.join("\n")} wrap="none"
                      ref={(node) => { if (node) node.offsetX(node.width() * label.horizontalAnchor); }}
                      fontFamily="Roboto" fontSize={label.fontSize} lineHeight={label.lineHeight / label.fontSize} fill={colors.guestText}
                      listening={tool === "move" && !busy} />}
                  </Group>;
                })}
              </Group>
            );
          })}
          {!tables.length && <Text x={80} y={280} width={940} align="center" text={emptyLabel} fontSize={15} fill={colors.mutedText} listening={false} />}
        </Layer>
        <Layer y={-offset} listening={false}><Arrow ref={preview} points={noPoints} visible={false} stroke={colors.table} fill={colors.table} strokeWidth={4} dash={[10, 7]} pointerLength={12} pointerWidth={10} lineCap="round" lineJoin="round" /></Layer>
      </Stage>
    </div>
  );
}
