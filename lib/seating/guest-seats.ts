export type SeatingPartyGuest = {
  id: string;
  tableId?: string | null;
  seatNumber?: number | null;
  invitedPax?: number | null;
};

export function seatingPartySize(guest: Pick<SeatingPartyGuest, "invitedPax">) {
  const value = Number(guest.invitedPax ?? 1);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, 30) : 1;
}

export function seatingSeatBlock(startSeat: number, partySize: number, capacity: number) {
  if (!Number.isInteger(startSeat) || !Number.isInteger(partySize) || !Number.isInteger(capacity)
    || startSeat < 1 || startSeat > capacity || partySize < 1 || partySize > capacity) return [];
  return Array.from({ length: partySize }, (_, index) => ((startSeat - 1 + index) % capacity) + 1);
}

export function seatingGuestSeats(guest: SeatingPartyGuest, capacity: number) {
  if (!guest.tableId || !guest.seatNumber) return [];
  return seatingSeatBlock(guest.seatNumber, seatingPartySize(guest), capacity);
}

export function seatingGuestAtSeat<T extends SeatingPartyGuest>(
  guests: T[],
  tableId: string,
  seatNumber: number,
  capacity: number,
  excludeGuestId?: string | null,
): T | null {
  return guests.find((guest) =>
    guest.id !== excludeGuestId
    && guest.tableId === tableId
    && seatingGuestSeats(guest, capacity).includes(seatNumber),
  ) ?? null;
}

export function seatingOccupiedSeatCount(guests: SeatingPartyGuest[], tableId: string, capacity: number) {
  const occupied = new Set<number>();
  for (const guest of guests) {
    if (guest.tableId !== tableId) continue;
    for (const seat of seatingGuestSeats(guest, capacity)) occupied.add(seat);
  }
  return occupied.size;
}

export function seatingBlocksOverlap(left: number[], right: number[]) {
  const rightSeats = new Set(right);
  return left.some((seat) => rightSeats.has(seat));
}
