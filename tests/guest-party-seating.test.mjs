import assert from "node:assert/strict";
import test from "node:test";
import {
  seatingBlocksOverlap,
  seatingGuestAtSeat,
  seatingGuestSeatLabel,
  seatingGuestSeats,
  seatingOccupiedSeatCount,
  seatingPartySize,
  seatingSeatBlock,
} from "../lib/seating/guest-seats.ts";
import {
  minimumInvitedPaxForSalutation,
  recipientTypeForManualParty,
} from "../lib/guests/manual-party.ts";

test("manual guest salutations define sensible shared Guest party defaults", () => {
  assert.equal(minimumInvitedPaxForSalutation("BAPAK"), 1);
  assert.equal(minimumInvitedPaxForSalutation("IBU"), 1);
  assert.equal(minimumInvitedPaxForSalutation("BAPAK_IBU"), 2);
  assert.equal(recipientTypeForManualParty("BAPAK_IBU", 2), "COUPLE");
  assert.equal(recipientTypeForManualParty("BAPAK_IBU", 4), "FAMILY");
  assert.equal(recipientTypeForManualParty("BAPAK", 3), "GROUP");
});

test("one Guest party occupies adjacent seats and may wrap around a table", () => {
  assert.deepEqual(seatingSeatBlock(3, 4, 8), [3, 4, 5, 6]);
  assert.deepEqual(seatingSeatBlock(7, 3, 8), [7, 8, 1]);
  assert.deepEqual(seatingSeatBlock(7, 9, 8), []);
  assert.equal(seatingPartySize({ invitedPax: 4 }), 4);
});

test("seat lookup treats every slot in one Guest party as occupied", () => {
  const guests = [
    { id: "couple", tableId: "table-a", seatNumber: 2, invitedPax: 2 },
    { id: "family", tableId: "table-a", seatNumber: 6, invitedPax: 3 },
  ];
  assert.deepEqual(seatingGuestSeats(guests[0], 8), [2, 3]);
  assert.equal(seatingGuestAtSeat(guests, "table-a", 3, 8)?.id, "couple");
  assert.equal(seatingGuestAtSeat(guests, "table-a", 8, 8)?.id, "family");
  assert.equal(seatingOccupiedSeatCount(guests, "table-a", 8), 5);
  assert.equal(seatingGuestAtSeat(guests, "table-a", 3, 8, "couple"), null);
  assert.equal(seatingBlocksOverlap([2, 3], [3, 4]), true);
  assert.equal(seatingBlocksOverlap([2, 3], [4, 5]), false);
});

test("every party seat gets a capitalized member label, including a block wrapping through seat one", () => {
  const guest = { id: "hendra", name: "hendra wijaya", tableId: "table-a", seatNumber: 7, invitedPax: 4 };
  assert.deepEqual([7, 8, 1, 2].map((seat) => seatingGuestSeatLabel(guest, seat, 8)), ["Hendra Wijaya 1", "Hendra Wijaya 2", "Hendra Wijaya 3", "Hendra Wijaya 4"]);
  assert.equal(seatingGuestSeatLabel(guest, 4, 8), "");
  assert.equal(seatingGuestSeatLabel({ ...guest, invitedPax: 1 }, 7, 8), "Hendra Wijaya");
  assert.equal(guest.name, "hendra wijaya");
  assert.equal(guest.invitedPax, 4);
});
