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
    onPath: (points) => calls.paths.push(points), onDrawingChange: (v) => calls.drawing.push(v),
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
    assert.deepEqual(calls.drawing, [true, false]);
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
function chartFixture(overrides = {}) {
  const calls = [];
  const state = { ...editor.emptySeatingEditor(), plan: layout(), revision, savedKey: editor.seatingPlanKey(layout()), past: [plans.emptySeatingPlan()] };
  const plan = { editor: state, loading: false, saving: false, ready: true, error: "", dispatch: (action) => calls.push(action), save: async (value) => { calls.push(value); return true; }, reload: async () => {}, ...overrides };
  const Chart = loadSource("components/Dashboard/SeatingChart.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useEffect() {}, useState: (initial) => [initial, () => {}], useRef: (value) => ({ current: value }), useMemo: (fn) => fn() },
    "lucide-react": icons, "@/components/Theme/ThemeProvider": { useTheme: () => ({ isDarkMode: false }) },
    "@/components/ui/button": { Button }, "@/components/ui/input": { Input },
    "@/components/Dashboard/useDashboardI18n": { useDashboardI18n }, "@/lib/text/display-title-case": titles,
    "@/components/Dashboard/DashboardPrimitives": primitives, "@/lib/guests/filters": filters,
    "@/components/Dashboard/seating-chart-geometry": geometry, "@/lib/seating/plan": plans, "@/lib/seating/editor": editor,
    "./use-seating-plan": { useSeatingPlan: () => plan },
    "./SeatingPlanCanvas": { __esModule: true, default: () => React.createElement("div", { "aria-label": "Denah" }) },
    "./SeatingPlanPrint": { __esModule: true, default: Print }, "./seating-plan-print-browser": { printSeatingPlan: async () => () => {} },
  }).default;
  return { Chart, calls };
}

test("actual chart toolbar SSR provides localized tools and disables mutations after an unknown failed load", () => {
  for (const [locale, expected] of [["id", ["Pilih / geser", "Gambar jalur", "Simpan denah", "Cetak"]], ["en", ["Select / move", "Draw route", "Save plan", "Print"]]]) {
    const { Chart } = chartFixture();
    const html = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(Chart, { invitationId: "event-a", title: "Naya & Arga", tables: [table], guests: [], onAssigned: async () => {} })));
    for (const label of expected) assert.ok(html.includes(label), label);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /aria-label="Undo"/);
    assert.match(html, /aria-label="Redo"/);
    const failed = chartFixture({ ready: false, error: "Denah belum dapat dimuat. Coba lagi." });
    const blocked = renderToStaticMarkup(React.createElement(LanguageProvider, { initialLocale: locale }, React.createElement(failed.Chart, { invitationId: "event-a", tables: [table], guests: [], onAssigned: async () => {} })));
    const buttons = blocked.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || [];
    for (const label of expected) assert.match(buttons.find((markup) => markup.includes(label)), /disabled=""/);
    assert.ok(blocked.includes(locale === "en" ? "Reload plan" : "Muat ulang denah"));
  }
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
