"use client";

import AssetLayerInspector from "@/components/InvitationStudio/AssetLayerInspector";
import CopyTextInspector from "@/components/InvitationStudio/CopyTextInspector";
import PhotoSlotInspector from "@/components/InvitationStudio/PhotoSlotInspector";
import RsvpElementInspector from "@/components/InvitationStudio/RsvpElementInspector";
import SectionElementInspector from "@/components/InvitationStudio/SectionElementInspector";
import SectionInspector from "@/components/InvitationStudio/SectionInspector";
import StudioNativeVisualInspector from "@/components/InvitationStudio/StudioNativeVisualInspector";
import { templatePhotoMotion, templateNativeMotionForKey } from "@/lib/templates/template-motion";
import { supportsPhotoCropAspect } from "@/lib/templates/catalog";
import { defaultNativeVisualTransform, isNativeVisualKey, nativeVisualTransformForKey } from "@/lib/templates/native-visual-transforms";
import type { NativeVisualTransform } from "@/lib/templates/native-visual-transforms";
import TextLayerInspector from "@/components/InvitationStudio/TextLayerInspector";
import { assetLayerScopePosition, type AssetLayerPosition } from "@/components/InvitationStudio/designer-layer-order";
import type { InvitationDesignState } from "@/components/InvitationStudio/designer-types";
import type { EditableInvitationCopyField } from "@/lib/templates/editable-copy";
import type { EditableCopyMotion } from "@/lib/templates/editable-copy-motion";
import type { InvitationAssetLayer } from "@/lib/templates/asset-layers";
import type { CroppablePhotoSlot, GallerySettings, InvitationPhotoAsset, PhotoCrop, PhotoFocus, PhotoMotion, PhotoSlot } from "@/lib/templates/photo-slots";
import type { InvitationSectionKey } from "@/lib/templates/sections";
import type { InvitationSectionStyle } from "@/lib/templates/section-styles";
import type { StudioSectionElementKind } from "@/lib/templates/section-element-styles";

type SelectedSectionElement = {
  section: InvitationSectionKey;
  kind: StudioSectionElementKind;
} | null;

export default function StudioSelectionInspector({
  locale,
  design,
  selectedAssetLayer,
  selectedAssetIndex,
  maxAssetLayers,
  selectedPhotoSlot,
  onStartPhotoCrop,
  photoAssets,
  photoEditingDisabled,
  selectedRsvpElementKey,
  selectedSectionElement,
  selectedCopyField,
  selectedSectionKey,
  selectedNativeKey,
  onUpdateNative,
  onDeleteNative,
  nativeEditingDisabled = false,
  onCloseNative,
  onCloseAsset,
  onUpdateAsset,
  onPositionAsset,
  onUpdatePhotoMotion,
  onSetPhotoFocus,
  onSetPhotoCrop,
  onResetPhotoCrop,
  onGallerySettings,
  onReorderGallery,
  onResetPhotoMotion,
  onClosePhoto,
  onUpdateRsvpConfig,
  onCloseRsvp,
  onUpdateSectionElementStyles,
  onCloseSectionElement,
  onUpdateCopyMotion,
  onResetCopyMotion,
  onCloseCopy,
  onUpdateSectionStyle,
  onResetSectionStyle,
  onCloseSection,
}: {
  locale: string;
  design: InvitationDesignState;
  selectedAssetLayer: InvitationAssetLayer | null | undefined;
  selectedAssetIndex: number;
  maxAssetLayers: number;
  selectedPhotoSlot: PhotoSlot | null;
  onStartPhotoCrop: (slot: CroppablePhotoSlot) => void;
  photoAssets: InvitationPhotoAsset[];
  photoEditingDisabled: boolean;
  selectedRsvpElementKey: string | null;
  selectedSectionElement: SelectedSectionElement;
  selectedCopyField: EditableInvitationCopyField | null;
  selectedSectionKey: InvitationSectionKey | null;
  selectedNativeKey: string | null;
  onUpdateNative: (key: string, value: NativeVisualTransform) => void;
  onDeleteNative?: (key: string) => void;
  nativeEditingDisabled?: boolean;
  onCloseNative: () => void;
  onCloseAsset: () => void;
  onUpdateAsset: (id: string, patch: Partial<InvitationAssetLayer>) => void;
  onPositionAsset: (id: string, position: AssetLayerPosition) => void;
  onUpdatePhotoMotion: (slot: PhotoSlot, patch: Partial<PhotoMotion>) => void;
  onSetPhotoFocus: (slot: CroppablePhotoSlot, focus: PhotoFocus) => void;
  onSetPhotoCrop: (slot: CroppablePhotoSlot, crop: PhotoCrop) => void;
  onResetPhotoCrop: (slot: CroppablePhotoSlot) => void;
  onGallerySettings: (patch: Partial<GallerySettings>) => void;
  onReorderGallery: (sourceId: string, targetId: string) => void;
  onResetPhotoMotion: (slot: PhotoSlot) => void;
  onClosePhoto: () => void;
  onUpdateRsvpConfig: (patch: Partial<InvitationDesignState["rsvpConfig"]>) => void;
  onCloseRsvp: () => void;
  onUpdateSectionElementStyles: (styles: InvitationDesignState["sectionElementStyles"]) => void;
  onCloseSectionElement: () => void;
  onUpdateCopyMotion: (field: EditableInvitationCopyField, patch: Partial<EditableCopyMotion>) => void;
  onResetCopyMotion: (field: EditableInvitationCopyField) => void;
  onCloseCopy: () => void;
  onUpdateSectionStyle: (key: InvitationSectionKey, patch: Partial<InvitationSectionStyle>) => void;
  onResetSectionStyle: (key: InvitationSectionKey) => void;
  onCloseSection: () => void;
}) {
  const scopedLayerPosition = selectedAssetLayer
    ? assetLayerScopePosition(design.layers, selectedAssetLayer.id)
    : { index: selectedAssetIndex, count: design.layers.length };
  const nativeControls = selectedNativeKey && isNativeVisualKey(selectedNativeKey) ? (
    <StudioNativeVisualInspector locale={locale} targetKey={selectedNativeKey}
      value={{ ...defaultNativeVisualTransform, ...templateNativeMotionForKey(design.template, selectedNativeKey, design.sectionStyles), ...nativeVisualTransformForKey(design.nativeVisuals, selectedNativeKey) }}
      ownValue={design.nativeVisuals[selectedNativeKey] ?? null}
      onChange={(value) => onUpdateNative(selectedNativeKey, value)}
      onDelete={onDeleteNative ? () => onDeleteNative(selectedNativeKey) : undefined}
      disabled={nativeEditingDisabled}
      onClose={onCloseNative} />
  ) : null;

  if (selectedAssetLayer?.kind === "text") {
    return (
      <TextLayerInspector
        locale={locale}
        layer={selectedAssetLayer}
        selectedIndex={scopedLayerPosition.index}
        layerCount={scopedLayerPosition.count}
        sections={design.sections}
        maxLayers={maxAssetLayers}
        onClose={onCloseAsset}
        onUpdate={onUpdateAsset}
        onPosition={onPositionAsset}
      />
    );
  }

  if (selectedAssetLayer) {
    return (
      <AssetLayerInspector
        locale={locale}
        selectedAssetLayer={selectedAssetLayer}
        selectedAssetIndex={selectedAssetIndex}
        layerCount={scopedLayerPosition.count}
        sections={design.sections}
        maxLayers={maxAssetLayers}
        onDeselect={onCloseAsset}
        onUpdate={onUpdateAsset}
        onPosition={onPositionAsset}
      />
    );
  }

  if (selectedPhotoSlot) {
    return (
      <div className="undara-studio-selection-stack">
      <PhotoSlotInspector
        locale={locale}
        slot={selectedPhotoSlot}
        allowAspectRatio={supportsPhotoCropAspect(design.template, selectedPhotoSlot)}
        onStartCrop={onStartPhotoCrop}
        motion={templatePhotoMotion(design.template, design.photos.motion, design.sectionStyles)[selectedPhotoSlot]}
        assignments={design.photos}
        assets={photoAssets}
        disabled={photoEditingDisabled}
        onSetFocus={onSetPhotoFocus}
        onSetCrop={onSetPhotoCrop}
        onResetCrop={onResetPhotoCrop}
        onGallerySettings={onGallerySettings}
        onReorderGallery={onReorderGallery}
        onUpdate={(patch) => onUpdatePhotoMotion(selectedPhotoSlot, patch)}
        onReset={() => onResetPhotoMotion(selectedPhotoSlot)}
        onClose={onClosePhoto}
      />
      {nativeControls}
      </div>
    );
  }

  if (selectedRsvpElementKey) {
    return (
      <div className="undara-studio-selection-stack">
      <RsvpElementInspector
        locale={locale}
        elementKey={selectedRsvpElementKey}
        config={design.rsvpConfig}
        onConfig={onUpdateRsvpConfig}
        onClose={onCloseRsvp}
      />
      {nativeControls}
      </div>
    );
  }

  if (selectedSectionElement) {
    return (
      <div className="undara-studio-selection-stack">
      <SectionElementInspector
        locale={locale}
        section={selectedSectionElement.section}
        kind={selectedSectionElement.kind}
        styles={design.sectionElementStyles}
        onChange={onUpdateSectionElementStyles}
        onClose={onCloseSectionElement}
      />
      {nativeControls}
      </div>
    );
  }

  if (selectedCopyField) {
    return (
      <div className="undara-studio-selection-stack">
      <CopyTextInspector
        locale={locale}
        field={selectedCopyField}
        motion={design.copyMotion[selectedCopyField]}
        onMotion={(patch) => onUpdateCopyMotion(selectedCopyField, patch)}
        onReset={() => onResetCopyMotion(selectedCopyField)}
        onClose={onCloseCopy}
      />
      {nativeControls}
      </div>
    );
  }

  if (selectedSectionKey) {
    return (
      <SectionInspector
        locale={locale}
        sectionKey={selectedSectionKey}
        style={design.sectionStyles[selectedSectionKey]}
        onUpdate={(patch) => onUpdateSectionStyle(selectedSectionKey, patch)}
        onReset={() => onResetSectionStyle(selectedSectionKey)}
        onClose={onCloseSection}
      />
    );
  }

  if (selectedNativeKey) return nativeControls;

  return null;
}
