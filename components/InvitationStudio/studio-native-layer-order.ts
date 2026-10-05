import { resolveStudioCanvasSelection } from "@/components/InvitationStudio/studio-canvas-selection";
import { isNativeVisualKey, nativePhotoVisualKey, nativeVisualSelector } from "@/lib/templates/native-visual-transforms";
import { nativeVisualSupportsLayerOrder } from "@/lib/templates/native-visual-order";

function keyForNode(node: Element, surface: HTMLElement) {
  const selected = resolveStudioCanvasSelection(node, surface);
  const instance = "instanceId" in selected && selected.instanceId ? `:${selected.instanceId}` : "";
  const key = selected.kind === "native" ? selected.key
    : selected.kind === "rsvp-element" ? `rsvp:${selected.key}${instance}`
    : selected.kind === "section-element" ? `element:${selected.section}:${selected.elementKind}${instance}`
    : selected.kind === "copy" ? `copy:${selected.field}${instance}`
    : selected.kind === "photo" ? nativePhotoVisualKey(selected.slot,
      node.closest<HTMLElement>("[data-invitation-section]")?.dataset.invitationSection === "envelope" ? "envelope" : "cover",
      selected.instanceId, selected.assetId)
    : null;
  return key && isNativeVisualKey(key) ? key : null;
}

/** Actual sibling boxes only: nested groups and different section instances are separate scopes. */
export function studioNativeLayerPeers(target: Element | null, surface: HTMLElement): string[] {
  if (!target?.parentElement || !nativeVisualSupportsLayerOrder(target) || !surface.contains(target)) return [];
  const section = target.closest("[data-invitation-section]");
  const instance = target.closest("[data-section-instance-id]");
  const peers = Array.from(target.parentElement.children).flatMap((node, index) => {
    if (!nativeVisualSupportsLayerOrder(node) || node.closest("[data-invitation-section]") !== section
      || node.closest("[data-section-instance-id]") !== instance) return [];
    const key = keyForNode(node, surface);
    const selector = key && nativeVisualSelector(key);
    if (!key || !selector || !node.matches(selector)) return [];
    const style = getComputedStyle(node);
    if (style.display === "contents" || style.display === "none") return [];
    const zIndex = Number.parseInt(style.zIndex, 10);
    return [{ key, index, order: Number.isFinite(zIndex) ? zIndex : 0 }];
  });
  return peers.sort((a, b) => a.order - b.order || a.index - b.index).map((peer) => peer.key);
}
