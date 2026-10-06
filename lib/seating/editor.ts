import { clampSeatingPoint, emptySeatingPlan, SEATING_MAX_POINTS, type SeatingPlan, type SeatingPoint } from "./plan";

export function seatingPlanKey(plan: SeatingPlan) {
  return JSON.stringify([plan.height, Object.entries(plan.tables).sort(([a], [b]) => a.localeCompare(b)), plan.paths]);
}

export type SeatingEditorState = {
  plan: SeatingPlan;
  savedKey: string;
  revision: string | null;
  past: SeatingPlan[];
  future: SeatingPlan[];
};
export function emptySeatingEditor(): SeatingEditorState {
  const plan = emptySeatingPlan();
  return { plan, savedKey: seatingPlanKey(plan), revision: null, past: [], future: [] };
}
export type SeatingEditorAction =
  | { type: "LOAD"; plan: SeatingPlan; revision: string | null; keepUndo?: boolean }
  | { type: "EDIT"; plan: SeatingPlan }
  | { type: "SAVED"; plan: SeatingPlan; revision: string; snapshotKey?: string }
  | { type: "UNDO" | "REDO" };

export function seatingEditorReducer(state: SeatingEditorState, action: SeatingEditorAction): SeatingEditorState {
  if (action.type === "LOAD") {
    const changed = seatingPlanKey(action.plan) !== seatingPlanKey(state.plan);
    return { plan: action.plan, revision: action.revision, savedKey: seatingPlanKey(action.plan), past: action.keepUndo ? changed ? [...state.past.slice(-14), state.plan] : state.past : [], future: [] };
  }
  if (action.type === "SAVED") return { ...state, plan: action.snapshotKey === seatingPlanKey(state.plan) ? action.plan : state.plan, savedKey: seatingPlanKey(action.plan), revision: action.revision };
  if (action.type === "EDIT") {
    if (seatingPlanKey(action.plan) === seatingPlanKey(state.plan)) return state;
    return { ...state, plan: action.plan, past: [...state.past.slice(-14), state.plan], future: [] };
  }
  if (action.type === "UNDO" && state.past.length) return { ...state, plan: state.past.at(-1)!, past: state.past.slice(0, -1), future: [state.plan, ...state.future].slice(0, 15) };
  if (action.type === "REDO" && state.future.length) return { ...state, plan: state.future[0], past: [...state.past.slice(-14), state.plan], future: state.future.slice(1) };
  return state;
}

/** A single captured pointer owns a stroke. Interrupted strokes never become saved paths. */
export function createSeatingPathGesture() {
  let pointerId: number | null = null;
  let points: number[] = [];
  let height = 620;
  return {
    get pointerId() { return pointerId; },
    start(id: number, point: SeatingPoint, boardHeight: number) {
      if (pointerId !== null) return false;
      pointerId = id; height = boardHeight;
      const bounded = clampSeatingPoint(point, height);
      points = [bounded.x, bounded.y];
      return true;
    },
    move(id: number, point: SeatingPoint, force = false) {
      if (id !== pointerId) return null;
      const bounded = clampSeatingPoint(point, height);
      if (Math.hypot(bounded.x - points.at(-2)!, bounded.y - points.at(-1)!) < (force ? 0.5 : 3)) return points;
      if (points.length >= SEATING_MAX_POINTS * 2) points = points.filter((_, index) => Math.floor(index / 2) % 2 === 0);
      points = [...points, bounded.x, bounded.y];
      return points;
    },
    end(id: number) {
      if (id !== pointerId) return null;
      const result = points.length >= 4 ? points : null;
      pointerId = null; points = [];
      return result;
    },
    cancel() { pointerId = null; points = []; },
  };
}
