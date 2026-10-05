"use client";

import { useEffect, type RefObject } from "react";
import { parseNativeVisualTransforms } from "@/lib/templates/native-visual-transforms";
import { observeNativeVisualLayerOrder } from "@/components/PublicInvitation/native-layer-runtime";

export function useInvitationNativeLayerOrder(rootRef: RefObject<HTMLElement | null>, designKey: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (root) return observeNativeVisualLayerOrder(root, parseNativeVisualTransforms(designKey));
  }, [rootRef, designKey]);
}
