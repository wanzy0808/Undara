"use client";

import { useState, type MouseEvent } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { SceneProps } from "@/components/PublicInvitation/InvitationThemeScenes";
import StudioPhotoCropOverlay from "@/components/InvitationStudio/StudioPhotoCropOverlay";
import { invitationText } from "@/lib/invitations/language";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";

export function useOccasionOpening({ preview, allowEnvelopeOpen, motionEnabled = true, onOpen }: SceneProps) {
  const [opening, setOpening] = useState(false);
  const reducedMotion = useReducedMotion();
  const open = (event: MouseEvent<HTMLButtonElement>) => {
    if (opening || (preview && !allowEnvelopeOpen)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const immediate = event.detail === 0 || Boolean(reducedMotion) || !motionEnabled;
    setOpening(!immediate);
    // Keep audio in the synchronous gesture handled by the shared renderer.
    onOpen(immediate);
  };
  return { opening, open };
}

export function OccasionOpenButton({ opening, open, preview }: {
  opening: boolean; open: (event: MouseEvent<HTMLButtonElement>) => void; preview?: boolean;
}) {
  const language = useInvitationLanguage();
  return <button type="button" data-studio-native-object="object:envelope:open-button"
    data-studio-system-action={preview ? "open-invitation" : undefined}
    className="ot-open" disabled={opening} onClick={open}>
    {invitationText(language, "Buka Undangan")}<ArrowUpRight size={19} aria-hidden="true" />
  </button>;
}

/** No stock fallback: only the actual event photo is rendered. */
export function OccasionPortrait({ cover, names, focus, crop, cropEditing, onCropChange, onFinishCrop, locale, preview, onEditPhoto }: SceneProps) {
  const language = useInvitationLanguage();
  if (!cover) return preview && onEditPhoto ? <button type="button" className="ot-photo-add" onClick={onEditPhoto}>
    {invitationText(language, "Pilih foto")}
  </button> : null;
  const cropStyle = crop
    ? { objectPosition: `${crop.x}% ${crop.y}%`, transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` }
    : { objectPosition: `center ${focus}` };
  return <div data-studio-native-object="object:cover:photo-frame" className="ot-cover-photo-frame">
    <div data-invitation-photo-slot="cover" className="ot-cover-photo">
      <img src={cover} alt={`${invitationText(language, "Foto")} ${names}`} loading="eager" decoding="async" style={cropStyle} />
      {preview && onEditPhoto && !cropEditing && <button type="button" className="ot-edit-photo" onClick={onEditPhoto}>
        {invitationText(language, "Atur Foto Sampul")}
      </button>}
      {preview && cropEditing && crop && onCropChange && onFinishCrop && <StudioPhotoCropOverlay
        crop={crop} onChange={onCropChange} onDone={onFinishCrop} locale={locale} />}
    </div>
  </div>;
}

export function OccasionScrollHint() {
  const language = useInvitationLanguage();
  return <p className="ot-scroll" data-studio-native-object="object:cover:scroll-copy">
    {invitationText(language, "Gulir untuk membaca")}<ArrowDown size={17} aria-hidden="true" />
  </p>;
}
