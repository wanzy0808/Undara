import type { GuestLabels } from "@/lib/guests/filters";

export type SeatingGuest = GuestLabels & {
  id: string;
  name: string;
  personalAddressee?: string | null;
  invitedPax?: number;
  tableId?: string | null;
  seatNumber?: number | null;
  rsvpStatus?: string;
  source?: "RSVP" | "MANUAL";
};

export type SeatingTable = {
  id: string;
  name: string;
  shape: string;
  capacity: number;
};

export type SeatingChartProps = {
  invitationId: string;
  title?: string;
  guests: SeatingGuest[];
  tables: SeatingTable[];
  accent?: string;
  onTablesChanged?: () => Promise<void>;
  onAssigned: (
    guestId: string,
    tableId: string,
    seatNumber: number,
  ) => Promise<void>;
};

export type SeatingPoint = {
  x: number;
  y: number;
};

export type SeatingSeatTarget = {
  table: SeatingTable;
  seat: number;
  guest: SeatingGuest | null;
};
