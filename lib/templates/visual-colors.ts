import type { CSSProperties } from "react";

export type InvitationColorFilter = { color: string; mode: "solid" | "tint" };

export function safeVisualColor(value: unknown, transparent = false): string | undefined {
  if (transparent && value === "transparent") return value;
  return typeof value === "string" && /^#[a-fA-F0-9]{6}$/.test(value) ? value.toLowerCase() : undefined;
}

/** IDs contain only validated paint values, never URLs or user-provided selectors. */
export function invitationColorFilterId(color: string, mode: InvitationColorFilter["mode"]) {
  if (mode !== "solid" && mode !== "tint") return undefined;
  const safe = safeVisualColor(color);
  return safe ? `undara-${mode}-${safe.slice(1)}` : undefined;
}

export function invitationColorFilterCss(color: string | undefined, mode: InvitationColorFilter["mode"]) {
  const id = color ? invitationColorFilterId(color, mode) : undefined;
  return id ? `url("#${id}")` : undefined;
}

/** Luminance tint preserves detail and copies alpha unchanged, including soft image edges. */
export function invitationTintMatrix(color: string) {
  const safe = safeVisualColor(color);
  if (!safe) return undefined;
  const channels = [1, 3, 5].map((index) => Number.parseInt(safe.slice(index, index + 2), 16) / 255);
  return [...channels.flatMap((channel) => [0.2126, 0.7152, 0.0722].map((weight) =>
    Number((channel * weight).toFixed(6))).concat([0, 0])), 0, 0, 0, 1, 0].join(" ");
}

/** Group presentation reaches actual fields; width, opacity and alignment stay on the group. */
export function invitationFieldColors(style?: CSSProperties): CSSProperties {
  return {
    ...(style?.fontSize !== undefined ? { fontSize: style.fontSize } : {}),
    ...(style?.color ? { color: style.color } : {}),
    ...(style?.backgroundColor ? { backgroundColor: style.backgroundColor } : {}),
    ...(style?.borderColor ? { borderColor: style.borderColor } : {}),
  };
}
