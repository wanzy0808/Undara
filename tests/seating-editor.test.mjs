import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as plans from "../lib/seating/plan.ts";
import * as editor from "../lib/seating/editor.ts";
import * as persistence from "../lib/seating/persistence.ts";
import * as appearance from "../lib/seating/appearance.ts";
import * as geometry from "../components/Dashboard/seating-chart-geometry.ts";
import * as icons from "lucide-react";
import * as primitives from "../components/Dashboard/DashboardPrimitives.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import * as dialogs from "../components/ui/dialog.tsx";
import { LanguageProvider } from "../components/I18n/LanguageProvider.tsx";
import { useDashboardI18n } from "../components/Dashboard/useDashboardI18n.ts";
import * as filters from "../lib/guests/filters.ts";
import * as titles from "../lib/text/display-title-case.ts";
import PrintModule, { seatingPrintOffsets } from "../components/Dashboard/SeatingPlanPrint.tsx";
import { loadSource } from "./helpers/package-access.mjs";

const layout = () => ({ height: 620, tables: { "table-a": { x: 420, y: 310 } }, paths: [[100, 200, 260, 210, 330, 330]] });
const table = { id: "table-a", name: "Meja keluarga", shape: "ROUND", capacity: 8 };
const revision = "2026-10-06T05:00:00.000Z";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("default table positions become saved geometry and survive adding/removing other tables", () => {
  const tables = [table, { ...table, id: "table-b" }];
  const saved = geometry.seatingPlanWithTables(plans.emptySeatingPlan(), tables);
  assert.equal(Object.keys(saved.tables).length, 2);
  const next = geometry.seatingPlanWithTables(saved, [...tables, { ...table, id: "table-c" }]);
  assert.deepEqual(next.tables[table.id], saved.tables[table.id]);
  assert.deepEqual(next.tables["table-b"], saved.tables["table-b"]);
  assert.deepEqual(Object.keys(geometry.seatingPlanWithTables(next, [table]).tables), [table.id]);
  assert.equal(plans.parseSeatingPlan(next) !== null, true);
});

test("table additions keep prior positions/routes and use vacant spaces rather than stacking on old tables", () => {
  const existing = [table], added = Array.from({ length: 12 }, (_, i) => ({ ...table, id: `new-${i}` }));
  const original = { ...layout(), tables: { [table.id]: { x: 175, y: 110 } } };
  const result = geometry.seatingPlanWithAddedTables(original, existing, added);
  assert.deepEqual(result.tables[table.id], original.tables[table.id]);
  assert.deepEqual(result.paths, original.paths);
  const centers = Object.values(result.tables);
  for (let i = 0; i < centers.length; i++) for (let j = i + 1; j < centers.length; j++) assert.ok(Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y) >= 185);
  assert.ok(result.height > 620); assert.ok(plans.parseSeatingPlan(result));
  const maximum = geometry.seatingPlanWithAddedTables(plans.emptySeatingPlan(), [], Array.from({ length: 100 }, (_, i) => ({ ...table, id: `max-${i}` })));
  assert.equal(Object.keys(maximum.tables).length, 100); assert.ok(plans.parseSeatingPlan(maximum));
});

test("moved tables drive the real seat drop geometry, including occupied seats and self drops", () => {
  const plan = layout(), guests = [{ id: "guest-a", tableId: table.id, seatNumber: 1 }];
  const seat = geometry.seatingSeatPoint(plan.tables[table.id], 0, table.capacity);
  assert.equal(geometry.findSeatingSeatTarget(seat, [table], guests, null, plan).guest.id, "guest-a");
  assert.equal(geometry.findSeatingSeatTarget(seat, [table], guests, "guest-a", plan).guest, null);
  assert.equal(geometry.findSeatingSeatTarget({ x: 20, y: 20 }, [table], guests, null, plan), null);
  const moved = { ...plan, tables: { [table.id]: { x: 820, y: 430 } } };
  assert.equal(geometry.findSeatingSeatTarget(seat, [table], guests, null, moved), null);
  assert.equal(geometry.findSeatingSeatTarget(geometry.seatingSeatPoint(moved.tables[table.id], 3, 8), [table], guests, null, moved).seat, 4);
});

test("Undo/Redo restores table positions and routes; a new edit discards redo and bounds history", () => {
  let state = editor.seatingEditorReducer(editor.emptySeatingEditor(), { type: "LOAD", plan: layout(), revision });
  const moved = { ...state.plan, tables: { [table.id]: { x: 550, y: 330 } } };
  state = editor.seatingEditorReducer(state, { type: "EDIT", plan: moved });
  state = editor.seatingEditorReducer(state, { type: "EDIT", plan: { ...moved, paths: [] } });
  state = editor.seatingEditorReducer(state, { type: "UNDO" });
  assert.deepEqual(state.plan, moved);
  state = editor.seatingEditorReducer(state, { type: "UNDO" });
  assert.deepEqual(state.plan, layout());
  state = editor.seatingEditorReducer(state, { type: "REDO" });
  assert.deepEqual(state.plan, moved);
  state = editor.seatingEditorReducer(state, { type: "EDIT", plan: { ...moved, paths: [[5, 5, 50, 50]] } });
  assert.equal(state.future.length, 0);
  for (let i = 0; i < 30; i++) state = editor.seatingEditorReducer(state, { type: "EDIT", plan: { ...state.plan, tables: { [table.id]: { x: 560 + i, y: 330 } } } });
  assert.equal(state.past.length, 15);
  assert.equal(editor.seatingEditorReducer(state, { type: "EDIT", plan: structuredClone(state.plan) }), state);
});

test("Save acknowledges its snapshot, materializes defaults, and cannot replace newer draft edits", () => {
  let state = editor.emptySeatingEditor();
  const snapshotKey = editor.seatingPlanKey(state.plan);
  const saved = geometry.seatingPlanWithTables(state.plan, [table]);
  state = editor.seatingEditorReducer(state, { type: "SAVED", plan: saved, revision, snapshotKey });
  assert.deepEqual(state.plan, saved);
  const duringSave = { ...saved, paths: [[10, 10, 100, 100]] };
  state = editor.seatingEditorReducer(state, { type: "EDIT", plan: duringSave });
  state = editor.seatingEditorReducer(state, { type: "SAVED", plan: saved, revision, snapshotKey: editor.seatingPlanKey(saved) });
  assert.deepEqual(state.plan, duringSave);
  assert.notEqual(editor.seatingPlanKey(state.plan), state.savedKey);
  const same = editor.seatingEditorReducer(state, { type: "LOAD", plan: structuredClone(duringSave), revision, keepUndo: true });
  assert.equal(same.past.length, state.past.length);
  const reloaded = editor.seatingEditorReducer(state, { type: "LOAD", plan: saved, revision, keepUndo: true });
  assert.deepEqual(editor.seatingEditorReducer(reloaded, { type: "UNDO" }).plan, duringSave);
});

test("a freehand stroke has one pointer owner, preserves direction and ignores clicks/cancelled strokes", () => {
  const gesture = editor.createSeatingPathGesture();
  assert.equal(gesture.start(1, { x: 50, y: 80 }, 620), true);
  assert.equal(gesture.start(2, { x: 900, y: 500 }, 620), false);
  assert.equal(gesture.move(2, { x: 900, y: 500 }), null);
  assert.equal(gesture.end(2), null);
  assert.deepEqual(gesture.move(1, { x: 51, y: 81 }), [50, 80]);
  gesture.move(1, { x: 260, y: 210 });
  gesture.move(1, { x: 330, y: 330 }, true);
  assert.deepEqual(gesture.end(1), [50, 80, 260, 210, 330, 330]);
  gesture.start(3, { x: 10, y: 10 }, 620);
  assert.equal(gesture.end(3), null);
  gesture.start(4, { x: 10, y: 10 }, 620);
  gesture.move(4, { x: 100, y: 100 });
  gesture.cancel();
  assert.equal(gesture.end(4), null);
  assert.equal(gesture.pointerId, null);
});

test("long/outside pointer strokes remain finite, bounded and accepted by the server codec", () => {
  const gesture = editor.createSeatingPathGesture();
  gesture.start(1, { x: -300, y: -100 }, 620);
  for (let i = 0; i < 7000; i++) gesture.move(1, { x: i % 2 ? 1090 : 10, y: i % 620 });
  gesture.move(1, { x: 5000, y: 5000 }, true);
  const points = gesture.end(1);
  assert.ok(points.length <= plans.SEATING_MAX_POINTS * 2);
  assert.deepEqual(points.slice(0, 2), [0, 0]);
  assert.deepEqual(points.slice(-2), [1100, 620]);
  assert.notEqual(plans.parseSeatingPlan({ ...layout(), paths: [points] }), null);
});

test("real client load/Save use an event-scoped no-store request and the current server revision", async () => {
  const calls = [];
  let stored = { layout: null, updatedAt: null };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "PUT") {
      const body = JSON.parse(options.body);
      assert.equal(body.invitationId, "event /&a");
      assert.equal(body.updatedAt, stored.updatedAt);
      stored = { layout: body.layout, updatedAt: revision };
    }
    return Response.json(stored);
  };
  const empty = await persistence.loadSeatingPlan("event /&a", undefined, fetcher);
  assert.deepEqual(empty.plan, plans.emptySeatingPlan());
  const saved = await persistence.saveSeatingPlan("event /&a", layout(), empty.revision, undefined, fetcher);
  assert.deepEqual(saved, { plan: layout(), revision });
  assert.deepEqual(await persistence.loadSeatingPlan("event /&a", undefined, fetcher), saved);
  assert.equal(calls[0].url, "/api/seating-plan?invitationId=event%20%2F%26a");
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal(calls[1].options.headers["Content-Type"], "application/json");
});

test("client rejects failed/conflicting/malformed responses and forwards cancellation", async () => {
  const controller = new AbortController();
  for (const status of [401, 402, 409, 500]) {
    const fail = async (_url, options) => { assert.equal(options.signal, controller.signal); return Response.json({ error: "server failure" }, { status }); };
    await assert.rejects(persistence.saveSeatingPlan("event-a", layout(), revision, controller.signal, fail), /server failure/);
    await assert.rejects(persistence.loadSeatingPlan("event-a", controller.signal, fail), /server failure/);
  }
  for (const bad of [{ layout: {}, updatedAt: revision }, { layout: layout() }, { layout: null, updatedAt: null }]) {
    await assert.rejects(persistence.saveSeatingPlan("event-a", layout(), revision, undefined, async () => Response.json(bad)), /Data denah tidak valid/);
  }
  await assert.rejects(persistence.loadSeatingPlan("event-a", undefined, async () => Response.json({ layout: layout(), updatedAt: 17 })), /Data denah tidak valid/);
  for (const fetcher of [async () => { throw new TypeError("network disconnected"); }, async () => new Response("upstream unavailable", { status: 502 })]) {
    await assert.rejects(persistence.loadSeatingPlan("event-a", undefined, fetcher), /Denah belum dapat dimuat/);
    await assert.rejects(persistence.saveSeatingPlan("event-a", layout(), revision, undefined, fetcher), /Denah belum tersimpan/);
  }
  await assert.rejects(persistence.loadSeatingPlan("event-a", undefined, async () => new Response("bad json")), /Data denah tidak valid/);
});

function hookFixture(fetcher) {
  const cells = [], effects = [];
  let index = 0, mounting = true, writes = 0;
  const hooks = {
    useState(initial) {
      const key = index++;
      if (!(key in cells)) cells[key] = typeof initial === "function" ? initial() : initial;
      return [cells[key], (next) => { writes++; cells[key] = typeof next === "function" ? next(cells[key]) : next; }];
    },
    useReducer(reducer, initial, init) {
      const key = index++;
      if (!(key in cells)) cells[key] = init(initial);
      return [cells[key], (action) => { writes++; cells[key] = reducer(cells[key], action); }];
    },
    useRef(initial) { const key = index++; if (!(key in cells)) cells[key] = { current: initial }; return cells[key]; },
    useEffect(fn) { if (mounting) effects.push(fn); },
  };
  const { useSeatingPlan: invokeHook } = loadSource("components/Dashboard/use-seating-plan.ts", {
    react: hooks, "@/lib/seating/editor": editor,
    "@/lib/seating/persistence": {
      loadSeatingPlan: (id, signal) => persistence.loadSeatingPlan(id, signal, fetcher),
      saveSeatingPlan: (id, plan, stamp, signal) => persistence.saveSeatingPlan(id, plan, stamp, signal, fetcher),
      clearSeatingPlan: (id, ids, stamp, signal) => persistence.clearSeatingPlan(id, ids, stamp, signal, fetcher),
    },
  });
  const render = () => { index = 0; const result = invokeHook("event-a"); mounting = false; return result; };
  render();
  const cleanup = effects.map((effect) => effect());
  return { render, unmount: () => cleanup.forEach((fn) => fn?.()), writes: () => writes };
}

test("the actual hook blocks Save after failed initial load, then supports retry without unknown overwrites", async () => {
  const calls = [];
  let failing = true;
  const hook = hookFixture(async (_url, options) => {
    calls.push(options);
    return failing ? Response.json({ error: "temporary failure" }, { status: 500 }) : Response.json({ layout: layout(), updatedAt: revision });
  });
  await flush();
  let view = hook.render();
  assert.equal(view.ready, false);
  assert.equal(view.loading, false);
  assert.equal(await view.save(layout()), false);
  assert.equal(calls.length, 1);
  failing = false;
  await view.reload();
  view = hook.render();
  assert.equal(view.ready, true);
  assert.equal(view.error, "");
  assert.deepEqual(view.editor.plan, layout());
  hook.unmount();
});

test("offline draft edits survive successful reload in Undo and require a fresh revision before Save", async () => {
  let failing = true;
  let persistedPlan = layout(), serverRevision = revision;
  const requests = [];
  const hook = hookFixture(async (_url, options) => {
    requests.push(options);
    if (failing) return Response.json({ error: "Penyimpanan denah belum siap. Silakan hubungi pengelola." }, { status: 503 });
    if (options.method === "PUT") {
      const sent = JSON.parse(options.body);
      assert.equal(sent.updatedAt, serverRevision);
      persistedPlan = sent.layout; serverRevision = "2026-10-06T05:02:00.000Z";
      return Response.json({ layout: persistedPlan, updatedAt: serverRevision });
    }
    return Response.json({ layout: persistedPlan, updatedAt: serverRevision });
  });
  await flush();
  const draft = { ...layout(), tables: { [table.id]: { x: 640, y: 410 } }, paths: [[200, 50, 800, 430]] };
  hook.render().dispatch({ type: "EDIT", plan: draft });
  assert.equal(await hook.render().save(draft), false);
  assert.equal(requests.length, 1);
  failing = false;
  const result = await hook.render().reload();
  assert.equal(result.replacedDraft, true);
  assert.deepEqual(hook.render().editor.plan, layout());
  hook.render().dispatch({ type: "UNDO" });
  assert.deepEqual(hook.render().editor.plan, draft);
  assert.equal(await hook.render().save(draft), true);
  assert.equal(requests.length, 3);
  assert.equal((await hook.render().reload()).replacedDraft, false);
  hook.unmount();
});

test("hook Save guards duplicate submits and preserves edits made while the request is pending", async () => {
  const put = deferred(), calls = [];
  const hook = hookFixture(async (_url, options) => {
    calls.push(options);
    return options.method === "PUT" ? put.promise : Response.json({ layout: layout(), updatedAt: revision });
  });
  await flush();
  const view = hook.render();
  const pending = view.save(layout());
  assert.equal(await view.save(layout()), false);
  const next = { ...layout(), paths: [[50, 50, 500, 500]] };
  view.dispatch({ type: "EDIT", plan: next });
  put.resolve(Response.json({ layout: layout(), updatedAt: "2026-10-06T05:01:00.000Z" }));
  assert.equal(await pending, true);
  const current = hook.render();
  assert.deepEqual(current.editor.plan, next);
  assert.notEqual(editor.seatingPlanKey(current.editor.plan), current.editor.savedKey);
  assert.equal(calls.filter((call) => call.method === "PUT").length, 1);
  hook.unmount();
});

test("unmount/event remount aborts old layout responses without changing state", async () => {
  const response = deferred();
  let signal;
  const hook = hookFixture(async (_url, options) => { signal = options.signal; return response.promise; });
  hook.unmount();
  assert.equal(signal.aborted, true);
  const writes = hook.writes();
  response.resolve(Response.json({ layout: layout(), updatedAt: revision }));
  await flush();
  assert.equal(hook.writes(), writes);
});

test("failed Save retains the hook's draft and revision for a successful retry", async () => {
  let failing = true;
  const calls = [];
  const hook = hookFixture(async (_url, options) => {
    if (options.method !== "PUT") return Response.json({ layout: layout(), updatedAt: revision });
    calls.push(JSON.parse(options.body));
    return failing ? Response.json({ error: "Denah belum tersimpan. Coba lagi." }, { status: 500 }) : Response.json({ layout: JSON.parse(options.body).layout, updatedAt: "2026-10-06T05:02:00.000Z" });
  });
  await flush();
  const next = { ...layout(), paths: [] };
  hook.render().dispatch({ type: "EDIT", plan: next });
  assert.equal(await hook.render().save(next), false);
  let view = hook.render();
  assert.equal(view.ready, true);
  assert.equal(view.saving, false);
  assert.equal(view.editor.revision, revision);
  assert.deepEqual(view.editor.plan, next);
  assert.match(view.error, /belum tersimpan/);
  failing = false;
  assert.equal(await view.save(next), true);
  view = hook.render();
  assert.equal(view.error, "");
  assert.equal(editor.seatingPlanKey(view.editor.plan), view.editor.savedKey);
  assert.ok(calls.every((call) => call.updatedAt === revision));
  hook.unmount();
});

test("actual Empty persistence sends the current revision/table IDs and rejects nonempty or failed responses", async () => {
  const calls = [], stamp = "2026-10-06T05:02:00.000Z";
  const result = await persistence.clearSeatingPlan("event-a", [table.id], revision, undefined, async (url, options) => {
    calls.push([url, options]); return Response.json({ layout: plans.emptySeatingPlan(), updatedAt: stamp });
  });
  assert.deepEqual(result, { plan: plans.emptySeatingPlan(), revision: stamp });
  assert.equal(calls[0][0], "/api/seating-plan"); assert.equal(calls[0][1].method, "DELETE");
  assert.deepEqual(JSON.parse(calls[0][1].body), { invitationId: "event-a", tableIds: [table.id], updatedAt: revision });
  await assert.rejects(persistence.clearSeatingPlan("event-a", [table.id], revision, undefined, async () => Response.json({ layout: layout(), updatedAt: stamp })), /Data denah tidak valid/);
  await assert.rejects(persistence.clearSeatingPlan("event-a", [table.id], revision, undefined, async () => Response.json({ error: "Conflict" }, { status: 409 })), /Conflict/);
  await assert.rejects(persistence.clearSeatingPlan("event-a", [table.id], revision, undefined, async () => { throw new TypeError("Offline"); }), /belum dapat dikosongkan/);
});

test("actual hook Empty preserves drafts on failure and clears deleted-table Undo only after success", async () => {
  let failing = true;
  const calls = [];
  const hook = hookFixture(async (_url, options) => {
    if (options.method !== "DELETE") return Response.json({ layout: layout(), updatedAt: revision });
    calls.push(JSON.parse(options.body));
    return failing ? Response.json({ error: "temporary failure" }, { status: 500 }) : Response.json({ layout: plans.emptySeatingPlan(), updatedAt: "2026-10-06T05:02:00.000Z" });
  });
  await flush();
  const draft = { ...layout(), paths: [] };
  hook.render().dispatch({ type: "EDIT", plan: draft });
  assert.equal(await hook.render().clear([table.id]), false);
  assert.deepEqual(hook.render().editor.plan, draft); assert.equal(hook.render().editor.revision, revision); assert.equal(hook.render().editor.past.length, 1);
  failing = false;
  assert.equal(await hook.render().clear([table.id]), true);
  const current = hook.render();
  assert.deepEqual(current.editor.plan, plans.emptySeatingPlan()); assert.equal(current.editor.past.length, 0); assert.equal(current.editor.future.length, 0);
  assert.equal(current.editor.savedKey, editor.seatingPlanKey(current.editor.plan)); assert.equal(current.error, "");
  assert.ok(calls.every((call) => call.updatedAt === revision && call.tableIds[0] === table.id));
  hook.unmount();
});

test("actual Empty blocks unknown revisions and concurrent mutations and aborts cleanly on unmount", async () => {
  const pending = deferred(), calls = [];
  const hook = hookFixture(async (_url, options) => {
    calls.push(options);
    return options.method === "DELETE" ? pending.promise : Response.json({ layout: layout(), updatedAt: revision });
  });
  assert.equal(await hook.render().clear([table.id]), false);
  await flush();
  const view = hook.render(), clearing = view.clear([table.id]);
  assert.equal(await view.clear([table.id]), false); assert.equal(await view.save(layout()), false); assert.equal(await view.reload(), undefined);
  assert.equal(calls.filter((call) => call.method === "DELETE").length, 1);
  hook.unmount();
  const writes = hook.writes();
  assert.equal(calls.at(-1).signal.aborted, true);
  pending.resolve(Response.json({ layout: plans.emptySeatingPlan(), updatedAt: revision }));
  assert.equal(await clearing, false); assert.equal(hook.writes(), writes);
});

function elements(element, match) {
  if (!element || typeof element !== "object") return [];
  return [...(match(element) ? [element] : []), ...React.Children.toArray(element.props?.children).flatMap((child) => elements(child, match))];
}
function canvasFixture(overrides = {}) {
  const calls = { paths: [], drawing: [], tables: [], guests: [], capture: new Set(), preview: [] };
  const container = { focus() {}, setPointerCapture: (id) => calls.capture.add(id), hasPointerCapture: (id) => calls.capture.has(id), releasePointerCapture: (id) => calls.capture.delete(id) };
  const bounds = { left: 30, top: -50, width: 550, height: 310 };
  const refs = [container, { container: () => ({ getBoundingClientRect: () => bounds }) }, { visible: (v) => calls.preview.push(v), points: (p) => calls.preview.push(p) }];
  let index = 0;
  const Canvas = loadSource("components/Dashboard/SeatingPlanCanvas.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useRef: (value) => ({ current: index < refs.length ? refs[index++] : (index++, value) }), useState: () => [1100, () => {}], useEffect: () => {}, useCallback: (fn) => fn },
    "react-konva": Object.fromEntries(["Arrow", "Circle", "Group", "Layer", "Rect", "Stage", "Text"].map((name) => [name, name])),
    "@/lib/seating/editor": editor, "@/lib/seating/appearance": appearance, "@/lib/seating/plan": plans,
    "./seating-chart-geometry": geometry,
  }).default;
  const props = {
    layout: layout(), tables: [table], guests: [{ id: "guest-a", name: "Naya", tableId: table.id, seatNumber: 1 }],
    tool: "draw", dark: false, busy: false, draggedGuestId: "guest-a", hoverTarget: null, selectedTableId: table.id,
    onTableSelect: (id) => calls.tables.push(["select", id]), onTableMove: (id, point) => calls.tables.push(["move", id, point]),
    onPath: (points) => calls.paths.push(points), onDrawingChange: (v) => calls.drawing.push(v), onExitDraw: () => calls.drawing.push("exit"),
    onGuestStart: (id) => calls.guests.push(["start", id]), onGuestHover: (p) => calls.guests.push(["hover", p]), onGuestDrop: async (id, p) => calls.guests.push(["drop", id, p]),
    onUndo: () => calls.tables.push(["undo"]), onRedo: () => calls.tables.push(["redo"]), label: "Denah", emptyLabel: "Empty", ...overrides,
  };
  const tree = Canvas(props);
  const pointer = (id, x = 250, y = 105) => ({ pointerId: id, clientX: x, clientY: y, button: 0, preventDefault() {}, currentTarget: container });
  return { tree, calls, pointer };
}

test("actual canvas pointer handlers draw in scaled/scrolled logical coordinates and release capture", () => {
  const { tree, calls, pointer } = canvasFixture();
  tree.props.onPointerDown(pointer(1));
  tree.props.onPointerMove(pointer(2, 500, 210));
  tree.props.onPointerUp(pointer(2, 500, 210));
  assert.equal(calls.paths.length, 0);
  tree.props.onPointerMove(pointer(1, 400, 160));
  tree.props.onPointerUp(pointer(1, 500, 210));
  assert.deepEqual(calls.paths, [[440, 310, 740, 420, 940, 520]]);
  assert.deepEqual(calls.drawing, [true, false]);
  assert.equal(calls.capture.size, 0);
});

test("actual canvas cancelled/lost pointers and Escape discard unfinished strokes; busy mode does not start", () => {
  for (const action of ["onPointerCancel", "onLostPointerCapture", "escape"]) {
    const { tree, calls, pointer } = canvasFixture();
    tree.props.onPointerDown(pointer(1));
    tree.props.onPointerMove(pointer(1, 400, 160));
    if (action === "escape") tree.props.onKeyDown({ key: "Escape" }); else tree.props[action](pointer(1));
    tree.props.onPointerUp(pointer(1, 500, 210));
    assert.equal(calls.paths.length, 0);
    assert.deepEqual(calls.drawing, action === "escape" ? [true, false, "exit"] : [true, false]);
    assert.equal(calls.capture.size, 0);
  }
  const busy = canvasFixture({ busy: true });
  busy.tree.props.onPointerDown(busy.pointer(1));
  assert.equal(busy.calls.capture.size, 0);
});

test("table drag clamps the real Konva group; child guest drag does not move the whole table", () => {
  const { tree, calls } = canvasFixture({ tool: "move" });
  const group = elements(tree, (el) => el.type === "Group" && el.props.x === 420)[0];
  const target = { x: () => -800, y: () => 2000, position: (p) => calls.tables.push(["node", p]) };
  group.props.onDragEnd({ target, currentTarget: target });
  assert.deepEqual(calls.tables, [["node", { x: 110, y: 510 }], ["move", table.id, { x: 110, y: 510 }]]);
  const guestCircle = elements(tree, (el) => el.type === "Circle" && el.props.draggable)[0];
  const guestNode = { getStage: () => ({ getRelativePointerPosition: () => ({ x: 740, y: 420 }) }), position: (p) => calls.guests.push(["reset", p]) };
  const event = { target: guestNode, currentTarget: guestNode };
  guestCircle.props.onDragEnd(event);
  assert.equal(event.cancelBubble, true);
  assert.deepEqual(calls.guests, [["reset", { x: 0, y: 0 }], ["drop", "guest-a", { x: 740, y: 420 }]]);
  group.props.onDragEnd({ target: guestNode, currentTarget: target });
  assert.equal(calls.tables.length, 2);
});

test("actual canvas native guest drop and keyboard moves use the same logical board", () => {
  const { tree, calls, pointer } = canvasFixture({ tool: "move" });
  tree.props.onDrop({ ...pointer(1), dataTransfer: {} });
  assert.deepEqual(calls.guests, [["drop", "guest-a", { x: 440, y: 310 }]]);
  tree.props.onKeyDown({ key: "ArrowRight", shiftKey: true, preventDefault() {} });
  assert.deepEqual(calls.tables, [["move", table.id, { x: 470, y: 310 }]]);
  tree.props.onKeyDown({ key: "z", ctrlKey: true, shiftKey: true, preventDefault() {} });
  assert.deepEqual(calls.tables.at(-1), ["redo"]);
});

const Print = PrintModule.default ?? PrintModule;
function chartFixture(overrides = {}, interactive = false) {
  const calls = [];
  let canvasProps;
  const cells = [];
  let index = 0;
  const state = { ...editor.emptySeatingEditor(), plan: layout(), revision, savedKey: editor.seatingPlanKey(layout()), past: [plans.emptySeatingPlan()] };
  const plan = { editor: state, loading: false, saving: false, ready: true, error: "", dispatch: (action) => { calls.push(action); if (interactive) plan.editor = editor.seatingEditorReducer(plan.editor, action); }, save: async (value) => { calls.push(value); return true; }, reload: async () => {}, clear: async () => true, ...overrides };
  const hooks = interactive ? {
    useEffect() {}, useMemo: (fn) => fn(),
    useState(initial) { const key = index++; if (!(key in cells)) cells[key] = initial; return [cells[key], (value) => { cells[key] = typeof value === "function" ? value(cells[key]) : value; }]; },
    useRef(value) { const key = index++; if (!(key in cells)) cells[key] = { current: value }; return cells[key]; },
  } : { useEffect() {}, useState: (initial) => [initial, () => {}], useRef: (value) => ({ current: value }), useMemo: (fn) => fn() };
  const Chart = loadSource("components/Dashboard/SeatingChart.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: hooks,
    "lucide-react": icons, "@/components/Theme/ThemeProvider": { useTheme: () => ({ isDarkMode: false }) },
    "@/components/ui/button": { Button }, "@/components/ui/input": { Input },
    "@/components/ui/dialog": dialogs,
    "@/components/Dashboard/useDashboardI18n": { useDashboardI18n: interactive ? () => ({ d: (text) => text, locale: "id" }) : useDashboardI18n }, "@/lib/text/display-title-case": titles,
    "@/components/Dashboard/DashboardPrimitives": primitives, "@/lib/guests/filters": filters,
    "@/components/Dashboard/seating-chart-geometry": geometry, "@/lib/seating/plan": plans, "@/lib/seating/editor": editor,
    "./use-seating-plan": { useSeatingPlan: () => plan },
    "./SeatingPlanCanvas": { __esModule: true, default: (props) => { canvasProps = props; return React.createElement("div", { "aria-label": "Denah" }); } },
    "./SeatingPlanPrint": { __esModule: true, default: Print }, "./seating-plan-print-browser": { printSeatingPlan: async () => () => {} },
  }).default;
  return { Chart, calls, plan, canvas: () => canvasProps, render: (props) => { index = 0; return Chart(props); } };
}

test("localized chart keeps local editing/print available after a failed load while Save stays blocked", () => {
  for (const [locale, expected] of [["id", ["Tambah meja", "Gambar jalur", "Simpan denah", "Cetak"]], ["en", ["Add tables", "Draw route", "Save plan", "Print"]]]) {
    const { Chart } = chartFixture();
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(Chart, { invitationId: "event-a", title: "Naya & Arga", tables: [table], guests: [], onAssigned: async () => {} })));
    for (const label of expected) assert.ok(html.includes(label), label);
    assert.match(html, /aria-pressed="false"/);
    assert.doesNotMatch(html, /Pilih \/ geser|Select \/ move|aria-label="(?:Pilih meja|Select table)"/);
    assert.ok(html.includes(locale === "en" ? "Empty plan" : "Kosongkan denah"));
    assert.match(html, /aria-label="Undo"/);
    assert.match(html, /aria-label="Redo"/);
    const failed = chartFixture({ ready: false, error: "Denah belum dapat dimuat. Coba lagi." });
    const blocked = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(failed.Chart, { invitationId: "event-a", tables: [table], guests: [], onAssigned: async () => {} })));
    const buttons = blocked.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || [];
    for (const label of [expected[0], expected[1], expected[3]]) assert.doesNotMatch(buttons.find((markup) => markup.includes(label)), /disabled=""/);
    assert.match(buttons.find((markup) => markup.includes(expected[2])), /disabled=""/);
    assert.equal(failed.canvas().busy, false);
    assert.ok(blocked.includes(locale === "en" ? "Reload plan" : "Muat ulang denah"));
    const pending = chartFixture({ loading: true });
    const pendingHtml = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(pending.Chart, { invitationId: "event-a", tables: [table], guests: [], onAssigned: async () => {} })));
    const pendingButtons = pendingHtml.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || [];
    for (const label of expected) assert.match(pendingButtons.find((markup) => markup.includes(label)), /disabled=""/);
    assert.equal(pending.canvas().busy, true);
  }
});

test("real chart table edits and canonical guest assignments work independently of layout storage failure", async () => {
  const assigned = [], fixture = chartFixture({ ready: false, error: "Penyimpanan denah belum siap. Silakan hubungi pengelola." });
  renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: "id" }, React.createElement(fixture.Chart, {
    invitationId: "event-a", tables: [table], guests: [{ id: "guest-manual", name: "Naya", source: "MANUAL", tableId: null }],
    onAssigned: async (...args) => assigned.push(args),
  })));
  const canvas = fixture.canvas();
  canvas.onTableMove(table.id, { x: 700, y: 400 });
  assert.deepEqual(fixture.calls.at(-1).plan.tables[table.id], { x: 700, y: 400 });
  canvas.onPath([100, 100, 500, 200]);
  assert.deepEqual(fixture.calls.at(-1).plan.paths.at(-1), [100, 100, 500, 200]);
  await canvas.onGuestDrop("guest-manual", geometry.seatingSeatPoint(layout().tables[table.id], 0, table.capacity));
  assert.deepEqual(assigned, [["guest-manual", table.id, 1]]);
});

const labelOf = (node) => typeof node === "string" ? node : React.Children.toArray(node?.props?.children).map(labelOf).join("");
const chartCanvas = (tree) => elements(tree, (el) => Boolean(el.props?.onTableMove && el.props?.onDrawingChange))[0].props;
const chartButton = (tree, label) => elements(tree, (el) => el.type === Button && labelOf(el) === label)[0];
const chartProps = { invitationId: "event-a", tables: [table], guests: [{ id: "guest-a", name: "Naya", source: "MANUAL", tableId: table.id, seatNumber: 2 }], onAssigned: async () => {} };

test("actual chart toggles Draw back to direct table dragging, including Escape and the route limit", () => {
  const f = chartFixture({}, true);
  let tree = f.render(chartProps);
  assert.equal(chartCanvas(tree).tool, "move");
  assert.equal(chartButton(tree, "Pilih / geser"), undefined);
  assert.equal(elements(tree, (el) => el.type === "select" && el.props["aria-label"] === "Pilih meja").length, 0);
  chartButton(tree, "Gambar jalur").props.onClick();
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "draw");
  chartButton(tree, "Gambar jalur").props.onClick();
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "move");
  chartButton(tree, "Gambar jalur").props.onClick();
  f.plan.dispatch({ type: "EDIT", plan: { ...layout(), paths: Array.from({ length: 20 }, () => [100, 100, 500, 200]) } });
  tree = f.render(chartProps);
  assert.equal(chartButton(tree, "Gambar jalur").props.disabled, false);
  chartCanvas(tree).onExitDraw();
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "move");
  assert.equal(chartButton(tree, "Gambar jalur").props.disabled, true);
  chartCanvas(tree).onTableSelect(table.id);
  assert.equal(chartCanvas(f.render(chartProps)).selectedTableId, table.id);
});

test("actual chart Add is repeatable, guards double submits and retains old geometry/assignments after refresh", async () => {
  const originalFetch = globalThis.fetch, pending = deferred(), calls = [];
  let refreshes = 0;
  globalThis.fetch = async (_url, options) => { calls.push(options); return pending.promise; };
  try {
    const f = chartFixture({}, true), props = { ...chartProps, onTablesChanged: async () => { refreshes++; } };
    let tree = f.render(props);
    const inputs = elements(tree, (el) => el.type === Input && el.props.type === "number");
    assert.equal(inputs[0].props.value, 1); assert.equal(chartButton(tree, "Tambah meja").props.disabled, false);
    inputs[0].props.onChange({ target: { value: "2" } });
    tree = f.render(props);
    const submit = elements(tree, (el) => el.type === "form")[0].props.onSubmit;
    const adding = submit({ preventDefault() {} });
    await submit({ preventDefault() {} });
    assert.equal(calls.length, 1); assert.deepEqual(JSON.parse(calls[0].body), { invitationId: "event-a", count: 2, capacity: 8, shape: "ROUND", locale: "id" });
    assert.equal(chartButton(f.render(props), "Menambahkan meja...").props.disabled, true);
    const added = [2, 3].map((i) => ({ ...table, id: `new-${i}`, name: `Meja ${i}` }));
    pending.resolve(Response.json({ tables: added }, { status: 201 })); await adding;
    tree = f.render({ ...props, tables: [table, ...added] });
    assert.equal(chartCanvas(tree).tables.length, 3);
    assert.deepEqual(chartCanvas(tree).layout.tables[table.id], layout().tables[table.id]);
    assert.deepEqual(chartCanvas(tree).guests[0], props.guests[0]); assert.equal(refreshes, 1);
    elements(tree, (el) => el.type === Input && el.props.type === "number")[0].props.onChange({ target: { value: "1" } });
    globalThis.fetch = async () => Response.json({ tables: [{ ...table, id: "new-4", name: "Meja 4" }] }, { status: 201 });
    await elements(f.render({ ...props, tables: [table, ...added] }), (el) => el.type === "form")[0].props.onSubmit({ preventDefault() {} });
    tree = f.render(props);
    assert.equal(chartCanvas(tree).tables.length, 4); assert.equal(refreshes, 2);
    assert.deepEqual(chartCanvas(tree).layout.tables[table.id], layout().tables[table.id]);
    assert.deepEqual(chartCanvas(tree).layout.paths, layout().paths);
  } finally { globalThis.fetch = originalFetch; }
});

test("actual chart failed Add retains tables and the layout, and the allowance disables additions at 100", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: "Maksimal 100 meja per acara." }, { status: 409 });
  try {
    const f = chartFixture({}, true);
    await elements(f.render(chartProps), (el) => el.type === "form")[0].props.onSubmit({ preventDefault() {} });
    const tree = f.render(chartProps);
    assert.deepEqual(chartCanvas(tree).tables, [table]); assert.deepEqual(chartCanvas(tree).layout, layout());
    assert.equal(chartButton(tree, "Tambah meja").props.disabled, false);
    const full = f.render({ ...chartProps, tables: Array.from({ length: 100 }, (_, i) => ({ ...table, id: `full-${i}` })) });
    assert.equal(chartButton(full, "Tambah meja").props.disabled, true);
  } finally { globalThis.fetch = originalFetch; }
});

test("actual chart Empty waits for success, drops stale table props and returns guests to the roster", async () => {
  let succeeds = false, refreshes = 0;
  const ids = [];
  const f = chartFixture({ clear: async (tables) => {
    ids.push(tables);
    if (!succeeds) return false;
    f.plan.dispatch({ type: "LOAD", plan: plans.emptySeatingPlan(), revision }); return true;
  } }, true);
  const props = { ...chartProps, onTablesChanged: async () => { refreshes++; } };
  let tree = f.render(props);
  elements(tree, (el) => el.type === dialogs.Dialog)[0].props.onOpenChange(true);
  tree = f.render(props); assert.equal(elements(tree, (el) => el.type === dialogs.Dialog)[0].props.open, true);
  chartButton(tree, "Batal").props.onClick();
  assert.equal(elements(f.render(props), (el) => el.type === dialogs.Dialog)[0].props.open, false); assert.equal(ids.length, 0);
  elements(f.render(props), (el) => el.type === dialogs.Dialog)[0].props.onOpenChange(true);
  chartButton(f.render(props), "Ya, kosongkan").props.onClick(); await flush();
  tree = f.render(props); assert.equal(chartCanvas(tree).tables.length, 1); assert.equal(chartCanvas(tree).guests[0].tableId, table.id);
  assert.equal(elements(tree, (el) => el.type === dialogs.Dialog)[0].props.open, true);
  succeeds = true;
  chartButton(tree, "Ya, kosongkan").props.onClick(); await flush();
  tree = f.render(props);
  assert.deepEqual(ids, [[table.id], [table.id]]); assert.equal(refreshes, 1);
  assert.equal(chartCanvas(tree).tables.length, 0); assert.deepEqual(chartCanvas(tree).layout, plans.emptySeatingPlan());
  assert.deepEqual(chartCanvas(tree).guests[0], { ...props.guests[0], tableId: null, seatNumber: null });
  assert.equal(elements(tree, (el) => el.props?.draggable === true).length, 1);
  assert.equal(elements(tree, (el) => el.type === dialogs.Dialog)[0].props.open, false);
  assert.equal(chartButton(tree, "Tambah meja").props.disabled, false);
});

const printHtml = (overrides = {}) => renderToStaticMarkup(React.createElement(Print, {
  title: "naya & arga", layout: layout(), tables: [table], guests: [
    { id: "guest-private-id", name: "Naya", tableId: table.id, seatNumber: 2, qrToken: "SECRET-TICKET" },
    { id: "guest-two", name: "Arga", tableId: table.id, seatNumber: 1 },
    { id: "manual-a", name: "Tamu Manual", source: "MANUAL" },
    { id: "rsvp-a", name: "Tamu Hadir", source: "RSVP", rsvpStatus: "ATTENDING" },
    { id: "rsvp-b", name: "Tamu Tidak Hadir", source: "RSVP", rsvpStatus: "DECLINED" },
  ], locale: "id", ...overrides,
}));

test("actual print SSR matches moved geometry/routes, includes the full roster and keeps private tokens out", () => {
  const html = printHtml();
  assert.match(html, /transform="translate\(420 310\)"/);
  assert.match(html, /points="100,200 260,210 330,330"/);
  assert.match(html, /marker-end="url\(#seating-route-tip-0\)"/);
  assert.match(html, /<td>Meja keluarga<\/td><td>1<\/td><td>Arga<\/td>/);
  assert.match(html, /<td>Meja keluarga<\/td><td>2<\/td><td>Naya<\/td>/);
  assert.match(html, /Tamu Manual/);
  assert.match(html, /Tamu Hadir/);
  assert.doesNotMatch(html, /SECRET-TICKET|guest-private-id|Tamu Tidak Hadir|Simpan denah|<button|<aside/);
  assert.match(html, /assets\/brand\/undara\/logo.webp/);
  assert.match(html, /A4 landscape/);
  assert.match(html, /fill="#FFF9F3"/);
});

test("print labels support English and guest/event text is escaped by React", () => {
  const html = printHtml({ locale: "en", title: "<script>alert(1)</script>", guests: [{ id: "a", name: '<img src=x onerror="alert(1)">', tableId: table.id, seatNumber: 1 }] });
  assert.match(html, /Guest placement|guests assigned/);
  assert.match(html, /Dashed arrow: bridal route/);
  assert.match(html, /&lt;script&gt;/i);
  assert.match(html, /&lt;img/i);
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(printHtml({ tables: [], guests: [], layout: plans.emptySeatingPlan(), title: "", locale: "en" }), /<h1>Seating plan<\/h1>/);
});

test("long plans print as overlapping readable pages and preserve all three table shapes", () => {
  const height = plans.seatingCanvasHeight(100), offsets = seatingPrintOffsets(height);
  assert.equal(offsets[0], 0);
  assert.equal(offsets.at(-1) + 620, height);
  for (let i = 1; i < offsets.length; i++) assert.ok(offsets[i] - offsets[i - 1] <= 400);
  const html = printHtml({ layout: { ...layout(), height }, tables: [table, { ...table, id: "b", shape: "SQUARE" }, { ...table, id: "c", shape: "RECTANGLE" }] });
  assert.equal((html.match(/class="seating-print-map"/g) || []).length, offsets.length);
  assert.match(html, /width="72" height="72"/);
  assert.match(html, /width="96" height="60"/);
  assert.match(html, /Halaman 1\//);
});

function printerFixture({ ready = true, fonts = Promise.resolve(), logo = Promise.resolve(), brokenRoot = false, printError = false } = {}) {
  const calls = { printed: 0, removed: 0, unmounted: 0, rendered: [], heads: [], bodies: [] };
  const node = (tag) => ({ tag, style: {}, setAttribute() {}, appendChild(child) { calls.bodies.push(child); }, decode: () => logo });
  const target = { head: { appendChild: (n) => calls.heads.push(n) }, body: node("body"), fonts: { ready: fonts }, createElement: node };
  const printer = { focus() {}, print() { calls.printed++; if (printError) throw new Error("printer unavailable"); }, requestAnimationFrame(fn) { queueMicrotask(fn); } };
  const frame = { ...node("iframe"), contentDocument: target, contentWindow: printer, remove() { calls.removed++; } };
  const sheet = { href: "https://undara.test/_next/static/css/main.css", cssRules: [{ type: 5, cssText: '@font-face { font-family: Roboto; src: url("../media/roboto.woff2"); }' }, { type: 1, cssText: ".dashboard { display:flex; }" }] };
  const source = { baseURI: "https://undara.test/dashboard", body: { appendChild: (n) => calls.bodies.push(n) }, styleSheets: [sheet, { get cssRules() { throw new Error("cross-origin"); } }], defaultView: { getComputedStyle: () => ({ fontFamily: "__Roboto, sans-serif" }) }, createElement: (tag) => { assert.equal(tag, "iframe"); return frame; } };
  const renderRoot = () => {
    if (brokenRoot) throw new Error("renderer unavailable");
    return { render(element) { calls.rendered.push(element); if (ready) queueMicrotask(element.props.onReady); }, unmount() { calls.unmounted++; } };
  };
  const { printSeatingPlan } = loadSource("components/Dashboard/seating-plan-print-browser.ts", { react: { createElement: React.createElement, useEffect() {} }, "react-dom/client": { createRoot: renderRoot } });
  return { calls, target, frame, start: (signal) => printSeatingPlan(React.createElement("main", null, "Private plan"), "Acara", source, renderRoot, signal) };
}

test("isolated print waits for rendering/fonts/brand asset, copies only font faces and cleans up once", async () => {
  const fonts = deferred(), logo = deferred();
  const fixture = printerFixture({ fonts: fonts.promise, logo: logo.promise });
  const pending = fixture.start();
  await flush();
  assert.equal(fixture.calls.printed, 0);
  fonts.resolve(); await flush();
  assert.equal(fixture.calls.printed, 0);
  logo.resolve();
  const dispose = await pending;
  assert.equal(fixture.calls.printed, 1);
  assert.equal(fixture.target.title, "Acara");
  const fontsCss = fixture.calls.heads.find((n) => n.tag === "style").textContent;
  assert.match(fontsCss, /https:\/\/undara.test\/_next\/static\/media\/roboto.woff2/);
  assert.doesNotMatch(fontsCss, /dashboard/);
  assert.equal(fixture.target.body.style.fontFamily, "__Roboto, sans-serif");
  assert.equal(fixture.calls.removed, 0);
  dispose(); dispose();
  assert.equal(fixture.calls.unmounted, 1);
  assert.equal(fixture.calls.removed, 1);
});

test("unmount aborts print even before mount or while assets wait, without a late print", async () => {
  for (const options of [{ ready: false }, { fonts: new Promise(() => {}) }]) {
    const controller = new AbortController(), fixture = printerFixture(options);
    const pending = fixture.start(controller.signal);
    await flush();
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(fixture.calls.printed, 0);
    assert.equal(fixture.calls.removed, 1);
    assert.equal(fixture.calls.unmounted, 1);
  }
});

test("print render/asset/printer failures remove the isolated frame and remain retryable", async () => {
  for (const options of [{ brokenRoot: true }, { logo: Promise.resolve().then(() => { throw new Error("logo missing"); }) }, { printError: true }]) {
    const fixture = printerFixture(options);
    await assert.rejects(fixture.start(), /Cetak belum dapat dibuka/);
    assert.equal(fixture.calls.removed, 1);
  }
});
