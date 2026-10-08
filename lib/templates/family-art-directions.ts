import type { InvitationSectionKey } from "@/lib/templates/sections";

/** Visual direction only; selectable themes and event compatibility live in catalog.ts. */
export const familyArtDirections = {
  "cherry-picnic": { cover: "picnic", envelope: "pocket", vignette: null, accent: "cherries" },
  "velvet-wish": { cover: "velvet", envelope: "gatefold", vignette: null, accent: "candle" },
  "little-parade": { cover: "parade", envelope: "sleeve", vignette: null, accent: "pennants" },
  "disco-bloom": { cover: "disco", envelope: "wrap", vignette: null, accent: "mirror" },
  "serambi-pagi": { cover: "arched", envelope: "pocket", vignette: "greeting" },
  "rumah-senja": { cover: "editorial", envelope: "wrap", vignette: "closing" },
  "langit-safari": { cover: "playful", envelope: "sleeve", vignette: "greeting" },
  "purnama-biru": { cover: "night", envelope: "gatefold", vignette: "closing" },
  "giok-abadi": { cover: "tea", envelope: "gatefold", vignette: "greeting" },
  "peony-silk": { cover: "romantic", envelope: "wrap", vignette: "closing" },
  "imperial-crimson": { cover: "ceremony", envelope: "gatefold", vignette: "closing" },
  "porcelain-bloom": { cover: "porcelain", envelope: "sleeve", vignette: "greeting" },
} as const;

export type FamilyStationeryTheme = keyof typeof familyArtDirections;
export function familyArtDirection(key: string) {
  const theme = key.split("::")[0];
  return Object.hasOwn(familyArtDirections, theme)
    ? familyArtDirections[theme as FamilyStationeryTheme]
    : undefined;
}

export function familyArtworkUrl(theme: string, kind: "scene" | "detail" = "scene") {
  return familyArtDirection(theme) ? `/templates/${theme.split("::")[0]}/${kind}.webp` : undefined;
}

export function familyHasSectionArtwork(theme: string, section: InvitationSectionKey) {
  return familyArtDirection(theme)?.vignette === section;
}

export function birthdayStationeryAccent(theme: string) {
  const direction = familyArtDirection(theme);
  return direction && "accent" in direction ? direction.accent : undefined;
}
