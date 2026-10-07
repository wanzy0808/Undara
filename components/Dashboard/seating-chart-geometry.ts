import type {
  SeatingGuest,
  SeatingPoint,
  SeatingSeatTarget,
  SeatingTable,
} from "@/components/Dashboard/seating-chart-types";
import { clampSeatingPoint, seatingPlanForTables, SEATING_MAX_HEIGHT, SEATING_TABLE_MARGIN, type SeatingPlan } from "@/lib/seating/plan";
import { seatingGuestAtSeat } from "@/lib/seating/guest-seats";

export const SEATING_STAGE_WIDTH = 1100;
export const SEATING_STAGE_HEIGHT = 620;
export const SEATING_TABLE_RADIUS = 64;
export const SEATING_TABLE_BODY_RADIUS = 38;
export const SEATING_SEAT_RADIUS = 14;
export const SEATING_TABLE_GAP_X = 250;
export const SEATING_TABLE_GAP_Y = 205;

export function seatingTableBounds(shape: string) {
  return shape === "SQUARE"
    ? { x: -32, y: -32, width: 64, height: 64 }
    : { x: -42, y: -26, width: 84, height: 52 };
}

/** Shared editor/print windows overlap so edge tables remain readable. */
export function seatingPlanPageOffsets(height: number) {
  const last = Math.max(0, height - SEATING_STAGE_HEIGHT);
  const count = Math.ceil(last / 400) + 1;
  return Array.from({ length: count }, (_, index) => count === 1 ? 0 : Math.round(last * index / (count - 1)));
}

export function seatingPlanPageAtY(y: number, height: number) {
  const offsets = seatingPlanPageOffsets(height);
  return offsets.reduce((best, offset, index) =>
    Math.abs(y - offset - SEATING_STAGE_HEIGHT / 2) < Math.abs(y - offsets[best] - SEATING_STAGE_HEIGHT / 2) ? index : best, 0);
}

export function seatingTablePoint(
  index: number,
  total: number,
  height = SEATING_STAGE_HEIGHT,
): SeatingPoint {
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(total))));
  const rows = Math.max(1, Math.ceil(total / columns));
  const row = Math.floor(index / columns);
  const column = index % columns;
  const width = (columns - 1) * SEATING_TABLE_GAP_X;
  const rowGap =
    rows > 1
      ? Math.min(
          SEATING_TABLE_GAP_Y,
          (height - 220) / (rows - 1),
        )
      : 0;

  return {
    x: SEATING_STAGE_WIDTH / 2 - width / 2 + column * SEATING_TABLE_GAP_X,
    y: 95 + row * rowGap,
  };
}

export function seatingTableCenter(id: string, index: number, total: number, plan?: SeatingPlan): SeatingPoint {
  const fallback = seatingTablePoint(index, total, plan?.height);
  return plan ? plan.tables[id] ?? clampSeatingPoint(fallback, plan.height, SEATING_TABLE_MARGIN) : fallback;
}

/** Materialize default positions so a saved plan survives a changed table count. */
export function seatingPlanWithTables(plan: SeatingPlan, tables: SeatingTable[]): SeatingPlan {
  const current = seatingPlanForTables(plan, tables.map((table) => table.id));
  return { ...current, tables: Object.fromEntries(tables.map((table, index) => [table.id, seatingTableCenter(table.id, index, tables.length, current)])) };
}

/** Keep existing geometry and put additions in the next available grid spaces. */
export function seatingPlanWithAddedTables(plan: SeatingPlan, existing: SeatingTable[], added: SeatingTable[]): SeatingPlan {
  const current = seatingPlanWithTables(plan, existing);
  const next = seatingPlanForTables(current, [...existing, ...added].map((table) => table.id));
  const positions = { ...current.tables };
  for (const table of added) {
    let point: SeatingPoint | undefined;
    for (let y = SEATING_TABLE_MARGIN; y <= SEATING_MAX_HEIGHT - SEATING_TABLE_MARGIN && !point; y += SEATING_TABLE_GAP_Y) {
      for (const x of [175, 425, 675, 925]) {
        if (Object.values(positions).every((other) => Math.hypot(other.x - x, other.y - y) >= 185)) { point = { x, y }; break; }
      }
    }
    point ??= clampSeatingPoint(seatingTablePoint(Object.keys(positions).length, existing.length + added.length, next.height), next.height, SEATING_TABLE_MARGIN);
    next.height = Math.max(next.height, point.y + SEATING_TABLE_MARGIN);
    positions[table.id] = point;
  }
  return { ...next, tables: positions };
}

export function seatingSeatPoint(
  center: SeatingPoint,
  index: number,
  capacity: number,
): SeatingPoint {
  const angle =
    (Math.PI * 2 * index) / Math.max(capacity, 1) - Math.PI / 2;

  return {
    x: center.x + Math.cos(angle) * SEATING_TABLE_RADIUS,
    y: center.y + Math.sin(angle) * SEATING_TABLE_RADIUS,
  };
}

export function findSeatingSeatTarget(
  point: SeatingPoint,
  tables: SeatingTable[],
  guests: SeatingGuest[],
  draggedGuestId: string | null,
  plan?: SeatingPlan,
): SeatingSeatTarget | null {
  let nearest: SeatingSeatTarget | null = null;
  let distance = Number.POSITIVE_INFINITY;

  tables.forEach((table, tableIndex) => {
    const center = seatingTableCenter(table.id, tableIndex, tables.length, plan);

    for (let index = 0; index < table.capacity; index += 1) {
      const seat = seatingSeatPoint(center, index, table.capacity);
      const currentDistance = Math.hypot(
        point.x - seat.x,
        point.y - seat.y,
      );

      if (currentDistance >= distance || currentDistance > 38) continue;

      nearest = {
        table,
        seat: index + 1,
        guest: seatingGuestAtSeat(guests, table.id, index + 1, table.capacity, draggedGuestId),
      };
      distance = currentDistance;
    }
  });

  return nearest;
}
