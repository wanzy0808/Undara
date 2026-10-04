import type { InvitationDesignerInvitation, InvitationDesignState } from "./designer-types";
import type { InvitationLanguage } from "@/lib/invitations/language";

export const STUDIO_PREVIEW_PATH = "/studio/preview";
export const STUDIO_PREVIEW_READY = "undara:studio-preview:ready";
export const STUDIO_PREVIEW_DRAFT = "undara:studio-preview:draft";
export const STUDIO_PREVIEW_CLOSE = "undara:studio-preview:close";

export const studioPreviewViewports = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

export type StudioPreviewDevice = keyof typeof studioPreviewViewports;
export type StudioPreviewSize = { width: number; height: number };
export type StudioPreviewSnapshot = {
  invitation: InvitationDesignerInvitation | null;
  design: Pick<InvitationDesignState, "template" | "palette" | "font" | "decor" | "sections" | "photos">;
  designKey: string;
  musicUrl: string;
  eventTag: string;
  dressCode: string;
  invitationLanguage: InvitationLanguage;
};

const deviceInsets = {
  mobile: { side: 14, top: 26, bottom: 22, overhang: 0, base: 0 },
  tablet: { side: 22, top: 26, bottom: 26, overhang: 0, base: 0 },
  desktop: { side: 24, top: 32, bottom: 36, overhang: 96, base: 28 },
} as const;

/** Fit the entire device, including the laptop base, around the real viewport. */
export function studioPreviewDeviceBounds(device: StudioPreviewDevice) {
  const viewport = studioPreviewViewports[device];
  const inset = deviceInsets[device];
  const bodyWidth = viewport.width + inset.side * 2;
  const bodyHeight = viewport.height + inset.top + inset.bottom;
  return {
    width: bodyWidth + inset.overhang * 2,
    height: bodyHeight + inset.base,
    bodyWidth,
    bodyHeight,
    bodyLeft: inset.overhang,
    screenLeft: inset.side,
    screenTop: inset.top,
    baseHeight: inset.base,
  };
}

/** Scale the display only: the iframe keeps the requested CSS viewport. */
export function studioPreviewScale(viewport: StudioPreviewSize, available: StudioPreviewSize) {
  if (available.width <= 0 || available.height <= 0) return 0;
  return Math.min(1, available.width / viewport.width, available.height / viewport.height);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Both sides accept only their own same-origin parent/iframe, never another tab. */
export function isStudioPreviewMessage(
  event: Pick<MessageEvent, "source" | "origin" | "data">,
  source: MessageEventSource | null,
  origin: string,
  type: string,
) {
  return source !== null && event.source === source && event.origin === origin && record(event.data) && event.data.type === type;
}

export function readStudioPreviewSnapshot(value: unknown): StudioPreviewSnapshot | null {
  if (!record(value) || !record(value.design)) return null;
  const design = value.design;
  if (!["template", "palette", "font", "decor"].every((key) => typeof design[key] === "string")) return null;
  if (!record(design.sections) || !record(design.photos)) return null;
  if (!["designKey", "musicUrl", "eventTag", "dressCode"].every((key) => typeof value[key] === "string")) return null;
  if (value.invitationLanguage !== "ID" && value.invitationLanguage !== "EN") return null;
  if (value.invitation !== null) {
    if (!record(value.invitation)) return null;
    const invitation = value.invitation;
    if (!["id", "slug", "title", "eventCategory", "groomName", "brideName", "venue", "timezone", "eventDate", "templateKey"].every((key) => typeof invitation[key] === "string")) return null;
    if (invitation.type !== "WEDDING" && invitation.type !== "ADAT_AKAD") return null;
    if (typeof invitation.isPublished !== "boolean" || !Array.isArray(invitation.assets)) return null;
    if (!invitation.assets.every((asset) => record(asset) && typeof asset.id === "string" && typeof asset.url === "string" && (asset.type === "IMAGE" || asset.type === "AUDIO"))) return null;
  }
  return value as StudioPreviewSnapshot;
}

export function postStudioPreviewDraft(target: Window | null, snapshot: StudioPreviewSnapshot, origin: string) {
  if (!target) return;
  try {
    if (target.location.origin !== origin || target.location.pathname !== STUDIO_PREVIEW_PATH) return;
    target.postMessage({ type: STUDIO_PREVIEW_DRAFT, snapshot }, origin);
  } catch {
    // A frame that navigated away must never receive the customer's draft.
  }
}
