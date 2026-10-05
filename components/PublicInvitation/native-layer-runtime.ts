import { nativeVisualSelector, type NativeVisualTransforms } from "@/lib/templates/native-visual-transforms";
import { nativeVisualSupportsLayerOrder } from "@/lib/templates/native-visual-order";

/** Position only static boxes; preserve authored absolute/fixed placement and React child ownership. */
export function observeNativeVisualLayerOrder(root: HTMLElement, transforms: NativeVisualTransforms) {
  const selectors = Object.entries(transforms).flatMap(([key, value]) => {
    const selector = value.layerOrder !== undefined && nativeVisualSelector(key);
    return selector ? [selector] : [];
  });
  if (!selectors.length) return () => {};
  const marked = new Set<Element>();
  const attribute = "data-invitation-native-layer-static";
  const clear = () => { marked.forEach((node) => node.removeAttribute(attribute)); marked.clear(); };
  const refresh = () => {
    clear();
    for (const selector of selectors) root.querySelectorAll(selector).forEach((node) => {
      if (nativeVisualSupportsLayerOrder(node) && getComputedStyle(node).position === "static") {
        node.setAttribute(attribute, "true");
        marked.add(node);
      }
    });
  };
  refresh();
  const observer = new MutationObserver(refresh);
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener("resize", refresh);
  return () => { observer.disconnect(); window.removeEventListener("resize", refresh); clear(); };
}
