"use client";

import { displayTitleCase } from "@/lib/text/display-title-case";
import { getInvitationCountdown } from "@/lib/invitations/countdown";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CalendarDays, Gift, Heart, Leaf, MapPin, Moon, Sparkles, Star } from "lucide-react";
import "./zen-atelier.css";
import "./pencil-reverie.css";
import "./serein.css";
import "./confetti-club.css";
import "./botanical-ivory.css";
import "./eternal-blossom.css";
import "./modern-maroon.css";
import "./garden-light.css";
import "./midnight-romance.css";
import "./classic-pearl.css";
import "./golden-art-deco.css";
import "./paper-cut-botanical.css";
import InvitationThemeScenes from "@/components/PublicInvitation/InvitationThemeScenes";
import RsvpForm from "@/components/InvitationStudio/RsvpForm";
import GuestWishes from "@/components/PublicInvitation/GuestWishes";
import type { PersonalRsvpGuest } from "@/components/InvitationStudio/rsvp-types";
import { readableInk, invitationFontFamily } from "@/lib/templates/presentation";
import InvitationFonts from "@/components/PublicInvitation/InvitationFonts";
import OurStorySection from "@/components/PublicInvitation/OurStorySection";
import InvitationAssetLayers from "@/components/PublicInvitation/InvitationAssetLayers";
import { parseAssetLayers, type InvitationAssetLayer, type StudioObjectSection } from "@/lib/templates/asset-layers";
import InvitationMusic, { type InvitationMusicHandle } from "@/components/PublicInvitation/InvitationMusic";
import { resolveInvitationMusic } from "@/lib/templates/music";
import { getEventCategory, normalizeEventCategory } from "@/lib/events/catalog";
import { localizedWeddingParentLine } from "@/lib/invitations/language";
import { formatPersonalEnvelopeAddress } from "@/lib/guests/personal-envelope";
import { invitationText, localizedEditableCopy, type InvitationLanguage } from "@/lib/invitations/language";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationFonts, invitationPalettes, parseDesignKey } from "@/lib/templates/design";
import { parseEditableCopyMotions } from "@/lib/templates/editable-copy-motion";
import { getInvitationTemplate } from "@/lib/templates/catalog";
import { photoCropStyle, resolveGallerySettings, resolveInvitationPhotos, resolvePhotoCrop, type CroppablePhotoSlot, type PhotoAssignments, type PhotoCrop, type PhotoSlot } from "@/lib/templates/photo-slots";
import { parseInvitationSections, type InvitationSectionKey, type InvitationSections } from "@/lib/templates/sections";
import { invitationSectionBackgroundRule, invitationSectionInstanceStyle, invitationSectionStyleCss, parseInvitationSectionStyles, type InvitationSectionStyle } from "@/lib/templates/section-styles";
import { parseInvitationRsvpConfig, rsvpElementStyleCss } from "@/lib/templates/rsvp-config";
import { parseSectionElementStyles, sectionElementStyleCss } from "@/lib/templates/section-element-styles";
import { nativeVisualColorFilters, nativeVisualFontFamilies, nativeVisualScopeClass, nativeVisualStyleSheet } from "@/lib/templates/native-visual-transforms";
import InvitationColorFilters from "@/components/PublicInvitation/InvitationColorFilters";
import { invitationComponentColorCss } from "@/lib/templates/component-colors";
import { instancesForSection, parseInvitationSectionLayout } from "@/lib/templates/section-layout";
import EditableSectionInstance, { type SectionInstanceEditorActions } from "@/components/PublicInvitation/EditableSectionInstance";
import { useInvitationSectionAnimations } from "@/components/PublicInvitation/use-section-animations";
import { usePremiumSectionTimelines } from "@/components/PublicInvitation/use-premium-section-timelines";
import { useInvitationPhotoAnimations } from "@/components/PublicInvitation/use-photo-animations";
import { useInvitationCopyAnimations } from "@/components/PublicInvitation/use-copy-animations";
import { useInvitationNativeVisualAnimations } from "@/components/PublicInvitation/use-native-visual-animations";
import InvitationLayerTextContent from "@/components/PublicInvitation/InvitationLayerTextContent";
import StudioPhotoCropOverlay from "@/components/InvitationStudio/StudioPhotoCropOverlay";
import { templateHasDefaultMotion, templateHasDefaultPhotoMotion } from "@/lib/templates/template-motion";

const BlossomSectionArt = dynamic(() => import("@/components/PublicInvitation/EternalBlossomArtwork").then(module => module.EternalBlossomSectionArt));
const BlossomSymbol = dynamic(() => import("@/components/PublicInvitation/EternalBlossomArtwork").then(module => module.BlossomSymbol));
const SereinGallery = dynamic(() => import("@/components/PublicInvitation/SereinGallery"));
const ConfettiClubSectionArt = dynamic(() => import("@/components/PublicInvitation/ConfettiClubArtwork").then((module) => module.ConfettiClubSectionArt));
const BotanicalIvoryGallery = dynamic(() => import("@/components/PublicInvitation/BotanicalIvoryGallery"));
const BotanicalSectionArt = dynamic(() => import("@/components/PublicInvitation/BotanicalIvoryArtwork").then((module) => module.BotanicalSectionArt));
const BotanicalIdentity = dynamic(() => import("@/components/PublicInvitation/BotanicalIvoryArtwork").then((module) => module.BotanicalIdentity));
const ModernMaroonSectionArt = dynamic(() => import("@/components/PublicInvitation/ModernMaroonArtwork"));
const GardenLightSectionArt = dynamic(() => import("@/components/PublicInvitation/GardenLightArtwork").then((module) => module.GardenLightSectionArt));
const GardenLightGallery = dynamic(() => import("@/components/PublicInvitation/GardenLightGallery"));
const MidnightRomanceSectionArt = dynamic(() => import("@/components/PublicInvitation/MidnightRomanceArtwork").then((module) => module.MidnightRomanceSectionArt));
const MidnightRomanceGallery = dynamic(() => import("@/components/PublicInvitation/MidnightRomanceGallery"));
const ConfigurablePhotoGallery = dynamic(() => import("@/components/PublicInvitation/ConfigurablePhotoGallery"));
const ClassicPearlSectionArt = dynamic(() => import("@/components/PublicInvitation/ClassicPearlArtwork").then((module) => module.ClassicPearlSectionArt));
const ClassicPearlIdentity = dynamic(() => import("@/components/PublicInvitation/ClassicPearlArtwork").then((module) => module.ClassicPearlIdentity));
const ClassicPearlGallery = dynamic(() => import("@/components/PublicInvitation/ClassicPearlGallery"));
const GoldenArtDecoSectionArt = dynamic(() => import("@/components/PublicInvitation/GoldenArtDecoArtwork").then((module) => module.GoldenArtDecoSectionArt));
const GoldenArtDecoIdentity = dynamic(() => import("@/components/PublicInvitation/GoldenArtDecoArtwork").then((module) => module.GoldenArtDecoIdentity));
const GoldenArtDecoGallery = dynamic(() => import("@/components/PublicInvitation/GoldenArtDecoGallery"));
const CelestialInkSectionArt = dynamic(() => import("@/components/PublicInvitation/CelestialInkArtwork").then((module) => module.CelestialInkSectionArt));
const CelestialInkIdentity = dynamic(() => import("@/components/PublicInvitation/CelestialInkArtwork").then((module) => module.CelestialInkIdentity));
const CelestialInkGallery = dynamic(() => import("@/components/PublicInvitation/CelestialInkGallery"));
const PaperCutBotanicalSectionArt = dynamic(() => import("@/components/PublicInvitation/PaperCutBotanicalArtwork").then((module) => module.PaperCutBotanicalSectionArt));
const PaperCutBotanicalIdentity = dynamic(() => import("@/components/PublicInvitation/PaperCutBotanicalArtwork").then((module) => module.PaperCutBotanicalIdentity));
const PaperCutBotanicalGallery = dynamic(() => import("@/components/PublicInvitation/PaperCutBotanicalGallery"));
const VelvetHorizonSectionArt = dynamic(() => import("@/components/PublicInvitation/VelvetHorizonArtwork").then((module) => module.VelvetHorizonSectionArt));
const VelvetHorizonGallery = dynamic(() => import("@/components/PublicInvitation/VelvetHorizonGallery"));

const PencilSectionArt = dynamic(() => import("@/components/PublicInvitation/PencilReverieArtwork").then((module) => module.PencilSectionArt));
const PencilMemoryGallery = dynamic(() => import("@/components/PublicInvitation/PencilReverieArtwork").then((module) => module.PencilMemoryGallery));
const PencilBackwardClock = dynamic(() => import("@/components/PublicInvitation/PencilReverieArtwork").then((module) => module.PencilBackwardClock));
const ZenAtelierGallery = dynamic(() => import("@/components/PublicInvitation/ZenAtelierGallery"));
const ZenSectionArtwork = dynamic(() => import("@/components/PublicInvitation/ZenAtelierArtwork").then((module) => module.ZenSectionArtwork));
const ZenMemoryArtwork = dynamic(() => import("@/components/PublicInvitation/ZenAtelierArtwork").then((module) => module.ZenMemoryArtwork));

type InvitationData = {
  slug: string;
  title: string;
  eventCategory: string;
  groomName: string;
  brideName: string;
  groomFatherName?: string | null;
  groomMotherName?: string | null;
  groomChildOrder?: number | null;
  groomChildPosition?: string | null;
  brideFatherName?: string | null;
  brideMotherName?: string | null;
  brideChildOrder?: number | null;
  brideChildPosition?: string | null;
  venue: string;
  address?: string | null;
  mapUrl?: string | null;
  timezone: string;
  eventDate: Date | string;
  ceremonyTime: string | null;
  receptionTime: string | null;
  description: string | null;
  templateKey: string;
  giftBankName?: string | null;
  giftAccountName?: string | null;
  giftAccountNumber?: string | null;
  weddingHashtag?: string | null;
  dressCode?: string | null;
  musicUrl?: string | null;
  assets: { id: string; type: "IMAGE" | "AUDIO"; url: string; title: string | null }[];
};

const headings = {
  cover: ["The celebration", "Sebuah Undangan"],
  greeting: ["A warm welcome", "Dengan Hangat"],
  identity: ["Meet the hosts", "Yang Mengundang"],
  event: ["Our celebration", "Detail Acara"],
  dateTime: ["Save the date", "Tanggal & Waktu"],
  gallery: ["Our moments", "Galeri Foto"],
  countdown: ["The day is near", "Menuju Hari Istimewa"],
  location: ["Find your way", "Lokasi"],
  rsvp: ["Your presence matters", "Konfirmasi Kehadiran"],
  wishes: ["Kind words", "Ucapan & Doa"],
  gift: ["With gratitude", "Tanda Kasih"],
  closing: ["Until we meet", "Terima Kasih"],
} as const;

const confettiHeadings: Record<keyof typeof headings, string> = {
  cover: "Rayakan",
  greeting: "Datang dan rayakan",
  identity: "Yang berulang tahun",
  event: "Rencana pesta",
  dateTime: "Simpan tanggalnya",
  gallery: "Potongan bahagia",
  countdown: "Sebentar lagi",
  location: "Tempat kita bertemu",
  rsvp: "Datang, ya?",
  wishes: "Titipkan ucapan",
  gift: "Tanda kasih",
  closing: "Sampai di pesta!",
};

const zenHeadings: Record<keyof typeof headings, string> = {
  cover: "Sampul",
  greeting: "Sebuah Cerita",
  identity: "Tentang Kami",
  event: "Detail Acara",
  dateTime: "Tanggal & Waktu",
  gallery: "Galeri Foto",
  countdown: "Hitung Mundur",
  location: "Lokasi Acara",
  rsvp: "Konfirmasi Kehadiran",
  wishes: "Ucapan & Doa",
  gift: "Kirim Hadiah",
  closing: "Terima Kasih",
};

function displayDate(value: Date | string, timezone: string, numeric = false, language: InvitationLanguage = "ID") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return invitationText(language, "Tanggal belum ditentukan");
  try {
    return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "id-ID", { day: "numeric", month: numeric ? "2-digit" : "long", year: "numeric", timeZone: timezone || "Asia/Jakarta" }).format(date).replaceAll("/", " · ");
  } catch {
    return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "id-ID", { day: "numeric", month: numeric ? "2-digit" : "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date).replaceAll("/", " · ");
  }
}

function eventCountdown(value: Date | string, now: number | null) {
  if (now === null) return null;
  const remaining = getInvitationCountdown(value, now);
  if (!remaining) return null;
  return [
    ["Hari", remaining.days],
    ["Jam", remaining.hours],
    ["Menit", remaining.minutes],
    ["Detik", remaining.seconds],
  ] as const;
}

/** One shared feature engine for individually art-directed non-Romantic Rose themes.
 * Section logic, media ownership and RSVP are shared; themed envelope, cover and section art remain template-owned.
 */
export default function UniversalInvitationTemplate({
  invitation,
  preview = false,
  editorPreview = preview,
  allowEnvelopeOpen = false,
  sections: sectionOverride,
  photoAssignments,
  activeCropSlot,
  onCropPhoto,
  onFinishCrop,
  coverUrl,
  onEditPhoto,
  onEnvelopeOpened,
  selectedAssetLayerId,
  selectedAssetLayerIds,
  onSelectAssetLayer,
  onMoveAssetLayer,
  onUpdateAssetLayer,
  selectedSectionInstanceId,
  onSelectSectionInstance,
  onMoveSectionInstance,
  onToggleSectionInstance,
  onDuplicateSectionInstance,
  onDeleteSectionInstance,
  editorMode = "customer",
  templateKey,
  designKey,
  personalGuest,
  previewRecipientLine,
}: {
  invitation: InvitationData;
  personalGuest?: PersonalRsvpGuest;
  preview?: boolean;
  editorPreview?: boolean;
  allowEnvelopeOpen?: boolean;
  previewRecipientLine?: string;
  sections?: InvitationSections;
  photoAssignments?: PhotoAssignments;
  activeCropSlot?: CroppablePhotoSlot | null;
  onCropPhoto?: (slot: CroppablePhotoSlot, crop: PhotoCrop) => void;
  onFinishCrop?: () => void;
  coverUrl?: string;
  onEditPhoto?: (slot: PhotoSlot) => void;
  /** Optional Studio-only callback; fires after the envelope has finished opening. */
  onEnvelopeOpened?: () => void;
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
  templateKey?: string;
  designKey?: string;
}) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const musicRef = useRef<InvitationMusicHandle>(null);
  const [now, setNow] = useState<number | null>(null);
  const key = templateKey || parseDesignKey(invitation.templateKey).template;
  const template = getInvitationTemplate(key);
  // A bare theme key is used by public demo cards and legacy saved records.
  // Resolve its actual theme preset instead of unintentionally using global rose/Cinzel defaults.
  const activeDesignKey = designKey || (parseDesignKey(invitation.templateKey).template === key && invitation.templateKey.includes("::")
    ? invitation.templateKey
    : `${key}::${template.preset.palette}::${template.preset.font}`);
  const design = parseDesignKey(activeDesignKey);
  const editableCopy = localizedEditableCopy(activeDesignKey, key, invitation.description, language);
  const copyMotions = parseEditableCopyMotions(activeDesignKey);
  const illustrationLayers = parseAssetLayers(activeDesignKey);
  const palette = invitationPalettes[design.palette] || invitationPalettes[template.preset.palette];
  const font = invitationFonts[design.font] || invitationFonts[template.preset.font];
  const layout = template.preset.layout;
  const usesPhotos = template.usesPhotos;
  const isInkTheme = key === "midnight-romance" || key === "celestial-ink" || key === "golden-art-deco";
  const sections = sectionOverride ?? parseInvitationSections(activeDesignKey);
  const sectionStyles = useMemo(() => parseInvitationSectionStyles(activeDesignKey), [activeDesignKey]);
  useInvitationSectionAnimations(rootRef, sectionStyles);
  usePremiumSectionTimelines(rootRef, sectionStyles, String(opened));
  useInvitationCopyAnimations(rootRef, copyMotions, editableCopy, String(opened));
  useInvitationNativeVisualAnimations(rootRef, activeDesignKey, String(opened), templateHasDefaultMotion(key) ? { template: key, sectionStyles } : undefined);
  const rsvpConfig = parseInvitationRsvpConfig(activeDesignKey);
  const sectionElementStyles = parseSectionElementStyles(activeDesignKey);
  const sectionLayout = parseInvitationSectionLayout(activeDesignKey);
  const sectionEditorActions: SectionInstanceEditorActions | undefined = editorPreview ? {
    selectedId: selectedSectionInstanceId,
    onSelect: onSelectSectionInstance,
    onMove: onMoveSectionInstance,
    onToggle: onToggleSectionInstance,
    onDuplicate: onDuplicateSectionInstance,
    onDelete: onDeleteSectionInstance,
  } : undefined;
  const media = resolveInvitationPhotos(invitation.assets, activeDesignKey, coverUrl, photoAssignments);
  const gallerySettings = resolveGallerySettings(media.assignment);
  useInvitationPhotoAnimations(rootRef, media.assignment, `${opened}-${media.gallery.length}`, templateHasDefaultPhotoMotion(key) ? { template: key, sectionStyles } : undefined);
  const identity = getEventCategory(normalizeEventCategory(invitation.eventCategory));
  const couple = identity.nameMode === "couple";
  const names = couple
    ? [displayTitleCase(invitation.groomName), displayTitleCase(invitation.brideName)].filter(Boolean).join(" & ")
    : identity.nameMode === "single"
      ? displayTitleCase(invitation.groomName) || displayTitleCase(invitation.title)
      : displayTitleCase(invitation.title);
  const groomParents = couple ? localizedWeddingParentLine(language, invitation.groomFatherName, invitation.groomMotherName, invitation.groomChildOrder, "putra", invitation.groomChildPosition) : "";
  const brideParents = couple ? localizedWeddingParentLine(language, invitation.brideFatherName, invitation.brideMotherName, invitation.brideChildOrder, "putri", invitation.brideChildPosition) : "";
  const eventTitle = displayTitleCase(invitation.title) || names || "Perayaan";
  const date = displayDate(invitation.eventDate, invitation.timezone, false, language);
  const countdown = eventCountdown(invitation.eventDate, now);
  const maps = invitation.mapUrl && /^https?:\/\//i.test(invitation.mapUrl) ? invitation.mapUrl : null;
  const hasGift = Boolean(invitation.giftBankName?.trim() && invitation.giftAccountNumber?.trim());
  const music = resolveInvitationMusic(key, invitation.musicUrl, invitation.assets);
  const personalEnvelopeAddress = personalGuest ? formatPersonalEnvelopeAddress({ ...personalGuest, personalLanguage: language }) : preview ? previewRecipientLine ?? "" : "";
  const frame = key === "zen-atelier" ? "rounded-none border border-[var(--inv-soft)] p-1 bg-[var(--inv-surface)]" : layout === "midnight" ? "rounded-full" : layout === "maroon" ? "rounded-none" : layout === "editorial" ? "rounded-2xl" : "rounded-t-[140px] rounded-b-xl";
  const panel = key === "zen-atelier" ? "rounded-none" : layout === "midnight" ? "rounded-3xl" : layout === "maroon" ? "rounded-sm" : layout === "editorial" ? "rounded-xl" : "rounded-[28px]";
  const customPalette = design.palette !== template.preset.palette;
  const css = {
    "--inv-heading": invitationFontFamily(font.heading),
    ...(customPalette ? {
      "--inv-scene-bg": palette.bg,
      "--inv-scene-text": "currentColor",
      "--inv-scene-surface": palette.surface,
      "--inv-scene-ink": readableInk(palette.bg, palette.ink),
      "--inv-scene-surface-ink": readableInk(palette.surface, palette.ink),
      "--inv-scene-accent": palette.accent,
      "--inv-scene-soft": palette.soft,
    } : {}),
    "--inv-bg": palette.bg,
    "--inv-surface": palette.surface,
    "--cc-on-accent": readableInk(palette.accent, palette.surface),
    "--serein-on-accent": readableInk(palette.accent, palette.surface),
    "--serein-surface-ink": readableInk(palette.surface, palette.ink),
    "--blossom-on-accent": readableInk(palette.accent, palette.surface),
    "--blossom-surface-ink": readableInk(palette.surface, palette.ink),
    "--bi-on-accent": readableInk(palette.accent, palette.surface),
    "--bi-surface-ink": readableInk(palette.surface, palette.ink),
    "--mr-on-accent": readableInk(palette.accent, palette.bg),
    "--cp-on-accent": readableInk(palette.accent, palette.surface),
    "--gd-on-accent": readableInk(palette.accent, palette.bg),
    "--ci-on-accent": readableInk(palette.accent, palette.bg),
    "--inv-ink": key === "confetti-club" || key === "zen-atelier" || key === "serein" || key === "botanical-ivory" || key === "eternal-blossom" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" ? readableInk(palette.bg, palette.ink) : palette.ink,
    "--inv-accent": palette.accent,
    "--inv-soft": palette.soft,
    color: palette.ink,
    backgroundColor: palette.bg,
    fontFamily: invitationFontFamily(font.body),
  } as CSSProperties;

  useEffect(() => {
    if (!opened && sections.envelope !== false) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [opened, sections.envelope]);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => {
      setOpened(true);
      setOpening(false);
      onEnvelopeOpened?.();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches || ((key === "zen-atelier" || key === "pencil-reverie" || key === "botanical-ivory" || key === "eternal-blossom" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" || key === "velvet-horizon") && (sectionStyles.envelope?.animation === "none" || sectionStyles.envelope?.timeline)) ? 0 : (key === "zen-atelier" || key === "pencil-reverie" || key === "botanical-ivory" || key === "eternal-blossom" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" || key === "velvet-horizon") ? 950 : key === "confetti-club" ? 650 : 1350);
    return () => window.clearTimeout(timer);
  }, [opening, onEnvelopeOpened, key, sectionStyles]);

  const handleOpen = (immediate = false) => {
    musicRef.current?.playOnOpen();
    if (immediate) { setOpened(true); onEnvelopeOpened?.(); return; }
    if (key === "confetti-club" || key === "zen-atelier" || key === "pencil-reverie" || key === "serein" || key === "botanical-ivory" || key === "eternal-blossom" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "celestial-ink" || key === "velvet-horizon") {
      setOpening(true);
    } else {
      setOpened(true);
      onEnvelopeOpened?.();
    }
  };

  const changePhoto = (slot: PhotoSlot, label: string) =>
    preview && onEditPhoto && activeCropSlot !== slot ? (
      <button
        type="button"
        className="absolute inset-0 z-10 flex items-end justify-center bg-transparent pb-3 text-xs font-medium text-transparent transition hover:bg-black/25 hover:text-white focus-visible:bg-black/25 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-[var(--inv-accent)]"
        onClick={() => onEditPhoto(slot)}
        aria-label={`Atur foto ${label}`}
      >
        Atur foto
      </button>
    ) : null;

  const cropOverlay = (slot: CroppablePhotoSlot) =>
    preview && activeCropSlot === slot && onCropPhoto && onFinishCrop ? (
      <StudioPhotoCropOverlay
        crop={resolvePhotoCrop(media.assignment, slot)}
        onChange={(crop) => onCropPhoto(slot, crop)}
        onDone={onFinishCrop}
      />
    ) : null;

  const objectOverlay = (target: StudioObjectSection, instanceId: string = target) => <InvitationAssetLayers layers={illustrationLayers} section={target} sectionInstanceId={instanceId}
    editable={preview && Boolean(onUpdateAssetLayer)} editorMode={editorMode} selectedId={selectedAssetLayerId} selectedIds={selectedAssetLayerIds} onSelect={onSelectAssetLayer}
    onUpdate={onUpdateAssetLayer} />;

  const renderSectionInstances = (keyName: InvitationSectionKey, render: (instanceId: string, style: InvitationSectionStyle | undefined) => ReactNode) => {
    const hidden = sections[keyName] === false;
    if (hidden && (!editorPreview || key === "blank-canvas")) return null;
    return instancesForSection(sectionLayout, keyName).map((instance) => (
      <EditableSectionInstance
        key={instance.id}
        instance={instance}
        order={instance.order}
        total={sectionLayout.length}
        preview={editorPreview}
        hidden={hidden}
        actions={sectionEditorActions}
      >
        {render(instance.id, invitationSectionInstanceStyle(sectionStyles[keyName], instance))}
      </EditableSectionInstance>
    ));
  };

  const section = (keyName: keyof typeof headings, children: ReactNode, index: number, after?: (instanceId: string) => ReactNode) => {
    const sectionKey = keyName;
    const sectionHasPremiumTimeline = Boolean(sectionStyles[sectionKey]?.timeline);
    const left = key === "modern-maroon" || key === "golden-art-deco" || key === "celestial-ink";
    const paper = key === "paper-cut-botanical";
    const celestial = key === "celestial-ink";
    const zen = key === "zen-atelier";
    const pencil = key === "pencil-reverie";
    const serein = key === "serein";
    const confetti = key === "confetti-club";
    const botanical = key === "botanical-ivory";
    const blossom = key === "eternal-blossom";
    const modern = key === "modern-maroon";
    const garden = key === "garden-light";
    const midnight = key === "midnight-romance";
    const classic = key === "classic-pearl";
    const golden = key === "golden-art-deco";
    const velvet = key === "velvet-horizon";
    const contrast = !customPalette && isInkTheme && index % 2 === 0;
    const modernDarkSection = ["identity", "dateTime", "rsvp", "gift"].includes(keyName);
    const modernSoftSection = ["event", "countdown", "wishes"].includes(keyName);
    const modernBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb, var(--inv-surface) 78%, var(--inv-soft))",
      dateTime: "color-mix(in srgb, var(--inv-bg) 84%, #000)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb, var(--inv-surface) 78%, var(--inv-soft))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb, var(--inv-surface) 78%, var(--inv-soft))",
      gift: "var(--inv-bg)",
      closing: "var(--inv-surface)",
    };
    const gardenBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-surface) 72%,var(--inv-soft))",
      dateTime: "var(--inv-bg)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb,var(--inv-soft) 70%,var(--inv-bg))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-surface) 82%,var(--inv-soft))",
      gift: "var(--inv-bg)",
      closing: "var(--inv-surface)",
    };
    const midnightBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-soft) 18%,var(--inv-bg))",
      dateTime: "var(--inv-surface)",
      gallery: "var(--inv-bg)",
      countdown: "color-mix(in srgb,var(--inv-soft) 16%,var(--inv-bg))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-soft) 14%,var(--inv-bg))",
      gift: "var(--inv-surface)",
      closing: "var(--inv-bg)",
    };
    const classicBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-surface) 72%,var(--inv-soft))",
      dateTime: "var(--inv-bg)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb,var(--inv-soft) 22%,var(--inv-bg))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-surface) 80%,var(--inv-soft))",
      gift: "var(--inv-bg)",
      closing: "var(--inv-surface)",
    };
    const goldenBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-soft) 18%,var(--inv-bg))",
      dateTime: "var(--inv-surface)",
      gallery: "var(--inv-bg)",
      countdown: "color-mix(in srgb,var(--inv-soft) 15%,var(--inv-bg))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-soft) 14%,var(--inv-bg))",
      gift: "var(--inv-surface)",
      closing: "var(--inv-bg)",
    };
    const celestialBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-surface) 76%,var(--inv-bg))",
      dateTime: "var(--inv-bg)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb,var(--inv-bg) 84%,var(--inv-surface))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-surface) 82%,var(--inv-bg))",
      gift: "var(--inv-bg)",
      closing: "var(--inv-surface)",
    };
    const velvetBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-surface) 82%,var(--inv-soft))",
      dateTime: "var(--inv-bg)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb,var(--inv-bg) 82%,var(--inv-soft))",
      location: "var(--inv-surface)",
      rsvp: "var(--inv-bg)",
      wishes: "color-mix(in srgb,var(--inv-surface) 84%,var(--inv-bg))",
      gift: "var(--inv-bg)",
      closing: "var(--inv-surface)",
    };
    const paperBackdrop: Partial<Record<keyof typeof headings, string>> = {
      greeting: "var(--inv-surface)",
      identity: "var(--inv-bg)",
      event: "color-mix(in srgb,var(--inv-surface) 76%,var(--inv-soft))",
      dateTime: "var(--inv-bg)",
      gallery: "var(--inv-surface)",
      countdown: "color-mix(in srgb,var(--inv-bg) 82%,var(--inv-soft))",
      location: "var(--inv-bg)",
      rsvp: "var(--inv-surface)",
      wishes: "color-mix(in srgb,var(--inv-surface) 80%,var(--inv-bg))",
      gift: "var(--inv-surface)",
      closing: "var(--inv-bg)",
    };
    const backdrop = modern ? (modernBackdrop[keyName] ?? "var(--inv-bg)") : garden ? (gardenBackdrop[keyName] ?? "var(--inv-bg)") : midnight ? (midnightBackdrop[keyName] ?? "var(--inv-bg)") : classic ? (classicBackdrop[keyName] ?? "var(--inv-bg)") : golden ? (goldenBackdrop[keyName] ?? "var(--inv-bg)") : celestial ? (celestialBackdrop[keyName] ?? "var(--inv-bg)") : velvet ? (velvetBackdrop[keyName] ?? "var(--inv-bg)") : paper ? (paperBackdrop[keyName] ?? "var(--inv-bg)") : botanical || blossom ? keyName === "countdown" ? "var(--inv-accent)" : ["greeting", "wishes", "gallery"].includes(keyName) ? "var(--inv-surface)" : "var(--inv-bg)" : contrast ? (key === "golden-art-deco" ? "#191b17" : "#080d20") : index % 2 ? "var(--inv-surface)" : "var(--inv-bg)";
    return renderSectionInstances(keyName, (instanceId, sectionStyle) => {
    const color = modern
      ? readableInk(modernDarkSection ? palette.bg : modernSoftSection ? palette.surface : palette.surface, palette.ink)
      : confetti ? readableInk(sectionStyle?.background || (index % 2 ? palette.surface : palette.bg), palette.ink)
      : garden ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : midnight ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : classic ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : golden ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : celestial ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : velvet ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : paper ? (sectionStyle?.background ? readableInk(sectionStyle.background, palette.ink) : palette.ink)
      : botanical || blossom ? readableInk(sectionStyle?.background || (keyName === "countdown" ? palette.accent : ["greeting", "wishes", "gallery"].includes(keyName) ? palette.surface : palette.bg), palette.ink) : customPalette ? readableInk(index % 2 ? palette.surface : palette.bg, palette.ink) : contrast ? (key === "celestial-ink" ? "#c9e2f0" : "#e7cfa4") : "var(--inv-ink)";
    return (
      <>
      <section data-invitation-section={keyName} data-premium-timeline={sectionHasPremiumTimeline ? "true" : undefined} className={`relative overflow-hidden px-6 sm:px-9 ${confetti ? "cc-section" : zen ? "zen-section" : pencil ? "pr-section" : serein ? "serein-section" : botanical ? "bi-section" : blossom ? "eb-section" : garden ? "gl-section" : midnight ? "mr-section" : classic ? "cp-section" : golden ? "gd-section" : celestial ? "ci-section" : velvet ? "vh-section" : paper ? "pcb-section" : modern ? `mm-section mm-${keyName}` : "py-16"} ${confetti || left || pencil || serein || botanical || blossom || garden || midnight || classic || golden || paper || modern ? "text-left" : "text-center"}`}
        style={{ ...(confetti ? { "--cc-section-heading": readableInk(sectionStyle?.background || (index % 2 ? palette.surface : palette.bg), palette.accent) } as CSSProperties : {}), backgroundColor: backdrop, color, backgroundImage: zen ? "radial-gradient(circle at 10% 40%,rgba(112,100,81,.055),transparent 42%)" : undefined, ...invitationSectionStyleCss(sectionStyle) }}
      >
        {confetti && <ConfettiClubSectionArt section={keyName} />}
        {botanical && <BotanicalSectionArt section={keyName} />}
        {blossom && <BlossomSectionArt section={keyName} />}
        {modern && <ModernMaroonSectionArt section={keyName} />}
        {garden && <GardenLightSectionArt section={keyName} />}
        {midnight && <MidnightRomanceSectionArt section={keyName} />}
        {classic && <ClassicPearlSectionArt section={keyName} />}
        {golden && <GoldenArtDecoSectionArt section={keyName} />}
        {celestial && <CelestialInkSectionArt section={keyName} />}
        {velvet && <VelvetHorizonSectionArt section={keyName} />}
        {paper && <PaperCutBotanicalSectionArt section={keyName} />}
        {zen && <ZenSectionArtwork section={keyName} />}
        {pencil && <PencilSectionArt section={keyName} />}
        <div data-studio-native-object={`object:${keyName}:heading-group`} className="relative">
          {!confetti && !zen && !pencil && !serein && !botanical && !blossom && !garden && !midnight && !classic && !golden && !velvet && !paper && <p data-studio-native-object={`object:${keyName}:kicker`} className="text-[10px] uppercase tracking-[0.23em]" style={{color:contrast ? "inherit" : "var(--inv-accent)"}}>{tr(headings[keyName][0])}</p>}
          <h2
            data-studio-native-heading=""
            data-studio-rsvp-element={keyName === "rsvp" ? "title" : undefined}
            className={`leading-snug ${confetti ? "cc-section-title" : zen ? "text-[29px] tracking-[-.03em]" : velvet ? "vh-section-title" : `mt-3 text-2xl ${left ? "uppercase tracking-[.04em]" : ""}`}`}
            style={{
              fontFamily: invitationFontFamily(font.heading),
              color: confetti ? "var(--cc-section-heading)" : "inherit",
              ...(keyName === "rsvp" ? rsvpElementStyleCss(rsvpConfig, "title") : {}),
            }}
          >
            {keyName === "rsvp"
              ? tr(rsvpConfig.title || (confetti ? confettiHeadings.rsvp : zen ? zenHeadings.rsvp : headings.rsvp[1]))
              : tr(confetti ? (keyName === "identity" && identity.key !== "BIRTHDAY" ? headings.identity[1] : confettiHeadings[keyName]) : zen ? zenHeadings[keyName] : botanical && keyName === "gallery" ? "Galeri Kisah" : pencil && keyName === "gallery" ? "Galeri Cerita" : classic && keyName === "gallery" ? "Galeri Kenangan" : golden && keyName === "gallery" ? "Vignette Malam" : celestial && keyName === "gallery" ? (language === "EN" ? "Night Programme" : "Program Malam") : velvet && keyName === "gallery" ? (language === "EN" ? "Our Gallery" : "Galeri Kami") : paper && keyName === "gallery" ? "Kolase Kertas" : headings[keyName][1])}
          </h2>
          {confetti || serein || botanical || blossom || garden || midnight || classic || golden || velvet || paper ? null : pencil ? <span aria-hidden="true" data-studio-native-object={`object:${keyName}:divider`} className="pr-heading-mark" /> : zen ? <span aria-hidden="true" data-studio-native-object={`object:${keyName}:divider`} className="mx-auto my-6 block h-px w-10 bg-[var(--inv-accent)]/75" /> : (
            <div data-studio-native-object={`object:${keyName}:divider`} className={`my-6 flex items-center gap-2 ${left ? "" : "justify-center"}`}>
              <span className="h-px w-12 opacity-55" style={{ backgroundColor: contrast ? "currentColor" : "var(--inv-soft)" }} />
              {key === "celestial-ink" ? <Moon className="h-4 w-4" /> : key === "paper-cut-botanical" || key === "garden-light" || key === "botanical-ivory" ? <Leaf className="h-4 w-4" /> : key === "golden-art-deco" ? <Star className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              <span className="h-px w-12 opacity-55" style={{ backgroundColor: contrast ? "currentColor" : "var(--inv-soft)" }} />
            </div>
          )}
          {children}
        </div>
        {objectOverlay(keyName, instanceId)}
      </section>
      {after?.(instanceId)}
      </>
    );
    });
  };

  return (
    <main
      ref={rootRef}
      data-studio-preview-root={editorPreview ? "true" : undefined}
      className={`relative isolate ${nativeVisualScopeClass(activeDesignKey)} mx-auto min-h-[760px] w-full max-w-2xl ${editorPreview ? "overflow-visible" : "overflow-hidden"} border border-[var(--inv-soft)] text-[var(--inv-ink)] ${panel} ${key === "confetti-club" ? "confetti-club-invitation" : key === "zen-atelier" ? "zen-invitation" : key === "pencil-reverie" ? "pr-invitation" : key === "serein" ? "serein-invitation" : key === "botanical-ivory" ? "botanical-invitation" : key === "eternal-blossom" ? "eternal-invitation" : key === "modern-maroon" ? "modern-maroon-invitation" : key === "garden-light" ? "garden-light-invitation" : key === "midnight-romance" ? "midnight-romance-invitation" : key === "classic-pearl" ? "classic-pearl-invitation" : key === "golden-art-deco" ? "golden-art-deco-invitation" : key === "celestial-ink" ? "celestial-ink-invitation" : key === "velvet-horizon" ? "velvet-horizon-invitation" : key === "paper-cut-botanical" ? "paper-cut-botanical-invitation" : ""}`}
      style={css}
    >
      <style>{nativeVisualStyleSheet(activeDesignKey)}</style>
      <style>{invitationComponentColorCss(nativeVisualScopeClass(activeDesignKey), rsvpConfig, sectionElementStyles)}</style>
      <InvitationColorFilters filters={nativeVisualColorFilters(activeDesignKey)} />
      <style>{invitationSectionBackgroundRule}</style>
      <InvitationFonts families={[font.heading, font.body, ...nativeVisualFontFamilies(activeDesignKey)]} />
      {sections.music !== false && <InvitationMusic ref={musicRef} source={music} opened={opened || sections.envelope === false} preview={preview} />}
      {!opened && sections.envelope !== false ? (
        <div data-invitation-section="envelope" data-invitation-background-override={sectionStyles.envelope?.background ? "true" : undefined} className="relative" style={invitationSectionStyleCss(sectionStyles.envelope)}><InvitationThemeScenes
          theme={key}
          isWedding={normalizeEventCategory(invitation.eventCategory) === "WEDDING"}
          couple={couple}
          hashtag={invitation.weddingHashtag}
          names={names || eventTitle}
          time={invitation.ceremonyTime || undefined}
          eventLabel={tr(identity.label)}
          date={key === "zen-atelier" ? displayDate(invitation.eventDate, invitation.timezone, true, language) : date}
          cover={usesPhotos ? media.cover : undefined}
          focus={media.assignment.focus.cover}
          crop={resolvePhotoCrop(media.assignment, "cover")}
          cropEditing={preview && activeCropSlot === "cover"}
          onCropChange={onCropPhoto ? (crop) => onCropPhoto("cover", crop) : undefined}
          onFinishCrop={onFinishCrop}
          stage="envelope"
          allowEnvelopeOpen={allowEnvelopeOpen}
          onOpen={handleOpen}
          preview={preview}
          recipientLine={personalEnvelopeAddress}
          motionEnabled={sectionStyles.envelope?.animation !== "none" && !sectionStyles.envelope?.timeline}
          locale={language === "EN" ? "en" : "id"}
        />{objectOverlay("envelope")}</div>
      ) : (
        <div className={`${key === "zen-atelier" ? "zen-content " : ""}flex flex-col`}>
          {renderSectionInstances("cover", (instanceId, sectionStyle) => (
            <div className="relative" data-studio-cover-stage data-invitation-section="cover" data-invitation-background-override={sectionStyle?.background ? "true" : undefined} style={invitationSectionStyleCss(sectionStyle)}><InvitationThemeScenes
              theme={key}
              isWedding={normalizeEventCategory(invitation.eventCategory) === "WEDDING"}
              couple={couple}
              hashtag={invitation.weddingHashtag}
              names={names || eventTitle}
              time={invitation.ceremonyTime || undefined}
              eventLabel={tr(identity.label)}
              date={key === "zen-atelier" ? displayDate(invitation.eventDate, invitation.timezone, true, language) : date}
              locale={language === "EN" ? "en" : "id"}
              cover={usesPhotos ? media.cover : undefined}
              focus={media.assignment.focus.cover}
          crop={resolvePhotoCrop(media.assignment, "cover")}
          cropEditing={preview && activeCropSlot === "cover"}
          onCropChange={onCropPhoto ? (crop) => onCropPhoto("cover", crop) : undefined}
          onFinishCrop={onFinishCrop}
              stage="cover"
              onOpen={handleOpen}
              onEditPhoto={usesPhotos && preview && onEditPhoto ? () => onEditPhoto("cover") : undefined}
              motionEnabled={sectionStyle?.animation !== "none" && !sectionStyle?.timeline}
            />{objectOverlay("cover", instanceId)}</div>
          ))}

          {section("greeting", key === "pencil-reverie" ? (
            <div data-studio-native-object="object:greeting:copy-group" className="pr-greeting-copy">
              <p data-studio-copy-field="greeting" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.greeting ?? ""} unit={copyMotions.greeting?.unit} /></p>
              <p data-studio-copy-field="attendanceRequest" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.attendanceRequest ?? ""} unit={copyMotions.attendanceRequest?.unit} /></p>
            </div>
          ) : key === "modern-maroon" ? (
            <div data-studio-native-object="object:greeting:copy-group" className="mm-greeting-copy">
              <span aria-hidden="true" data-studio-native-object="object:greeting:flourish" className="mm-flourish ml-auto mb-5 text-[var(--inv-accent)]" />
              <p data-studio-copy-field="greeting" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.greeting ?? ""} unit={copyMotions.greeting?.unit} /></p>
              <p data-studio-copy-field="attendanceRequest" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.attendanceRequest ?? ""} unit={copyMotions.attendanceRequest?.unit} /></p>
            </div>
          ) : (
            <div data-studio-native-object="object:greeting:copy-group" className="mx-auto max-w-md space-y-4 text-sm leading-8 opacity-80">
              <p data-studio-copy-field="greeting" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.greeting ?? ""} unit={copyMotions.greeting?.unit} /></p>
              <p data-studio-copy-field="attendanceRequest" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.attendanceRequest ?? ""} unit={copyMotions.attendanceRequest?.unit} /></p>
            </div>
          ), 1)}

          {section("identity", key === "confetti-club" ? (
            <div data-studio-native-object="object:identity:honoree-group" className="cc-honoree">
              {media.cover && <div data-invitation-photo-slot="cover" className="cc-portrait">
                <img src={media.cover} alt={tr("Foto") + " " + (names || eventTitle)} loading="lazy" decoding="async" style={photoCropStyle(media.assignment, "cover")} />
                {changePhoto("cover", names || eventTitle)}
                {cropOverlay("cover")}
              </div>}
              {!media.cover && preview && onEditPhoto && <button type="button" className="cc-photo-add" onClick={() => onEditPhoto("cover")}>{tr("Pilih foto")}</button>}
              <p data-studio-native-object="object:identity:event-name" className="cc-honoree-name">{names || eventTitle}</p>
            </div>
          ) : key === "pencil-reverie" ? (
            <div data-studio-native-object="object:identity:story-group" className="pr-identity-story">
              <div className="pr-identity-polaroid" data-studio-native-object="object:identity:portrait-art"><span className="pr-polaroid-tape" aria-hidden="true"/>
                <Image alt="Ilustrasi dua orang yang saling bersandar" src="/templates/pencil-reverie/couplesitting.webp" width={1122} height={1402} sizes="(max-width: 640px) 70vw, 310px" loading="lazy"/>
              </div>
              <p className="pr-identity-names" data-studio-native-object="object:identity:names">{names || eventTitle}</p>
              {couple && <p className="pr-identity-signature" data-studio-native-object="object:identity:signature">{tr("Dua hati, satu cerita yang selalu tumbuh.")}</p>}
              {(groomParents || brideParents) && <div data-studio-native-object="object:identity:parents-group" className="pr-identity-parents"><p data-studio-native-object="object:identity:personOne-parents">{groomParents}</p><p data-studio-native-object="object:identity:personTwo-parents">{brideParents}</p></div>}
            </div>
          ) : key === "paper-cut-botanical" ? (
            <PaperCutBotanicalIdentity couple={couple} first={displayTitleCase(invitation.groomName)} second={displayTitleCase(invitation.brideName)} firstParents={groomParents} secondParents={brideParents} names={names || eventTitle} emptyName={tr("Nama belum diisi")} />
          ) : key === "botanical-ivory" ? (
            <BotanicalIdentity couple={couple} first={displayTitleCase(invitation.groomName)} second={displayTitleCase(invitation.brideName)} firstParents={groomParents} secondParents={brideParents} names={names || eventTitle} emptyName={tr("Nama belum diisi")} />
          ) : key === "zen-atelier" ? (
            <div>
              {media.cover && <div data-invitation-photo-slot="cover" className="zen-identity-photo relative">
                <img src={media.cover} alt={`Foto ${names || eventTitle}`} loading="lazy" style={photoCropStyle(media.assignment, "cover")} />
                {changePhoto("cover", "pasangan")}
                {cropOverlay("cover")}
              </div>}
              {!media.cover && preview && onEditPhoto && <button className="zen-action mb-6" type="button" onClick={() => onEditPhoto("cover")}>Pilih Foto Pasangan</button>}
              <p className="zen-couple-name" data-studio-native-object="object:identity:names">{couple ? <>{displayTitleCase(invitation.brideName)}<em>&amp;</em>{displayTitleCase(invitation.groomName)}</> : names || eventTitle}</p>
              {couple && <p className="zen-quote" data-studio-native-object="object:identity:quote">{tr("Dua jiwa, satu perjalanan, menuju selamanya.")}</p>}
              {(groomParents || brideParents) && <div className="zen-parents"><p data-studio-native-object="object:identity:personTwo-parents">{brideParents}</p><p data-studio-native-object="object:identity:personOne-parents">{groomParents}</p></div>}
            </div>
          ) : key === "golden-art-deco" ? (
            <GoldenArtDecoIdentity couple={couple} first={displayTitleCase(invitation.groomName)} second={displayTitleCase(invitation.brideName)} firstParents={groomParents} secondParents={brideParents} names={names || eventTitle} emptyName={tr("Nama belum diisi")} />
          ) : key === "celestial-ink" ? (
            <CelestialInkIdentity couple={couple} first={displayTitleCase(invitation.groomName)} second={displayTitleCase(invitation.brideName)} firstParents={groomParents} secondParents={brideParents} names={names || eventTitle} emptyName={tr("Nama belum diisi")} />
          ) : key === "classic-pearl" ? (
            <ClassicPearlIdentity couple={couple} first={displayTitleCase(invitation.groomName)} second={displayTitleCase(invitation.brideName)} firstParents={groomParents} secondParents={brideParents} names={names || eventTitle} emptyName={tr("Nama belum diisi")} />
          ) : key === "modern-maroon" ? (
            <div className={couple ? "mm-identity-layout" : "mx-auto max-w-sm"}>
              {couple ? (
                <>
                  {([["personOne", displayTitleCase(invitation.groomName), media.personOne], ["personTwo", displayTitleCase(invitation.brideName), media.personTwo]] as const).map(([slot, name, url]) => (
                    <div key={slot} data-studio-native-object={`object:identity:${slot}-group`} className="mm-person">
                      <div data-invitation-photo-slot={slot} className="mm-person-photo">
                        {url ? <img src={url} alt={`Foto ${name || "mempelai"}`} loading="lazy" style={photoCropStyle(media.assignment, slot)} /> : <div className="flex h-full min-h-64 items-center justify-center bg-black/10"><Heart className="h-8 w-8 opacity-40" /></div>}
                        {changePhoto(slot, name || "mempelai")}
                        {cropOverlay(slot)}
                      </div>
                      <div className="mm-person-copy">
                        <p data-studio-native-object={`object:identity:${slot}-name`} className="mm-person-name" style={{ fontFamily: invitationFontFamily(font.heading) }}>{name || tr("Nama belum diisi")}</p>
                        {(slot === "personOne" ? groomParents : brideParents) && <p data-studio-native-object={`object:identity:${slot}-parents`} className="mm-person-parents">{slot === "personOne" ? groomParents : brideParents}</p>}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p data-studio-native-object="object:identity:event-name" className="break-words text-3xl" style={{ fontFamily: invitationFontFamily(font.heading) }}>{names || eventTitle}</p>
              )}
            </div>
          ) : (
            <div className={`${key === "serein" ? "sr-identity" : key === "eternal-blossom" ? "eb-identity" : key === "velvet-horizon" ? "vh-identity" : ""} mx-auto max-w-lg gap-5 ${couple ? "grid grid-cols-2" : "flex flex-col items-center"}`}>
              {couple ? (
                <>
                  {([["personOne", displayTitleCase(invitation.groomName), media.personOne], ["personTwo", displayTitleCase(invitation.brideName), media.personTwo]] as const).map(([slot, name, url]) => (
                    <div key={slot} data-studio-native-object={`object:identity:${slot}-group`} className={key === "serein" ? "sr-person" : key === "eternal-blossom" ? "eb-person" : key === "velvet-horizon" ? "vh-person" : "min-w-0"}>
                      {usesPhotos && <div data-invitation-photo-slot={slot} className={key === "serein" ? "sr-person-photo" : key === "eternal-blossom" ? "eb-person-photo" : key === "velvet-horizon" ? "vh-person-photo" : `relative mx-auto overflow-hidden ${frame}`}>
                        {url ? <img src={url} alt={`Foto ${name || "mempelai"}`} loading="lazy" className="aspect-[3/4] w-full object-cover" style={photoCropStyle(media.assignment, slot)} /> : <div className="flex aspect-[3/4] items-center justify-center bg-black/5"><Heart className="h-8 w-8 opacity-40"/></div>}
                        {changePhoto(slot, name || "mempelai")}
                        {cropOverlay(slot)}
                      </div>}
                      {!usesPhotos && (key === "zen-atelier"
                        ? <span aria-hidden data-studio-native-object={`object:identity:${slot}-symbol`} className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border-b border-[var(--inv-accent)] text-xl text-[var(--inv-accent)]">{slot === "personOne" ? "花" : "和"}</span>
                        : <div aria-hidden data-studio-native-object={`object:identity:${slot}-symbol`} className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-current/40 text-xl">{slot === "personOne" ? "✧" : "◇"}</div>)}
                      <div className={key === "serein" ? "sr-person-copy" : key === "eternal-blossom" ? "eb-person-copy" : key === "velvet-horizon" ? "vh-person-copy" : undefined}><p data-studio-native-object={`object:identity:${slot}-name`} className={key === "serein" ? "sr-person-name" : key === "eternal-blossom" ? "eb-person-name" : key === "velvet-horizon" ? "vh-person-name" : "mt-4 break-words text-base"} style={{ fontFamily: invitationFontFamily(font.heading) }}>{name || "Nama belum diisi"}</p>
                      {(slot === "personOne" ? groomParents : brideParents) && <p data-studio-native-object={`object:identity:${slot}-parents`} className={key === "serein" ? "sr-person-parents" : key === "eternal-blossom" ? "eb-person-parents" : key === "velvet-horizon" ? "vh-person-parents" : "mx-auto mt-2 max-w-[18rem] text-xs leading-5 opacity-75"}>{slot === "personOne" ? groomParents : brideParents}</p>}</div>
                    </div>
                  ))}
                </>
              ) : (
                <p data-studio-native-object="object:identity:event-name" className="break-words text-lg" style={{ fontFamily: invitationFontFamily(font.heading) }}>{names || eventTitle}</p>
              )}
            </div>
          ), 2, () => couple ? <OurStorySection story={editableCopy.ourStory} theme={key} preview={preview} motionUnit={copyMotions.ourStory?.unit} /> : null)}

          {section("event", key === "pencil-reverie" ? (
            <div data-studio-native-object="object:event:details-group" className="pr-event-story">
              <p data-studio-native-object="object:event:kicker" className="mb-2 text-[10px] uppercase tracking-[.22em] text-[var(--inv-accent)]">{tr(couple ? "Hari kita berdua" : "Hari istimewa")}</p>
              <h3 data-studio-native-object="object:event:event-title">{eventTitle}</h3>
              {invitation.venue && <p data-studio-native-object="object:event:venue" className="mt-3">{invitation.venue}</p>}
              {invitation.address && <p data-studio-native-object="object:event:address" className="mt-1 opacity-75">{invitation.address}</p>}
              {invitation.dressCode && <p data-studio-native-object="object:event:dress-code" className="mt-3 text-xs">Dress code · {invitation.dressCode}</p>}
            </div>
          ) : key === "modern-maroon" ? (
            <div data-studio-native-object="object:event:details-group" className="mm-event-story">
              <span aria-hidden="true" data-studio-native-object="object:event:monogram" className="mm-event-index">{couple ? "&" : "•"}</span>
              <div className="mm-event-copy">
                <h3 data-studio-native-object="object:event:event-title" className="mm-event-title">{eventTitle}</h3>
                {invitation.venue && <p data-studio-native-object="object:event:venue" className="mm-event-meta">{invitation.venue}</p>}
                {invitation.address && <p data-studio-native-object="object:event:address" className="mm-event-meta">{invitation.address}</p>}
                {invitation.dressCode && <p data-studio-native-object="object:event:dress-code" className="mm-event-meta">Dress code · {invitation.dressCode}</p>}
              </div>
            </div>
          ) : (
            <div data-studio-native-object="object:event:details-group" className="mx-auto max-w-md space-y-3 text-sm leading-7">
              {key === "zen-atelier" ? <div className="grid grid-cols-[24px_1fr] gap-4 border-y border-[var(--inv-soft)] py-6 text-left">
                <CalendarDays size={22} strokeWidth={1.3} data-studio-native-object="object:event:calendar-icon" className="mt-1 text-[var(--inv-accent)]" aria-hidden="true" />
                <div><h3 data-studio-native-object="object:event:event-title" className="text-xl">{eventTitle}</h3>{invitation.venue && <p data-studio-native-object="object:event:venue" className="mt-3">{invitation.venue}</p>}</div>
              </div> : <><p data-studio-native-object="object:event:event-title" className="text-lg" style={{ fontFamily: invitationFontFamily(font.heading) }}>{eventTitle}</p>
              {invitation.venue && <p data-studio-native-object="object:event:venue" className="opacity-80">{invitation.venue}</p>}</>}
              {invitation.dressCode && <p data-studio-native-object="object:event:dress-code" className="text-xs opacity-70">Dress code · {invitation.dressCode}</p>}
            </div>
          ), 3)}

          {section("dateTime", key === "modern-maroon" ? (
            <div data-studio-native-object="object:dateTime:panel" className="mm-date-poster">
              <p data-studio-native-object="object:dateTime:date" className="mm-date-main">{date}</p>
              <div className="mm-date-times">
                <div>{invitation.ceremonyTime ? <p data-studio-native-object="object:dateTime:start">{tr("Mulai")}<br />{invitation.ceremonyTime}</p> : <p>{tr("Waktu belum ditentukan")}</p>}</div>
                <div>{invitation.receptionTime ? <p data-studio-native-object="object:dateTime:end">{tr("Selesai")}<br />{invitation.receptionTime === "END" ? tr("Selesai acara") : invitation.receptionTime}</p> : <p data-studio-native-object="object:dateTime:timezone">{invitation.timezone || "Asia/Jakarta"}</p>}</div>
              </div>
              {invitation.receptionTime && <p data-studio-native-object="object:dateTime:timezone" className="mt-6 text-[10px] uppercase tracking-[.22em] opacity-60">{invitation.timezone || "Asia/Jakarta"}</p>}
            </div>
          ) : (
            <div data-studio-native-object="object:dateTime:panel" className={key === "pencil-reverie" ? "pr-date-scrap" : `mx-auto max-w-sm border border-[var(--inv-soft)] bg-[var(--inv-bg)] px-5 py-7 ${panel}`}>
              {key !== "confetti-club" && key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <CalendarDays data-studio-native-object="object:dateTime:calendar-icon" className="mx-auto h-6 w-6 text-[var(--inv-accent)]" aria-hidden />}
              <p data-studio-native-object="object:dateTime:date" className="mt-4 text-lg" style={{ fontFamily: invitationFontFamily(font.heading) }}>{date}</p>
              {invitation.ceremonyTime && <p data-studio-native-object="object:dateTime:start" className="mt-3 text-sm">{tr("Mulai")} · {invitation.ceremonyTime}</p>}
              {invitation.receptionTime && <p data-studio-native-object="object:dateTime:end" className="mt-1 text-sm">{tr("Selesai")} · {invitation.receptionTime === "END" ? tr("Selesai acara") : invitation.receptionTime}</p>}
              <p data-studio-native-object="object:dateTime:timezone" className="mt-3 text-xs opacity-65">{invitation.timezone || "Asia/Jakarta"}</p>
            </div>
          ), 4)}

          {section("gallery", usesPhotos && gallerySettings.presentation !== "template" ? <ConfigurablePhotoGallery photos={media.gallery} settings={gallerySettings} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "confetti-club" ? <div data-studio-native-object="object:gallery:collage-group" className="cc-photo-wall"><ConfigurablePhotoGallery photos={media.gallery} settings={{ ...gallerySettings, presentation: "masonry" }} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /></div> : key === "celestial-ink" ? <CelestialInkGallery /> : key === "paper-cut-botanical" ? <PaperCutBotanicalGallery /> : key === "golden-art-deco" ? <GoldenArtDecoGallery /> : key === "classic-pearl" ? <ClassicPearlGallery /> : key === "velvet-horizon" ? <VelvetHorizonGallery photos={media.gallery} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "midnight-romance" ? <MidnightRomanceGallery photos={media.gallery} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "garden-light" ? <GardenLightGallery photos={media.gallery} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "botanical-ivory" ? <BotanicalIvoryGallery /> : key === "eternal-blossom" ? <SereinGallery appearance="blossom" photos={media.gallery} preview={preview} allowPhotoOpen={allowEnvelopeOpen} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "serein" ? <SereinGallery photos={media.gallery} preview={preview} onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined} /> : key === "pencil-reverie" ? <PencilMemoryGallery preview={preview} /> : key === "zen-atelier" ? <>
            {preview && onEditPhoto && <button type="button" className="zen-action mb-5" onClick={() => onEditPhoto("gallery")}>Atur Foto Galeri</button>}
            <ZenAtelierGallery photos={media.gallery} customMotion={Boolean(media.assignment.motion?.gallery?.animation)} preview={preview} />
          </> : key === "modern-maroon" ? (
            usesPhotos ? <>
              {preview && onEditPhoto && <button type="button" onClick={() => onEditPhoto("gallery")} className="mm-action mb-7 min-h-10 border border-[var(--inv-soft)] px-5 text-xs text-[var(--inv-accent)]">Atur foto galeri</button>}
              <span aria-hidden="true" data-studio-native-object="object:gallery:flourish" className="mm-flourish mb-6 text-[var(--inv-accent)]" />
              {media.gallery.length ? (
                <div data-studio-native-object="object:gallery:grid" className="mm-gallery-grid">
                  {media.gallery.map((asset, index) => (
                    <div key={asset.id} data-invitation-photo-slot="gallery" data-studio-photo-id={asset.id} className="mm-gallery-item">
                      <img src={asset.url} alt={`Galeri foto ${index + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : <p data-studio-native-object="object:gallery:empty-copy" className="text-sm opacity-65">{tr("Belum ada foto galeri.")}</p>}
            </> : <p data-studio-native-object="object:gallery:empty-copy" className="text-sm opacity-65">{tr("Belum ada foto galeri.")}</p>
          ) : (
            usesPhotos ? <>
              {preview && onEditPhoto && <button type="button" onClick={() => onEditPhoto("gallery")} className="mb-5 min-h-10 rounded-[var(--undara-control-radius)] border border-[var(--inv-soft)] px-5 text-xs text-[var(--inv-accent)]">Atur foto galeri</button>}
              {media.gallery.length ? (
                <div data-studio-native-object="object:gallery:grid" className={`grid gap-3 ${key === "modern-maroon" ? "grid-cols-3" : key === "midnight-romance" ? "grid-cols-2 rounded-t-[120px] overflow-hidden" : key === "zen-atelier" ? "grid-cols-2 auto-rows-[125px] sm:auto-rows-[155px]" : "grid-cols-2"}`}>
                  {media.gallery.map((asset, index) => (
                    <div key={asset.id} data-invitation-photo-slot="gallery" data-studio-photo-id={asset.id} className={`relative overflow-hidden ${key === "modern-maroon" ? "rounded-none" : key === "midnight-romance" ? "rounded-t-full rounded-b-lg" : key === "zen-atelier" ? "rounded-none border border-[var(--inv-soft)] bg-[var(--inv-surface)] p-1" : "rounded-[35%_35%_12px_12px]"} ${index === 0 && key === "zen-atelier" && media.gallery.length > 1 ? "row-span-2" : index === 0 && key !== "modern-maroon" ? "col-span-2" : ""}`}>
                      <img src={asset.url} alt={`Galeri foto ${index + 1}`} loading="lazy" className={key === "zen-atelier" ? "h-full w-full object-cover" : index === 0 ? "aspect-[4/3] w-full object-cover" : "aspect-[3/4] w-full object-cover"} />
                    </div>
                  ))}
                </div>
              ) : key === "zen-atelier" ? (
                <div className="mx-auto max-w-sm">
                  <ZenMemoryArtwork />
                  <p data-studio-native-object="object:gallery:empty-copy" className="mt-5 text-sm opacity-65">{tr("Foto galeri belum ditambahkan.")}</p>
                </div>
              ) : <p data-studio-native-object="object:gallery:empty-copy" className="text-sm opacity-65">{tr("Belum ada foto galeri.")}</p>}
            </> : key === "zen-atelier" ? (
              <div className="mx-auto max-w-sm">
                <ZenMemoryArtwork />
                <p data-studio-native-object="object:gallery:memory-copy" className="mx-auto mt-6 max-w-xs text-sm leading-7 opacity-75">{tr("Setiap pertemuan menyimpan cerita yang layak dikenang.")}</p>
              </div>
            ) : (
              <div data-studio-native-object="object:gallery:memory-panel" className="relative mx-auto flex min-h-48 max-w-xs flex-col items-center justify-center border border-current/25 px-6 py-10">
                <div aria-hidden data-studio-native-object="object:gallery:memory-symbols" className="mb-5 flex items-center gap-4 text-3xl opacity-60">{key === "celestial-ink" ? "✧ ✦ ☾" : key === "golden-art-deco" ? "◇ ◆ ◇" : key === "paper-cut-botanical" ? "❧ ❦ ❧" : "✦ ❖ ✦"}</div>
                <p data-studio-native-object="object:gallery:memory-copy" className="text-sm leading-7 opacity-75">{tr("Kenangan indah hadir dalam setiap momen yang kita rayakan bersama.")}</p>
              </div>
            )
          ), 5)}

          {section("countdown", countdown ? (
            key === "modern-maroon" ? (
              <div data-studio-native-object="object:countdown:group">
                <div data-studio-native-object="object:countdown:grid" className="mm-countdown-grid">
                  {countdown.map(([label, value]) => (
                    <div key={label} data-studio-native-object={`object:countdown:${label.toLowerCase()}`} className="mm-countdown-cell">
                      <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-value`} className="mm-countdown-value">{String(value).padStart(2, "0")}</p>
                      <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-label`} className="mm-countdown-label">{tr(label)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div data-studio-native-object="object:countdown:group" className={key === "pencil-reverie" ? "pr-countdown-canvas" : ""}>
                {key === "pencil-reverie" && <PencilBackwardClock />}
                <div data-studio-native-object="object:countdown:grid" className="grid grid-cols-4 gap-2">
                  {countdown.map(([label, value]) => (
                    <div key={label} data-studio-native-object={`object:countdown:${label.toLowerCase()}`} className={`border border-[var(--inv-soft)] bg-[var(--inv-bg)] px-1 py-3 ${panel}`}>
                      <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-value`} className="text-xl text-[var(--inv-accent)]" style={{ fontFamily: invitationFontFamily(font.heading) }}>{String(value).padStart(2, "0")}</p>
                      <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-label`} className="mt-1 text-[10px] opacity-65">{tr(label)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <p data-studio-native-object="object:countdown:empty-copy" className="text-sm opacity-65">{tr("Tanggal acara belum tersedia.")}</p>
          ), 6)}

          {section("location", key === "modern-maroon" ? (
            <div data-studio-native-object="object:location:details-group" className="mm-location-card">
              <MapPin aria-hidden data-studio-native-object="object:location:map-icon" className="mm-location-icon" />
              <p data-studio-native-object="object:location:venue" className="mm-location-venue">{invitation.venue || tr("Lokasi belum ditentukan")}</p>
              {invitation.address && <p data-studio-native-object="object:location:address" className="mt-5 text-sm leading-7 opacity-70">{invitation.address}</p>}
              {maps && <a data-studio-section-element="location:button" style={sectionElementStyleCss(sectionElementStyles, "location", "button")} href={maps} target="_blank" rel="noopener noreferrer" onClick={preview ? (event) => event.preventDefault() : undefined} className="mm-action mt-7 inline-flex min-h-11 items-center justify-center bg-[var(--inv-accent)] px-6 text-sm text-white">{tr("Lihat Lokasi")}</a>}
              {!maps && <p data-studio-native-object="object:location:empty-copy" className="mt-5 text-xs opacity-55">{tr("Tautan lokasi belum tersedia.")}</p>}
            </div>
          ) : (
            <div data-studio-native-object="object:location:details-group" className="mx-auto max-w-sm space-y-4">
              {key !== "confetti-club" && key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <MapPin aria-hidden data-studio-native-object="object:location:map-icon" className="mx-auto h-6 w-6 text-[var(--inv-accent)]" />}
              <p data-studio-native-object="object:location:venue" className="text-lg" style={{ fontFamily: invitationFontFamily(font.heading) }}>{invitation.venue || tr("Lokasi belum ditentukan")}</p>
              {invitation.address && <p data-studio-native-object="object:location:address" className="text-sm leading-7 opacity-75">{invitation.address}</p>}
              {maps && <a data-studio-section-element="location:button" style={sectionElementStyleCss(sectionElementStyles, "location", "button")} href={maps} target="_blank" rel="noopener noreferrer" onClick={preview ? (event) => event.preventDefault() : undefined} className={key === "golden-art-deco" ? "gd-action" : key === "celestial-ink" ? "ci-action" : key === "velvet-horizon" ? "vh-action" : key === "paper-cut-botanical" ? "pcb-action" : key === "classic-pearl" ? "cp-action" : key === "midnight-romance" ? "mr-action" : key === "garden-light" ? "gl-action" : key === "botanical-ivory" ? "bi-action" : key === "eternal-blossom" ? "eb-action" : key === "zen-atelier" ? "zen-action" : "inline-flex min-h-11 items-center justify-center rounded-[var(--undara-control-radius)] bg-[var(--inv-accent)] px-6 text-sm text-white"}>{tr("Lihat Lokasi")}</a>}
              {!maps && <p data-studio-native-object="object:location:empty-copy" className="text-xs opacity-55">{tr("Tautan lokasi belum tersedia.")}</p>}
            </div>
          ), 7)}

          {sections.rsvp && section("rsvp", (
            <div data-studio-native-object="object:rsvp:form-group">
              {key === "pencil-reverie" || key === "zen-atelier" || key === "serein" || key === "botanical-ivory" || key === "eternal-blossom" || key === "modern-maroon" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" || key === "velvet-horizon" || key === "paper-cut-botanical" ? <>
                <p data-studio-native-object="object:rsvp:intro" className="mx-auto mb-7 max-w-sm text-sm leading-7">{tr("Merupakan kebahagiaan bagi kami apabila Anda berkenan hadir.")}</p>
                <RsvpForm slug={invitation.slug} appearance="zen" preview={preview} eventCategory={invitation.eventCategory} rsvpConfig={rsvpConfig} guestId={personalGuest?.id} guestName={personalGuest?.name} guestToken={personalGuest?.token} invitedPax={personalGuest?.invitedPax} eventDate={invitation.eventDate} venue={invitation.venue} title={eventTitle} start={invitation.ceremonyTime} description={invitation.description} />
              </> : <RsvpForm slug={invitation.slug} preview={preview} eventCategory={invitation.eventCategory} rsvpConfig={rsvpConfig} guestId={personalGuest?.id} guestName={personalGuest?.name} guestToken={personalGuest?.token} invitedPax={personalGuest?.invitedPax} eventDate={invitation.eventDate} venue={invitation.venue} title={eventTitle} start={invitation.ceremonyTime} description={invitation.description} />}
            </div>
          ), 8)}

          {sections.wishes && section("wishes", (
            <div data-studio-native-object="object:wishes:form-group">
              <GuestWishes slug={invitation.slug} preview={preview} initialName={personalGuest?.name} appearance={key === "pencil-reverie" || key === "zen-atelier" || key === "serein" || key === "botanical-ivory" || key === "eternal-blossom" || key === "modern-maroon" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" || key === "velvet-horizon" || key === "paper-cut-botanical" ? "zen" : "default"} inputStyle={sectionElementStyleCss(sectionElementStyles, "wishes", "input")} buttonStyle={sectionElementStyleCss(sectionElementStyles, "wishes", "button")} />
            </div>
          ), 9)}

          {sections.gift && section("gift", hasGift ? (key === "modern-maroon" ? (
            <div data-studio-native-object="object:gift:panel" className="mm-gift-ticket">
              <Gift data-studio-native-object="object:gift:gift-icon" className="mb-7 h-6 w-6 text-[var(--mm-champagne)]" aria-hidden />
              <p data-studio-native-object="object:gift:bank-name" className="text-[10px] uppercase tracking-[.24em] opacity-65">{invitation.giftBankName}</p>
              {invitation.giftAccountName && <p data-studio-native-object="object:gift:account-name" className="mt-4 text-sm font-semibold">{invitation.giftAccountName}</p>}
              <p data-studio-native-object="object:gift:account-number" className="mt-2 break-all text-2xl" style={{ fontFamily: invitationFontFamily(font.heading) }}>{invitation.giftAccountNumber}</p>
              <button data-studio-section-element="gift:button" style={sectionElementStyleCss(sectionElementStyles, "gift", "button")} type="button" onClick={async () => { if (preview || !invitation.giftAccountNumber) return; try { await navigator.clipboard.writeText(invitation.giftAccountNumber); setCopyMessage("Nomor rekening disalin."); } catch { setCopyMessage("Belum dapat menyalin. Silakan salin nomor secara manual."); } }} className="mm-action mt-7 min-h-10 border border-white/35 px-5 text-xs text-white">{tr("Salin Nomor Rekening")}</button>
              {copyMessage && <p role="status" className="mt-3 text-xs">{tr(copyMessage)}</p>}
            </div>
          ) : (
            <div data-studio-native-object="object:gift:panel" className={`mx-auto max-w-sm border border-[var(--inv-soft)] bg-[var(--inv-bg)] px-6 py-7 text-sm ${key === "pencil-reverie" ? "pr-gift-panel" : panel}`}>
              {key !== "confetti-club" && key !== "celestial-ink" && key !== "velvet-horizon" && key !== "botanical-ivory" && key !== "midnight-romance" && key !== "classic-pearl" && key !== "golden-art-deco" && key !== "paper-cut-botanical" && <Gift data-studio-native-object="object:gift:gift-icon" className="mx-auto h-6 w-6 text-[var(--inv-accent)]" aria-hidden />}
              <p data-studio-native-object="object:gift:bank-name" className="mt-4 text-xs opacity-70">{invitation.giftBankName}</p>
              {invitation.giftAccountName && <p data-studio-native-object="object:gift:account-name" className="mt-2 font-semibold">{invitation.giftAccountName}</p>}
              <p data-studio-native-object="object:gift:account-number" className="mt-2 break-all text-lg" style={{ fontFamily: invitationFontFamily(font.heading) }}>{invitation.giftAccountNumber}</p>
              <button data-studio-section-element="gift:button" style={sectionElementStyleCss(sectionElementStyles, "gift", "button")} type="button" onClick={async () => { if (preview || !invitation.giftAccountNumber) return; try { await navigator.clipboard.writeText(invitation.giftAccountNumber); setCopyMessage("Nomor rekening disalin."); } catch { setCopyMessage("Belum dapat menyalin. Silakan salin nomor secara manual."); } }} className={key === "golden-art-deco" ? "gd-action mt-5" : key === "celestial-ink" ? "ci-action mt-5" : key === "velvet-horizon" ? "vh-action mt-5" : key === "paper-cut-botanical" ? "pcb-action mt-5" : key === "classic-pearl" ? "cp-action mt-5" : key === "midnight-romance" ? "mr-action mt-5" : key === "garden-light" ? "gl-action mt-5" : key === "botanical-ivory" ? "bi-action mt-5" : key === "eternal-blossom" ? "eb-action mt-5" : "mt-5 min-h-10 rounded-[var(--undara-control-radius)] border border-[var(--inv-soft)] px-5 text-xs text-[var(--inv-accent)]"}>{tr("Salin Nomor Rekening")}</button>
              {copyMessage && <p role="status" className="mt-3 text-xs">{tr(copyMessage)}</p>}
            </div>
          )) : <p data-studio-native-object="object:gift:empty-copy" className="text-sm opacity-65">{tr("Informasi tanda kasih belum ditambahkan.")}</p>, 10)}

          {section("closing", (
            <div data-studio-native-object="object:closing:copy-group" className={key === "zen-atelier" ? "zen-closing-copy text-sm leading-8" : key === "pencil-reverie" ? "pr-closing-copy text-sm leading-8" : key === "modern-maroon" ? "mm-closing-copy text-sm leading-8" : "mx-auto max-w-sm text-sm leading-8"}>
              {key === "modern-maroon" ? <><p data-studio-copy-field="closing" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.closing ?? ""} unit={copyMotions.closing?.unit} /></p><span aria-hidden="true" data-studio-native-object="object:closing:flourish" className="mm-flourish ml-auto mt-6 text-[var(--inv-accent)]" /></> : key === "confetti-club" || key === "pencil-reverie" || key === "zen-atelier" || key === "serein" || key === "botanical-ivory" || key === "eternal-blossom" || key === "garden-light" || key === "midnight-romance" || key === "classic-pearl" || key === "golden-art-deco" || key === "celestial-ink" || key === "velvet-horizon" || key === "paper-cut-botanical" ? <p data-studio-copy-field="closing" className={`mx-auto max-w-xs whitespace-pre-line text-[15px] leading-8 ${key === "zen-atelier" ? "zen-closing-message" : ""}`}><InvitationLayerTextContent text={editableCopy.closing ?? ""} unit={copyMotions.closing?.unit} /></p> : <><Heart aria-hidden data-studio-native-object="object:closing:heart" className="mx-auto mb-4 h-7 w-7 text-[var(--inv-accent)]" strokeWidth={1.3} /><p data-studio-copy-field="closing" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.closing ?? ""} unit={copyMotions.closing?.unit} /></p></>}
              <p data-studio-native-object="object:closing:names" className={`mt-7 break-words text-lg ${key === "zen-atelier" ? "zen-closing-names" : ""}`} style={{ fontFamily: invitationFontFamily(font.heading) }}>{names || eventTitle}</p>
              <p data-studio-copy-field="prayerWish" className={`whitespace-pre-line ${key === "pencil-reverie" ? "pr-prayer-copy" : key === "zen-atelier" ? "zen-closing-prayer mt-5" : "mt-5 opacity-80"}`}><InvitationLayerTextContent text={editableCopy.prayerWish ?? ""} unit={copyMotions.prayerWish?.unit} /></p>
              {key === "zen-atelier" && couple && <p data-studio-copy-field="zenQuote" className="zen-closing-quote zen-quote whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.zenQuote ?? ""} unit={copyMotions.zenQuote?.unit} /></p>}
            </div>
          ), 11)}

          {renderSectionInstances("footer", (instanceId, sectionStyle) => (
            <footer data-invitation-section="footer" style={invitationSectionStyleCss(sectionStyle)} className={key === "golden-art-deco" ? "gd-footer" : key === "celestial-ink" ? "ci-footer" : key === "velvet-horizon" ? "vh-footer" : key === "paper-cut-botanical" ? "pcb-footer" : key === "pencil-reverie" ? "pr-footer" : key === "classic-pearl" ? "cp-footer" : key === "midnight-romance" ? "mr-footer" : key === "garden-light" ? "gl-footer" : key === "botanical-ivory" ? "relative bi-footer" : key === "eternal-blossom" ? "relative eb-footer" : key === "modern-maroon" ? "relative mm-footer flex items-center" : "relative flex items-center justify-center border-t border-[var(--inv-soft)] bg-[var(--inv-surface)] px-6 py-5"}>
              {key === "golden-art-deco" ? <><span aria-hidden="true" data-studio-native-object="object:footer:diamond" className="gd-footer-mark" /><span data-studio-native-object="object:footer:signature" className="gd-footer-signature">Undara</span></> : key === "celestial-ink" ? <><span aria-hidden="true" data-studio-native-object="object:footer:moon" className="ci-footer-mark">☾</span><span data-studio-native-object="object:footer:signature" className="ci-footer-signature">Undara</span></> : key === "velvet-horizon" ? <span data-studio-native-object="object:footer:signature" className="vh-footer-signature">Undara</span> : key === "paper-cut-botanical" ? <><span aria-hidden="true" data-studio-native-object="object:footer:paper-mark" className="pcb-footer-mark" /><span data-studio-native-object="object:footer:signature" className="pcb-footer-signature">Undara</span></> : key === "pencil-reverie" ? <><span aria-hidden="true" data-studio-native-object="object:footer:pencil-mark" className="pr-footer-mark" /><span data-studio-native-object="object:footer:signature" className="pr-footer-signature">Undara</span></> : key === "classic-pearl" ? <><span aria-hidden="true" data-studio-native-object="object:footer:pearl" className="cp-footer-mark" /><span data-studio-native-object="object:footer:signature" className="cp-footer-signature">Undara</span></> : key === "midnight-romance" ? <><span aria-hidden="true" data-studio-native-object="object:footer:star" className="mr-footer-mark">✦</span><span data-studio-native-object="object:footer:signature" className="mr-footer-signature">Undara</span></> : key === "garden-light" ? <><span aria-hidden="true" data-studio-native-object="object:footer:star" className="gl-footer-mark">✦</span><span data-studio-native-object="object:footer:signature" className="gl-footer-signature">Undara</span></> : key === "botanical-ivory" ? <><span aria-hidden="true" data-studio-native-object="object:footer:monogram" className="bi-footer-mark">&amp;</span><span data-studio-native-object="object:footer:signature" className="bi-footer-signature">Undara</span></> : key === "eternal-blossom" ? <span data-studio-native-object="object:footer:flower-art" aria-hidden="true"><BlossomSymbol /></span> : <span aria-hidden="true" data-studio-native-object="object:footer:rule" className="h-px w-10 bg-[var(--inv-accent)] opacity-50" />}
              {objectOverlay("footer", instanceId)}
            </footer>
          ))}
        </div>
      )}
    </main>
  );
}
