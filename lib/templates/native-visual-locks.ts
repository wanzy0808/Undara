import { isNativeVisualKey, nativeVisualInstanceId } from "@/lib/templates/native-visual-transforms";

/** Editor metadata, deliberately separate from presentation CSS and protected event data. */
export type NativeVisualLocks = Record<string, boolean>;

export function sanitizeNativeVisualLocks(value: unknown): NativeVisualLocks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 512)
    .filter(([key, locked]) => isNativeVisualKey(key) && typeof locked === "boolean"));
}

export function parseNativeVisualLocks(designKey: string): NativeVisualLocks {
  const token = designKey.split("::").find((part) => part.startsWith("nativeLocks="));
  if (!token || token.length > 128000) return {};
  try { return sanitizeNativeVisualLocks(JSON.parse(decodeURIComponent(token.slice("nativeLocks=".length)))); }
  catch { return {}; }
}

export function withNativeVisualLocks(designKey: string, locks: NativeVisualLocks = {}) {
  const base = designKey.split("::").filter((part) => !part.startsWith("nativeLocks=")).join("::");
  const normalized = sanitizeNativeVisualLocks(locks);
  return Object.keys(normalized).length ? `${base}::nativeLocks=${encodeURIComponent(JSON.stringify(normalized))}` : base;
}

export function nativeVisualIsLocked(locks: NativeVisualLocks = {}, key: string) {
  if (!isNativeVisualKey(key)) return false;
  if (Object.hasOwn(locks, key)) return locks[key] === true;
  const baseKey = nativeVisualInstanceId(key) ? key.slice(0, key.lastIndexOf(":")) : key;
  return locks[baseKey] === true;
}
