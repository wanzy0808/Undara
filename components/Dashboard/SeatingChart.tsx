"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Check, GripVertical, PencilLine, Printer, Redo2, RefreshCw, Save, Trash2, Undo2, UserPlus, X } from "lucide-react";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import type { PersonalSalutation } from "@/lib/guests/personal-envelope";
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
import { printSeatingPlan } from "./seating-plan-print-browser";
import type {
  SeatingChartProps,
  SeatingGuest,
  SeatingPoint,
  SeatingSeatTarget,
  SeatingTable,
} from "@/components/Dashboard/seating-chart-types";

export default function SeatingChart({ invitationId, title = "", guests, tables, onAssigned, onTablesChanged }: SeatingChartProps) {
  const { d, locale } = useDashboardI18n();
  const { isDarkMode } = useTheme();
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [savingGuestId, setSavingGuestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSalutation, setManualSalutation] = useState<PersonalSalutation>("BAPAK");
  const [manualPax, setManualPax] = useState(1);
  const [manualCategory, setManualCategory] = useState("REGULAR");
  const [manualSaving, setManualSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [localGuests, setLocalGuests] = useState<SeatingGuest[]>([]);
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
  const [pageSelection, setPageSelection] = useState({ invitationId, index: 0 });
  const [printing, setPrinting] = useState(false);
  const printCleanup = useRef<(() => void) | null>(null);
  const printRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { tableRequest.current?.abort(); printRequest.current?.abort(); printCleanup.current?.(); }, []);

  const visibleTables = useMemo(() => {
    const known = new Set(tables.map((table) => table.id));
    return [
      ...tables.filter((table) => !removedTableIds.includes(table.id)),
      ...localTables.filter((table) => !known.has(table.id)),
    ];
  }, [tables, localTables, removedTableIds]);
  const layout = useMemo(() => seatingPlanWithTables(plan.editor.plan, visibleTables), [plan.editor.plan, visibleTables]);
  const layoutDirty = seatingPlanKey(layout) !== plan.editor.savedKey || (plan.editor.revision === null && visibleTables.length > 0);
  const layoutBusy = plan.loading || plan.saving || generating || Boolean(savingGuestId);
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

    return merged.map((guest) =>
      guestOverrides[guest.id]
        ? { ...guest, ...guestOverrides[guest.id] }
        : guest,
    );
  }, [guests, localGuests, guestOverrides]);

  const rosterGuests = visibleGuests.filter(
    (guest) => guest.tableId || guest.source === "MANUAL" || guest.rsvpStatus === "ATTENDING",
  );
  const unassigned = rosterGuests.filter((guest) => !guest.tableId);
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
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, name, salutation: manualSalutation, invitedPax: manualPax, category: manualCategory }),
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
    if (layoutBusy || drawing) return;
    const target = targetAtPoint(point);
    setHoverTarget(null);

    if (!target) {
      setMessage(d("Jatuhkan tamu tepat di kursi."));
      setDraggedGuestId(null);
      return;
    }

    if (target.guest) {
      setSwapCandidate({ guestId, target });
      return;
    }

    setSavingGuestId(guestId);
    setMessage("");
    try {
      await onAssigned(guestId, target.table.id, target.seat);
      setGuestOverrides((current) => ({
        ...current,
        [guestId]: { tableId: target.table.id, seatNumber: target.seat },
      }));
      setMessage(d("Penempatan tamu tersimpan."));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : d("Penempatan tamu gagal disimpan."),
      );
    } finally {
      setSavingGuestId(null);
      setDraggedGuestId(null);
    }
  }

  async function confirmSwap() {
    if (!swapCandidate) return;
    const { guestId, target } = swapCandidate;
    if (!target.guest) return;

    const source = visibleGuests.find((guest) => guest.id === guestId);
    if (!source) return;

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
                tableId: sourceResult.tableId,
                seatNumber: sourceResult.seatNumber,
              },
            }
          : {}),
        ...(targetResult
          ? {
              [targetResult.id]: {
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
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid min-w-0 items-start gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
          <DashboardPanel
              title={d("Struktur meja")}
              actions={
                <DashboardStatusBadge active={visibleTables.length > 0}>
                  {visibleTables.length} {locale === "en" ? "tables" : "meja"}
                </DashboardStatusBadge>
              }
          >

            <form onSubmit={generateTables} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <span>{d("Meja")}:</span>
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, 100 - visibleTables.length)}
                  disabled={toolbarBusy || visibleTables.length >= 100}
                  value={tableCount}
                  className="min-h-11 w-16 px-2"
                  onChange={(event) => setTableCount(Number(event.target.value))}
                />
              </label>
              <div className="flex min-w-0 max-w-full items-end gap-2">
                <label className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium">
                  <span>{d("Kursi")}:</span>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    disabled={toolbarBusy || visibleTables.length >= 100}
                    value={seatsPerTable}
                    className="min-h-11 w-16 max-w-full px-2"
                    onChange={(event) => setSeatsPerTable(Number(event.target.value))}
                  />
                </label>
                <Button
                  type="submit"
                  size="sm"
                  className="h-auto min-h-11 max-w-full shrink px-3 py-2 whitespace-normal"
                  disabled={toolbarBusy || visibleTables.length >= 100}
                  title={visibleTables.length >= 100 ? d("Maksimal 100 meja per acara.") : undefined}
                >
                  <span className="min-w-0 break-words">{generating ? d("Menambahkan meja...") : d("Tambah meja")}</span>
                </Button>
              </div>
            </form>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <DashboardCompactStat label={d("Kursi")} value={String(totalSeats)} />
              <DashboardCompactStat label={d("Terisi")} value={String(assignedCount)} />
            </div>
          </DashboardPanel>

          <DashboardPanel title={d("Isi tamu")}>
            <form onSubmit={addManualGuest} className="mt-4 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
              <label className="block w-40 max-w-full text-xs text-muted-foreground">
                {d("Sapaan")}
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
              </label>
              <label className="block min-w-0 max-w-full text-xs text-muted-foreground"
                style={{ width: Math.min(320, Math.max(192, manualName.length * 8 + 32)) }}>
                {d("Nama")}
                <Input value={manualName} onChange={(event) => setManualName(event.target.value)}
                  placeholder={d("Nama tamu manual")} className="mt-1 capitalize" />
              </label>
              <label className="block w-36 max-w-full text-xs text-muted-foreground">
                {d("Kategori tamu")}
                <select value={manualCategory} disabled={manualSaving}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  onChange={(event) => setManualCategory(event.target.value)}>
                  <option value="REGULAR">{d("Reguler")}</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                </select>
              </label>
              <label className="block w-24 max-w-full text-xs text-muted-foreground">
                {d("Jumlah orang")}
                <Input type="number" min={minimumInvitedPaxForSalutation(manualSalutation)} max={MAX_GUEST_PARTY_SIZE}
                  value={manualPax} disabled={manualSaving} className="mt-1 min-h-11"
                  onChange={(event) => setManualPax(Number(event.target.value))} />
              </label>
              <Button type="submit" size="sm" className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                disabled={manualSaving} title={d("Tambah ke Daftar Tamu")}>
                <UserPlus className="h-4 w-4" />
                <span className="min-w-0 break-words">{manualSaving ? d("Menambahkan tamu...") : d("Tambah ke Daftar Tamu")}</span>
              </Button>
            </form>
          </DashboardPanel>
        </div>

        <DashboardPanel className="min-w-0"
            title={d("Daftar tamu")}
            actions={
              <DashboardStatusBadge active={rosterGuests.length > 0}>
                {rosterGuests.length} {locale === "en" ? "guests" : "tamu"}
              </DashboardStatusBadge>
            }
        >
          <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
            <label className="block min-w-0 max-w-full text-xs text-muted-foreground">
              {d("Kategori tamu")}
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
            </label>
            <label className="block min-w-0 max-w-full text-xs text-muted-foreground">
              {d("Tag tamu")}
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
            </label>
            <p role="status" className="w-full text-xs text-muted-foreground">
              {locale === "en"
                ? `Showing ${filteredRoster.length} of ${rosterGuests.length} guests · ${unassigned.length} unassigned.`
                : `Menampilkan ${filteredRoster.length} dari ${rosterGuests.length} tamu · ${unassigned.length} belum ditempatkan.`}
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

          <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
            {filteredRoster.length === 0 && (
              <DashboardEmptyState className="min-h-0! px-3! py-3!"
                title={hasRosterFilter ? d("Tidak ada hasil") : d("Belum ada tamu")}
                description={
                  hasRosterFilter
                    ? d("Tidak ada tamu yang cocok dengan filter aktif.")
                    : d("Tambahkan tamu atau tunggu konfirmasi RSVP Hadir.")
                }
              />
            )}
            {rosterGroups.map((group) => (
              <section key={group.category} aria-label={group.category === "REGULAR" ? d("Reguler") : displayTitleCase(group.category)}>
                <h3 className="mb-1 flex items-center justify-between gap-2 text-sm font-semibold text-primary">
                  <span>{group.category === "REGULAR" ? d("Reguler") : displayTitleCase(group.category)}</span>
                  <span className="font-[family-name:var(--font-undara-mono)] text-xs tabular-nums text-muted-foreground">{group.guests.length}</span>
                </h3>
                <ul className="divide-y divide-border/60">
                  {group.guests.map((guest) => {
                    const name = displayTitleCase(guest.name);
                    const words = name.trim().split(/\s+/u);
                    const initials = [Array.from(words[0])[0], words.length > 1 ? Array.from(words[words.length - 1])[0] : ""].join("");
                    const assignedTable = visibleTables.find((table) => table.id === guest.tableId);
                    const seats = assignedTable ? seatingGuestSeats(guest, assignedTable.capacity) : [];
                    const pax = seatingPartySize(guest);
                    const canDrag = !guest.tableId && !toolbarBusy && tool === "move";
                    return (
                      <li key={guest.id} data-guest-id={guest.id}
                        draggable={canDrag}
                        onDragStart={(event) => {
                          if (!canDrag) { event.preventDefault(); return; }
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
                        {canDrag && <GripVertical aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel className="min-w-0"
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
        <SeatingPlanCanvas layout={layout} tables={visibleTables} guests={visibleGuests} tool={tool} dark={isDarkMode} busy={layoutBusy}
          pageOffset={pageOffsets[pageIndex]}
          draggedGuestId={draggedGuestId} hoverTarget={hoverTarget} selectedTableId={selectedTableId} onTableSelect={setSelectedTableId}
          onTableMove={(id, point) => plan.dispatch({ type: "EDIT", plan: { ...layout, tables: { ...layout.tables, [id]: point } } })}
          onPath={(points) => {
            if (layout.paths.length >= SEATING_MAX_PATHS) { setMessage(d("Maksimal 20 jalur. Hapus jalur untuk menggambar lagi.")); return; }
            plan.dispatch({ type: "EDIT", plan: { ...layout, paths: [...layout.paths, points] } });
          }}
          onDrawingChange={setDrawing}
          onExitDraw={() => setTool("move")}
          onGuestStart={(id) => { setDraggedGuestId(id); setSwapCandidate(null); }} onGuestHover={setHoverFromPoint} onGuestDrop={assignGuestAtPoint}
          onGuestCancel={() => { setDraggedGuestId(null); setHoverTarget(null); }}
          onUndo={() => plan.dispatch({ type: "UNDO" })} onRedo={() => plan.dispatch({ type: "REDO" })}
          label={d("Denah: pilih meja, lalu gunakan tombol panah untuk menggeser.")} emptyLabel={d("Atur jumlah meja dan kursi untuk membuat denah.")}
        />
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
      </DashboardPanel>
    </div>
  );
}
