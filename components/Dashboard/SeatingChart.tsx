"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, LayoutGrid, MousePointer2, PencilLine, Printer, Redo2, RefreshCw, Save, Trash2, Undo2, UserPlus, X } from "lucide-react";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import {
  DashboardCompactStat,
  DashboardEmptyState,
  DashboardStatusBadge,
  DashboardPanel,
} from "@/components/Dashboard/DashboardPrimitives";
import { matchesGuestLabels } from "@/lib/guests/filters";
import { findSeatingSeatTarget, seatingPlanWithTables } from "@/components/Dashboard/seating-chart-geometry";
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

export default function SeatingChart({ invitationId, title = "", guests, tables, onAssigned }: SeatingChartProps) {
  const { d, locale } = useDashboardI18n();
  const { isDarkMode } = useTheme();
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [savingGuestId, setSavingGuestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [localGuests, setLocalGuests] = useState<SeatingGuest[]>([]);
  const [localTables, setLocalTables] = useState<SeatingTable[]>([]);
  const [guestOverrides, setGuestOverrides] = useState<
    Record<string, Partial<SeatingGuest>>
  >({});
  const [hoverTarget, setHoverTarget] = useState<SeatingSeatTarget | null>(null);
  const [swapCandidate, setSwapCandidate] = useState<{
    guestId: string;
    target: SeatingSeatTarget;
  } | null>(null);
  const [tableCount, setTableCount] = useState(tables.length || 1);
  const [seatsPerTable, setSeatsPerTable] = useState(
    tables[0]?.capacity || 8,
  );
  const [generating, setGenerating] = useState(false);
  const plan = useSeatingPlan(invitationId);
  const [tool, setTool] = useState<"move" | "draw">("move");
  const [drawing, setDrawing] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [printing, setPrinting] = useState(false);
  const printCleanup = useRef<(() => void) | null>(null);
  const printRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { printRequest.current?.abort(); printCleanup.current?.(); }, []);

  const visibleTables = useMemo(() => {
    const known = new Set(tables.map((table) => table.id));
    return [
      ...tables,
      ...localTables.filter((table) => !known.has(table.id)),
    ];
  }, [tables, localTables]);
  const layout = useMemo(() => seatingPlanWithTables(plan.editor.plan, visibleTables), [plan.editor.plan, visibleTables]);
  const layoutDirty = seatingPlanKey(layout) !== plan.editor.savedKey || (plan.editor.revision === null && visibleTables.length > 0);
  const layoutBusy = plan.loading || plan.saving || generating || Boolean(savingGuestId);
  const toolbarBusy = layoutBusy || drawing;

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

  const unassigned = visibleGuests.filter(
    (guest) =>
      !guest.tableId &&
      (guest.source === "MANUAL" || guest.rsvpStatus === "ATTENDING"),
  );
  const draggedGuest = draggedGuestId
    ? (visibleGuests.find((guest) => guest.id === draggedGuestId) ?? null)
    : null;
  const categories = Array.from(
    new Set(visibleGuests.flatMap((guest) => guest.category ? [guest.category] : [])),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const tags = Array.from(
    new Set(visibleGuests.flatMap((guest) => guest.tags ?? [])),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const filteredUnassigned = unassigned.filter((guest) =>
    matchesGuestLabels(guest, categoryFilter, tagFilter),
  );
  const hasRosterFilter = Boolean(categoryFilter || tagFilter);
  const totalSeats = visibleTables.reduce((sum, table) => sum + table.capacity, 0);
  const assignedCount = visibleGuests.filter((guest) => guest.tableId).length;

  async function generateTables(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = Math.max(1, Math.floor(tableCount));
    const capacity = Math.max(1, Math.floor(seatsPerTable));

    if (visibleTables.length > 0) {
      setMessage(
        d("Denah sudah memiliki meja. Gunakan data meja yang sudah tersimpan."),
      );
      return;
    }

    setGenerating(true);
    setMessage("");
    try {
      const created: SeatingTable[] = [];
      for (let index = 1; index <= count; index += 1) {
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitationId,
            name: locale === "en" ? `Table ${index}` : `Meja ${index}`,
            capacity,
            shape: "ROUND",
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
          data?.error ||
            (locale === "en"
              ? `Table ${index} could not be created.`
              : `Meja ${index} gagal dibuat.`),
        );
        }
        created.push(data.table as SeatingTable);
        setLocalTables([...created]);
      }
      setLocalTables(created);
      setMessage(locale === "en" ? `Seating plan created: ${count} tables × ${capacity} seats.` : `Denah dibuat: ${count} meja × ${capacity} bangku.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : locale === "en"
            ? "Seating plan could not be created."
            : "Denah gagal dibuat.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function addManualGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = manualName.trim();
    if (!name) {
      setMessage(d("Nama tamu manual wajib diisi."));
      return;
    }

    setManualSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, name }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || d("Tamu manual gagal ditambahkan."));
      }
      setLocalGuests((current) => [...current, data.guest as SeatingGuest]);
      setManualName("");
      setMessage(d("Tamu manual ditambahkan ke roster."));
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

      setMessage(locale === "en" ? `${source.name} and ${target.guest.name} swapped positions.` : `Posisi ${source.name} dan ${target.guest.name} ditukar.`);
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
    <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.7fr)]">
      <aside className="min-w-0 space-y-4">
        <DashboardPanel
            title={d("Struktur meja")}
            actions={
              <DashboardStatusBadge active={visibleTables.length > 0}>
                {visibleTables.length} {locale === "en" ? "tables" : "meja"}
              </DashboardStatusBadge>
            }
        >

          <form onSubmit={generateTables} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">{d("Jumlah meja")}</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(event) => setTableCount(Number(event.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">{d("Bangku per meja")}</span>
              <Input
                type="number"
                min={1}
                max={50}
                value={seatsPerTable}
                onChange={(event) => setSeatsPerTable(Number(event.target.value))}
              />
            </label>
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={generating || visibleTables.length > 0}
              title={visibleTables.length ? d("Denah meja sudah tersimpan") : d("Buat denah meja")}
            >
              <LayoutGrid className="h-4 w-4" />
              {generating
                ? d("Membuat denah meja...")
                : visibleTables.length
                  ? d("Denah meja tersimpan")
                  : d("Buat denah meja")}
            </Button>
          </form>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <DashboardCompactStat label={d("Kursi")} value={String(totalSeats)} />
            <DashboardCompactStat label={d("Terisi")} value={String(assignedCount)} />
          </div>
        </DashboardPanel>

        <DashboardPanel
            title={d("Belum ditempatkan")}
            actions={
              <DashboardStatusBadge active={unassigned.length > 0}>
                {unassigned.length} {locale === "en" ? "guests" : "tamu"}
              </DashboardStatusBadge>
            }
        >

          <form onSubmit={addManualGuest} className="mt-4 space-y-2">
            <Input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              placeholder={d("Nama tamu manual")}
            />
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={manualSaving}
              title={d("Tambahkan tamu manual ke roster")}
            >
              <UserPlus className="h-4 w-4" />
              {manualSaving ? d("Menambahkan tamu...") : d("Tambah tamu manual")}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            <label className="block text-xs text-muted-foreground">
              {d("Kategori tamu")}
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">{displayTitleCase(d("Semua kategori"))}</option>
                {categoryFilter && !categories.includes(categoryFilter) && (
                  <option value={categoryFilter}>{displayTitleCase(categoryFilter)}</option>
                )}
                {categories.map((category) => (
                  <option key={category} value={category}>{displayTitleCase(category)}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              {d("Tag tamu")}
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
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
            <p role="status" className="text-xs text-muted-foreground">
              {locale === "en"
                ? `Showing ${filteredUnassigned.length} of ${unassigned.length} unassigned guests.`
                : `Menampilkan ${filteredUnassigned.length} dari ${unassigned.length} tamu belum ditempatkan.`}
            </p>
            {hasRosterFilter && (
              <Button
                type="button"
                className="min-h-11"
                onClick={() => { setCategoryFilter(""); setTagFilter(""); }}
              >
                {d("Reset filter")}
              </Button>
            )}
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {filteredUnassigned.length === 0 && (
              <DashboardEmptyState
                title={hasRosterFilter ? d("Tidak ada hasil") : d("Semua tamu sudah ditempatkan")}
                description={
                  hasRosterFilter
                    ? d("Tidak ada tamu belum ditempatkan yang cocok dengan filter aktif.")
                    : d("Tamu yang belum memiliki meja akan muncul di sini.")
                }
              />
            )}
            {filteredUnassigned.map((guest) => (
              <div
                key={guest.id}
                draggable={!toolbarBusy && tool === "move"}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", guest.id);
                  event.dataTransfer.effectAllowed = "move";
                  setDraggedGuestId(guest.id);
                  setSwapCandidate(null);
                }}
                onDragEnd={(event) => { if (event.dataTransfer.dropEffect === "none") { setDraggedGuestId(null); setHoverTarget(null); } }}
                className="undara-dashboard-detail-card cursor-grab rounded-tr-[22px] border border-primary/20 bg-primary/[0.035] px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-primary/[0.08] active:cursor-grabbing"
              >
                <div className="truncate font-medium text-foreground">{guest.name}</div>
                {(guest.category || Boolean(guest.tags?.length)) && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {[guest.category, ...(guest.tags ?? [])].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-1 font-[family-name:var(--font-undara-mono)] text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {guest.invitedPax ? `${guest.invitedPax} ${d("orang diundang")} · ` : ""}
                  {guest.source === "RSVP" ? `RSVP · ${d("Hadir")}` : d("Manual")}
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </aside>

      <DashboardPanel className="min-w-0"
          title={d("Denah tempat duduk")}
          actions={
            <div className="flex gap-2">
              <DashboardCompactStat label={d("Meja")} value={String(visibleTables.length)} className="min-w-20" />
              <DashboardCompactStat label={d("Tamu")} value={`${assignedCount}/${visibleGuests.length}`} className="min-w-20" />
            </div>
          }
      >

        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={d("Alat denah")}>
          <Button type="button" size="sm" variant={tool === "move" ? "default" : "outline"} aria-pressed={tool === "move"} disabled={toolbarBusy} onClick={() => setTool("move")}><MousePointer2 className="h-4 w-4" />{d("Pilih / geser")}</Button>
          <Button type="button" size="sm" variant={tool === "draw" ? "default" : "outline"} aria-pressed={tool === "draw"} disabled={toolbarBusy || layout.paths.length >= SEATING_MAX_PATHS} onClick={() => setTool("draw")}><PencilLine className="h-4 w-4" />{d("Gambar jalur")}</Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label={d("Undo")} title={d("Undo")} disabled={toolbarBusy || !plan.editor.past.length} onClick={() => plan.dispatch({ type: "UNDO" })}><Undo2 className="h-4 w-4" /></Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label={d("Redo")} title={d("Redo")} disabled={toolbarBusy || !plan.editor.future.length} onClick={() => plan.dispatch({ type: "REDO" })}><Redo2 className="h-4 w-4" /></Button>
          <Button type="button" size="sm" variant="outline" disabled={toolbarBusy || !layout.paths.length} onClick={() => plan.dispatch({ type: "EDIT", plan: { ...layout, paths: [] } })}><Trash2 className="h-4 w-4" />{d("Hapus jalur")}</Button>
          <select aria-label={d("Pilih meja")} value={selectedTableId} disabled={toolbarBusy || tool !== "move"} onChange={(event) => setSelectedTableId(event.target.value)} className="min-h-11 max-w-44 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">{d("Pilih meja")}</option>{visibleTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button type="button" size="sm" disabled={toolbarBusy || !plan.ready || !layoutDirty} title={!plan.ready ? d("Muat denah sebelum menyimpan.") : undefined} onClick={() => void saveLayout()}><Save className="h-4 w-4" />{plan.saving ? d("Menyimpan...") : d("Simpan denah")}</Button>
            <Button type="button" size="sm" variant="outline" disabled={toolbarBusy || printing} onClick={() => void printLayout()}><Printer className="h-4 w-4" />{printing ? d("Menyiapkan cetak...") : d("Cetak")}</Button>
          </div>
        </div>
        <SeatingPlanCanvas layout={layout} tables={visibleTables} guests={visibleGuests} tool={tool} dark={isDarkMode} busy={layoutBusy}
          draggedGuestId={draggedGuestId} hoverTarget={hoverTarget} selectedTableId={selectedTableId} onTableSelect={setSelectedTableId}
          onTableMove={(id, point) => plan.dispatch({ type: "EDIT", plan: { ...layout, tables: { ...layout.tables, [id]: point } } })}
          onPath={(points) => {
            if (layout.paths.length >= SEATING_MAX_PATHS) { setMessage(d("Maksimal 20 jalur. Hapus jalur untuk menggambar lagi.")); return; }
            plan.dispatch({ type: "EDIT", plan: { ...layout, paths: [...layout.paths, points] } });
          }}
          onDrawingChange={setDrawing}
          onGuestStart={(id) => { setDraggedGuestId(id); setSwapCandidate(null); }} onGuestHover={setHoverFromPoint} onGuestDrop={assignGuestAtPoint}
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
              {locale === "en" ? `Seat occupied by ${swapCandidate.target.guest?.name}. Swap with ${draggedGuest?.name}?` : `Kursi ditempati ${swapCandidate.target.guest?.name}. Tukar dengan ${draggedGuest?.name}?`}
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
