export const eventCategoryOptions = [
  { key: "WEDDING", label: "Pernikahan", nameMode: "couple" },
  { key: "SILVER_WEDDING", label: "Silver Wedding", nameMode: "couple" },
  { key: "GOLDEN_WEDDING", label: "Golden Wedding", nameMode: "couple" },
  { key: "BIRTHDAY", label: "Ulang Tahun", nameMode: "single" },
  { key: "BABY_SHOWER", label: "Baby Shower", nameMode: "single" },
  { key: "KHITANAN", label: "Khitanan", nameMode: "single" },
  { key: "SANGJIT", label: "Sangjit", nameMode: "couple" },
  { key: "OTHER", label: "Event Lainnya", nameMode: "optional" },
] as const;

export const indonesiaTimezones = [
  { value: "Asia/Jakarta", label: "WIB", description: "Jakarta / Indonesia Barat" },
  { value: "Asia/Makassar", label: "WITA", description: "Bali / Indonesia Tengah" },
  { value: "Asia/Jayapura", label: "WIT", description: "Papua / Indonesia Timur" },
] as const;

export type EventCategory = (typeof eventCategoryOptions)[number]["key"];
export type EventNameMode = (typeof eventCategoryOptions)[number]["nameMode"];
export type IndonesiaTimezone = (typeof indonesiaTimezones)[number]["value"];

const categorySet = new Set<string>(eventCategoryOptions.map((item) => item.key));
const timezoneSet = new Set<string>(indonesiaTimezones.map((item) => item.value));

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && categorySet.has(value);
}

export function normalizeEventCategory(value: unknown): EventCategory {
  return isEventCategory(value) ? value : "OTHER";
}

export function normalizeIndonesiaTimezone(value: unknown): IndonesiaTimezone {
  return typeof value === "string" && timezoneSet.has(value)
    ? (value as IndonesiaTimezone)
    : "Asia/Jakarta";
}

export function getEventCategory(category: EventCategory) {
  return eventCategoryOptions.find((item) => item.key === category) ?? eventCategoryOptions.find((item) => item.key === "OTHER")!;
}

export function getIndonesiaTimezone(value: string) {
  return indonesiaTimezones.find((item) => item.value === value) ?? indonesiaTimezones[0];
}

export function buildEventTitle(
  category: EventCategory,
  primaryName: string,
  secondaryName: string,
  customTitle = "",
) {
  const primary = primaryName.trim();
  const secondary = secondaryName.trim();

  switch (category) {
    case "WEDDING":
      return primary && secondary ? `Pernikahan ${primary} & ${secondary}` : "Pernikahan";
    case "SILVER_WEDDING":
      return primary && secondary ? `Silver Wedding ${primary} & ${secondary}` : "Silver Wedding";
    case "GOLDEN_WEDDING":
      return primary && secondary ? `Golden Wedding ${primary} & ${secondary}` : "Golden Wedding";
    case "BIRTHDAY":
      return primary ? `Ulang Tahun ${primary}` : "Ulang Tahun";
    case "BABY_SHOWER":
      return primary ? `Baby Shower ${primary}` : "Baby Shower";
    case "KHITANAN":
      return primary ? `Khitanan ${primary}` : "Khitanan";
    case "SANGJIT":
      return primary && secondary ? `Sangjit ${primary} & ${secondary}` : "Sangjit";
    case "OTHER":
      return customTitle.trim();
  }
}
