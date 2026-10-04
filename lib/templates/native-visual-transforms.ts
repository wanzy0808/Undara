import type { CSSProperties } from "react";
import { editableInvitationCopyFields } from "@/lib/templates/editable-copy";
import { invitationFonts } from "@/lib/templates/design";
import { invitationFontFamily } from "@/lib/templates/presentation";
import {
  isInvitationSectionAnimation,
  type InvitationSectionAnimation,
} from "@/lib/templates/section-animations";
import { invitationContentSectionKeys } from "@/lib/templates/section-layout";
import type { PhotoSlot } from "@/lib/templates/photo-slots";

export type NativeVisualTextAlign = "left" | "center" | "right";

export type NativeVisualTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  /** Optional visual overrides share the same persisted nativeVisuals token. */
  opacity?: number;
  color?: string;
  background?: string;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: NativeVisualTextAlign;
  letterSpacing?: number;
  lineHeight?: number;
  fontFamily?: string;
  animation?: InvitationSectionAnimation;
  animationDuration?: number;
  animationDelay?: number;
  /** Reversible presentation removal. Source data and component behavior stay intact. */
  hidden?: boolean;
};
export type NativeVisualTransforms = Record<string, NativeVisualTransform>;

export const defaultNativeVisualTransform: NativeVisualTransform = {
  x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
};

const nativeObjectKey = /^object:(?:envelope|cover|greeting|identity|event|dateTime|gallery|countdown|location|rsvp|wishes|gift|closing|footer):[a-zA-Z0-9_-]{1,64}(?::[a-zA-Z0-9_-]{1,64})?$/;
const nativeTextObjectId = /(?:^|[-_])(?:kicker|date|name|names|venue|address|title|heading|subtitle|signature|quote|hashtag|copy|greeting|timezone|start|end|bank-name|account-name|account-number|dress-code|side-label|ending|parents|value|label|button)(?:$|[-_])/i;
const nativeSystemContentObjectId = /^(?:date|event-title|venue|address|dress-code|timezone|start|end|bank-name|account-name|account-number|personOne-name|personTwo-name|personOne-parents|personTwo-parents|event-name|names|hashtag|letter-names|empty-copy)$/i;
const hexColor = /^#[0-9a-fA-F]{6}$/;
const nativeFontFamilies: ReadonlySet<string> = new Set<string>(
  Object.values(invitationFonts).flatMap((item) => [item.heading, item.body]),
);

const keys = new Set<string>([
  ...editableInvitationCopyFields.map((field) => `copy:${field}`),
  ...invitationContentSectionKeys.map((section) => `heading:${section}`),
  "heading:envelope",
  "element:location:button", "element:gift:button",
  "element:wishes:input", "element:wishes:button",
  "rsvp:title", "rsvp:button", "rsvp:inputs",
  "photo:cover", "photo:envelope:cover", "photo:personOne", "photo:personTwo",
]);

export function nativeVisualCapabilities(key: string) {
  const parts = key.split(":");
  const kind = parts[0];
  if (kind === "photo") return { opacity: true, colors: false, typography: false };
  if (kind === "element" || kind === "rsvp") return { opacity: false, colors: false, typography: false };
  if (kind === "heading" || kind === "copy") return { opacity: true, colors: true, typography: true };
  if (kind === "object") {
    const objectId = parts[2] ?? "";
    const groupObject = /(?:^|[-_])group$/i.test(objectId);
    return { opacity: true, colors: true, typography: !groupObject && nativeTextObjectId.test(objectId) };
  }
  return { opacity: false, colors: false, typography: false };
}

export function nativeVisualUsesSystemContent(key: string) {
  const parts = key.split(":");
  const kind = parts[0];
  const section = parts[1];
  const objectId = parts[2] ?? "";
  if (kind === "heading") return section === "envelope" || section === "cover";
  if (kind !== "object") return false;
  if (section === "countdown" && /^(?:hari|jam|menit|detik|days?|hours?|minutes?|seconds?)(?:-value)?$/i.test(objectId)) return true;
  return nativeSystemContentObjectId.test(objectId);
}

export function nativeVisualSupportsAnimation(key: string) {
  const kind = key.split(":")[0];
  return kind === "heading" || kind === "object" || kind === "element" || kind === "rsvp";
}

export function isNativeVisualKey(key: string) {
  if (keys.has(key) || nativeObjectKey.test(key) || /^photo:gallery:[a-zA-Z0-9_-]{1,64}(?::[a-zA-Z0-9_-]{1,64})?$/.test(key)) return true;
  const parts = key.split(":");
  const instanceId = parts.at(-1);
  if (!instanceId || !/^[a-zA-Z0-9_-]{1,64}$/.test(instanceId)) return false;
  if (parts.length === 3 && (parts[0] === "copy" || parts[0] === "heading")) {
    return keys.has(`${parts[0]}:${parts[1]}`);
  }
  if (parts.length === 4 && parts[0] === "element") {
    return keys.has(`element:${parts[1]}:${parts[2]}`);
  }
  if (parts.length === 3 && parts[0] === "rsvp") {
    return keys.has(`rsvp:${parts[1]}`);
  }
  if (parts.length === 3 && parts[0] === "photo") {
    return keys.has(`photo:${parts[1]}`);
  }
  return false;
}

export function nativePhotoVisualKey(slot: PhotoSlot, stage: "envelope" | "cover", instanceId?: string, assetId?: string) {
  const base = slot === "gallery" ? assetId ? `photo:gallery:${assetId}` : ""
    : slot === "cover" && stage === "envelope" ? "photo:envelope:cover" : `photo:${slot}`;
  const key = instanceId && base !== "photo:envelope:cover" ? `${base}:${instanceId}` : base;
  return isNativeVisualKey(key) ? key : null;
}

export function nativeVisualInstanceId(key: string) {
  if (!isNativeVisualKey(key)) return null;
  const parts = key.split(":");
  if ((parts[0] === "object" || parts[0] === "element") && parts.length === 4) return parts[3];
  if (["copy", "heading", "rsvp"].includes(parts[0]) && parts.length === 3) return parts[2];
  if (parts[0] === "photo") {
    if (parts[1] === "gallery" && parts.length === 4) return parts[3];
    if (parts[1] !== "gallery" && parts[1] !== "envelope" && parts.length === 3) return parts[2];
  }
  return null;
}

/** Scoped controls start from the same legacy base styles that the public CSS inherits. */
export function nativeVisualTransformForKey(transforms: NativeVisualTransforms, key: string) {
  if (!isNativeVisualKey(key)) return undefined;
  const baseKey = nativeVisualInstanceId(key) ? key.slice(0, key.lastIndexOf(":")) : key;
  if (!transforms[baseKey] && !transforms[key]) return undefined;
  return { ...defaultNativeVisualTransform, ...transforms[baseKey], ...transforms[key] };
}

/** Every registered visual target can be removed without deleting its source record. */
export function nativeVisualCanHide(key: string) {
  return isNativeVisualKey(key);
}

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(max, Math.max(min, value)) * 100) / 100 : fallback;
const optionalNumber = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(max, Math.max(min, value)) * 100) / 100 : undefined;
const optionalColor = (value: unknown) =>
  typeof value === "string" && hexColor.test(value) ? value.toLowerCase() : undefined;
const optionalAlign = (value: unknown): NativeVisualTextAlign | undefined =>
  value === "left" || value === "center" || value === "right" ? value : undefined;
const optionalFontFamily = (value: unknown) =>
  typeof value === "string" && nativeFontFamilies.has(value) ? value : undefined;

export function sanitizeNativeVisualTransforms(value: unknown): NativeVisualTransforms {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: NativeVisualTransforms = {};
  // Full templates and duplicated sections need more than 96 editable targets.
  for (const [key, raw] of Object.entries(value).slice(0, 512)) {
    if (!isNativeVisualKey(key) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const source = raw as Record<string, unknown>;
    const capabilities = nativeVisualCapabilities(key);
    const transform: NativeVisualTransform = {
      x: clamp(source.x, -2000, 2000, 0),
      y: clamp(source.y, -2000, 2000, 0),
      scaleX: clamp(source.scaleX, 0.25, 3, 1),
      scaleY: clamp(source.scaleY, 0.25, 3, 1),
      rotation: clamp(source.rotation, -180, 180, 0),
    };
    if (capabilities.opacity) transform.opacity = optionalNumber(source.opacity, 0.2, 1);
    if (capabilities.colors) {
      transform.color = optionalColor(source.color);
      transform.background = optionalColor(source.background);
      transform.borderColor = optionalColor(source.borderColor);
    }
    if (capabilities.typography) {
      transform.fontSize = optionalNumber(source.fontSize, 8, 160);
      const weight = optionalNumber(source.fontWeight, 100, 900);
      transform.fontWeight = weight === undefined ? undefined : Math.round(weight / 100) * 100;
      transform.textAlign = optionalAlign(source.textAlign);
      transform.letterSpacing = optionalNumber(source.letterSpacing, -5, 20);
      transform.lineHeight = optionalNumber(source.lineHeight, 0.7, 3);
      transform.fontFamily = optionalFontFamily(source.fontFamily);
    }
    if (nativeVisualSupportsAnimation(key) && isInvitationSectionAnimation(source.animation)) {
      transform.animation = source.animation;
      transform.animationDuration = optionalNumber(source.animationDuration, 0.2, 2.5);
      transform.animationDelay = optionalNumber(source.animationDelay, 0, 2);
    }
    if (source.hidden === true && nativeVisualCanHide(key)) transform.hidden = true;
    for (const [property, propertyValue] of Object.entries(transform)) {
      if (propertyValue === undefined) delete (transform as Record<string, unknown>)[property];
    }
    const hasTransform = transform.x !== 0 || transform.y !== 0 || transform.scaleX !== 1 ||
      transform.scaleY !== 1 || transform.rotation !== 0;
    const hasVisualOverride = Object.keys(transform).some((name) =>
      !["x", "y", "scaleX", "scaleY", "rotation"].includes(name));
    // An identity transform on an instance can explicitly neutralize a legacy base transform.
    if (hasTransform || hasVisualOverride || nativeVisualInstanceId(key)) result[key] = transform;
  }
  return result;
}

export function parseNativeVisualTransforms(designKey: string): NativeVisualTransforms {
  const token = designKey.split("::").find((part) => part.startsWith("nativeVisuals="));
  if (!token || token.length > 256000) return {};
  try {
    return sanitizeNativeVisualTransforms(JSON.parse(decodeURIComponent(token.slice(14))));
  } catch {
    return {};
  }
}

export function withNativeVisualTransforms(designKey: string, transforms: NativeVisualTransforms) {
  const base = designKey.split("::").filter((part) => !part.startsWith("nativeVisuals=")).join("::");
  const clean = sanitizeNativeVisualTransforms(transforms);
  return Object.keys(clean).length
    ? `${base}::nativeVisuals=${encodeURIComponent(JSON.stringify(clean))}`
    : base;
}

export function nativeVisualSelector(key: string) {
  if (!isNativeVisualKey(key)) return null;
  const parts = key.split(":");
  const [kind, section, element] = parts;
  if (kind === "photo" && section === "gallery" && element) {
    const prefix = parts[3] ? `[data-section-instance-id="${parts[3]}"] ` : "";
    return `${prefix}[data-invitation-photo-slot="gallery"][data-studio-photo-id="${element}"]`;
  }
  if (kind === "object" && section && element) {
    const prefix = parts[3] ? `[data-section-instance-id="${parts[3]}"] ` : "";
    return `${prefix}[data-studio-native-object="object:${section}:${element}"]`;
  }
  if (kind === "photo") {
    const stage = section === "envelope" ? "envelope" : section === "cover" ? "cover" : "identity";
    const slot = section === "envelope" ? element : section;
    const prefix = section !== "envelope" && element ? `[data-section-instance-id="${element}"] ` : "";
    return `${prefix}[data-invitation-section="${stage}"] [data-invitation-photo-slot="${slot}"]`;
  }
  const instanceId = kind === "element" ? parts[3] : parts[2];
  const prefix = instanceId ? `[data-section-instance-id="${instanceId}"] ` : "";
  if (kind === "copy") return `${prefix}[data-studio-copy-field="${section}"]`;
  if (kind === "heading") return section === "envelope"
    ? '[data-invitation-section="envelope"] h1'
    : `${prefix}[data-invitation-section="${section}"] [data-studio-native-heading]`;
  if (kind === "element") return `${prefix}[data-studio-section-element="${section}:${element}"]`;
  if (kind === "rsvp") return `${prefix}[data-invitation-section="rsvp"] [data-studio-rsvp-element="${section}"]`;
  return null;
}

export function nativeVisualStyle(transform: NativeVisualTransform): CSSProperties {
  return {
    translate: `${transform.x}% ${transform.y}%`,
    rotate: `${transform.rotation}deg`,
    scale: `${transform.scaleX} ${transform.scaleY}`,
    transformOrigin: "center",
    opacity: transform.opacity,
    color: transform.color,
    backgroundColor: transform.background,
    borderColor: transform.borderColor,
    fontSize: transform.fontSize,
    fontWeight: transform.fontWeight,
    textAlign: transform.textAlign,
    letterSpacing: transform.letterSpacing,
    lineHeight: transform.lineHeight,
    fontFamily: transform.fontFamily ? invitationFontFamily(transform.fontFamily) : undefined,
    display: transform.hidden ? "none" : undefined,
  };
}

export function nativeVisualFontFamilies(designKey: string) {
  return [...new Set(
    Object.values(parseNativeVisualTransforms(designKey))
      .map((transform) => transform.fontFamily)
      .filter((family): family is string => Boolean(family)),
  )];
}

export function nativeVisualScopeClass(designKey: string) {
  let hash = 2166136261;
  for (let index = 0; index < designKey.length; index++) {
    hash = Math.imul(hash ^ designKey.charCodeAt(index), 16777619);
  }
  return `dc-native-${(hash >>> 0).toString(36)}`;
}

/** The selector registry and bounded numeric values keep injected styles free of user CSS. */
export function nativeVisualStyleSheet(designKey: string) {
  const transforms = parseNativeVisualTransforms(designKey);
  const scope = nativeVisualScopeClass(designKey);
  return Object.entries(transforms).map(([key, transform]) => {
    const selector = nativeVisualSelector(key);
    if (!selector) return "";
    const declarations = [
      `translate:${transform.x}% ${transform.y}%`,
      `rotate:${transform.rotation}deg`,
      `scale:${transform.scaleX} ${transform.scaleY}`,
      "transform-origin:center",
      transform.opacity !== undefined ? `opacity:${transform.opacity}` : "",
      transform.color ? `color:${transform.color}` : "",
      transform.background ? `background-color:${transform.background}` : "",
      transform.borderColor ? `border-color:${transform.borderColor}` : "",
      transform.fontSize !== undefined ? `font-size:${transform.fontSize}px` : "",
      transform.fontWeight !== undefined ? `font-weight:${transform.fontWeight}` : "",
      transform.textAlign ? `text-align:${transform.textAlign}` : "",
      transform.letterSpacing !== undefined ? `letter-spacing:${transform.letterSpacing}px` : "",
      transform.lineHeight !== undefined ? `line-height:${transform.lineHeight}` : "",
      transform.fontFamily
        ? `font-family:${invitationFontFamily(transform.fontFamily).startsWith("var(")
          ? invitationFontFamily(transform.fontFamily)
          : JSON.stringify(invitationFontFamily(transform.fontFamily))}`
        : "",
      transform.hidden ? "display:none!important" : "",
    ].filter(Boolean).join(";");
    return `.${scope} ${selector}{${declarations};}`;
  }).join("\n");
}
