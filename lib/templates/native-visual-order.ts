import { defaultNativeVisualTransform, isNativeVisualKey, nativeVisualInstanceId, nativeVisualTransformForKey, type NativeVisualTransforms } from "@/lib/templates/native-visual-transforms";
import { nativeVisualIsLocked, type NativeVisualLocks } from "@/lib/templates/native-visual-locks";

export type NativeVisualLayerPosition = "front" | "forward" | "backward" | "back";

export function nativeVisualSupportsLayerOrder(target: Pick<Element, "tagName" | "namespaceURI"> | null) {
  return Boolean(target && (target.namespaceURI !== "http://www.w3.org/2000/svg" || target.tagName.toLowerCase() === "svg"));
}

/** Peers are collected from one actual DOM parent by the Studio capability check. */
export function positionNativeVisuals(
  transforms: NativeVisualTransforms,
  orderedKeys: string[],
  key: string,
  position: NativeVisualLayerPosition,
  locks: NativeVisualLocks = {},
): NativeVisualTransforms {
  const keys = [...new Set(orderedKeys.filter(isNativeVisualKey))];
  const index = keys.indexOf(key);
  if (index < 0 || nativeVisualIsLocked(locks, key) || keys.length < 2) return transforms;
  if (keys.some((peer) => nativeVisualInstanceId(peer) !== nativeVisualInstanceId(key))) return transforms;
  const target = position === "front" ? keys.length - 1 : position === "forward" ? index + 1 : position === "backward" ? index - 1 : 0;
  if (target === index || target < 0 || target >= keys.length) return transforms;
  keys.splice(index, 1);
  keys.splice(target, 0, key);
  if (new Set([...Object.keys(transforms), ...keys]).size > 512) return transforms;
  const next = { ...transforms };
  keys.forEach((peer, layerOrder) => {
    next[peer] = { ...defaultNativeVisualTransform, ...nativeVisualTransformForKey(transforms, peer), layerOrder };
  });
  return next;
}
