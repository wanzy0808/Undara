"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Check, PencilLine, Plus, Printer, Redo2, RefreshCw, Save, Trash2, Undo2, UserPlus, X } from "lucide-react";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { getPersonalGuestSalutation, type PersonalSalutation } from "@/lib/guests/personal-envelope";
import { MAX_GUEST_PARTY_SIZE, minimumInvitedPaxForSalutation } from "@/lib/guests/manual-party";
import { seatingGuestSeats, seatingOccupiedSeatCount, seatingPartySize } from "@/lib/seating/guest-seats";
import {
  DashboardCompactStat,
  DashboardEmptyState,
  DashboardStatusBadge,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";
import { matchesGuestLabels } from "@/lib/guests/filters";
import { findSeatingSeatTarget, seatingPlanPageAtY, seatingPlanPageOffsets, seatingPlanWithAddedTables, seatingPlanWithTables } from "@/components/Dashboard/seating-chart-geometry";
import { SEATING_MAX_PATHS } from "@/lib/seating/plan";
import { seatingPlanKey } from "@/lib/seating/editor";
import { useSeatingPlan } from "./use-seating-plan";
import SeatingPlanCanvas from "./SeatingPlanCanvas";
import SeatingPlanPrint from "./SeatingPlanPrint";
import SeatingGuestActions from "./SeatingGuestActions";
import { printSeatingPlan } from "./seating-plan-print-browser";
import { WeddingGuestScopeField } from "./WeddingSessionFields";
import { parseInvitedSessions, type WeddingSessionId } from "@/lib/events/wedding-sessions";
import type {
  SeatingChartProps,
  SeatingGuest,
  SeatingPoint,
  SeatingSeatTarget,
  SeatingTable,
} from "@/components/Dashboard/seating-chart-types";

export default function SeatingChart({ invitationId, title = "", weddingSessions = [], guests, tables, onAssigned, onTablesChanged }: SeatingChartProps) {
  const { d, locale } = useDashboardI18n();
  const { isDarkMode } = useTheme();
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [savingGuestId, setSavingGuestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSalutation, setManualSalutation] = useState<PersonalSalutation>("BAPAK");
  const [manualPax, setManualPax] = useState(1);
  const [manualCategory, setManualCategory] = useState("REGULAR");
  const [manualSessions, setManualSessions] = useState<WeddingSessionId[]>([]);
  const [manualSaving, setManualSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [localGuests, setLocalGuests] = useState<SeatingGuest[]>([]);
  const [removedGuestIds, setRemovedGuestIds] = useState<string[]>([]);
  const [guestAction, setGuestAction] = useState<{ mode: "edit" | "delete"; guest: SeatingGuest } | null>(null);
  const [guestEditName, setGuestEditName] = useState("");
  const [guestEditCategory, setGuestEditCategory] = useState("REGULAR");
  const [guestEditPax, setGuestEditPax] = useState(1);
  const [guestEditSessions, setGuestEditSessions] = useState<WeddingSessionId[]>([]);
  const [guestMutating, setGuestMutating] = useState(false);
  const [guestError, setGuestError] = useState("");
  const guestRequest = useRef<AbortController | null>(null);
  const guestMutationBusy = useRef(false);
  const menuPointerGuestId = useRef<string | null>(null);
  const [localTables, setLocalTables] = useState<SeatingTable[]>([]);
  const [removedTableIds, setRemovedTableIds] = useState<string[]>([]);
  const [guestOverrides, setGuestOverrides] = useState<
    Record<string, Partial<SeatingGuest>>
  >({});
  const [hoverTarget, setHoverTarget] = useState<SeatingSeatTarget | null>(null);
  const [swapCandidate, setSwapCandidate] = useState<{
    guestId: string;
    target: SeatingSeatTarget;
  } | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [seatsPerTable, setSeatsPerTable] = useState(
    tables[0]?.capacity || 8,
  );
  const [generating, setGenerating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tableRequest = useRef<AbortController | null>(null);
  const tableMutationBusy = useRef(false);
  const plan = useSeatingPlan(invitationId);
  const [tool, setTool] = useState<"move" | "draw">("move");
  const [drawing, setDrawing] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [pageSelection, setPageSelection] = useState({ invitationId, index: 0 });
  const [printing, setPrinting] = useState(false);
  const printCleanup = useRef<(() => void) | null>(null);
  const printRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { tableRequest.current?.abort(); guestRequest.current?.abort(); printRequest.current?.abort(); printCleanup.current?.(); }, []);

  const visibleTables = useMemo(() => {
    const known = new Set(tables.map((table) => table.id));
    return [
      ...tables.filter((table) => !removedTableIds.includes(table.id)),
      ...localTables.filter((table) => !known.has(table.id)),
    ];
  }, [tables, localTables, removedTableIds]);
  const layout = useMemo(() => seatingPlanWithTables(plan.editor.plan, visibleTables), [plan.editor.plan, visibleTables]);
  const layoutDirty = seatingPlanKey(layout) !== plan.editor.savedKey || (plan.editor.revision === null && visibleTables.length > 0);
  const layoutBusy = plan.loading || plan.saving || generating || guestMutating || Boolean(savingGuestId);
  const toolbarBusy = layoutBusy || drawing;
  const pageOffsets = seatingPlanPageOffsets(layout.height);
  const pageIndex = Math.min(pageSelection.invitationId === invitationId ? pageSelection.index : 0, pageOffsets.length - 1);

  function showPage(index: number) {
    if (toolbarBusy || index === pageIndex) return;
    setPageSelection({ invitationId, index });
    setHoverTarget(null);
    setSelectedTableId("");
  }

  const visibleGuests = useMemo(() => {
    const known = new Set(guests.map((guest) => guest.id));
    const merged = [
      ...guests,
      ...localGuests.filter((guest) => !known.has(guest.id)),
    ];

    return merged.filter((guest) => !removedGuestIds.includes(guest.id)).map((guest) =>
      guestOverrides[guest.id]
        ? { ...guest, ...guestOverrides[guest.id] }
        : guest,
    );
  }, [guests, localGuests, guestOverrides, removedGuestIds]);

  const rosterGuests = visibleGuests.filter(
    (guest) => (!guest.tableId || !guest.seatNumber) && (guest.source === "MANUAL" || guest.rsvpStatus === "ATTENDING"),
  );
  const selectedGuest = visibleGuests.find((guest) => guest.id === selectedGuestId && guest.tableId) ?? null;
  const selectedGuestTable = selectedGuest ? visibleTables.find((table) => table.id === selectedGuest.tableId) : null;
  const allGuestsPlaced = visibleGuests.some((guest) => guest.tableId) && rosterGuests.length === 0;
  const draggedGuest = draggedGuestId
    ? (visibleGuests.find((guest) => guest.id === draggedGuestId) ?? null)
    : null;
  const categories = Array.from(
    new Set(rosterGuests.map((guest) => guest.category || "REGULAR")),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const tags = Array.from(
    new Set(rosterGuests.flatMap((guest) => guest.tags ?? [])),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const filteredRoster = rosterGuests.filter((guest) =>
    matchesGuestLabels({ ...guest, category: guest.category || "REGULAR" }, categoryFilter, tagFilter),
  );
  const primaryCategories = ["REGULAR", "VIP", "VVIP"];
  const rosterGroups = [...primaryCategories, ...categories.filter((category) => !primaryCategories.includes(category))]
    .map((category) => ({
      category,
      guests: filteredRoster.filter((guest) => (guest.category || "REGULAR") === category)
        .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base", numeric: true })),
    }))
    .filter((group) => group.guests.length > 0);
  const hasRosterFilter = Boolean(categoryFilter || tagFilter);
  const totalSeats = visibleTables.reduce((sum, table) => sum + table.capacity, 0);
  const assignedCount = visibleTables.reduce(
    (sum, table) => sum + seatingOccupiedSeatCount(visibleGuests, table.id, table.capacity),
    0,
  );
  const guestEditMinimumPax = minimumInvitedPaxForSalutation(
    (guestAction && getPersonalGuestSalutation(guestAction.guest)) || "BAPAK",
  );

  function openGuestAction(mode: "edit" | "delete", guest: SeatingGuest) {
    if (toolbarBusy || manualSaving || guestMutationBusy.current) return;
    setGuestAction({ mode, guest });
    setGuestEditName(guest.name);
    setGuestEditCategory(guest.category || "REGULAR");
    setGuestEditPax(seatingPartySize(guest));
    setGuestEditSessions(guest.invitedSessions ?? []);
    setGuestError("");
    setDraggedGuestId(null); setHoverTarget(null); setSwapCandidate(null);
  }

  async function saveGuestAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guestAction || guestMutationBusy.current || toolbarBusy) return;
    const { mode, guest } = guestAction;
    const name = guestEditName.trim();
    if (mode === "edit" && (!name || name.length > 120)) {
      setGuestError(d("Nama tamu wajib diisi (maksimal 120 karakter)."));
      return;
    }
    if (mode === "edit" && (!Number.isInteger(guestEditPax) || guestEditPax < 1 || guestEditPax > MAX_GUEST_PARTY_SIZE)) {
      setGuestError(d("Jumlah tamu wajib 1–30 orang."));
      return;
    }
    if (mode === "edit" && guestEditPax < guestEditMinimumPax) {
      setGuestError(d("Bapak & Ibu minimal 2 orang."));
      return;
    }
    const resizing = mode === "edit" && guestEditPax !== seatingPartySize(guest);
    let invitedSessions: WeddingSessionId[] | undefined;
    if (mode === "edit" && weddingSessions.length && !guest.checkedIn) {
      try { invitedSessions = parseInvitedSessions(weddingSessions.length === 1 ? [weddingSessions[0].id] : guestEditSessions, weddingSessions); }
      catch (error) { setGuestError(error instanceof Error ? error.message : d("Data tamu tidak valid.")); return; }
    }
    guestMutationBusy.current = true;
    const controller = new AbortController(); guestRequest.current = controller;
    setGuestMutating(true); setGuestError(""); setMessage("");
    try {
      const response = await fetch(mode === "edit" ? "/api/guests/manage" : `/api/guests/manage?id=${encodeURIComponent(guest.id)}&invitationId=${encodeURIComponent(invitationId)}`, {
        method: mode === "edit" ? "PATCH" : "DELETE", signal: controller.signal,
        ...(mode === "edit" ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: guest.id, invitationId, name, ...(invitedSessions ? { invitedSessions } : {}), ...(guestEditCategory !== (guest.category || "REGULAR") ? { category: guestEditCategory } : {}), ...(resizing ? { invitedPax: guestEditPax } : {}) }),
        } : {}),
      });
      const data = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data?.error || (mode === "edit" ? "Data tamu gagal diperbarui." : "Tamu gagal dihapus."));
      if (data?.ok !== true || (mode === "edit" && (data.guest?.id !== guest.id || data.guest?.invitationId !== invitationId || typeof data.guest?.name !== "string" || !data.guest.name.trim() || data.guest.name.length > 120 || (data.guest.category != null && typeof data.guest.category !== "string") || (data.guest.personalAddressee != null && typeof data.guest.personalAddressee !== "string")))) {
        throw new Error("Data tamu tidak valid. Muat ulang dan coba lagi.");
      }
      if (resizing && (!Number.isInteger(data.guest.invitedPax) || data.guest.invitedPax !== guestEditPax)) {
        throw new Error("Data tamu tidak valid. Muat ulang dan coba lagi.");
      }
      if (mode === "edit") {
        const updated = data.guest as SeatingGuest;
        setGuestOverrides((current) => ({ ...current, [guest.id]: {
          ...current[guest.id], name: updated.name,
          ...(updated.category !== undefined ? { category: updated.category } : {}),
          ...(updated.invitedSessions !== undefined ? { invitedSessions: updated.invitedSessions } : {}),
          ...(updated.personalAddressee !== undefined ? { personalAddressee: updated.personalAddressee } : {}),
          ...(resizing ? { invitedPax: updated.invitedPax } : {}),
        } }));
        setMessage(d("Data tamu diperbarui."));
      } else {
        setRemovedGuestIds((current) => [...current, guest.id]);
        setLocalGuests((current) => current.filter((item) => item.id !== guest.id));
        setGuestOverrides((current) => {
          const next = { ...current }; delete next[guest.id]; return next;
        });
        setMessage(d("Tamu dihapus. Kursinya kembali tersedia."));
      }
      setGuestAction(null);
      void onTablesChanged?.().catch(() => {});
    } catch (error) {
      if (!controller.signal.aborted) setGuestError(d(error instanceof Error ? error.message : "Data tamu gagal diperbarui."));
    } finally {
      if (guestRequest.current === controller) { guestRequest.current = null; guestMutationBusy.current = false; }
      if (!controller.signal.aborted) setGuestMutating(false);
    }
  }

  async function generateTables(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (toolbarBusy || tableMutationBusy.current) return;
    const count = tableCount, capacity = seatsPerTable;
    if (!Number.isInteger(count) || count < 1 || count > 100 - visibleTables.length) {
      setMessage(d("Jumlah meja melebihi sisa ruang (maksimal 100 meja)."));
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      setMessage(d("Kapasitas meja wajib 1–50 kursi."));
      return;
    }

    tableMutationBusy.current = true;
    const controller = new AbortController(); tableRequest.current = controller;
    setGenerating(true);
    setMessage("");
    try {
      const response = await fetch("/api/tables", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, count, capacity, shape: "ROUND", locale }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Meja gagal dibuat.");
      if (!Array.isArray(data?.tables) || data.tables.length !== count || data.tables.some((table: SeatingTable) => !table?.id || !table.name || !Number.isInteger(table.capacity))) throw new Error("Data meja tidak valid.");
      if (controller.signal.aborted) return;
      const created = data.tables as SeatingTable[];
      const nextLayout = seatingPlanWithAddedTables(layout, visibleTables, created);
      plan.dispatch({ type: "EDIT", plan: nextLayout });
      setLocalTables((current) => [...current, ...created]);
      setSelectedTableId(created[0].id);
      setPageSelection({ invitationId, index: seatingPlanPageAtY(nextLayout.tables[created[0].id].y, nextLayout.height) });
      setTool("move");
      setMessage(locale === "en" ? `${count} tables added, ${capacity} seats each.` : `${count} meja ditambahkan, masing-masing ${capacity} kursi.`);
      void onTablesChanged?.().catch(() => {});
    } catch (error) {
      if (!controller.signal.aborted) setMessage(d(error instanceof Error ? error.message : "Meja gagal dibuat."));
    } finally {
      tableMutationBusy.current = false;
      if (!controller.signal.aborted) setGenerating(false);
    }
  }

  async function clearLayout() {
    if (toolbarBusy || !plan.ready || tableMutationBusy.current) return;
    tableMutationBusy.current = true;
    setMessage("");
    try {
      if (!(await plan.clear(visibleTables.map((table) => table.id)))) return;
      setRemovedTableIds((current) => [...current, ...visibleTables.map((table) => table.id)]);
      setLocalTables([]);
      setGuestOverrides((current) => ({ ...current, ...Object.fromEntries(visibleGuests.map((guest) => [guest.id, { ...current[guest.id], tableId: null, seatNumber: null }])) }));
      setSelectedTableId(""); setDraggedGuestId(null); setHoverTarget(null); setSwapCandidate(null); setTool("move");
      setPageSelection({ invitationId, index: 0 });
      setConfirmReset(false);
      setMessage(d("Denah dikosongkan. Tamu kembali ke daftar belum ditempatkan."));
      void onTablesChanged?.().catch(() => {});
    } finally { tableMutationBusy.current = false; }
  }

  async function addManualGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = manualName.trim();
    if (!name) {
      setMessage(d("Nama tamu manual wajib diisi."));
      return;
    }
    const minimumPax = minimumInvitedPaxForSalutation(manualSalutation);
    if (!Number.isInteger(manualPax) || manualPax < minimumPax || manualPax > MAX_GUEST_PARTY_SIZE) {
      setMessage(d("Jumlah tamu wajib 1–30 orang."));
      return;
    }

    setManualSaving(true);
    setMessage("");
    try {
      const invitedSessions = parseInvitedSessions(weddingSessions.length === 1 ? [weddingSessions[0].id] : manualSessions, weddingSessions);
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, name, salutation: manualSalutation, invitedPax: manualPax, category: manualCategory, ...(weddingSessions.length ? { invitedSessions } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || d("Tamu manual gagal ditambahkan."));
      }
      setLocalGuests((current) => [...current, data.guest as SeatingGuest]);
      setManualName("");
      setManualSalutation("BAPAK");
      setManualPax(1);
      setManualCategory("REGULAR");
      setManualSessions([]);
      setMessage(d("Tamu ditambahkan ke Daftar Tamu."));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : d("Tamu manual gagal ditambahkan."),
      );
    } finally {
      setManualSaving(false);
    }
  }

  function targetAtPoint(point: SeatingPoint) {
    return findSeatingSeatTarget(point, visibleTables, visibleGuests, draggedGuestId, layout);
  }

  function setHoverFromPoint(point: SeatingPoint) {
    if (!draggedGuestId) return;
    setHoverTarget(targetAtPoint(point));
  }

  async function assignGuestAtPoint(guestId: string, point: SeatingPoint) {
    if (layoutBusy || drawing || guestMutationBusy.current) return;
    const target = findSeatingSeatTarget(point, visibleTables, visibleGuests, guestId, layout);
    setHoverTarget(null);

    if (!target) {
      if (visibleGuests.some((guest) => guest.id === guestId && guest.tableId && guest.seatNumber)) {
        await releaseGuest(guestId);
        return;
      }
      setMessage(d("Jatuhkan tamu tepat di kursi."));
      setDraggedGuestId(null);
      return;
    }

    if (target.guest) {
      setSwapCandidate({ guestId, target });
      return;
    }

    guestMutationBusy.current = true;
    setSavingGuestId(guestId);
    setMessage("");
    try {
      await onAssigned(guestId, target.table.id, target.seat);
      setGuestOverrides((current) => ({
        ...current,
        [guestId]: { ...current[guestId], tableId: target.table.id, seatNumber: target.seat },
      }));
      setMessage(d("Penempatan tamu tersimpan."));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : d("Penempatan tamu gagal disimpan."),
      );
    } finally {
      guestMutationBusy.current = false;
      setSavingGuestId(null);
      setDraggedGuestId(null);
    }
  }

  async function releaseGuest(guestId: string) {
    const guest = visibleGuests.find((item) => item.id === guestId && item.tableId);
    if (!guest || toolbarBusy || guestMutationBusy.current || tool !== "move") return;
    guestMutationBusy.current = true;
    const controller = new AbortController(); guestRequest.current = controller;
    setSavingGuestId(guest.id); setMessage(""); setDraggedGuestId(null); setHoverTarget(null); setSwapCandidate(null);
    try {
      const response = await fetch(`/api/guests/${encodeURIComponent(guest.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal,
        body: JSON.stringify({ tableId: null, seatNumber: null }),
      });
      const data = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data?.error || "Tamu belum dapat dilepas dari meja. Coba lagi.");
      if (data?.guest?.id !== guest.id || data.guest.invitationId !== invitationId || data.guest.tableId !== null || data.guest.seatNumber !== null) {
        throw new Error("Data tamu tidak valid. Muat ulang dan coba lagi.");
      }
      setGuestOverrides((current) => ({ ...current, [guest.id]: { ...current[guest.id], tableId: null, seatNumber: null } }));
      setSelectedGuestId("");
      setMessage(d("Tamu dilepas dari meja."));
      void onTablesChanged?.().catch(() => {});
    } catch (error) {
      if (!controller.signal.aborted) setMessage(d(error instanceof Error ? error.message : "Tamu belum dapat dilepas dari meja. Coba lagi."));
    } finally {
      if (guestRequest.current === controller) { guestRequest.current = null; guestMutationBusy.current = false; }
      if (!controller.signal.aborted) setSavingGuestId(null);
    }
  }

  async function confirmSwap() {
    if (!swapCandidate || guestMutationBusy.current) return;
    const { guestId, target } = swapCandidate;
    if (!target.guest) return;

    const source = visibleGuests.find((guest) => guest.id === guestId);
    if (!source) return;

    guestMutationBusy.current = true;
    setSavingGuestId(guestId);
    setMessage("");
    try {
      const response = await fetch(`/api/guests/${guestId}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGuestId: target.guest.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || d("Tukar posisi gagal disimpan."));
      }

      const swapped = data.guests as SeatingGuest[];
      const sourceResult = swapped.find((guest) => guest.id === guestId);
      const targetResult = swapped.find(
        (guest) => guest.id === target.guest?.id,
      );

      setGuestOverrides((current) => ({
        ...current,
        ...(sourceResult
          ? {
              [sourceResult.id]: {
                ...current[sourceResult.id],
                tableId: sourceResult.tableId,
                seatNumber: sourceResult.seatNumber,
              },
            }
          : {}),
        ...(targetResult
          ? {
              [targetResult.id]: {
                ...current[targetResult.id],
                tableId: targetResult.tableId,
                seatNumber: targetResult.seatNumber,
              },
            }
          : {}),
      }));

      setMessage(locale === "en" ? `${displayTitleCase(source.name)} and ${displayTitleCase(target.guest.name)} swapped positions.` : `Posisi ${displayTitleCase(source.name)} dan ${displayTitleCase(target.guest.name)} ditukar.`);
      setSwapCandidate(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : d("Tukar posisi gagal disimpan."),
      );
    } finally {
      guestMutationBusy.current = false;
      setSavingGuestId(null);
      setDraggedGuestId(null);
      setHoverTarget(null);
    }
  }

  function cancelSwap() {
    setSwapCandidate(null);
    setDraggedGuestId(null);
    setHoverTarget(null);
    setMessage(d("Tukar posisi dibatalkan."));
  }

  async function saveLayout() {
    if (toolbarBusy || !plan.ready) return;
    if (await plan.save(layout)) setMessage(d("Denah tersimpan."));
  }

  async function reloadLayout() {
    const result = await plan.reload();
    if (result?.replacedDraft) setMessage(d("Denah dimuat ulang. Gunakan Undo untuk memulihkan perubahan tadi."));
  }

  async function printLayout() {
    if (toolbarBusy || printing) return;
    setPrinting(true);
    setMessage("");
    printCleanup.current?.();
    printRequest.current?.abort();
    const controller = new AbortController();
    printRequest.current = controller;
    try {
      const dispose = await printSeatingPlan(
        <SeatingPlanPrint title={title} layout={layout} tables={visibleTables} guests={visibleGuests} locale={locale} />,
        `${displayTitleCase(title) || d("Denah tamu")} — ${d("Denah tamu")}`,
        document, undefined, controller.signal,
      );
      printCleanup.current = dispose;
    } catch (error) {
      if (!controller.signal.aborted) setMessage(d(error instanceof Error ? error.message : "Cetak belum dapat dibuka. Coba lagi."));
    } finally { if (!controller.signal.aborted) setPrinting(false); }
  }

  return (
    <div className="mt-5 min-w-0 space-y-4">
      <div className="grid min-w-0 items-stretch gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
        <DashboardPanel
            className="h-full min-w-0"
            title={d("Struktur meja")}
            actions={
              <DashboardStatusBadge active={visibleTables.length > 0} className="min-h-7">
                {visibleTables.length} {locale === "en" ? "tables" : "meja"}
              </DashboardStatusBadge>
            }
        >

          <form onSubmit={generateTables} className="mt-4 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
            <FloatingField label={d("Meja")} className="block w-20 max-w-full text-xs text-muted-foreground">
              <Input
                type="number"
                min={1}
                max={Math.max(1, 100 - visibleTables.length)}
                disabled={toolbarBusy || visibleTables.length >= 100}
                value={tableCount}
                className="mt-1 min-h-11 w-full px-2"
                onChange={(event) => setTableCount(Number(event.target.value))}
              />
            </FloatingField>
            <FloatingField label={d("Kursi")} className="block w-20 max-w-full text-xs text-muted-foreground">
              <Input
                type="number"
                min={1}
                max={50}
                disabled={toolbarBusy || visibleTables.length >= 100}
                value={seatsPerTable}
                className="mt-1 min-h-11 w-full px-2"
                onChange={(event) => setSeatsPerTable(Number(event.target.value))}
              />
            </FloatingField>
            <Button
              type="submit"
              size="sm"
              className="h-auto min-h-11 max-w-full shrink px-3 py-2 whitespace-normal"
              disabled={toolbarBusy || visibleTables.length >= 100}
              title={visibleTables.length >= 100 ? d("Maksimal 100 meja per acara.") : undefined}
            >
              <Plus className="h-4 w-4" />
              <span className="min-w-0 break-words">{generating ? d("Menambahkan meja...") : d("Tambah meja")}</span>
            </Button>
          </form>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <DashboardCompactStat label={d("Kursi")} value={String(totalSeats)} />
            <DashboardCompactStat label={d("Terisi")} value={String(assignedCount)} />
          </div>
        </DashboardPanel>

        <DashboardPanel title={d("Isi tamu")} className="h-full min-w-0">
          <form onSubmit={addManualGuest} className="mt-4 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
            <FloatingField label={d("Sapaan")} className="block w-40 max-w-full text-xs text-muted-foreground">
              <select value={manualSalutation} disabled={manualSaving}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                onChange={(event) => {
                  const next = event.target.value as PersonalSalutation;
                  setManualSalutation(next);
                  setManualPax((current) => Math.max(current, minimumInvitedPaxForSalutation(next)));
                }}>
                <option value="BAPAK">{d("Bapak")}</option>
                <option value="IBU">{d("Ibu")}</option>
                <option value="BAPAK_IBU">{d("Bapak & Ibu")}</option>
              </select>
            </FloatingField>
            <FloatingField label={d("Nama")} className="block min-w-0 max-w-full text-xs text-muted-foreground"
              style={{ width: Math.min(320, Math.max(192, manualName.length * 8 + 32)) }}>
              <Input value={manualName} onChange={(event) => setManualName(event.target.value)}
                placeholder={d("Nama tamu manual")} className="mt-1 min-h-11 capitalize" />
            </FloatingField>
            <FloatingField label={d("Kategori tamu")} className="block w-36 max-w-full text-xs text-muted-foreground">
              <select value={manualCategory} disabled={manualSaving}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                onChange={(event) => setManualCategory(event.target.value)}>
                <option value="REGULAR">{d("Reguler")}</option>
                <option value="VIP">VIP</option>
                <option value="VVIP">VVIP</option>
              </select>
            </FloatingField>
            <FloatingField label={d("Jumlah orang")} className="block w-24 max-w-full text-xs text-muted-foreground">
              <Input type="number" min={minimumInvitedPaxForSalutation(manualSalutation)} max={MAX_GUEST_PARTY_SIZE}
                value={manualPax} disabled={manualSaving} className="mt-1 min-h-11"
                onChange={(event) => setManualPax(Number(event.target.value))} />
            </FloatingField>
            <WeddingGuestScopeField sessions={weddingSessions} value={manualSessions} onChange={setManualSessions} disabled={manualSaving} />
            <Button type="submit" size="sm" className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
              disabled={manualSaving} title={d("Tambah ke Daftar Tamu")}>
              <UserPlus className="h-4 w-4" />
              <span className="min-w-0 break-words">{manualSaving ? d("Menambahkan tamu...") : d("Tambah ke Daftar Tamu")}</span>
            </Button>
          </form>
        </DashboardPanel>
      </div>

      <DashboardPanel className="@container min-w-0"
          title={d("Denah tempat duduk")}
          actions={
            <div className="flex gap-2">
              <DashboardCompactStat label={d("Meja")} value={String(visibleTables.length)} className="min-w-20" />
              <DashboardCompactStat label={d("Kursi")} value={`${assignedCount}/${totalSeats}`} className="min-w-20" />
            </div>
          }
      >

        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={d("Alat denah")}>
          <Button type="button" size="sm" variant={tool === "draw" ? "default" : "outline"}
            className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
            aria-pressed={tool === "draw"}
            title={tool === "draw" ? `${d("Selesai menggambar")} (Esc)` : undefined}
            disabled={toolbarBusy || (tool !== "draw" && layout.paths.length >= SEATING_MAX_PATHS)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && tool === "draw" && !drawing) { event.preventDefault(); setTool("move"); }
            }}
            onClick={() => { setTool(tool === "draw" ? "move" : "draw"); setDraggedGuestId(null); setHoverTarget(null); setSwapCandidate(null); }}
          >
            {tool === "draw" ? <Check className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
            <span className="min-w-0 break-words">{d(tool === "draw" ? "Selesai menggambar" : "Gambar jalur")}</span>
          </Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label={d("Undo")} title={d("Undo")} disabled={toolbarBusy || !plan.editor.past.length} onClick={() => plan.dispatch({ type: "UNDO" })}><Undo2 className="h-4 w-4" /></Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label={d("Redo")} title={d("Redo")} disabled={toolbarBusy || !plan.editor.future.length} onClick={() => plan.dispatch({ type: "REDO" })}><Redo2 className="h-4 w-4" /></Button>
          <Button type="button" size="sm" variant="outline" disabled={toolbarBusy || !layout.paths.length} onClick={() => plan.dispatch({ type: "EDIT", plan: { ...layout, paths: [] } })}><Trash2 className="h-4 w-4" />{d("Hapus jalur")}</Button>
          <Dialog open={confirmReset} onOpenChange={(open) => { if (!plan.saving) setConfirmReset(open); }}>
            <DialogTrigger render={<Button type="button" size="sm" variant="outline" disabled={toolbarBusy || !plan.ready || (!visibleTables.length && !layout.paths.length)} title={!plan.ready ? d("Muat denah sebelum mengosongkan.") : undefined} />}><Trash2 className="h-4 w-4" />{d("Kosongkan denah")}</DialogTrigger>
            <DialogContent showCloseButton={!plan.saving}>
              <DialogHeader><DialogTitle>{d("Kosongkan denah?")}</DialogTitle><DialogDescription>{d("Semua meja, jalur dan penempatan kursi akan dihapus. Data tamu tetap tersimpan. Tindakan ini tidak bisa di-Undo.")}</DialogDescription></DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={plan.saving} onClick={() => setConfirmReset(false)}>{d("Batal")}</Button>
                <Button type="button" disabled={toolbarBusy || !plan.ready} onClick={() => void clearLayout()}>{plan.saving ? d("Mengosongkan...") : d("Ya, kosongkan")}</Button>
              </DialogFooter>
              {plan.error && <p role="alert" className="text-xs text-primary">{d(plan.error)}</p>}
            </DialogContent>
          </Dialog>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button type="button" size="sm" disabled={toolbarBusy || !plan.ready || !layoutDirty} title={!plan.ready ? d("Muat denah sebelum menyimpan.") : undefined} onClick={() => void saveLayout()}><Save className="h-4 w-4" />{plan.saving ? d("Menyimpan...") : d("Simpan denah")}</Button>
            <Button type="button" size="sm" variant="outline" disabled={toolbarBusy || printing} onClick={() => void printLayout()}><Printer className="h-4 w-4" />{printing ? d("Menyiapkan cetak...") : d("Cetak")}</Button>
          </div>
        </div>
        {pageOffsets.length > 1 && <nav className="mb-3 flex flex-wrap items-center justify-end gap-2" aria-label={d("Halaman denah")}>
          <span className="mr-auto text-sm text-muted-foreground">{d("Halaman")}</span>
          {pageOffsets.map((offset, index) => <Button key={offset} type="button" size="icon" className="size-11" variant={pageIndex === index ? "default" : "outline"}
            aria-label={`${d("Halaman")} ${index + 1}`} aria-current={pageIndex === index ? "page" : undefined} disabled={toolbarBusy}
            onClick={() => showPage(index)}
            onDragEnter={() => { if (draggedGuestId && tool === "move") showPage(index); }}
            onPointerEnter={() => { if (draggedGuestId && tool === "move") showPage(index); }}>
            {index + 1}
          </Button>)}
        </nav>}
        <div className="grid min-w-0 items-start gap-4 @min-[52rem]:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <SeatingPlanCanvas layout={layout} tables={visibleTables} guests={visibleGuests} tool={tool} dark={isDarkMode} busy={layoutBusy}
              pageOffset={pageOffsets[pageIndex]}
              draggedGuestId={draggedGuestId} hoverTarget={hoverTarget} selectedTableId={selectedTableId}
              onTableSelect={(id) => { setSelectedTableId(id); setSelectedGuestId(""); }} onGuestSelect={setSelectedGuestId}
              onTableMove={(id, point) => plan.dispatch({ type: "EDIT", plan: { ...layout, tables: { ...layout.tables, [id]: point } } })}
              onPath={(points) => {
                if (layout.paths.length >= SEATING_MAX_PATHS) { setMessage(d("Maksimal 20 jalur. Hapus jalur untuk menggambar lagi.")); return; }
                plan.dispatch({ type: "EDIT", plan: { ...layout, paths: [...layout.paths, points] } });
              }}
              onDrawingChange={setDrawing}
              onExitDraw={() => setTool("move")}
              onGuestStart={(id) => { setDraggedGuestId(id); setSelectedGuestId(id); setSwapCandidate(null); }} onGuestHover={setHoverFromPoint} onGuestDrop={assignGuestAtPoint}
              onGuestRelease={releaseGuest}
              onGuestCancel={() => { setDraggedGuestId(null); setHoverTarget(null); }}
              onUndo={() => plan.dispatch({ type: "UNDO" })} onRedo={() => plan.dispatch({ type: "REDO" })}
              label={d("Denah: pilih meja, lalu gunakan tombol panah untuk menggeser.")} emptyLabel={d("Atur jumlah meja dan kursi untuk membuat denah.")}
            />
            {selectedGuest && <div data-seated-guest={selectedGuest.id} className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
              <div className="min-w-0 mr-auto">
                <p className="break-words text-sm font-medium">{displayTitleCase(selectedGuest.name)}</p>
                <p className="break-words text-xs text-muted-foreground">
                  {seatingPartySize(selectedGuest)} {locale === "en" ? (seatingPartySize(selectedGuest) === 1 ? "person" : "people") : "orang"}
                  {selectedGuestTable ? ` · ${displayTitleCase(selectedGuestTable.name)} · ${d("Kursi")} ${seatingGuestSeats(selectedGuest, selectedGuestTable.capacity).join(", ")}` : ""}
                </p>
              </div>
              <SeatingGuestActions guest={selectedGuest} disabled={toolbarBusy || manualSaving}
                onEdit={(item) => openGuestAction("edit", item)} onDelete={(item) => openGuestAction("delete", item)} />
              <Button type="button" size="sm" variant="outline" disabled={toolbarBusy || tool !== "move"}
                className="h-auto min-h-11 max-w-full py-2 whitespace-normal" onClick={() => void releaseGuest(selectedGuest.id)}>
                {savingGuestId === selectedGuest.id ? d("Menyimpan...") : d("Lepas dari meja")}
              </Button>
            </div>}
          </div>
          <aside aria-label={d("Daftar tamu")}
            className={cn("min-w-0 self-stretch border-t border-border pt-4 @min-[52rem]:border-t-0 @min-[52rem]:border-l @min-[52rem]:pt-0 @min-[52rem]:pl-4", draggedGuest?.tableId && draggedGuest.seatNumber && "bg-primary/5 outline outline-1 outline-primary/30")}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{d("Daftar tamu")}</h3>
              <DashboardStatusBadge active={rosterGuests.length > 0}>
                {rosterGuests.length} {locale === "en" ? "guests" : "tamu"}
              </DashboardStatusBadge>
            </div>
            {draggedGuest?.tableId && Boolean(draggedGuest.seatNumber) && <p className="mt-2 text-xs text-primary">{d("Lepaskan untuk kembali ke daftar")}</p>}
            <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
              <FloatingField label={d("Kategori tamu")} className="block min-w-0 max-w-full text-xs text-muted-foreground">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="mt-1 min-h-11 w-auto max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">{displayTitleCase(d("Semua kategori"))}</option>
                  {categoryFilter && !categories.includes(categoryFilter) && (
                    <option value={categoryFilter}>{categoryFilter === "REGULAR" ? d("Reguler") : displayTitleCase(categoryFilter)}</option>
                  )}
                  {categories.map((category) => (
                    <option key={category} value={category}>{category === "REGULAR" ? d("Reguler") : displayTitleCase(category)}</option>
                  ))}
                </select>
              </FloatingField>
              {(tags.length > 0 || tagFilter) && <FloatingField label={d("Tag tamu")} className="block min-w-0 max-w-full text-xs text-muted-foreground">
                <select
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="mt-1 min-h-11 w-auto max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">{displayTitleCase(d("Semua tag"))}</option>
                  {tagFilter && !tags.includes(tagFilter) && (
                    <option value={tagFilter}>{displayTitleCase(tagFilter)}</option>
                  )}
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>{displayTitleCase(tag)}</option>
                  ))}
                </select>
              </FloatingField>}
              <p role="status" className="w-full text-xs text-muted-foreground">
                {locale === "en"
                  ? `Showing ${filteredRoster.length} of ${rosterGuests.length} unassigned guests.`
                  : `Menampilkan ${filteredRoster.length} dari ${rosterGuests.length} tamu belum ditempatkan.`}
              </p>
              {hasRosterFilter && (
                <Button
                  type="button"
                  size="sm" className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                  onClick={() => { setCategoryFilter(""); setTagFilter(""); }}
                >
                  {d("Reset filter")}
                </Button>
              )}
            </div>

            <div className="mt-3 max-h-96 @min-[52rem]:max-h-[30rem] space-y-4 overflow-y-auto pr-1">
              {filteredRoster.length === 0 && (
                <DashboardEmptyState className="min-h-0! px-3! py-3!"
                  title={hasRosterFilter ? d("Tidak ada hasil") : allGuestsPlaced ? d("Semua tamu sudah ditempatkan") : d("Belum ada tamu")}
                  description={
                    hasRosterFilter
                      ? d("Tidak ada tamu yang cocok dengan filter aktif.")
                      : allGuestsPlaced ? undefined : d("Tambahkan tamu atau tunggu konfirmasi RSVP Hadir.")
                  }
                />
              )}
              {rosterGroups.map((group) => (
                <section key={group.category} aria-label={group.category === "REGULAR" ? d("Reguler") : displayTitleCase(group.category)}>
                  <h4 className="mb-1 flex items-center justify-between gap-2 text-sm font-semibold text-primary">
                    <span>{group.category === "REGULAR" ? d("Reguler") : displayTitleCase(group.category)}</span>
                    <span className="font-[family-name:var(--font-undara-mono)] text-xs tabular-nums text-muted-foreground">{group.guests.length}</span>
                  </h4>
                  <ul className="divide-y divide-border/60">
                    {group.guests.map((guest) => {
                      const name = displayTitleCase(guest.name);
                      const words = name.trim().split(/\s+/u);
                      const initials = [Array.from(words[0])[0], words.length > 1 ? Array.from(words[words.length - 1])[0] : ""].join("");
                      const assignedTable = visibleTables.find((table) => table.id === guest.tableId);
                      const seats = assignedTable ? seatingGuestSeats(guest, assignedTable.capacity) : [];
                      const pax = seatingPartySize(guest);
                      const canDrag = (!guest.tableId || !guest.seatNumber) && !toolbarBusy && tool === "move";
                      return (
                        <li key={guest.id} data-guest-id={guest.id}
                          draggable={canDrag}
                          onPointerDownCapture={(event) => {
                            menuPointerGuestId.current = (event.target as HTMLElement | null)?.closest?.("button") ? guest.id : null;
                          }}
                          onDragStart={(event) => {
                            if (!canDrag || menuPointerGuestId.current === guest.id || (event.target as HTMLElement | null)?.closest?.("button")) { event.preventDefault(); return; }
                            event.dataTransfer.setData("text/plain", guest.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDraggedGuestId(guest.id);
                            setSwapCandidate(null);
                          }}
                          onDragEnd={(event) => { if (event.dataTransfer.dropEffect === "none") { setDraggedGuestId(null); setHoverTarget(null); } }}
                          className={`flex min-w-0 items-start gap-2.5 rounded-md px-1 py-2.5 text-sm ${canDrag ? "cursor-grab hover:bg-primary/[0.06] active:cursor-grabbing" : ""}`}
                        >
                          <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</span>
                          <div className="min-w-0 flex-1">
                            <div className="break-words font-medium leading-5 text-foreground">{name}</div>
                            <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">
                              {pax} {locale === "en" ? (pax === 1 ? "person" : "people") : "orang"} · {guest.source === "MANUAL" ? d("Manual") : "RSVP"}
                              {guest.source === "RSVP" && guest.rsvpStatus === "ATTENDING" ? ` · ${d("Hadir")}` : ""}
                            </p>
                            <p className={`break-words text-xs leading-5 ${guest.tableId ? "text-muted-foreground" : "text-primary"}`}>
                              {assignedTable
                                ? `${displayTitleCase(assignedTable.name)}${seats.length ? ` · ${d("Kursi")} ${seats.join(", ")}` : ""}`
                                : guest.tableId ? d("Ditempatkan") : d("Belum ditempatkan")}
                            </p>
                            {Boolean(guest.tags?.length) && (
                              <p className="break-words text-xs leading-5 text-muted-foreground">{guest.tags?.map(displayTitleCase).join(" · ")}</p>
                            )}
                          </div>
                          <SeatingGuestActions guest={guest} disabled={toolbarBusy || manualSaving}
                            onEdit={(item) => openGuestAction("edit", item)} onDelete={(item) => openGuestAction("delete", item)} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        </div>
        <div className="mt-3 flex min-h-8 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground" role="status">
          <span>{plan.loading ? d("Memuat denah...") : plan.saving || savingGuestId ? d("Menyimpan...") : (plan.ready || plan.editor.past.length > 0) && layoutDirty ? d("Perubahan denah belum disimpan") : ""}</span>
          {plan.error && <div className="flex flex-wrap items-center gap-2 text-primary"><span>{d(plan.error)}</span><Button type="button" size="sm" variant="outline" disabled={toolbarBusy} onClick={() => void reloadLayout()}><RefreshCw className="h-4 w-4" />{d("Muat ulang denah")}</Button></div>}
        </div>

        {swapCandidate && (
          <div className="undara-dashboard-detail-card mt-3 rounded-tr-[22px] border border-primary/20 bg-primary/[0.045] p-4">
            <p className="text-xs font-medium leading-5 text-foreground">
              {locale === "en" ? `Seat occupied by ${displayTitleCase(swapCandidate.target.guest?.name ?? "")}. Swap with ${displayTitleCase(draggedGuest?.name ?? "")}?` : `Kursi ditempati ${displayTitleCase(swapCandidate.target.guest?.name ?? "")}. Tukar dengan ${displayTitleCase(draggedGuest?.name ?? "")}?`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={confirmSwap}
                disabled={Boolean(savingGuestId)}
                title={d("Konfirmasi tukar posisi tamu")}
              >
                <ArrowLeftRight className="h-4 w-4" />
                {d("Tukar posisi")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={cancelSwap}
                disabled={Boolean(savingGuestId)}
                title={d("Batalkan tukar posisi")}
              >
                <X className="h-4 w-4" />
                {d("Batal tukar")}
              </Button>
            </div>
          </div>
        )}

        {message && (
          <p
            className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.035] px-3 py-2.5 text-xs font-medium leading-5 text-primary"
            role="status"
          >
            {message}
          </p>
        )}
        <Dialog open={guestAction !== null} onOpenChange={(open) => { if (!open && !guestMutationBusy.current) setGuestAction(null); }}>
          <DialogContent showCloseButton={!guestMutating} className="max-w-md">
            {guestAction && <form data-guest-action={guestAction.mode} onSubmit={saveGuestAction} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{d(guestAction.mode === "edit" ? "Edit tamu" : "Hapus tamu?")}</DialogTitle>
                <DialogDescription>
                  {guestAction.mode === "edit" ? displayTitleCase(guestAction.guest.name) : d("Tamu akan dihapus dari daftar dan kursinya dikosongkan.")}
                </DialogDescription>
              </DialogHeader>
              {guestAction.mode === "edit" ? <div className="flex min-w-0 flex-wrap items-end gap-3">
                <FloatingField label={d("Nama")} className="block min-w-0 max-w-full text-sm"
                  style={{ width: Math.min(320, Math.max(192, guestEditName.length * 8 + 32)) }}>
                  <Input autoFocus value={guestEditName} disabled={guestMutating} maxLength={120} required
                    className="mt-1 min-h-11 capitalize" onChange={(event) => setGuestEditName(event.target.value)} />
                </FloatingField>
                <FloatingField label={d("Kategori tamu")} className="block w-36 max-w-full text-sm">
                  <select value={guestEditCategory} disabled={guestMutating}
                    className={cn(controlStyles.input, "mt-1 min-h-11 px-3 py-2")}
                    onChange={(event) => setGuestEditCategory(event.target.value)}>
                    <option value="REGULAR">{d("Reguler")}</option>
                    <option value="VIP">VIP</option>
                    <option value="VVIP">VVIP</option>
                    {!primaryCategories.includes(guestEditCategory) && <option value={guestEditCategory}>{displayTitleCase(guestEditCategory)}</option>}
                  </select>
                </FloatingField>
                <FloatingField label={d("Jumlah orang")} className="block w-24 max-w-full text-sm">
                  <Input type="number" min={guestEditMinimumPax} max={MAX_GUEST_PARTY_SIZE} step={1} required
                    value={guestEditPax} disabled={guestMutating} className="mt-1 min-h-11"
                    onChange={(event) => setGuestEditPax(Number(event.target.value))} />
                </FloatingField>
                <WeddingGuestScopeField sessions={weddingSessions} value={guestEditSessions} onChange={setGuestEditSessions} disabled={guestMutating || guestAction.guest.checkedIn} />
              </div> : <p className="break-words text-sm font-medium">{displayTitleCase(guestAction.guest.name)}</p>}
              {guestError && <p role="alert" className="text-sm text-destructive">{guestError}</p>}
              <DialogFooter className="flex-row flex-wrap">
                <Button type="button" variant="outline" disabled={guestMutating}
                  className="h-auto min-h-11 max-w-full py-2 whitespace-normal" onClick={() => setGuestAction(null)}>{d("Batal")}</Button>
                <Button type="submit" variant={guestAction.mode === "delete" ? "destructive" : "default"} disabled={guestMutating}
                  className="h-auto min-h-11 max-w-full py-2 whitespace-normal">
                  {guestMutating ? d(guestAction.mode === "delete" ? "Menghapus..." : "Menyimpan...") : d(guestAction.mode === "delete" ? "Hapus" : "Simpan")}
                </Button>
              </DialogFooter>
            </form>}
          </DialogContent>
        </Dialog>
      </DashboardPanel>
    </div>
  );
}
