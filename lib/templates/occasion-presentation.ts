import type { InvitationSectionKey } from "@/lib/templates/sections";
import type { GalleryPresentation } from "@/lib/templates/photo-slots";

type Heading = readonly [id: string, en: string];
type OccasionPresentation = {
  gallery: GalleryPresentation;
  surfaceSections: readonly InvitationSectionKey[];
  headings: Partial<Record<InvitationSectionKey, Heading>>;
};

/** Presentation only. Event compatibility remains exclusively in catalog.ts. */
export const occasionPresentations = {
  "little-cloud": {
    gallery: "carousel",
    surfaceSections: ["greeting", "identity", "gallery", "rsvp", "gift"],
    headings: {
      greeting: ["Bahagia kecil yang dinanti", "A little joy on its way"],
      identity: ["Dari keluarga kami", "From our family"],
      event: ["Mari berbagi bahagia", "Let's share the joy"],
      gallery: ["Cerita sebelum bertemu", "Memories before we meet"],
      wishes: ["Harapan untuk si kecil", "Wishes for our little one"],
      closing: ["Sampai bertemu", "See you soon"],
    },
  },
  gathering: {
    gallery: "masonry",
    surfaceSections: ["identity", "event", "gallery", "location", "wishes"],
    headings: {
      greeting: ["Ada cerita untuk dibagi", "A story to share"],
      identity: ["Tentang pertemuan ini", "About this gathering"],
      event: ["Rencana kita", "Our plans"],
      gallery: ["Momen bersama", "Moments together"],
      closing: ["Bertemu, berbagi, mengingat", "Meet, share, remember"],
    },
  },
  "silver-reverie": {
    gallery: "masonry",
    surfaceSections: ["greeting", "gallery", "location", "wishes", "closing"],
    headings: {
      greeting: ["Kasih yang terus tumbuh", "A love that keeps growing"],
      identity: ["Masih berjalan bersama", "Still side by side"],
      event: ["Merayakan perjalanan", "Celebrating the journey"],
      gallery: ["Lembar kenangan", "Pages of memories"],
      closing: ["Untuk banyak hari lagi", "For many more days"],
    },
  },
  "golden-keepsake": {
    gallery: "stack",
    surfaceSections: ["identity", "dateTime", "gallery", "rsvp", "gift"],
    headings: {
      greeting: ["Hangatnya kebersamaan", "The warmth of togetherness"],
      identity: ["Cerita yang kami jaga", "The story we cherish"],
      event: ["Hari untuk berkumpul", "A day to gather"],
      gallery: ["Album sepanjang waktu", "An album through time"],
      closing: ["Kasih yang tinggal", "A love that stays"],
    },
  },
} as const satisfies Record<string, OccasionPresentation>;

export type OccasionThemeKey = keyof typeof occasionPresentations;
export function occasionPresentation(key: string): OccasionPresentation | undefined {
  return Object.hasOwn(occasionPresentations, key)
    ? occasionPresentations[key as OccasionThemeKey]
    : undefined;
}

export function occasionSectionBackground(key: string, section: InvitationSectionKey, palette: { bg: string; surface: string }) {
  return occasionPresentation(key)?.surfaceSections.includes(section) ? palette.surface : palette.bg;
}
