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
import * as manualParty from "../lib/guests/manual-party.ts";
import * as envelope from "../lib/guests/personal-envelope.ts";
import * as guestSeats from "../lib/seating/guest-seats.ts";
import * as titles from "../lib/text/display-title-case.ts";
import PrintModule, { seatingPrintOffsets } from "../components/Dashboard/SeatingPlanPrint.tsx";
import ActionsModule from "../components/Dashboard/SeatingGuestActions.tsx";
import { controlStyles } from "../components/ui/control-styles.ts";
import * as utils from "../lib/utils.ts";
import { loadSource } from "./helpers/package-access.mjs";
import Konva from "konva";
import { DD } from "konva/lib/DragAndDrop.js";

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

test("editor pages overlap, cover the complete plan and keep every full table reachable", () => {
  for (const count of [0, 1, 12, 20, 100]) {
    const height = plans.seatingCanvasHeight(count), offsets = geometry.seatingPlanPageOffsets(height);
    assert.equal(offsets[0], 0); assert.equal(offsets.at(-1) + 620, height);
    for (let i = 1; i < offsets.length; i++) assert.ok(offsets[i] > offsets[i - 1] && offsets[i] - offsets[i - 1] <= 400);
    for (let y = 110; y <= height - 110; y += 10) {
      assert.ok(offsets.some((offset) => y - 110 >= offset && y + 110 <= offset + 620), `unreachable table at ${y}`);
      const selected = geometry.seatingPlanPageAtY(y, height);
      assert.ok(selected >= 0 && selected < offsets.length);
    }
  }
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
const draggableSeatGroups = (tree) => elements(tree, (el) => el.type === "Group" && el.props.draggable && el.props.onDragMove);
function canvasFixture(overrides = {}) {
  const calls = { paths: [], drawing: [], tables: [], guests: [], capture: new Set(), preview: [], focus: [] };
  const container = { getBoundingClientRect: () => ({ left: 30, right: 580, top: -50, bottom: 260 }), focus: (options) => calls.focus.push(options), setPointerCapture: (id) => calls.capture.add(id), hasPointerCapture: (id) => calls.capture.has(id), releasePointerCapture: (id) => calls.capture.delete(id) };
  const bounds = { left: 30, top: -50, width: 550, height: 310 };
  const refs = [container, { container: () => ({ getBoundingClientRect: () => bounds }) }, { visible: (v) => calls.preview.push(v), points: (p) => calls.preview.push(p) }];
  let index = 0;
  const Canvas = loadSource("components/Dashboard/SeatingPlanCanvas.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useRef: (value) => ({ current: index < refs.length ? refs[index++] : (index++, value) }), useState: () => [1100, () => {}], useEffect: () => {}, useCallback: (fn) => fn },
    "react-konva": Object.fromEntries(["Arrow", "Circle", "Group", "Layer", "Rect", "Stage", "Text"].map((name) => [name, name])),
    "@/lib/seating/editor": editor, "@/lib/seating/appearance": appearance, "@/lib/seating/plan": plans,
    "@/lib/seating/guest-seats": guestSeats,
    "@/lib/text/display-title-case": titles,
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
  assert.deepEqual(calls.focus, [{ preventScroll: true }]);
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
  assert.deepEqual(busy.calls.focus, []);
});

test("table drag clamps the real Konva group; child guest drag does not move the whole table", () => {
  const { tree, calls } = canvasFixture({ tool: "move" });
  const group = elements(tree, (el) => el.type === "Group" && el.props.x === 420)[0];
  const target = { x: () => -800, y: () => 2000, position: (p) => calls.tables.push(["node", p]) };
  group.props.onDragEnd({ target, currentTarget: target });
  assert.deepEqual(calls.tables, [["node", { x: 110, y: 510 }], ["move", table.id, { x: 110, y: 510 }]]);
  const guestCircle = draggableSeatGroups(tree)[0];
  const guestNode = { getStage: () => ({ getRelativePointerPosition: () => ({ x: 740, y: 420 }) }), position: (p) => calls.guests.push(["reset", p]) };
  const event = { target: guestNode, currentTarget: guestNode, evt: { type: "mouseup" } };
  guestCircle.props.onDragEnd(event);
  assert.equal(event.cancelBubble, true);
  assert.deepEqual(calls.guests, [["reset", { x: guestCircle.props.x, y: guestCircle.props.y }], ["drop", "guest-a", { x: 740, y: 420 }]]);
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

test("later canvas pages translate paths and both guest drag modes into the original saved coordinates", () => {
  const tall = { ...layout(), height: 1240, tables: { [table.id]: { x: 420, y: 810 } } };
  const drawing = canvasFixture({ layout: tall, pageOffset: 400 });
  assert.equal(elements(drawing.tree, (el) => el.type === "Stage")[0].props.height, 620);
  assert.ok(elements(drawing.tree, (el) => el.type === "Layer").every((el) => el.props.y === -400));
  drawing.tree.props.onPointerDown(drawing.pointer(1)); drawing.tree.props.onPointerMove(drawing.pointer(1, 400, 160)); drawing.tree.props.onPointerUp(drawing.pointer(1, 500, 210));
  assert.deepEqual(drawing.calls.paths, [[440, 710, 740, 820, 940, 920]]);

  const moving = canvasFixture({ layout: tall, pageOffset: 400, tool: "move" });
  moving.tree.props.onDrop({ ...moving.pointer(1), dataTransfer: {} });
  const circle = draggableSeatGroups(moving.tree)[0];
  const node = { getStage: () => ({ getRelativePointerPosition: () => ({ x: 740, y: 420 }) }), position() {} };
  circle.props.onDragEnd({ target: node, evt: { type: "mouseup" } });
  assert.deepEqual(moving.calls.guests, [["drop", "guest-a", { x: 440, y: 710 }], ["drop", "guest-a", { x: 740, y: 820 }]]);
  const group = elements(moving.tree, (el) => el.type === "Group" && el.props.x === 420)[0];
  const tableNode = { x: () => 520, y: () => 900, position() {} };
  group.props.onDragEnd({ target: tableNode, currentTarget: tableNode });
  assert.deepEqual(moving.calls.tables, [["move", table.id, { x: 520, y: 900 }]]);
  moving.tree.props.onKeyDown({ key: "ArrowDown", preventDefault() {} });
  assert.deepEqual(moving.calls.tables.at(-1), ["move", table.id, { x: 420, y: 820 }]);
});

test("dropping a seated party outside the canvas releases it rather than placing it on a hidden page", () => {
  let cancelled = 0;
  const released = [];
  const f = canvasFixture({ layout: { ...layout(), height: 1240 }, pageOffset: 400, tool: "move", onGuestCancel: () => cancelled++, onGuestRelease: async (id) => released.push(id) });
  const circle = draggableSeatGroups(f.tree)[0];
  const node = { getStage: () => ({ getRelativePointerPosition: () => ({ x: 440, y: -30 }) }), position() {} };
  circle.props.onDragEnd({ target: node, evt: { type: "mouseup" } });
  assert.equal(cancelled, 0); assert.deepEqual(f.calls.guests, []); assert.deepEqual(released, ["guest-a"]);
});

test("mouse/touch drops anywhere outside the canvas release the same whole party", () => {
  for (const evt of [{ type: "mouseup", clientX: 5, clientY: 10 }, { type: "touchend", changedTouches: [{ clientX: 950, clientY: 280 }] }]) {
    const returned = [], positions = [], f = canvasFixture({ tool: "move", pageOffset: 400,
      layout: { ...layout(), height: 1240 },
      onGuestRelease: async (id) => { returned.push(id); },
    });
    const circle = draggableSeatGroups(f.tree)[0];
    const node = { getStage: () => ({ getRelativePointerPosition: () => ({ x: 1500, y: 800 }) }), position: (point) => positions.push(point) };
    circle.props.onDragEnd({ target: node, evt });
    assert.deepEqual(returned, ["guest-a"]);
    assert.deepEqual(positions, [{ x: circle.props.x, y: circle.props.y }]); assert.deepEqual(f.calls.guests, []);
  }
});

test("canvas seat click/tap selects its canonical guest and Escape dismisses the selected actions", () => {
  const selected = [], f = canvasFixture({ tool: "move", onGuestSelect: (id) => selected.push(id) });
  const circle = draggableSeatGroups(f.tree)[0];
  for (const action of ["onClick", "onTap"]) {
    const event = {}; circle.props[action](event); assert.equal(event.cancelBubble, true);
  }
  assert.deepEqual(selected, ["guest-a", "guest-a"]);
  f.tree.props.onKeyDown({ key: "Escape" }); assert.deepEqual(selected, ["guest-a", "guest-a", ""]);
  const busy = canvasFixture({ tool: "move", busy: true, onGuestSelect: () => assert.fail("busy seat must not select") });
  elements(busy.tree, (el) => el.type === "Group" && el.props.onDragMove)[0].props.onClick({});
});

test("cancelled touch/programmatic guest drags restore the seat without changing assignment", () => {
  for (const evt of [undefined, { type: "touchcancel" }, { type: "pointercancel" }]) {
    let cancelled = 0;
    const f = canvasFixture({ tool: "move", onGuestRelease: () => assert.fail("cancel is not a drop"), onGuestCancel: () => cancelled++ });
    const seat = draggableSeatGroups(f.tree)[0], positions = [];
    seat.props.onDragEnd({ evt, target: { getStage: () => ({ getRelativePointerPosition: () => ({ x: 1500, y: 900 }) }), position: (p) => positions.push(p) } });
    assert.deepEqual(positions, [{ x: seat.props.x, y: seat.props.y }]);
    assert.equal(cancelled, 1); assert.deepEqual(f.calls.guests, []);
  }
});

test("outside the visible scroll viewport releases a party even when the full stage still reports a hidden seat", () => {
  for (const evt of [{ type: "mouseup", clientX: 250, clientY: 105 }, { type: "touchend", changedTouches: [{ clientX: 250, clientY: 105 }] }]) {
    const released = [], f = canvasFixture({ tool: "move", onGuestRelease: async (id) => released.push(id) });
    f.tree.props.ref.current.getBoundingClientRect = () => ({ left: 30, right: 580, top: -50, bottom: 40 });
    const seat = draggableSeatGroups(f.tree)[0];
    seat.props.onDragEnd({ evt, target: { getStage: () => ({ getRelativePointerPosition: () => ({ x: 420, y: 246 }) }), position() {} } });
    assert.deepEqual(released, ["guest-a"]); assert.deepEqual(f.calls.guests, []);
  }
});

test("real Konva mouse/touch bubbling drags names and companion seats as their whole party, never the table", (t) => {
  // Only font metrics and the DOM stage boundary are stubbed; Konva selects,
  // bubbles, moves and ends the drag through its actual Node/DD implementation.
  t.mock.method(Konva.Util, "createCanvasElement", () => ({ getContext: () => ({ measureText: (text) => ({ width: Array.from(text).length * 6 }) }) }));
  const autoDraw = Konva.autoDrawEnabled; Konva.autoDrawEnabled = false;
  t.after(() => { DD._dragElements.clear(); Konva.autoDrawEnabled = autoDraw; });
  for (const touch of [false, true]) for (const surface of ["circle", "name"]) {
    const released = [], guest = { id: "party", name: "hendra", invitedPax: 3, tableId: table.id, seatNumber: 8 };
    const f = canvasFixture({ tool: "move", guests: [guest], onGuestRelease: async (id) => released.push(id) });
    const stage = new Konva.Group(), id = touch ? 41 : 999;
    const boundary = {
      _changedPointerPositions: [],
      setPointersPositions(evt) {
        const pointer = evt.touches?.[0] ?? evt.changedTouches?.[0] ?? evt;
        this._changedPointerPositions = [{ id, x: (pointer.clientX - 30) * 2, y: (pointer.clientY + 50) * 2 }];
      },
      _getPointerById() { return this._changedPointerPositions[0]; },
      getRelativePointerPosition() { return this._changedPointerPositions[0]; },
    };
    stage.getStage = () => boundary;
    function mount(element, parent) {
      if (!element || typeof element !== "object") return;
      if (element.type === "div" || element.type === "Stage") {
        React.Children.toArray(element.props.children).forEach((child) => mount(child, parent)); return;
      }
      const { children, ref, ...props } = element.props;
      const attrs = Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith("on")));
      const node = new Konva[element.type === "Layer" ? "Group" : element.type](attrs);
      parent.add(node);
      for (const [key, handler] of Object.entries(props)) if (key.startsWith("on")) node.on(key.slice(2).toLowerCase(), handler);
      if (typeof ref === "function") ref(node);
      React.Children.toArray(children).forEach((child) => mount(child, node));
      return node;
    }
    mount(f.tree, stage);
    const tableNode = stage.find("Group").find((node) => node.draggable() && node.x() === 420);
    const seatNode = tableNode.children.find((node) => node instanceof Konva.Group && Math.abs(node.y() + 64) < 0.001);
    const hit = surface === "circle" ? seatNode.children[0] : seatNode.children.find((node) => node instanceof Konva.Text && node.text() === "Hendra 2");
    assert.equal(hit.isListening(), true);
    const seatPosition = seatNode.position(), tablePosition = tableNode.position();
    const origin = hit.getAbsolutePosition(), client = { clientX: origin.x / 2 + 30, clientY: origin.y / 2 - 50 };
    const event = (type, pointer) => touch
      ? { type, touches: type === "touchend" ? [] : [{ identifier: id, ...pointer }], changedTouches: [{ identifier: id, ...pointer }] }
      : { type, button: 0, ...pointer };
    const down = event(touch ? "touchstart" : "mousedown", client);
    boundary.setPointersPositions(down); hit.fire(down.type, { evt: down }, true);
    assert.deepEqual([...DD._dragElements.values()].map((entry) => entry.node), [seatNode]);
    const move = event(touch ? "touchmove" : "mousemove", { clientX: 10, clientY: 500 });
    DD._drag(move);
    assert.equal(seatNode.isDragging(), true);
    assert.deepEqual(f.calls.guests[0], ["start", guest.id]);
    const up = event(touch ? "touchend" : "mouseup", { clientX: 10, clientY: 500 });
    DD._endDragBefore(up); DD._endDragAfter(up);
    assert.deepEqual(released, [guest.id]); assert.deepEqual(seatNode.position(), seatPosition);
    assert.deepEqual(tableNode.position(), tablePosition);
    assert.ok(!f.calls.tables.some(([action]) => action === "move"));
    assert.equal(DD._dragElements.size, 0);
    stage.destroy();
  }
});

test("party names follow each seat outward with matching canvas/print wrapping and complete capitalization", () => {
  const guest = { id: "party", name: "hendra", tableId: table.id, seatNumber: 1, invitedPax: 8 };
  const f = canvasFixture({ guests: [guest], tool: "move" });
  const printed = PrintModule.default ?? PrintModule;
  const svg = printed({ title: "Acara", layout: layout(), tables: [table], guests: [guest], locale: "id" });
  const canvasLabels = elements(f.tree, (el) => el.type === "Text" && el.props.text.startsWith("Hendra"));
  const printLabels = elements(svg, (el) => el.type === "text" && el.props.dominantBaseline === "text-before-edge");
  assert.equal(canvasLabels.length, 8); assert.equal(printLabels.length, 8);
  assert.ok(canvasLabels[0].props.y < -geometry.SEATING_SEAT_RADIUS); // seat 1, above
  assert.ok(canvasLabels[2].props.x > geometry.SEATING_SEAT_RADIUS); // seat 3, right
  assert.ok(canvasLabels[4].props.y > geometry.SEATING_SEAT_RADIUS); // seat 5, below
  assert.ok(canvasLabels[6].props.x < -geometry.SEATING_SEAT_RADIUS); // seat 7, left
  assert.deepEqual([0, 2, 4, 6].map((i) => canvasLabels[i].props.align), ["center", "left", "center", "right"]);
  canvasLabels.forEach((label, i) => {
    assert.equal(label.props.text, `Hendra ${i + 1}`); assert.equal(label.props.listening, true);
    assert.equal(label.props.x, printLabels[i].props.x); assert.equal(label.props.y, printLabels[i].props.y);
    assert.equal(label.props.fontSize, printLabels[i].props.fontSize);
  });
  const long = "alexander christopher wirawan suryanegara";
  const expected = guestSeats.seatingGuestSeatLabel({ ...guest, name: long }, 3, 8);
  const longCanvas = canvasFixture({ guests: [{ ...guest, name: long }], tool: "move" });
  const label = elements(longCanvas.tree, (el) => el.type === "Text" && el.props.text.endsWith("3"))[1];
  const split = geometry.seatingSeatLabelLayout(expected, 2, 8);
  assert.equal(split.lines.join(" "), expected); assert.ok(split.lines.length > 1);
  assert.ok(label.props.text.includes("\n")); assert.equal(label.props.width, undefined); // auto width never clips a name
  const printLong = printed({ title: "Acara", layout: layout(), tables: [table], guests: [{ ...guest, name: long }], locale: "id" });
  const lines = elements(printLong, (el) => el.type === "text" && el.props.dominantBaseline === "text-before-edge")[2];
  assert.deepEqual(elements(lines, (el) => el.type === "tspan").map((span) => span.props.children), split.lines);
  const word = "ABCDEFGHIJKLMNOPQRSTUVWXY";
  assert.equal(geometry.seatingSeatLabelLayout(word, 0, 8).lines.join(""), word);
});

const Print = PrintModule.default ?? PrintModule;
const GuestActions = ActionsModule.default ?? ActionsModule;
function chartFixture(overrides = {}, interactive = false) {
  const calls = [];
  let canvasProps;
  const cells = [];
  let index = 0;
  let mounted = false, writes = 0;
  const cleanups = [];
  const state = { ...editor.emptySeatingEditor(), plan: layout(), revision, savedKey: editor.seatingPlanKey(layout()), past: [plans.emptySeatingPlan()] };
  const plan = { editor: state, loading: false, saving: false, ready: true, error: "", dispatch: (action) => { calls.push(action); if (interactive) plan.editor = editor.seatingEditorReducer(plan.editor, action); }, save: async (value) => { calls.push(value); return true; }, reload: async () => {}, clear: async () => true, ...overrides };
  const hooks = interactive ? {
    useEffect(effect) { if (!mounted) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } }, useMemo: (fn) => fn(),
    useState(initial) { const key = index++; if (!(key in cells)) cells[key] = initial; return [cells[key], (value) => { writes++; cells[key] = typeof value === "function" ? value(cells[key]) : value; }]; },
    useRef(value) { const key = index++; if (!(key in cells)) cells[key] = { current: value }; return cells[key]; },
  } : { useEffect() {}, useState: (initial) => [initial, () => {}], useRef: (value) => ({ current: value }), useMemo: (fn) => fn() };
  const Chart = loadSource("components/Dashboard/SeatingChart.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: hooks,
    "lucide-react": icons, "@/components/Theme/ThemeProvider": { useTheme: () => ({ isDarkMode: false }) },
    "@/components/ui/button": { Button }, "@/components/ui/input": { Input },
    "@/components/ui/control-styles": { controlStyles }, "@/lib/utils": utils,
    "@/components/ui/dialog": dialogs,
    "@/components/Dashboard/useDashboardI18n": { useDashboardI18n: interactive ? () => ({ d: (text) => text, locale: "id" }) : useDashboardI18n }, "@/lib/text/display-title-case": titles,
    "@/components/Dashboard/DashboardPrimitives": primitives, "@/lib/guests/filters": filters,
    "@/lib/guests/manual-party": manualParty, "@/lib/seating/guest-seats": guestSeats,
    "@/lib/guests/personal-envelope": envelope,
    "@/components/Dashboard/seating-chart-geometry": geometry, "@/lib/seating/plan": plans, "@/lib/seating/editor": editor,
    "./use-seating-plan": { useSeatingPlan: () => plan },
    "./SeatingPlanCanvas": { __esModule: true, default: (props) => { canvasProps = props; return React.createElement("div", { "aria-label": "Denah" }); } },
    "./SeatingPlanPrint": { __esModule: true, default: Print }, "./seating-plan-print-browser": { printSeatingPlan: async () => () => {} },
    "./SeatingGuestActions": { __esModule: true, default: GuestActions },
  }).default;
  return { Chart, calls, plan, canvas: () => canvasProps, unmount: () => cleanups.forEach((cleanup) => cleanup()), writes: () => writes, render: (props) => { index = 0; const tree = Chart(props); mounted = true; return tree; } };
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

const labelOf = (node) => typeof node === "string" || typeof node === "number" ? String(node) : React.Children.toArray(node?.props?.children).map(labelOf).join("");
const chartCanvas = (tree) => elements(tree, (el) => Boolean(el.props?.onTableMove && el.props?.onDrawingChange))[0].props;

test("setup and guest entry sit above a shared canvas panel with the guest list inside it", () => {
  for (const locale of ["id", "en"]) {
    const f = chartFixture();
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(f.Chart, { invitationId: "event-a", tables: [table], guests: [], onAssigned: async () => {} })));
    assert.ok(html.includes(locale === "en" ? "Tables:</span>" : "Meja:</span>"));
    assert.ok(html.includes(locale === "en" ? "Seats:</span>" : "Kursi:</span>"));
    assert.doesNotMatch(html, /Meja ditambahkan|Bangku per meja|Tables to add|Chairs per table/);
    assert.doesNotMatch(html, /aria-label="(?:Halaman denah|Plan pages)"/);
  }
  const f = chartFixture({}, true), tree = f.render({ invitationId: "event-a", tables: [table], guests: [], onAssigned: async () => {} });
  const sections = React.Children.toArray(tree.props.children);
  assert.equal(sections.length, 2);
  assert.ok(sections[0].props.className.includes("auto-fit"));
  assert.ok(sections[0].props.className.includes("items-stretch"));
  assert.deepEqual(elements(sections[0], (el) => el.type === primitives.DashboardPanel).map((el) => el.props.title), ["Struktur meja", "Isi tamu"]);
  const topPanels = React.Children.toArray(sections[0].props.children);
  assert.ok(topPanels.every((panel) => panel.props.className.includes("h-full")));
  assert.equal(elements(topPanels[0], (el) => el.type === "form").length, 1);
  assert.equal(elements(topPanels[1], (el) => el.type === "form").length, 1);
  assert.equal(sections[1].props.title, "Denah tempat duduk");
  const aside = elements(sections[1], (el) => el.type === "aside" && el.props["aria-label"] === "Daftar tamu")[0];
  assert.ok(aside);
  assert.equal(elements(aside, (el) => el.type === primitives.DashboardPanel).length, 0);
  assert.ok(sections[1].props.className.includes("@container"));
  const boardRow = elements(sections[1], (el) => el.props.className?.includes("@min-[52rem]:grid-cols-[minmax(0,1fr)_19rem]"))[0];
  assert.ok(chartCanvas(React.Children.toArray(boardRow.props.children)[0]));
  assert.equal(React.Children.toArray(boardRow.props.children)[1].props["aria-label"], "Daftar tamu");
  assert.equal(chartCanvas(tree).pageOffset, 0);
});

test("page navigation and drag-to-page preserve the full plan, while Save still includes hidden tables/routes", async () => {
  const tall = { ...layout(), height: 1600, tables: { ...layout().tables, "table-b": { x: 700, y: 1310 } } };
  const f = chartFixture({ editor: { ...editor.emptySeatingEditor(), plan: tall } }, true), assigned = [];
  const props = { invitationId: "event-a", tables: [table, { ...table, id: "table-b" }], guests: [{ id: "guest-manual", name: "Naya", source: "MANUAL", tableId: null, invitedPax: 2 }], onAssigned: async (...args) => assigned.push(args) };
  let tree = f.render(props);
  const pages = (tree) => elements(tree, (el) => el.type === Button && /^Halaman \d+$/.test(el.props["aria-label"] ?? ""));
  assert.ok(pages(tree).length > 1); assert.equal(pages(tree)[0].props["aria-current"], "page");
  pages(tree)[1].props.onClick(); tree = f.render(props);
  assert.equal(chartCanvas(tree).pageOffset, geometry.seatingPlanPageOffsets(tall.height)[1]);
  assert.deepEqual(f.calls, []); assert.equal(chartCanvas(tree).tables.length, 2);
  chartCanvas(tree).onDrawingChange(true); tree = f.render(props);
  assert.ok(pages(tree).every((el) => el.props.disabled));
  pages(tree)[0].props.onClick(); assert.equal(chartCanvas(f.render(props)).pageOffset, geometry.seatingPlanPageOffsets(tall.height)[1]);
  chartCanvas(f.render(props)).onDrawingChange(false); tree = f.render(props);
  chartCanvas(tree).onGuestStart("guest-manual"); tree = f.render(props);
  pages(tree).at(-1).props.onDragEnter(); tree = f.render(props);
  assert.equal(chartCanvas(tree).pageOffset, geometry.seatingPlanPageOffsets(tall.height).at(-1));
  assert.equal(chartCanvas(tree).draggedGuestId, "guest-manual");
  await chartCanvas(tree).onGuestDrop("guest-manual", geometry.seatingSeatPoint(tall.tables["table-b"], 0, table.capacity));
  assert.deepEqual(assigned, [["guest-manual", "table-b", 1]]);
  tree = f.render(props); chartButton(tree, "Simpan denah").props.onClick(); await flush();
  assert.deepEqual(f.calls.at(-1), tall);
  f.plan.editor = { ...editor.emptySeatingEditor(), plan: layout() };
  tree = f.render({ ...props, tables: [table], guests: [] });
  assert.equal(chartCanvas(tree).pageOffset, 0); assert.equal(pages(tree).length, 0);
});
const chartButton = (tree, label) => elements(tree, (el) => el.type === Button && labelOf(el) === label)[0];
const chartProps = { invitationId: "event-a", tables: [table], guests: [{ id: "guest-a", name: "Naya", source: "MANUAL", tableId: table.id, seatNumber: 2 }], onAssigned: async () => {} };

const rosterProps = {
  ...chartProps,
  guests: [
    { id: "regular-null", name: "zaki", source: "MANUAL", category: null, invitedPax: 1 },
    { id: "regular-party", name: "andi & rina", source: "MANUAL", category: "REGULAR", invitedPax: 2, tags: ["keluarga"] },
    { id: "vip-party", name: "hendra wijaya", source: "MANUAL", category: "VIP", invitedPax: 3, tableId: table.id, seatNumber: 8, tags: ["keluarga"] },
    { id: "vvip-attending", name: "naya", source: "RSVP", rsvpStatus: "ATTENDING", category: "VVIP", invitedPax: 1 },
    { id: "legacy-category", name: "budi", source: "MANUAL", category: "keluarga" },
    { id: "declined", name: "tidak hadir", source: "RSVP", rsvpStatus: "DECLINED", category: "VIP" },
    { id: "pending", name: "belum menjawab", source: "RSVP", rsvpStatus: "PENDING", category: "VVIP" },
    { id: "assigned-declined", name: "sudah ditempatkan", source: "RSVP", rsvpStatus: "DECLINED", category: "VIP", tableId: table.id, seatNumber: 4 },
  ],
};
const rosterRows = (tree) => elements(tree, (el) => el.type === "li" && Boolean(el.props["data-guest-id"]));
const rosterSelect = (tree, optionText) => elements(tree, (el) => el.type === "select" && labelOf(el).includes(optionText))[0];
const guestActions = (tree, id) => elements(tree, (el) => el.type === GuestActions && el.props.guest.id === id)[0];
const guestForm = (tree) => elements(tree, (el) => el.type === "form" && el.props["data-guest-action"])[0];
const selectedGuestRow = (tree) => elements(tree, (el) => Boolean(el.props["data-seated-guest"]))[0];
function beginGuestAction(f, props, guest, mode = "edit") {
  let tree = f.render(props);
  if (guest.tableId) { chartCanvas(tree).onGuestSelect(guest.id); tree = f.render(props); }
  guestActions(tree, guest.id).props[mode === "edit" ? "onEdit" : "onDelete"](guest);
  return f.render(props);
}

test("roster membership waits for successful placement, retains failed attempts and never drops the canonical party", async () => {
  const guest = rosterProps.guests[1], f = chartFixture({}, true), pending = deferred();
  let result = pending.promise;
  const props = { ...chartProps, guests: [guest], onAssigned: () => result };
  let tree = f.render(props);
  const target = geometry.seatingSeatPoint(layout().tables[table.id], 5, table.capacity);
  const saving = chartCanvas(tree).onGuestDrop(guest.id, target); tree = f.render(props);
  assert.equal(rosterRows(tree).length, 1); assert.equal(chartCanvas(tree).busy, true);
  pending.reject(Error("Meja penuh")); await saving; tree = f.render(props);
  assert.equal(rosterRows(tree).length, 1); assert.deepEqual(chartCanvas(tree).guests, [guest]);
  result = Promise.resolve(); await chartCanvas(tree).onGuestDrop(guest.id, target); tree = f.render(props);
  assert.equal(rosterRows(tree).length, 0); assert.equal(chartCanvas(tree).guests.length, 1);
  assert.deepEqual(chartCanvas(tree).guests[0], { ...guest, tableId: table.id, seatNumber: 6 });
  const print = renderToStaticMarkup(React.createElement(Print, { title: "Acara", layout: layout(), tables: [table], guests: chartCanvas(tree).guests, locale: "id" }));
  assert.ok(print.includes("Andi &amp; Rina 1")); assert.ok(print.includes("Andi &amp; Rina 2"));
});

test("selected guest release saves first, returns the complete party to the right list and permits re-assignment", async (t) => {
  const guest = rosterProps.guests[2], pending = deferred(), requests = [], assignments = [];
  let refreshed = 0;
  const props = { ...chartProps, guests: [guest], onTablesChanged: async () => { refreshed++; }, onAssigned: async (...args) => assignments.push(args) };
  const f = chartFixture({}, true);
  t.mock.method(globalThis, "fetch", (url, options) => { requests.push({ url, options }); return pending.promise; });
  let tree = f.render(props); chartCanvas(tree).onGuestSelect(guest.id); tree = f.render(props);
  assert.equal(rosterRows(tree).length, 0); assert.ok(selectedGuestRow(tree));
  chartButton(tree, "Lepas dari meja").props.onClick(); tree = f.render(props);
  assert.equal(rosterRows(tree).length, 0); assert.deepEqual(chartCanvas(tree).guests, [guest]);
  assert.equal(chartCanvas(tree).busy, true); assert.equal(chartButton(tree, "Menyimpan...").props.disabled, true);
  assert.equal(requests[0].url, `/api/guests/${guest.id}`); assert.equal(requests[0].options.method, "PATCH");
  assert.deepEqual(JSON.parse(requests[0].options.body), { tableId: null, seatNumber: null });
  pending.resolve(Response.json({ guest: { ...guest, invitationId: "event-a", tableId: null, seatNumber: null } }));
  await flush(); tree = f.render(props);
  const released = { ...guest, tableId: null, seatNumber: null };
  assert.deepEqual(chartCanvas(tree).guests, [released]); assert.equal(rosterRows(tree).length, 1);
  assert.equal(rosterRows(tree)[0].props["data-guest-id"], guest.id); assert.equal(rosterRows(tree)[0].props.draggable, true);
  assert.ok(labelOf(rosterRows(tree)[0]).includes("3 orang")); assert.equal(selectedGuestRow(tree), undefined);
  assert.equal(elements(tree, (el) => el.type === primitives.DashboardCompactStat && el.props.label === "Terisi")[0].props.value, "0");
  assert.equal(refreshed, 1); assert.deepEqual(f.plan.editor.plan, layout());
  await chartCanvas(tree).onGuestDrop(guest.id, geometry.seatingSeatPoint(layout().tables[table.id], 4, table.capacity)); tree = f.render(props);
  assert.deepEqual(assignments, [[guest.id, table.id, 5]]); assert.equal(rosterRows(tree).length, 0);
  assert.equal(chartCanvas(tree).guests[0].invitedPax, 3); assert.equal(chartCanvas(tree).guests[0].seatNumber, 5);
});

test("failed or malformed releases preserve seats and selected actions for retry", async (t) => {
  const guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] };
  for (const result of [
    Response.json({ error: "offline" }, { status: 503 }),
    Response.json({ guest: { ...guest, invitationId: "event-a" } }),
    Response.json({ guest: { ...guest, invitationId: "other", tableId: null, seatNumber: null } }),
    Response.json({ guest: { ...guest, id: "other", invitationId: "event-a", tableId: null, seatNumber: null } }),
    Response.json({ guest: { ...guest, invitationId: "event-a", tableId: null, seatNumber: 8 } }),
  ]) {
    const f = chartFixture({}, true); t.mock.method(globalThis, "fetch", async () => result);
    let tree = f.render(props); chartCanvas(tree).onGuestSelect(guest.id); tree = f.render(props);
    chartButton(tree, "Lepas dari meja").props.onClick(); await flush(); tree = f.render(props);
    assert.deepEqual(chartCanvas(tree).guests, [guest]); assert.equal(rosterRows(tree).length, 0);
    assert.ok(selectedGuestRow(tree)); assert.equal(chartButton(tree, "Lepas dari meja").props.disabled, false);
    assert.equal(elements(tree, (el) => el.type === primitives.DashboardCompactStat && el.props.label === "Terisi")[0].props.value, "3");
  }
});

test("release blocks same-frame duplicates and ignores aborted late replies", async (t) => {
  const guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] }, f = chartFixture({}, true), pending = deferred(), calls = [];
  t.mock.method(globalThis, "fetch", (_url, options) => { calls.push(options); return pending.promise; });
  let tree = f.render(props); chartCanvas(tree).onGuestSelect(guest.id); tree = f.render(props);
  const button = chartButton(tree, "Lepas dari meja"); button.props.onClick(); button.props.onClick();
  assert.equal(calls.length, 1); f.unmount(); const writes = f.writes();
  assert.equal(calls[0].signal.aborted, true);
  pending.resolve(Response.json({ guest: { ...guest, invitationId: "event-a", tableId: null, seatNumber: null } })); await flush();
  assert.equal(f.writes(), writes); assert.deepEqual(chartCanvas(f.render(props)).guests, [guest]);
});

test("empty canvas drops return seated parties but preserve waiting rows; valid seats still accept placement", async (t) => {
  const guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] }, f = chartFixture({}, true), requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options }); return Response.json({ guest: { ...guest, invitationId: "event-a", tableId: null, seatNumber: null } });
  });
  let tree = f.render(props);
  await chartCanvas(tree).onGuestRelease("unknown");
  assert.equal(requests.length, 0);
  await chartCanvas(tree).onGuestDrop(guest.id, { x: 800, y: 550 }); tree = f.render(props);
  assert.equal(requests.length, 1); assert.equal(rosterRows(tree)[0].props["data-guest-id"], guest.id);
  assert.equal(chartCanvas(tree).guests[0].tableId, null);
  assert.deepEqual(JSON.parse(requests[0].options.body), { tableId: null, seatNumber: null });
  await chartCanvas(tree).onGuestDrop(guest.id, { x: 800, y: 550 }); tree = f.render(props);
  assert.equal(requests.length, 1); assert.equal(rosterRows(tree).length, 1);
  const moves = [], mover = chartFixture({}, true);
  let moving = mover.render({ ...props, onAssigned: async (...args) => moves.push(args) });
  chartCanvas(moving).onGuestStart(guest.id); moving = mover.render({ ...props, onAssigned: async (...args) => moves.push(args) });
  await chartCanvas(moving).onGuestDrop(guest.id, geometry.seatingSeatPoint(layout().tables[table.id], 3, table.capacity));
  assert.deepEqual(moves, [[guest.id, table.id, 4]]); assert.equal(requests.length, 1);
});

test("a same-frame guest drop uses the dragged identity rather than stale hover state for collision checks", async () => {
  const guest = rosterProps.guests[2], moves = [], f = chartFixture({}, true);
  const tree = f.render({ ...chartProps, guests: [guest], onAssigned: async (...args) => moves.push(args) });
  // onGuestStart has not rendered yet; the saved anchor is occupied by this party.
  chartCanvas(tree).onGuestStart(guest.id);
  await chartCanvas(tree).onGuestDrop(guest.id, geometry.seatingSeatPoint(layout().tables[table.id], 7, table.capacity));
  assert.deepEqual(moves, [[guest.id, table.id, 8]]);
});

test("legacy table reservations without a seat anchor remain in the right list and can be placed", async () => {
  const guest = { ...rosterProps.guests[2], seatNumber: null }, assigned = [], props = { ...chartProps, guests: [guest], onAssigned: async (...args) => assigned.push(args) };
  const f = chartFixture({}, true); let tree = f.render(props);
  assert.equal(rosterRows(tree).length, 1); assert.equal(rosterRows(tree)[0].props.draggable, true);
  await chartCanvas(tree).onGuestDrop(guest.id, geometry.seatingSeatPoint(layout().tables[table.id], 4, table.capacity)); tree = f.render(props);
  assert.deepEqual(assigned, [[guest.id, table.id, 5]]); assert.equal(rosterRows(tree).length, 0);
});


test("six-dot guest menu keeps keyboard semantics, dispatches the exact guest and never starts row drag", () => {
  const calls = [], guest = rosterProps.guests[2];
  const Actions = loadSource("components/Dashboard/SeatingGuestActions.tsx", {
    "react/jsx-runtime": jsxRuntime, "@base-ui/react/menu": { Menu: Object.fromEntries(["Root", "Trigger", "Portal", "Positioner", "Popup", "Item"].map((name) => [name, name])) },
    "lucide-react": icons, "@/components/ui/button": { Button }, "@/components/ui/control-styles": { controlStyles }, "@/lib/utils": utils,
    "./useDashboardI18n": { useDashboardI18n: () => ({ d: (text) => text }) }, "@/lib/text/display-title-case": titles,
  }).default;
  for (const disabled of [false, true]) {
    const tree = Actions({ guest, disabled, onEdit: (value) => calls.push(["edit", value]), onDelete: (value) => calls.push(["delete", value]) });
    const trigger = elements(tree, (el) => el.type === "Trigger")[0];
    assert.equal(trigger.props.draggable, false); assert.equal(trigger.props.disabled, disabled);
    assert.equal(trigger.props["aria-label"], "Aksi tamu: Hendra Wijaya");
    assert.ok(trigger.props.render.props.className.includes("min-h-11"));
    let stopped = 0;
    trigger.props.onDragStart({ preventDefault() { stopped++; }, stopPropagation() { stopped++; } });
    assert.equal(stopped, 2);
    const items = elements(tree, (el) => el.type === "Item");
    assert.deepEqual(items.map(labelOf), ["Edit", "Hapus"]);
    items.forEach((item) => item.props.onClick());
  }
  assert.deepEqual(calls, [["edit", guest], ["delete", guest]]);
  for (const locale of ["id", "en"]) {
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(GuestActions, { guest, disabled: false, onEdit() {}, onDelete() {} })));
    assert.ok(html.includes(`aria-label="${locale === "en" ? "Guest actions" : "Aksi tamu"}: Hendra Wijaya"`));
    assert.match(html, /aria-haspopup="menu"/);
  }
  const f = chartFixture({}, true), tree = f.render(rosterProps);
  assert.equal(elements(tree, (el) => el.type === GuestActions).length, rosterRows(tree).length);
  let prevented = false;
  rosterRows(tree)[0].props.onDragStart({ target: { closest: () => ({}) }, preventDefault() { prevented = true; }, dataTransfer: { setData() { assert.fail("menu drag must not transfer a guest"); } } });
  assert.equal(prevented, true); assert.equal(chartCanvas(f.render(rosterProps)).draggedGuestId, null);
  const row = rosterRows(tree)[0];
  row.props.onPointerDownCapture({ target: { closest: () => ({}) } });
  prevented = false;
  row.props.onDragStart({ target: { closest: () => null }, preventDefault() { prevented = true; }, dataTransfer: { setData() { assert.fail("ancestor-retargeted menu drag must not transfer a guest"); } } });
  assert.equal(prevented, true);
  row.props.onPointerDownCapture({ target: { closest: () => null } });
  const transferred = [];
  row.props.onDragStart({ dataTransfer: { setData: (...args) => transferred.push(args) } });
  assert.deepEqual(transferred, [["text/plain", row.props["data-guest-id"]]]);
});

test("edit saves name/category on the canonical assigned party and updates roster, canvas and print", async (t) => {
  const guest = rosterProps.guests[2], requests = [];
  let refreshed = 0;
  const props = { ...chartProps, guests: [guest], onTablesChanged: async () => { refreshed++; } }, f = chartFixture({}, true);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body); requests.push({ url, options, body });
    return Response.json({ ok: true, guest: { ...guest, name: body.name, category: body.category, invitationId: props.invitationId } });
  });
  let tree = f.render(props);
  tree = beginGuestAction(f, props, guest);
  let form = guestForm(tree);
  elements(form, (el) => el.type === Input)[0].props.onChange({ target: { value: "  hendra baru  " } });
  elements(form, (el) => el.type === "select")[0].props.onChange({ target: { value: "VVIP" } });
  tree = f.render(props); form = guestForm(tree);
  await form.props.onSubmit({ preventDefault() {} }); tree = f.render(props);
  assert.equal(guestForm(tree), undefined);
  assert.equal(requests[0].url, "/api/guests/manage"); assert.equal(requests[0].options.method, "PATCH");
  assert.deepEqual(requests[0].body, { id: guest.id, invitationId: "event-a", name: "hendra baru", category: "VVIP" });
  const updated = chartCanvas(tree).guests[0];
  assert.deepEqual(updated, { ...guest, name: "hendra baru", category: "VVIP" });
  assert.equal(rosterRows(tree).length, 0); assert.ok(labelOf(selectedGuestRow(tree)).includes("Hendra Baru")); assert.ok(labelOf(selectedGuestRow(tree)).includes("Kursi 8, 1, 2"));
  assert.equal(guestActions(tree, guest.id).props.guest.category, "VVIP");
  const print = renderToStaticMarkup(React.createElement(Print, { title: "Acara", layout: layout(), tables: [table], guests: [updated], locale: "id" }));
  for (const label of ["Hendra Baru 1", "Hendra Baru 2", "Hendra Baru 3"]) assert.ok(print.includes(label));
  assert.equal(refreshed, 1); assert.deepEqual(f.plan.editor.plan, layout()); assert.equal(guest.name, "hendra wijaya");
  const refreshedGuest = { ...guest, plusOnes: 1, invitedPax: 2, seatNumber: 5 };
  assert.deepEqual(chartCanvas(f.render({ ...props, guests: [refreshedGuest] })).guests[0], { ...refreshedGuest, name: "hendra baru", category: "VVIP" });
});

test("name-only edits retain a legacy or missing category and local rename survives later assignment", async (t) => {
  const bodies = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body); bodies.push(body);
    return Response.json({ ok: true, guest: { id: body.id, invitationId: body.invitationId, name: body.name } });
  });
  for (const guest of [rosterProps.guests[0], rosterProps.guests[4]]) {
    const props = { ...chartProps, guests: [guest] }, f = chartFixture({}, true);
    let tree = f.render(props); tree = beginGuestAction(f, props, guest);
    elements(guestForm(tree), (el) => el.type === Input)[0].props.onChange({ target: { value: "nama baru" } });
    await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.equal(Object.hasOwn(bodies.at(-1), "category"), false);
    assert.equal(chartCanvas(tree).guests[0].category, guest.category);
    await chartCanvas(tree).onGuestDrop(guest.id, geometry.seatingSeatPoint(layout().tables[table.id], 5, table.capacity));
    const assigned = chartCanvas(f.render(props)).guests[0];
    assert.equal(assigned.name, "nama baru"); assert.equal(assigned.tableId, table.id); assert.equal(assigned.seatNumber, 6);
  }
});

test("failed or mismatched edit responses retain draft fields and the original shared party", async (t) => {
  const guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] };
  for (const result of [Response.json({ error: "temporary failure" }, { status: 500 }), Response.json({ ok: true, guest: { ...guest, invitationId: "other-event", name: "wrong" } }), Response.json({ ok: true, guest: { ...guest, id: "other-guest", invitationId: "event-a" } }), Response.json({ ok: true, guest: { ...guest, invitationId: "event-a", category: [] } })]) {
    t.mock.method(globalThis, "fetch", async () => result);
    const f = chartFixture({}, true); let tree = f.render(props);
    tree = beginGuestAction(f, props, guest);
    elements(guestForm(tree), (el) => el.type === Input)[0].props.onChange({ target: { value: "retry name" } });
    await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.equal(elements(guestForm(tree), (el) => el.type === Input)[0].props.value, "retry name");
    assert.equal(elements(guestForm(tree), (el) => el.props.role === "alert").length, 1);
    assert.deepEqual(chartCanvas(tree).guests, [guest]); assert.equal(chartCanvas(tree).busy, false);
  }
});

test("party edits grow and shrink the whole canonical block, occupancy and numbered print labels", async (t) => {
  const original = rosterProps.guests[2], requests = [], f = chartFixture({}, true);
  let refreshed = 0;
  const props = { ...chartProps, guests: [original], onTablesChanged: async () => { refreshed++; } };
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body); requests.push(body);
    return Response.json({ ok: true, guest: { ...original, invitationId: props.invitationId, invitedPax: body.invitedPax } });
  });
  let tree = f.render(props);
  for (const pax of [5, 2]) {
    const current = chartCanvas(tree).guests[0];
    tree = beginGuestAction(f, props, current);
    const input = elements(guestForm(tree), (el) => el.type === Input && el.props.type === "number")[0];
    assert.equal(input.props.value, guestSeats.seatingPartySize(current));
    assert.equal(input.props.min, 1); assert.equal(input.props.max, 30); assert.equal(input.props.step, 1);
    input.props.onChange({ target: { value: String(pax) } });
    await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.equal(guestForm(tree), undefined);
    assert.deepEqual(requests.at(-1), { id: original.id, invitationId: "event-a", name: original.name, invitedPax: pax });
    const changed = chartCanvas(tree).guests;
    assert.deepEqual(changed, [{ ...original, invitedPax: pax }]);
    assert.equal(elements(tree, (el) => el.type === primitives.DashboardCompactStat && el.props.label === "Terisi")[0].props.value, String(pax));
    assert.ok(labelOf(selectedGuestRow(tree)).includes(`${pax} orang`)); assert.equal(rosterRows(tree).length, 0);
    const printed = renderToStaticMarkup(React.createElement(Print, { title: "Acara", layout: layout(), tables: [table], guests: changed, locale: "id" }));
    for (let i = 1; i <= pax; i++) assert.ok(printed.includes(`Hendra Wijaya ${i}`));
    assert.ok(!printed.includes(`Hendra Wijaya ${pax + 1}`));
    assert.deepEqual(f.plan.editor.plan, layout());
  }
  assert.equal(refreshed, 2); assert.equal(original.invitedPax, 3);
});

test("party editing rejects invalid counts and respects the generated Bapak & Ibu minimum", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (...args) => { requests.push(args); throw Error("Unexpected write"); });
  for (const [guest, count, message] of [
    [rosterProps.guests[2], "0", /1–30/], [rosterProps.guests[2], "31", /1–30/],
    [rosterProps.guests[2], "1.5", /1–30/], [rosterProps.guests[2], "", /1–30/],
    [{ ...rosterProps.guests[2], personalAddressee: envelope.buildPersonalGuestAddressee(rosterProps.guests[2].name, "BAPAK_IBU") }, "1", /minimal 2/],
  ]) {
    const f = chartFixture({}, true), props = { ...chartProps, guests: [guest] };
    let tree = f.render(props); tree = beginGuestAction(f, props, guest);
    const input = elements(guestForm(tree), (el) => el.type === Input && el.props.type === "number")[0];
    assert.equal(input.props.min, guest.personalAddressee ? 2 : 1);
    input.props.onChange({ target: { value: count } });
    await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.match(labelOf(elements(guestForm(tree), (el) => el.props.role === "alert")[0]), message);
    assert.deepEqual(chartCanvas(tree).guests, [guest]);
  }
  assert.equal(requests.length, 0);
});

test("failed or wrong quota responses keep the original block and edited count for retry", async (t) => {
  const guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] };
  for (const result of [
    Response.json({ error: "Kursi bersebelahan tidak cukup. Pindahkan tamu terlebih dahulu." }, { status: 409 }),
    Response.json({ ok: true, guest: { id: guest.id, name: guest.name, invitationId: "event-a" } }),
    Response.json({ ok: true, guest: { ...guest, invitedPax: "5", invitationId: "event-a" } }),
    Response.json({ ok: true, guest: { ...guest, invitedPax: 4, invitationId: "event-a" } }),
  ]) {
    const f = chartFixture({}, true); t.mock.method(globalThis, "fetch", async () => result);
    let tree = f.render(props); tree = beginGuestAction(f, props, guest);
    elements(guestForm(tree), (el) => el.type === Input && el.props.type === "number")[0].props.onChange({ target: { value: "5" } });
    await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.equal(elements(guestForm(tree), (el) => el.type === Input && el.props.type === "number")[0].props.value, 5);
    assert.equal(elements(guestForm(tree), (el) => el.props.role === "alert").length, 1);
    assert.deepEqual(chartCanvas(tree).guests, [guest]);
  }
});

test("tag filter appears only for actual tags or an active filter, which remains resettable", () => {
  const f = chartFixture({}, true), guest = { ...rosterProps.guests[0], tags: [] }, props = { ...chartProps, guests: [guest] };
  let tree = f.render(props);
  assert.equal(rosterSelect(tree, "Semua Tag"), undefined);
  const tagged = { ...guest, tags: ["teman kantor"] };
  tree = f.render({ ...props, guests: [tagged] });
  rosterSelect(tree, "Semua Tag").props.onChange({ target: { value: "teman kantor" } });
  tree = f.render(props);
  assert.ok(rosterSelect(tree, "Semua Tag")); assert.equal(rosterRows(tree).length, 0);
  chartButton(tree, "Reset filter").props.onClick(); tree = f.render(props);
  assert.equal(rosterSelect(tree, "Semua Tag"), undefined); assert.equal(rosterRows(tree).length, 1);
});

test("delete needs named confirmation, preserves a protected guest on failure and frees the whole party after success", async (t) => {
  const guest = rosterProps.guests[2], calls = [], props = { ...chartProps, guests: [guest] }, f = chartFixture({}, true);
  let failing = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options }); return failing ? Response.json({ error: "Tamu ini sudah mempunyai undangan personal atau catatan check-in. Data bersama tidak dapat dihapus dari daftar biasa." }, { status: 409 }) : Response.json({ ok: true });
  });
  let tree = f.render(props); tree = beginGuestAction(f, props, guest, "delete");
  assert.ok(labelOf(guestForm(tree)).includes("Hendra Wijaya")); assert.equal(calls.length, 0);
  chartButton(guestForm(tree), "Batal").props.onClick(); tree = f.render(props);
  assert.equal(guestForm(tree), undefined); assert.equal(calls.length, 0);
  guestActions(tree, guest.id).props.onDelete(guest);
  await guestForm(f.render(props)).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
  assert.equal(rosterRows(tree).length, 0); assert.ok(selectedGuestRow(tree)); assert.deepEqual(chartCanvas(tree).guests, [guest]);
  assert.ok(labelOf(guestForm(tree)).includes("catatan check-in"));
  failing = false; await guestForm(tree).props.onSubmit({ preventDefault() {} }); tree = f.render(props);
  assert.equal(guestForm(tree), undefined); assert.equal(rosterRows(tree).length, 0); assert.deepEqual(chartCanvas(tree).guests, []);
  assert.equal(calls[0].url, `/api/guests/manage?id=${guest.id}&invitationId=event-a`); assert.equal(calls[0].options.method, "DELETE");
  assert.equal(elements(tree, (el) => el.type === primitives.DashboardCompactStat && el.props.label === "Terisi")[0].props.value, "0");
  const printed = renderToStaticMarkup(React.createElement(Print, { title: "Acara", layout: layout(), tables: [table], guests: chartCanvas(tree).guests, locale: "id" }));
  assert.ok(!printed.includes("Hendra Wijaya")); assert.deepEqual(f.plan.editor.plan, layout());
});

test("guest mutations block same-frame duplicate submits, lock canvas controls and ignore aborted late responses", async (t) => {
  for (const mode of ["edit", "delete"]) {
    const pending = deferred(), calls = [], guest = rosterProps.guests[2], props = { ...chartProps, guests: [guest] }, f = chartFixture({}, true);
    t.mock.method(globalThis, "fetch", (url, options) => { calls.push({ url, options }); return pending.promise; });
    let tree = beginGuestAction(f, props, guest, mode);
    const form = guestForm(f.render(props)), saving = form.props.onSubmit({ preventDefault() {} });
    await form.props.onSubmit({ preventDefault() {} }); tree = f.render(props);
    assert.equal(calls.length, 1); assert.equal(chartCanvas(tree).busy, true); assert.equal(guestActions(tree, guest.id).props.disabled, true);
    assert.equal(chartButton(tree, "Tambah meja").props.disabled, true); assert.equal(chartButton(guestForm(tree), "Batal").props.disabled, true);
    if (mode === "edit") assert.equal(elements(guestForm(tree), (el) => el.type === Input && el.props.type === "number")[0].props.disabled, true);
    f.unmount(); const writes = f.writes(); assert.equal(calls[0].options.signal.aborted, true);
    pending.resolve(Response.json({ ok: true, guest: { ...guest, invitationId: "event-a", name: "late name" } })); await saving;
    assert.equal(f.writes(), writes); assert.deepEqual(chartCanvas(f.render(props)).guests, [guest]);
  }
});

test("smaller shared table and seat shapes match canvas, print and usable seat drop targets", () => {
  const guest = { id: "guest-a", name: "naya", tableId: table.id, seatNumber: 1 }, plan = layout();
  const f = canvasFixture({ tool: "move" });
  const center = elements(f.tree, (el) => el.type === "Group" && el.props.x === 420)[0];
  assert.ok(elements(center, (el) => el.type === "Circle" && el.props.radius === geometry.SEATING_TABLE_BODY_RADIUS).length);
  assert.ok(elements(center, (el) => el.type === "Circle" && el.props.radius === geometry.SEATING_SEAT_RADIUS).length);
  const print = Print({ title: "Acara", layout: plan, tables: [table], guests: [guest], locale: "id" });
  assert.equal(elements(print, (el) => el.type === "circle" && el.props.r === geometry.SEATING_TABLE_BODY_RADIUS).length, 1);
  assert.equal(elements(print, (el) => el.type === "circle" && el.props.r === geometry.SEATING_SEAT_RADIUS).length, table.capacity);
  assert.equal(elements(center, (el) => el.type === "Text" && el.props.text === "1")[0].props.fontSize, 10);
  for (let i = 0; i < table.capacity; i++) {
    const seat = geometry.seatingSeatPoint(plan.tables[table.id], i, table.capacity);
    assert.ok(Math.abs(Math.hypot(seat.x - 420, seat.y - 310) - 64) < 0.001);
    assert.equal(geometry.findSeatingSeatTarget(seat, [table], [guest], null, plan).seat, i + 1);
  }
  const seat = geometry.seatingSeatPoint(plan.tables[table.id], 0, table.capacity);
  assert.equal(geometry.findSeatingSeatTarget({ ...seat, y: seat.y - 30 }, [table], [guest], null, plan).seat, 1);
  for (const shape of ["SQUARE", "RECTANGLE"]) {
    const shaped = { ...table, shape }, bounds = geometry.seatingTableBounds(shape);
    const canvas = canvasFixture({ tables: [shaped] }).tree;
    const rect = elements(canvas, (el) => el.type === "Rect" && el.props.width === bounds.width && el.props.height === bounds.height)[0];
    assert.ok(rect);
    const svg = Print({ title: "Acara", layout: plan, tables: [shaped], guests: [], locale: "id" });
    assert.equal(elements(svg, (el) => el.type === "rect" && el.props.width === bounds.width && el.props.height === bounds.height).length, 1);
  }
  assert.deepEqual(plan.tables[table.id], { x: 420, y: 310 });
});

test("member roster lists only eligible unassigned guests and keeps assigned parties in canvas data", () => {
  const original = structuredClone(rosterProps.guests), f = chartFixture({}, true);
  const tree = f.render(rosterProps);
  const groups = elements(tree, (el) => el.type === "section" && el.props["aria-label"]);
  assert.deepEqual(groups.map((group) => group.props["aria-label"]), ["Reguler", "VVIP", "Keluarga"]);
  assert.deepEqual(rosterRows(groups[0]).map((row) => row.props["data-guest-id"]), ["regular-party", "regular-null"]);
  assert.equal(rosterRows(tree).length, 4);
  assert.equal(rosterRows(tree).filter((row) => row.props.draggable).length, 4);
  assert.ok(!rosterRows(tree).some((row) => ["pending", "declined"].includes(row.props["data-guest-id"])));
  assert.ok(!rosterRows(tree).some((row) => ["vip-party", "assigned-declined"].includes(row.props["data-guest-id"])));
  assert.deepEqual(chartCanvas(tree).guests, original);
  assert.ok(labelOf(rosterRows(tree).find((row) => row.props["data-guest-id"] === "regular-party")).includes("Belum ditempatkan"));
  assert.ok(labelOf(rosterRows(tree).find((row) => row.props["data-guest-id"] === "vvip-attending")).includes("RSVP · Hadir"));
  assert.deepEqual(rosterProps.guests, original);
});

test("member roster filters count only unassigned guests and keep an empty active category resettable", () => {
  const f = chartFixture({}, true);
  let tree = f.render(rosterProps);
  rosterSelect(tree, "Semua Kategori").props.onChange({ target: { value: "REGULAR" } });
  tree = f.render(rosterProps);
  assert.deepEqual(rosterRows(tree).map((row) => row.props["data-guest-id"]), ["regular-party", "regular-null"]);
  rosterSelect(tree, "Semua Tag").props.onChange({ target: { value: "keluarga" } });
  tree = f.render(rosterProps);
  assert.deepEqual(rosterRows(tree).map((row) => row.props["data-guest-id"]), ["regular-party"]);
  rosterSelect(tree, "Semua Kategori").props.onChange({ target: { value: "VIP" } });
  tree = f.render(rosterProps);
  assert.deepEqual(rosterRows(tree).map((row) => row.props["data-guest-id"]), []);
  assert.ok(labelOf(elements(tree, (el) => el.props.role === "status")[0]).includes("0 dari 4 tamu belum ditempatkan"));
  rosterSelect(tree, "Semua Tag").props.onChange({ target: { value: "tag-lama" } });
  tree = f.render(rosterProps);
  assert.equal(rosterRows(tree).length, 0);
  assert.equal(elements(tree, (el) => el.type === primitives.DashboardEmptyState)[0].props.title, "Tidak ada hasil");
  assert.ok(labelOf(rosterSelect(tree, "Semua Tag")).includes("Tag-Lama"));
  chartButton(tree, "Reset filter").props.onClick();
  tree = f.render(rosterProps);
  assert.equal(rosterRows(tree).length, 4);
  assert.equal(chartButton(tree, "Reset filter"), undefined);
});

test("member row drags the canonical party ID, updates placement after assignment and blocks drag while drawing or busy", async () => {
  const assigned = [], f = chartFixture({}, true);
  const props = { ...chartProps, guests: [rosterProps.guests[1]], onAssigned: async (...args) => assigned.push(args) };
  const data = [], transfer = { setData: (...args) => data.push(args), dropEffect: "none" };
  let tree = f.render(props);
  rosterRows(tree)[0].props.onDragStart({ dataTransfer: transfer });
  assert.deepEqual(data, [["text/plain", "regular-party"]]); assert.equal(transfer.effectAllowed, "move");
  tree = f.render(props); assert.equal(chartCanvas(tree).draggedGuestId, "regular-party");
  rosterRows(tree)[0].props.onDragEnd({ dataTransfer: transfer });
  tree = f.render(props); assert.equal(chartCanvas(tree).draggedGuestId, null);
  chartButton(tree, "Gambar jalur").props.onClick(); tree = f.render(props);
  let prevented = 0;
  assert.equal(rosterRows(tree)[0].props.draggable, false);
  rosterRows(tree)[0].props.onDragStart({ preventDefault() { prevented++; }, dataTransfer: transfer });
  assert.equal(prevented, 1); assert.equal(data.length, 1);
  chartButton(tree, "Selesai menggambar").props.onClick(); tree = f.render(props);
  rosterRows(tree)[0].props.onDragStart({ dataTransfer: transfer });
  tree = f.render(props);
  await chartCanvas(tree).onGuestDrop("regular-party", geometry.seatingSeatPoint(layout().tables[table.id], 5, table.capacity));
  tree = f.render(props);
  assert.deepEqual(assigned, [["regular-party", table.id, 6]]);
  assert.equal(rosterRows(tree).length, 0);
  assert.equal(elements(tree, (el) => el.type === primitives.DashboardEmptyState)[0].props.title, "Semua tamu sudah ditempatkan");
  assert.equal(chartCanvas(tree).guests.length, 1); assert.equal(chartCanvas(tree).guests[0].invitedPax, 2);
  const pending = chartFixture({ loading: true }, true);
  const row = rosterRows(pending.render(props))[0];
  assert.equal(row.props.draggable, false);
  row.props.onDragStart({ preventDefault() { prevented++; }, dataTransfer: transfer });
  assert.equal(prevented, 2); assert.equal(data.length, 2);
});

test("member roster renders translated group, placement and empty states in both languages", () => {
  for (const locale of ["id", "en"]) {
    const f = chartFixture();
    const render = (props) => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(f.Chart, props)));
    const html = render(rosterProps);
    for (const text of locale === "en" ? ["Guest list", "Regular", "2 people", "1 person", "Unassigned"] : ["Daftar tamu", "Reguler", "2 orang", "Belum ditempatkan"]) assert.ok(html.includes(text), text);
    const placed = render({ ...chartProps, guests: [rosterProps.guests[2]] });
    assert.ok(placed.includes(locale === "en" ? "All guests are assigned" : "Semua tamu sudah ditempatkan"));
    assert.ok(!placed.includes(locale === "en" ? "No guests yet" : "Belum ada tamu"));
    const empty = render({ ...chartProps, guests: [] });
    assert.ok(empty.includes(locale === "en" ? "No guests yet" : "Belum ada tamu"));
    assert.ok(empty.includes(locale === "en" ? "Add a guest or wait for an attending RSVP." : "Tambahkan tamu atau tunggu konfirmasi RSVP Hadir."));
  }
});

test("actual chart toggles Draw back to direct table dragging, including Escape and the route limit", () => {
  const f = chartFixture({}, true);
  let tree = f.render(chartProps);
  assert.equal(chartCanvas(tree).tool, "move");
  assert.equal(chartButton(tree, "Pilih / geser"), undefined);
  assert.equal(elements(tree, (el) => el.type === "select" && el.props["aria-label"] === "Pilih meja").length, 0);
  chartButton(tree, "Gambar jalur").props.onClick();
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "draw");
  assert.equal(chartButton(tree, "Gambar jalur"), undefined);
  assert.equal(chartButton(tree, "Selesai menggambar").props["aria-pressed"], true);
  assert.ok(chartButton(tree, "Selesai menggambar").props.title.includes("Esc"));
  chartButton(tree, "Selesai menggambar").props.onClick();
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "move");
  assert.deepEqual(f.plan.editor.plan, layout());
  chartButton(tree, "Gambar jalur").props.onClick(); tree = f.render(chartProps);
  let prevented = false;
  chartButton(tree, "Selesai menggambar").props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; } });
  tree = f.render(chartProps); assert.equal(chartCanvas(tree).tool, "move"); assert.equal(prevented, true);
  assert.deepEqual(f.plan.editor.plan, layout());
  chartButton(tree, "Gambar jalur").props.onClick();
  f.plan.dispatch({ type: "EDIT", plan: { ...layout(), paths: Array.from({ length: 20 }, () => [100, 100, 500, 200]) } });
  tree = f.render(chartProps);
  assert.equal(chartButton(tree, "Selesai menggambar").props.disabled, false);
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

test("manual seating input creates the shared Guest party used by Personal Invitation", async () => {
  const originalFetch = globalThis.fetch, calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return Response.json({
      guest: {
        id: "guest-party",
        name: "andi & rina",
        source: "MANUAL",
        category: "REGULAR",
        personalAddressee: "Bapak Andi dan Ibu Rina",
        recipientType: "FAMILY",
        invitedPax: 4,
        tableId: null,
        seatNumber: null,
      },
    }, { status: 201 });
  };
  try {
    const f = chartFixture({}, true);
    const props = { ...chartProps, guests: [] };
    let tree = f.render(props);
    const salutation = elements(tree, (el) => el.type === "select" && el.props.value === "BAPAK")[0];
    salutation.props.onChange({ target: { value: "BAPAK_IBU" } });
    tree = f.render(props);
    const partyInput = elements(tree, (el) => el.type === Input && el.props.type === "number" && el.props.max === 30)[0];
    assert.equal(partyInput.props.value, 2);
    elements(tree, (el) => el.type === Input && el.props.placeholder === "Nama tamu manual")[0]
      .props.onChange({ target: { value: "andi & rina" } });
    partyInput.props.onChange({ target: { value: "4" } });
    tree = f.render(props);
    await elements(tree, (el) => el.type === "form")[1].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(calls, [{
      url: "/api/guests",
      body: { invitationId: "event-a", name: "andi & rina", salutation: "BAPAK_IBU", invitedPax: 4, category: "REGULAR" },
    }]);
    tree = f.render(props);
    assert.equal(chartCanvas(tree).guests.find((guest) => guest.id === "guest-party")?.invitedPax, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
  assert.match(html, /<td>Meja Keluarga<\/td><td>1<\/td><td>Arga<\/td>/);
  assert.match(html, /<td>Meja Keluarga<\/td><td>2<\/td><td>Naya<\/td>/);
  assert.match(html, /Tamu Manual/);
  assert.match(html, /Tamu Hadir/);
  assert.doesNotMatch(html, /SECRET-TICKET|guest-private-id|Tamu Tidak Hadir|Simpan denah|<button|<aside/);
  assert.match(html, /assets\/brand\/undara\/logo.webp/);
  assert.match(html, /A4 landscape/);
  assert.match(html, /fill="#FFF9F3"/);
});

test("actual canvas and print label every seat of a lowercase party without splitting its Guest identity", () => {
  const guest = { id: "party", name: "hendra wijaya", tableId: table.id, seatNumber: 7, invitedPax: 4 };
  const f = canvasFixture({ guests: [guest], tool: "move" });
  const texts = elements(f.tree, (el) => el.type === "Text").map((el) => el.props.text);
  for (const label of ["Hendra Wijaya 1", "Hendra Wijaya 2", "Hendra Wijaya 3", "Hendra Wijaya 4", "Meja Keluarga"]) assert.ok(texts.includes(label), label);
  assert.equal(draggableSeatGroups(f.tree).length, guestSeats.seatingPartySize(guest));
  const html = printHtml({ guests: [guest] });
  for (let member = 1; member <= 4; member++) assert.ok(html.includes(`>Hendra Wijaya ${member}</tspan>`));
  assert.ok(html.includes("<td>7, 8, 1, 2</td><td>Hendra Wijaya · 4 pax</td>"));
  const unassigned = chartFixture();
  const roster = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: "id" }, React.createElement(unassigned.Chart, { ...chartProps, guests: [{ ...guest, source: "MANUAL", tableId: null, seatNumber: null }] })));
  assert.ok(roster.includes("Hendra Wijaya")); assert.ok(!roster.includes(">hendra wijaya<"));
  assert.equal(guest.name, "hendra wijaya"); assert.equal(guest.id, "party"); assert.equal(guest.invitedPax, 4);
});

test("print labels support English and guest/event text is escaped by React", () => {
  const html = printHtml({ locale: "en", title: "<script>alert(1)</script>", guests: [{ id: "a", name: '<img src=x onerror="alert(1)">', tableId: table.id, seatNumber: 1 }] });
  assert.match(html, /Guest placement|seats occupied/);
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
  assert.match(html, /width="64" height="64"/);
  assert.match(html, /width="84" height="52"/);
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
