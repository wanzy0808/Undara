import { isInvitationSectionAnimation, type InvitationSectionAnimation } from "@/lib/templates/section-animations";
import { safeVisualColor } from "@/lib/templates/visual-colors";

/** Template-safe, invitation-scoped artwork and optional decorative text. */
export const studioObjectSections = [
  "envelope", "cover", "greeting", "identity", "event", "dateTime", "gallery",
  "countdown", "location", "rsvp", "wishes", "gift", "closing", "footer",
] as const;
export type StudioObjectSection = (typeof studioObjectSections)[number];
export type InvitationShapeKind = "rectangle" | "circle" | "line";
export type InvitationTextAnimationUnit = "whole" | "word" | "character" | "line";
export type CustomerAssetAccess = "locked" | "content" | "customizable";
export type InvitationAssetLayer = {
  id: string;
  /** Empty for text objects. Images always reference shipped public derivatives. */
  src: string;
  kind?: "text" | "shape";
  text?: string;
  shape?: InvitationShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  section?: StudioObjectSection;
  /** Optional section-instance owner. Legacy layers without it belong to the canonical instance. */
  sectionInstanceId?: string;
  x: number;
  y: number;
  width: number;
  /** Optional height relative to section width; absent preserves original image proportions. */
  height?: number;
  opacity: number;
  rotation?: number;
  fontSize?: number;
  fontRole?: "heading" | "body";
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  /** Text background / image frame. Absent preserves the existing transparent surface. */
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  /** Locked layers stay visible/selectable in Studio but cannot be transformed. */
  locked?: boolean;
  /** Hidden layers remain in the design/layer list but are omitted from public rendering. */
  hidden?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  /** Optional Studio label for easier layer management. */
  name?: string;
  /** Template-authored customer capability. Staff authoring always remains unrestricted. */
  customerAccess?: CustomerAssetAccess;
  /** Optional Studio group. Group IDs never affect public rendering by themselves. */
  groupId?: string;
  /** Optional entrance animation for this visual object. */
  animation?: InvitationSectionAnimation;
  animationDuration?: number;
  animationDelay?: number;
  /** Text-only choreography. Whole keeps the layer as a single animated object. */
  textAnimationUnit?: InvitationTextAnimationUnit;
  animationStagger?: number;
};

/** Customer Studio stays intentionally simple; Template Mode may author richer compositions. */
export const MAX_CUSTOMER_ASSET_LAYERS = 10;
export const MAX_TEMPLATE_ASSET_LAYERS = 120;
/** Allows a rich template plus a small customer-owned overlay budget in one saved design. */
export const MAX_PERSISTED_ASSET_LAYERS = 140;
/** Backwards-compatible UI default for customer-scoped callers. */
export const MAX_ASSET_LAYERS = MAX_CUSTOMER_ASSET_LAYERS;
const assetRoots = ["/template/", "/templates/", "/uploads/designer-assets/"];
const numberBetween = (input: unknown, min: number, max: number, fallback: number) =>
  typeof input === "number" && Number.isFinite(input) ? Math.min(max, Math.max(min, input)) : fallback;

export function isTemplateIllustration(src: unknown): src is string {
  if (typeof src !== "string" || src.length > 260 || !assetRoots.some((root) => src.startsWith(root))) return false;
  const segments = src.split("/").slice(2);
  if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || /[\\?#\x00-\x1f]/.test(part) || /%(?:2e|2f|5c|25)/i.test(part))) return false;
  return /\.(?:png|jpe?g|webp|gif|avif)$/i.test(src);
}

export function sanitizeAssetLayers(value: unknown): InvitationAssetLayer[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  const output: InvitationAssetLayer[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const entry = row as Record<string, unknown>;
    const textObject = entry.kind === "text";
    const shapeObject = entry.kind === "shape";
    const shape = entry.shape === "circle" || entry.shape === "line" ? entry.shape : "rectangle";
    const text = typeof entry.text === "string" ? entry.text.slice(0, 180) : "";
    if ((textObject ? !text.trim() : shapeObject ? false : !isTemplateIllustration(entry.src)) ||
      typeof entry.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(entry.id) || used.has(entry.id)) continue;
    used.add(entry.id);
    const layer: InvitationAssetLayer = {
      id: entry.id,
      src: textObject || shapeObject ? "" : entry.src as string,
      x: numberBetween(entry.x, 0, 100, 50),
      y: numberBetween(entry.y, 0, 100, 50),
      width: numberBetween(entry.width, 5, 85, 28),
      opacity: numberBetween(entry.opacity, 0, 1, 1),
    };
    if (shapeObject) {
      layer.kind = "shape";
      layer.shape = shape;
      layer.fill = typeof entry.fill === "string" && /^#[a-fA-F0-9]{6}$/.test(entry.fill) ? entry.fill : "#C07A84";
      layer.stroke = typeof entry.stroke === "string" && /^#[a-fA-F0-9]{6}$/.test(entry.stroke) ? entry.stroke : "#C07A84";
      layer.strokeWidth = numberBetween(entry.strokeWidth, 0, 12, shape === "line" ? 2 : 0);
      layer.radius = numberBetween(entry.radius, 0, 100, shape === "circle" ? 100 : 0);
    }
    if (textObject) {
      layer.kind = "text";
      layer.text = text;
      layer.fontSize = numberBetween(entry.fontSize, 10, 144, 24);
      layer.fontRole = entry.fontRole === "body" ? "body" : "heading";
      if (typeof entry.fontFamily === "string" && /^[A-Za-z0-9 .+_-]{1,64}$/.test(entry.fontFamily)) layer.fontFamily = entry.fontFamily;
      if (typeof entry.fontWeight === "number" && Number.isFinite(entry.fontWeight)) layer.fontWeight = numberBetween(entry.fontWeight, 300, 900, 400);
      if (entry.textAlign === "left" || entry.textAlign === "center" || entry.textAlign === "right") layer.textAlign = entry.textAlign;
      if (typeof entry.letterSpacing === "number" && Number.isFinite(entry.letterSpacing)) layer.letterSpacing = numberBetween(entry.letterSpacing, -2, 12, 0);
      if (typeof entry.lineHeight === "number" && Number.isFinite(entry.lineHeight)) layer.lineHeight = numberBetween(entry.lineHeight, 0.8, 2.5, 1.2);
      layer.color = typeof entry.color === "string" && /^#[a-fA-F0-9]{6}$/.test(entry.color) ? entry.color : "#C07A84";
    }
    if (!shapeObject) {
      const background = safeVisualColor(entry.background, true);
      const borderColor = safeVisualColor(entry.borderColor);
      if (background) layer.background = background;
      if (borderColor) layer.borderColor = borderColor;
      if (entry.borderWidth !== undefined) layer.borderWidth = numberBetween(entry.borderWidth, 0, 12, 2);
      // Images use color as optional tint; existing text-color behavior stays compatible.
      if (!textObject) {
        const tint = safeVisualColor(entry.color);
        if (tint) layer.color = tint;
      }
    }
    if (entry.height !== undefined) layer.height = numberBetween(entry.height, 3, 200, layer.width);
    if (!shapeObject && entry.radius !== undefined) layer.radius = numberBetween(entry.radius, 0, 100, 0);
    if (entry.shadowX !== undefined) layer.shadowX = numberBetween(entry.shadowX, -50, 50, 0);
    if (entry.shadowY !== undefined) layer.shadowY = numberBetween(entry.shadowY, -50, 50, 8);
    if (entry.shadowBlur !== undefined) layer.shadowBlur = numberBetween(entry.shadowBlur, 0, 60, 18);
    if (typeof entry.shadowColor === "string" && /^#[a-fA-F0-9]{6}$/.test(entry.shadowColor)) layer.shadowColor = entry.shadowColor;
    if (entry.shadowOpacity !== undefined) layer.shadowOpacity = numberBetween(entry.shadowOpacity, 0, 1, 0.2);
    if (studioObjectSections.includes(entry.section as StudioObjectSection)) layer.section = entry.section as StudioObjectSection;
    if (typeof entry.sectionInstanceId === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(entry.sectionInstanceId)) {
      layer.sectionInstanceId = entry.sectionInstanceId;
    }
    if (entry.rotation !== undefined) layer.rotation = numberBetween(entry.rotation, -180, 180, 0);
    if (entry.locked === true) layer.locked = true;
    if (entry.hidden === true) layer.hidden = true;
    if (entry.flipX === true) layer.flipX = true;
    if (entry.flipY === true) layer.flipY = true;
    if (typeof entry.name === "string") {
      const name = entry.name.replace(/[\\u0000-\\u001f\\u007f]/g, " ").replace(/\\s+/g, " ").trim().slice(0, 60);
      if (name) layer.name = name;
    }
    if (entry.customerAccess === "locked" || entry.customerAccess === "content" || entry.customerAccess === "customizable") {
      layer.customerAccess = entry.customerAccess;
    }
    if (typeof entry.groupId === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(entry.groupId)) layer.groupId = entry.groupId;
    if (isInvitationSectionAnimation(entry.animation)) layer.animation = entry.animation;
    if (layer.animation && layer.animation !== "none") {
      if (entry.animationDuration !== undefined) layer.animationDuration = numberBetween(entry.animationDuration, 0.2, 2.5, 0.7);
      if (entry.animationDelay !== undefined) layer.animationDelay = numberBetween(entry.animationDelay, 0, 2, 0);
      if (textObject && (entry.textAnimationUnit === "word" || entry.textAnimationUnit === "character" || entry.textAnimationUnit === "line")) {
        layer.textAnimationUnit = entry.textAnimationUnit;
      }
      if (textObject && layer.textAnimationUnit && entry.animationStagger !== undefined) {
        layer.animationStagger = numberBetween(entry.animationStagger, 0.01, 0.15, 0.05);
      }
    }
    output.push(layer);
    if (output.length === MAX_PERSISTED_ASSET_LAYERS) break;
  }
  return output;
}

export function parseAssetLayers(designKey: string): InvitationAssetLayer[] {
  const part = designKey.split("::").find((token) => token.startsWith("layers="));
  if (!part || part.length > 30000) return [];
  try {
    return sanitizeAssetLayers(JSON.parse(decodeURIComponent(part.slice("layers=".length))));
  } catch {
    return [];
  }
}

export function withAssetLayers(designKey: string, layers: InvitationAssetLayer[]): string {
  const base = designKey.split("::").filter((part) => !part.startsWith("layers=")).join("::");
  const normalized = sanitizeAssetLayers(layers);
  return normalized.length ? `${base}::layers=${encodeURIComponent(JSON.stringify(normalized))}` : base;
}
