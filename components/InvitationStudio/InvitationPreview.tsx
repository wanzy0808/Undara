"use client";

import dynamic from "next/dynamic";
import { InvitationLanguageProvider } from "@/components/PublicInvitation/InvitationLanguage";
import type { InvitationLanguage } from "@/lib/invitations/language";
import type { InvitationSectionKey, InvitationSections } from "@/lib/templates/sections";
import type { InvitationAssetLayer } from "@/lib/templates/asset-layers";
import type { CroppablePhotoSlot, PhotoAssignments, PhotoCrop, PhotoSlot } from "@/lib/templates/photo-slots";
import type { FontKey, PaletteKey } from "@/lib/templates/design";
import { invitationFonts, invitationPalettes } from "@/lib/templates/design";
import type { InvitationDesignerInvitation } from "@/components/InvitationStudio/designer-types";

const RomanticRoseTemplate = dynamic(() => import("@/components/PublicInvitation/RomanticRoseTemplate"));
const UniversalInvitationTemplate = dynamic(() => import("@/components/PublicInvitation/UniversalInvitationTemplate"));

/** Studio and public pages render identical template components; never mock RSVP as a functioning form. */
export function InvitationPreview({
  invitation,
  templateKey,
  palette,
  fontPair,
  decorUrl,
  sections,
  photoAssignments,
  activeCropSlot,
  onCropPhoto,
  onFinishCrop,
  onEditPhoto,
  onEnvelopeOpened,
  previewRecipientLine,
  invitationLanguage = "ID",
  allowEnvelopeOpen = false,
  editorPreview = true,
  designKey,
  musicUrl,
  selectedAssetLayerId,
  selectedAssetLayerIds,
  onSelectAssetLayer,
  onMoveAssetLayer,
  onUpdateAssetLayer,
  eventTag,
  dressCode,
  selectedSectionInstanceId,
  onSelectSectionInstance,
  onMoveSectionInstance,
  onToggleSectionInstance,
  onDuplicateSectionInstance,
  onDeleteSectionInstance,
  editorMode = "customer",
}: {
  invitation: InvitationDesignerInvitation | null;
  templateKey: string;
  palette: (typeof invitationPalettes)[PaletteKey];
  fontPair: (typeof invitationFonts)[FontKey];
  decorUrl: string;
  eventTag: string;
  dressCode: string;
  sections: InvitationSections;
  photoAssignments?: PhotoAssignments;
  activeCropSlot?: CroppablePhotoSlot | null;
  onCropPhoto?: (slot: CroppablePhotoSlot, crop: PhotoCrop) => void;
  onFinishCrop?: () => void;
  onEditPhoto?: (slot: PhotoSlot) => void;
  /** Studio canvas only: the guest has finished opening the envelope. */
  onEnvelopeOpened?: () => void;
  /** Studio-only sample, never a Guest record or saved invitation content. */
  previewRecipientLine?: string;
  invitationLanguage?: InvitationLanguage;
  /** Catalog demo interaction only; preview forms remain read-only. */
  allowEnvelopeOpen?: boolean;
  /** Final preview uses guest layout while preview data/form protections stay enabled. */
  editorPreview?: boolean;
  designKey?: string;
  musicUrl?: string;
  selectedAssetLayerId?: string | null;
  selectedAssetLayerIds?: string[];
  onSelectAssetLayer?: (id: string, additive?: boolean) => void;
  onMoveAssetLayer?: (id: string, x: number, y: number) => void;
  onUpdateAssetLayer?: (id: string, patch: Partial<InvitationAssetLayer>) => void;
  selectedSectionInstanceId?: string | null;
  onSelectSectionInstance?: (id: string, key: InvitationSectionKey) => void;
  onMoveSectionInstance?: (id: string, direction: -1 | 1) => void;
  onToggleSectionInstance?: (id: string) => void;
  onDuplicateSectionInstance?: (id: string) => void;
  onDeleteSectionInstance?: (id: string) => void;
  editorMode?: "template" | "customer";
}) {
  if (!invitation) {
    return <div className="grid min-h-[560px] place-items-center rounded-2xl border border-border bg-background text-sm text-muted-foreground">Memuat pratinjau undangan…</div>;
  }
  const previewInvitation = { ...invitation, weddingHashtag: eventTag, dressCode, ...(musicUrl === undefined ? {} : { musicUrl }) };
  if (templateKey === "romantic-rose") {
    return <InvitationLanguageProvider language={invitationLanguage}><RomanticRoseTemplate invitation={previewInvitation} designKey={designKey} preview editorPreview={editorPreview} allowEnvelopeOpen={allowEnvelopeOpen} previewRecipientLine={previewRecipientLine} sections={sections} coverUrl={decorUrl} photoAssignments={photoAssignments} activeCropSlot={activeCropSlot} onCropPhoto={onCropPhoto} onFinishCrop={onFinishCrop} onEditPhoto={onEditPhoto} onEnvelopeOpened={onEnvelopeOpened} selectedAssetLayerId={selectedAssetLayerId} selectedAssetLayerIds={selectedAssetLayerIds} onSelectAssetLayer={onSelectAssetLayer} onMoveAssetLayer={onMoveAssetLayer} onUpdateAssetLayer={onUpdateAssetLayer} selectedSectionInstanceId={selectedSectionInstanceId} onSelectSectionInstance={onSelectSectionInstance} onMoveSectionInstance={onMoveSectionInstance} onToggleSectionInstance={onToggleSectionInstance} onDuplicateSectionInstance={onDuplicateSectionInstance} onDeleteSectionInstance={onDeleteSectionInstance} editorMode={editorMode} /></InvitationLanguageProvider>;
  }
  return (
    <InvitationLanguageProvider language={invitationLanguage}><UniversalInvitationTemplate
      invitation={previewInvitation}
      templateKey={templateKey}
      designKey={designKey}
      preview
      editorPreview={editorPreview}
      allowEnvelopeOpen={allowEnvelopeOpen}
      previewRecipientLine={previewRecipientLine}
      sections={sections}
      coverUrl={decorUrl}
      photoAssignments={photoAssignments}
      activeCropSlot={activeCropSlot}
      onCropPhoto={onCropPhoto}
      onFinishCrop={onFinishCrop}
      onEditPhoto={onEditPhoto}
      onEnvelopeOpened={onEnvelopeOpened}
      selectedAssetLayerId={selectedAssetLayerId}
      selectedAssetLayerIds={selectedAssetLayerIds}
      onSelectAssetLayer={onSelectAssetLayer}
      onMoveAssetLayer={onMoveAssetLayer}
      onUpdateAssetLayer={onUpdateAssetLayer}
      selectedSectionInstanceId={selectedSectionInstanceId}
      onSelectSectionInstance={onSelectSectionInstance}
      onMoveSectionInstance={onMoveSectionInstance}
      onToggleSectionInstance={onToggleSectionInstance}
      onDuplicateSectionInstance={onDuplicateSectionInstance}
      onDeleteSectionInstance={onDeleteSectionInstance}
      editorMode={editorMode}
    /></InvitationLanguageProvider>
  );
}
