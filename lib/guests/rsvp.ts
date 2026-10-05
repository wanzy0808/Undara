/** Confirmed attendees include the recipient; other RSVP statuses count as zero. */
export function confirmedRsvpPax(guest: { rsvpStatus: string; plusOnes: number }) {
  return guest.rsvpStatus === "ATTENDING" ? guest.plusOnes + 1 : 0;
}

/** Export guest-entered answers as text, never spreadsheet formulas. */
export function rsvpCsvCell(value: string | number) {
  const text = String(value);
  const literal = /^\s*[=+\-@]/u.test(text) ? `'${text}` : text;
  return `"${literal.replaceAll('"', '""')}"`;
}
