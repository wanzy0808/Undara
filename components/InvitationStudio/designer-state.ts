import { parseNativeVisualLocks, withNativeVisualLocks } from "@/lib/templates/native-visual-locks";
import {
  getEventCategory,
  normalizeEventCategory,
} from "@/lib/events/catalog";
import {
  makeDesignKey,
  parseDesignKey,
} from "@/lib/templates/design";
import {
  parseInvitationSections,
  withInvitationSections,
} from "@/lib/templates/sections";
import { parsePhotoAssignments, withPhotoAssignments } from "@/lib/templates/photo-slots";
import { parseEditableCopy, parseEnglishEditableCopy, withEditableCopy, withEnglishEditableCopy } from "@/lib/templates/editable-copy";
import { parseEditableCopyMotions, withEditableCopyMotions } from "@/lib/templates/editable-copy-motion";
import { invitationTemplatePresets } from "@/components/InvitationStudio/designer-config";
import { defaultInvitationTemplateForEvent } from "@/lib/templates/catalog";
import { parseAssetLayers, withAssetLayers } from "@/lib/templates/asset-layers";
import { parseInvitationSectionStyles, withInvitationSectionStyles } from "@/lib/templates/section-styles";
import { parseInvitationRsvpConfig, withInvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import { parseInvitationSectionLayout, withInvitationSectionLayout } from "@/lib/templates/section-layout";
import { parseSectionElementStyles, withSectionElementStyles } from "@/lib/templates/section-element-styles";
import { parseNativeVisualTransforms, withNativeVisualTransforms } from "@/lib/templates/native-visual-transforms";
import type {
  InvitationDesignerInvitation,
  InvitationDesignState,
} from "@/components/InvitationStudio/designer-types";

export function getInvitationEventIdentity(
  invitation: InvitationDesignerInvitation | null,
) {
  if (!invitation) {
    return {
      category: normalizeEventCategory("OTHER"),
      label: "Event",
      primary: "Nama acara",
      secondary: "",
    };
  }

  const category = normalizeEventCategory(invitation.eventCategory);
  const info = getEventCategory(category);

  if (info.nameMode === "couple") {
    return {
      category,
      label: info.label,
      primary: invitation.groomName || invitation.title || "Nama pertama",
      secondary: invitation.brideName || "Nama kedua",
    };
  }

  if (info.nameMode === "single") {
    return {
      category,
      label: info.label,
      primary: invitation.groomName || invitation.title || "Nama utama",
      secondary: "",
    };
  }

  return {
    category,
    label: info.label,
    primary: invitation.title || "Nama acara",
    secondary: "",
  };
}

export function formatInvitationEventDate(
  invitation: InvitationDesignerInvitation | null,
) {
  if (!invitation?.eventDate) return "Tanggal acara belum diatur";
  const date = new Date(invitation.eventDate);
  if (Number.isNaN(date.getTime())) return "Tanggal acara belum diatur";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: invitation.timezone || "Asia/Jakarta",
  }).format(date);
}

export function makeInvitationDesignStateKey(state: InvitationDesignState) {
  const key = withNativeVisualTransforms(withSectionElementStyles(withInvitationSectionLayout(withInvitationRsvpConfig(withInvitationSectionStyles(withAssetLayers(withEditableCopyMotions(withEnglishEditableCopy(withEditableCopy(
    withPhotoAssignments(
      withInvitationSections(
        makeDesignKey(state.template, state.palette, state.font, state.decor),
        state.sections,
      ),
      state.photos,
    ),
    state.copy,
  ), state.copyEn), state.copyMotion), state.layers), state.sectionStyles), state.rsvpConfig), state.sectionLayout), state.sectionElementStyles), state.nativeVisuals);
  return withNativeVisualLocks(key, state.nativeLocks);
}

/** Use a compatible initial theme only when the event has no saved design. */
export function eventInvitationDesignFromKey(key: string, category: string, fallbackDecor: string) {
  const template = defaultInvitationTemplateForEvent(category);
  return invitationDesignStateFromKey(
    key || (template ? makeDesignKey(template.key, template.preset.palette, template.preset.font) : ""),
    fallbackDecor,
  );
}

export function invitationDesignStateFromKey(
  key: string,
  fallbackDecor: string,
): InvitationDesignState {
  const parsed = parseDesignKey(key);
  const preset =
    invitationTemplatePresets[parsed.template] ||
    invitationTemplatePresets["botanical-ivory"];

  return {
    template: parsed.template,
    palette: parsed.palette || preset.palette,
    font: parsed.font || preset.font,
    decor: parsed.decor || fallbackDecor,
    sections: parseInvitationSections(key),
    photos: parsePhotoAssignments(key),
    copy: parseEditableCopy(key),
    copyEn: parseEnglishEditableCopy(key),
    copyMotion: parseEditableCopyMotions(key),
    layers: parseAssetLayers(key),
    sectionStyles: parseInvitationSectionStyles(key),
    rsvpConfig: parseInvitationRsvpConfig(key),
    sectionLayout: parseInvitationSectionLayout(key),
    sectionElementStyles: parseSectionElementStyles(key),
    nativeVisuals: parseNativeVisualTransforms(key),
    nativeLocks: parseNativeVisualLocks(key),
  };
}
