import BrandWordmark from "@/components/Brand/BrandWordmark";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { seatingCanvasColors } from "@/lib/seating/appearance";
import { seatingGuestAtSeat, seatingGuestSeatLabel, seatingGuestSeats, seatingPartySize } from "@/lib/seating/guest-seats";
import { SEATING_WIDTH, type SeatingPlan } from "@/lib/seating/plan";
import { seatingPlanPageOffsets, seatingSeatPoint, seatingTableCenter, SEATING_SEAT_RADIUS } from "./seating-chart-geometry";
import type { SeatingGuest, SeatingTable } from "./seating-chart-types";

export const seatingPrintCss = `
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: white; color: #321B1B; }
  body { font-family: Roboto, sans-serif; font-size: 12px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; line-height: 1.25; }
  p { margin: 0; }
  .undara-brand-logo { display:block; width:112px; aspect-ratio:3498/1471; background:#703B3B; mask:url('/assets/brand/undara/logo.webp') left center / contain no-repeat; -webkit-mask:url('/assets/brand/undara/logo.webp') left center / contain no-repeat; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
  .seating-print-map { display:block; width:100%; height:auto; max-height:150mm; }
  .seating-print-sheet + .seating-print-sheet { break-before:page; }
  .seating-print-legend { margin-top:8px; font-size:11px; color:#703B3B; }
  .seating-print-roster { break-before:page; }
  h2 { font-size:18px; margin:0 0 12px; }
  table { border-collapse:collapse; width:100%; }
  th, td { text-align:left; padding:7px 10px; border-bottom:1px solid #d5c5b6; overflow-wrap:anywhere; }
  th { background:#EDE3D8; color:#703B3B; }
  thead { display:table-header-group; }
  tr { break-inside:avoid; }
  svg text { font-family:inherit; }
  @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
`;

export { seatingPlanPageOffsets as seatingPrintOffsets } from "./seating-chart-geometry";

export default function SeatingPlanPrint({ title, layout, tables, guests, locale }: {
  title: string; layout: SeatingPlan; tables: SeatingTable[]; guests: SeatingGuest[]; locale: string;
}) {
  const en = locale === "en", colors = seatingCanvasColors();
  const rows = tables.flatMap((table) => guests.filter((guest) => guest.tableId === table.id)
    .sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0)).map((guest) => ({ guest, table: table.name })));
  const unassigned = guests.filter((guest) => !guest.tableId && (guest.source === "MANUAL" || guest.rsvpStatus === "ATTENDING"));
  const assignedSeats = rows.reduce((sum, { guest }) => sum + seatingPartySize(guest), 0);
  const offsets = seatingPlanPageOffsets(layout.height);
  return (
    <main>
      <style>{seatingPrintCss}</style>
      {offsets.map((offset, page) => <section key={offset} className="seating-print-sheet">
      <header><div><h1>{displayTitleCase(title) || (en ? "Seating plan" : "Denah tamu")}</h1><p>{en ? "Seating plan" : "Denah tempat duduk"} · {tables.length} {en ? "tables" : "meja"} · {assignedSeats} {en ? "seats occupied" : "kursi terisi"}{offsets.length > 1 ? ` · ${en ? "Page" : "Halaman"} ${page + 1}/${offsets.length}` : ""}</p></div><BrandWordmark size="dashboard" /></header>
      <svg className="seating-print-map" xmlns="http://www.w3.org/2000/svg" viewBox={`0 ${offset} ${SEATING_WIDTH} 620`} role="img" aria-label={en ? "Table positions and bridal route" : "Posisi meja dan jalur pengantin"}>
        <defs><marker id={`seating-route-tip-${page}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill={colors.table} /></marker></defs>
        <rect width={SEATING_WIDTH} height={layout.height} fill="#FFF9F3" />
        {layout.paths.map((points, index) => <polyline key={index} points={Array.from({ length: points.length / 2 }, (_, i) => `${points[i * 2]},${points[i * 2 + 1]}`).join(" ")} fill="none" stroke={colors.table} strokeWidth={4} strokeDasharray="10 7" strokeLinecap="round" strokeLinejoin="round" markerEnd={`url(#seating-route-tip-${page})`} />)}
        {tables.map((table, index) => {
          const center = seatingTableCenter(table.id, index, tables.length, layout);
          return <g key={table.id} transform={`translate(${center.x} ${center.y})`}>
            {table.shape === "ROUND" ? <circle r={44} fill={colors.table} /> : <rect x={table.shape === "SQUARE" ? -36 : -48} y={table.shape === "SQUARE" ? -36 : -30} width={table.shape === "SQUARE" ? 72 : 96} height={table.shape === "SQUARE" ? 72 : 60} rx={8} fill={colors.table} />}
            <text textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight="bold" fill={colors.tableText}>{displayTitleCase(table.name)}</text>
            {Array.from({ length: table.capacity }, (_, seatIndex) => {
              const point = seatingSeatPoint({ x: 0, y: 0 }, seatIndex, table.capacity);
              const seat = seatIndex + 1;
              const guest = seatingGuestAtSeat(guests, table.id, seat, table.capacity);
              const label = guest ? seatingGuestSeatLabel(guest, seat, table.capacity) : "";
              return <g key={seatIndex} transform={`translate(${point.x} ${point.y})`}>
                <circle r={SEATING_SEAT_RADIUS} fill={guest ? colors.seatOccupied : colors.seatEmpty} stroke={colors.seatStroke} strokeWidth={2} />
                <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={guest ? "#321B1B" : colors.seatStroke}>{seat}</text>
                {guest && <text y={31} textAnchor="middle" fontSize={10} fill={colors.guestText}>{label}</text>}
              </g>;
            })}
          </g>;
        })}
      </svg>
      {layout.paths.length > 0 && <p className="seating-print-legend">{en ? "Dashed arrow: bridal route" : "Panah putus-putus: jalur pengantin"}</p>}
      </section>)}
      {(rows.length > 0 || unassigned.length > 0) && <section className="seating-print-roster"><h2>{en ? "Guest placement" : "Penempatan tamu"}</h2>
        <table><thead><tr><th>{en ? "Table" : "Meja"}</th><th>{en ? "Seat" : "Kursi"}</th><th>{en ? "Guest" : "Tamu"}</th></tr></thead>
          <tbody>{rows.map(({ guest, table }) => {
            const tableData = tables.find((item) => item.name === table);
            const seats = tableData ? seatingGuestSeats(guest, tableData.capacity) : [];
            return <tr key={guest.id}><td>{displayTitleCase(table)}</td><td>{seats.length ? seats.join(", ") : guest.seatNumber ?? "—"}</td><td>{displayTitleCase(guest.name)}{seatingPartySize(guest) > 1 ? ` · ${seatingPartySize(guest)} pax` : ""}</td></tr>;
          })}
            {unassigned.map((guest) => <tr key={guest.id}><td>{en ? "Unassigned" : "Belum ditempatkan"}</td><td>—</td><td>{displayTitleCase(guest.name)}</td></tr>)}
          </tbody></table>
      </section>}
    </main>
  );
}
