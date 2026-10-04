"use client";

import { useEffect, useState } from "react";
import { InvitationPreview } from "@/components/InvitationStudio/InvitationPreview";
import { invitationFonts, invitationPalettes } from "@/lib/templates/design";
import {
  isStudioPreviewMessage, readStudioPreviewSnapshot,
  STUDIO_PREVIEW_CLOSE, STUDIO_PREVIEW_DRAFT, STUDIO_PREVIEW_READY,
  type StudioPreviewSnapshot,
} from "./studio-preview-viewport";

/** Runs inside its own browsing context, including media queries and JS viewport APIs. */
export default function StudioPreviewFrame() {
  const [snapshot, setSnapshot] = useState<StudioPreviewSnapshot | null>(null);

  useEffect(() => {
    if (window.parent === window) return;
    const origin = window.location.origin;
    function receive(event: MessageEvent) {
      if (!isStudioPreviewMessage(event, window.parent, origin, STUDIO_PREVIEW_DRAFT)) return;
      const draft = readStudioPreviewSnapshot(event.data.snapshot);
      if (draft) setSnapshot(draft);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector('[aria-modal="true"]')) return;
      window.parent.postMessage({ type: STUDIO_PREVIEW_CLOSE }, origin);
    }
    window.addEventListener("message", receive);
    window.addEventListener("keydown", keydown);
    window.parent.postMessage({ type: STUDIO_PREVIEW_READY }, origin);
    return () => {
      window.removeEventListener("message", receive);
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  if (!snapshot) return null;
  const { invitation, design, designKey, musicUrl, eventTag, dressCode, invitationLanguage } = snapshot;
  return (
    <div lang={invitationLanguage === "EN" ? "en" : "id"}>
      <InvitationPreview
        key={designKey}
        allowEnvelopeOpen
        editorPreview={false}
        invitationLanguage={invitationLanguage}
        previewRecipientLine={invitationLanguage === "EN" ? "Dear : Mr [Name] and Mrs [Name]" : "Kepada Yth : Bapak [Nama] dan Ibu [Nama]"}
        invitation={invitation}
        templateKey={design.template}
        palette={invitationPalettes[design.palette]}
        fontPair={invitationFonts[design.font]}
        decorUrl={design.decor}
        sections={design.sections}
        photoAssignments={design.photos}
        designKey={designKey}
        musicUrl={musicUrl}
        eventTag={eventTag}
        dressCode={dressCode}
      />
    </div>
  );
}
