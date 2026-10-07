"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { createSeatingPathGesture } from "@/lib/seating/editor";
import { seatingCanvasColors } from "@/lib/seating/appearance";
import { seatingGuestAtSeat, seatingPartySize, seatingSeatBlock } from "@/lib/seating/guest-seats";
import { clampSeatingPoint, seatingPointFromClient, SEATING_TABLE_MARGIN, SEATING_WIDTH, type SeatingPlan, type SeatingPoint } from "@/lib/seating/plan";
import { seatingSeatPoint, seatingTableCenter, SEATING_SEAT_RADIUS } from "./seating-chart-geometry";
import type { SeatingGuest, SeatingSeatTarget, SeatingTable } from "./seating-chart-types";

const noPoints: number[] = [];
export default function SeatingPlanCanvas({
  layout, tables, guests, tool, dark, busy, draggedGuestId, hoverTarget, selectedTableId,
  onTableSelect, onTableMove, onPath, onDrawingChange, onExitDraw, onGuestStart, onGuestHover, onGuestDrop, onUndo, onRedo, label, emptyLabel,
}: {
  layout: SeatingPlan; tables: SeatingTable[]; guests: SeatingGuest[]; tool: "move" | "draw";
  dark: boolean; busy: boolean; draggedGuestId: string | null; hoverTarget: SeatingSeatTarget | null; selectedTableId: string;
  onTableSelect: (id: string) => void; onTableMove: (id: string, point: SeatingPoint) => void; onPath: (points: number[]) => void;
  onDrawingChange: (drawing: boolean) => void; onGuestStart: (id: string) => void; onGuestHover: (point: SeatingPoint) => void;
  onExitDraw: () => void;
  onGuestDrop: (id: string, point: SeatingPoint) => Promise<void>; onUndo: () => void; onRedo: () => void;
  label: string; emptyLabel: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const preview = useRef<Konva.Arrow>(null);
  const gesture = useRef(createSeatingPathGesture());
  const [width, setWidth] = useState(1100);
  const colors = seatingCanvasColors(dark);
  const scale = width / SEATING_WIDTH;
  const draggedGuest = draggedGuestId ? guests.find((guest) => guest.id === draggedGuestId) ?? null : null;

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(800, Math.min(1100, entry.contentRect.width))));
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
    const activeGesture = gesture.current;
    window.addEventListener("blur", cancelPath);
    return () => { window.removeEventListener("blur", cancelPath); activeGesture.cancel(); };
  }, [cancelPath]);

  function pointAt(event: { clientX: number; clientY: number }) {
    const bounds = stage.current?.container().getBoundingClientRect();
    return bounds ? seatingPointFromClient({ x: event.clientX, y: event.clientY }, bounds, layout.height) : null;
  }
  function startPath(event: React.PointerEvent<HTMLDivElement>) {
    if (busy) return;
    if (tool !== "draw") { container.current?.focus({ preventScroll: true }); return; }
    if (event.button !== 0) return;
    const point = pointAt(event);
    if (!point || !gesture.current.start(event.pointerId, point, layout.height)) return;
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
        if (event.key === "Escape") { cancelPath(); onExitDraw(); return; }
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
      <Stage ref={stage} width={width} height={layout.height * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          <Rect width={SEATING_WIDTH} height={layout.height} fill={colors.background} listening={false} />
          {layout.paths.map((points, index) => <Arrow key={index} points={points} stroke={colors.table} fill={colors.table} strokeWidth={4} dash={[10, 7]} pointerLength={12} pointerWidth={10} lineCap="round" lineJoin="round" listening={false} />)}
        </Layer>
        <Layer>
          {tables.map((table, index) => {
            const center = seatingTableCenter(table.id, index, tables.length, layout);
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
                  ? <Circle radius={44} fill={colors.table} stroke={selectedTableId === table.id ? colors.tableText : undefined} strokeWidth={3} />
                  : <Rect x={table.shape === "SQUARE" ? -36 : -48} y={table.shape === "SQUARE" ? -36 : -30} width={table.shape === "SQUARE" ? 72 : 96} height={table.shape === "SQUARE" ? 72 : 60} cornerRadius={8} fill={colors.table} stroke={selectedTableId === table.id ? colors.tableText : undefined} strokeWidth={3} />}
                <Text x={-44} y={-10} width={88} height={30} align="center" text={table.name} fontSize={13} fontFamily="Roboto" fontStyle="bold" fill={colors.tableText} listening={false} />
                {Array.from({ length: table.capacity }, (_, seatIndex) => {
                  const seat = seatIndex + 1, point = seatingSeatPoint({ x: 0, y: 0 }, seatIndex, table.capacity);
                  const guest = seatingGuestAtSeat(guests, table.id, seat, table.capacity);
                  const anchor = guest?.seatNumber === seat;
                  const highlighted = highlightedSeats.has(seat);
                  return <Group key={seat} x={point.x} y={point.y}>
                    <Circle radius={highlighted ? SEATING_SEAT_RADIUS + 5 : SEATING_SEAT_RADIUS} fill={guest ? colors.seatOccupied : colors.seatEmpty}
                      stroke={colors.seatStroke} strokeWidth={highlighted ? 5 : 2} draggable={Boolean(guest && anchor) && tool === "move" && !busy}
                      onDragStart={(event) => { event.cancelBubble = true; if (guest && anchor) onGuestStart(guest.id); }}
                      onDragMove={(event) => { event.cancelBubble = true; const point = event.target.getStage()?.getRelativePointerPosition(); if (point) onGuestHover(point); }}
                      onDragEnd={(event) => {
                        event.cancelBubble = true;
                        const point = event.target.getStage()?.getRelativePointerPosition();
                        event.target.position({ x: 0, y: 0 });
                        if (guest && anchor && point) void onGuestDrop(guest.id, point);
                      }} />
                    <Text x={-12} y={-6} width={24} align="center" text={String(seat)} fontSize={10} fill={guest ? "#321B1B" : colors.seatStroke} listening={false} />
                    {guest && anchor && <Text x={-42} y={20} width={84} height={30} align="center" text={guest.name} fontFamily="Roboto" fontSize={11} fill={colors.guestText} listening={false} />}
                  </Group>;
                })}
              </Group>
            );
          })}
          {!tables.length && <Text x={80} y={280} width={940} align="center" text={emptyLabel} fontSize={15} fill={colors.mutedText} listening={false} />}
        </Layer>
        <Layer listening={false}><Arrow ref={preview} points={noPoints} visible={false} stroke={colors.table} fill={colors.table} strokeWidth={4} dash={[10, 7]} pointerLength={12} pointerWidth={10} lineCap="round" lineJoin="round" /></Layer>
      </Stage>
    </div>
  );
}
