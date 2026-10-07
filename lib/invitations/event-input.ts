/** Pure parsing and immutable-event guard helpers for invitation routes. */
export const END_TIME_SENTINEL = "END";

export function optionalName(value: unknown) {
  return String(value ?? "").trim() || null;
}

export function optionalPositiveInt(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isValidTime24(value: string | null) {
  return !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidReceptionTime(value: string | null) {
  return value === END_TIME_SENTINEL || isValidTime24(value);
}

export const EVENT_DETAIL_MUTATION_FIELDS = [
  "type",
  "eventCategory",
  "title",
  "groomName",
  "brideName",
  "groomFatherName",
  "groomMotherName",
  "groomChildOrder",
  "groomChildPosition",
  "brideFatherName",
  "brideMotherName",
  "brideChildOrder",
  "brideChildPosition",
  "venue",
  "address",
  "mapUrl",
  "timezone",
  "eventDate",
  "ceremonyTime",
  "receptionTime",
  "description",
  "eventNotes",
  "eventConfigured",
  "weddingSessions",
  "weddingGuestScopes",
] as const;

export function hasEventDetailMutation(body: Record<string, unknown>) {
  return EVENT_DETAIL_MUTATION_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );
}
