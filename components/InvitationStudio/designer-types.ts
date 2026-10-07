import type { EventCategory } from "@/lib/events/catalog";
import type { FontKey, PaletteKey } from "@/lib/templates/design";
import type { InvitationSections } from "@/lib/templates/sections";
import type { PhotoAssignments } from "@/lib/templates/photo-slots";
import type { EditableInvitationCopy } from "@/lib/templates/editable-copy";
import type { EditableCopyMotions } from "@/lib/templates/editable-copy-motion";
import type { InvitationAssetLayer } from "@/lib/templates/asset-layers";
import type { InvitationSectionStyles } from "@/lib/templates/section-styles";
import type { InvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import type { InvitationSectionInstance } from "@/lib/templates/section-layout";
import type { StudioSectionElementStyles } from "@/lib/templates/section-element-styles";
import type { NativeVisualTransforms } from "@/lib/templates/native-visual-transforms";
import type { NativeVisualLocks } from "@/lib/templates/native-visual-locks";

export type InvitationDesignerInvitation = {
  id: string;
  slug: string;
  type: "WEDDING" | "ADAT_AKAD";
  title: string;
  eventCategory: EventCategory | string;
  groomName: string;
  brideName: string;
  groomFatherName?: string | null;
  groomMotherName?: string | null;
  groomChildOrder?: number | null;
  groomChildPosition?: "ELDEST" | "YOUNGEST" | "NUMBER" | null;
  brideFatherName?: string | null;
  brideMotherName?: string | null;
  brideChildOrder?: number | null;
  brideChildPosition?: "ELDEST" | "YOUNGEST" | "NUMBER" | null;
  venue: string;
  address?: string | null;
  mapUrl?: string | null;
  timezone: string;
  eventDate: string;
  weddingSessions?: unknown;
  ceremonyTime: string | null;
  receptionTime: string | null;
  description: string | null;
  weddingHashtag: string | null;
  dressCode: string | null;
  eventNotes: string | null;
  musicUrl: string | null;
  templateKey: string;
  isPublished: boolean;
  updatedAt?: string;
  accessPaid?: boolean;
  giftBankName?: string | null;
  giftAccountName?: string | null;
  giftAccountNumber?: string | null;
  assets: {
    id: string;
    type: "IMAGE" | "AUDIO";
    url: string;
    title: string | null;
  }[];
};

export type InvitationDesignerPanel =
  | "template"
  | "sections"
  | "decor"
  | "music"
  | "assets"
  | "text";

export type InvitationDesignState = {
  template: string;
  palette: PaletteKey;
  font: FontKey;
  decor: string;
  sections: InvitationSections;
  photos: PhotoAssignments;
  /** Only template-owned narrative copy; never duplicates event identity or schedule. */
  copy: EditableInvitationCopy;
  copyEn: EditableInvitationCopy;
  /** Visual-only entrance choreography for editable template-owned copy. */
  copyMotion: EditableCopyMotions;
  layers: InvitationAssetLayer[];
  sectionStyles: InvitationSectionStyles;
  rsvpConfig: InvitationRsvpConfig;
  sectionLayout: InvitationSectionInstance[];
  sectionElementStyles: StudioSectionElementStyles;
  nativeVisuals: NativeVisualTransforms;
  nativeLocks: NativeVisualLocks;
};

export type InvitationTemplateLayout =
  | "botanical"
  | "editorial"
  | "maroon"
  | "garden"
  | "midnight"
  | "classic";

export type InvitationTemplatePreset = {
  layout: InvitationTemplateLayout;
  palette: PaletteKey;
  font: FontKey;
};
