export const SEATING_WIDTH = 1100;
export const SEATING_MIN_HEIGHT = 620;
export const SEATING_MAX_HEIGHT = 6000;
export const SEATING_MAX_PATHS = 20;
export const SEATING_MAX_POINTS = 1024;
export const SEATING_MAX_BODY_BYTES = 256 * 1024;
export const SEATING_TABLE_MARGIN = 110;

export type SeatingPoint = { x: number; y: number };
export type SeatingPlan = {
  height: number;
  tables: Record<string, SeatingPoint>;
  paths: number[][];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coordinate(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export function seatingCanvasHeight(tableCount: number) {
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(tableCount))));
  const rows = Math.max(1, Math.ceil(tableCount / columns));
  return Math.min(SEATING_MAX_HEIGHT, Math.max(SEATING_MIN_HEIGHT, rows * 205 + 30));
}

export function emptySeatingPlan(tableCount = 0): SeatingPlan {
  return { height: seatingCanvasHeight(tableCount), tables: {}, paths: [] };
}

export function clampSeatingPoint(point: SeatingPoint, height: number, margin = 0): SeatingPoint {
  return {
    x: Math.round(Math.max(margin, Math.min(SEATING_WIDTH - margin, point.x))),
    y: Math.round(Math.max(margin, Math.min(height - margin, point.y))),
  };
}

/** Validate persisted vector data. No HTML, URLs, guest data or arbitrary canvas properties. */
export function parseSeatingPlan(value: unknown): SeatingPlan | null {
  if (!record(value) || !coordinate(value.height, SEATING_MAX_HEIGHT) || value.height < SEATING_MIN_HEIGHT
    || !record(value.tables) || !Array.isArray(value.paths) || value.paths.length > SEATING_MAX_PATHS) return null;
  const entries = Object.entries(value.tables);
  if (entries.length > 100) return null;
  const tables: [string, SeatingPoint][] = [];
  for (const [id, point] of entries) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || !record(point)
      || !coordinate(point.x, SEATING_WIDTH) || !coordinate(point.y, value.height)) return null;
    const bounded = clampSeatingPoint({ x: point.x, y: point.y }, value.height, SEATING_TABLE_MARGIN);
    tables.push([id, bounded]);
  }
  const paths: number[][] = [];
  for (const points of value.paths) {
    if (!Array.isArray(points) || points.length < 4 || points.length % 2 !== 0 || points.length > SEATING_MAX_POINTS * 2) return null;
    if (!points.every((point, index) => coordinate(point, index % 2 ? value.height as number : SEATING_WIDTH))) return null;
    paths.push(points.map((point) => Math.round(point)));
  }
  return { height: Math.ceil(value.height), tables: Object.fromEntries(tables), paths };
}

export function seatingPlanForTables(plan: SeatingPlan, tableIds: string[]): SeatingPlan {
  const known = new Set(tableIds);
  return { ...plan, height: Math.max(plan.height, seatingCanvasHeight(tableIds.length)), tables: Object.fromEntries(Object.entries(plan.tables).filter(([id]) => known.has(id))) };
}

export function seatingPointFromClient(
  point: SeatingPoint,
  rect: { left: number; top: number; width: number; height: number },
  height: number,
): SeatingPoint | null {
  if (!(rect.width > 0 && rect.height > 0)) return null;
  return { x: (point.x - rect.left) * SEATING_WIDTH / rect.width, y: (point.y - rect.top) * height / rect.height };
}
