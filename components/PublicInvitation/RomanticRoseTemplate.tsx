"use client";

import WeddingSessionSchedule from "./WeddingSessionSchedule";
import { weddingSessionsFor, weddingRsvpConfig } from "@/lib/events/wedding-sessions";

import { displayTitleCase } from "@/lib/text/display-title-case";
import { getInvitationCountdown } from "@/lib/invitations/countdown";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Gift, Heart, MapPin } from "lucide-react";
import RsvpForm from "@/components/InvitationStudio/RsvpForm";
import GuestWishes from "@/components/PublicInvitation/GuestWishes";
import type { PersonalRsvpGuest } from "@/components/InvitationStudio/rsvp-types";
import InvitationMusic, { type InvitationMusicHandle } from "@/components/PublicInvitation/InvitationMusic";
import OurStorySection from "@/components/PublicInvitation/OurStorySection";
import InvitationAssetLayers from "@/components/PublicInvitation/InvitationAssetLayers";
import { parseAssetLayers, type InvitationAssetLayer, type StudioObjectSection } from "@/lib/templates/asset-layers";
import { resolveInvitationMusic } from "@/lib/templates/music";
import { parseDesignKey } from "@/lib/templates/design";
import { invitationText, localizedEditableCopy } from "@/lib/invitations/language";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { parseEditableCopyMotions } from "@/lib/templates/editable-copy-motion";
import { localizedWeddingParentLine } from "@/lib/invitations/language";
import { formatPersonalEnvelopeAddress } from "@/lib/guests/personal-envelope";
import { photoCropStyle, resolveGallerySettings, resolveInvitationPhotos, resolvePhotoCrop, type CroppablePhotoSlot, type PhotoAssignments, type PhotoCrop, type PhotoSlot } from "@/lib/templates/photo-slots";
import { parseInvitationSections, type InvitationSectionKey, type InvitationSections } from "@/lib/templates/sections";
import { invitationSectionInstanceStyle, invitationSectionStyleCss, parseInvitationSectionStyles, type InvitationSectionStyle } from "@/lib/templates/section-styles";
import { parseInvitationRsvpConfig, rsvpElementStyleCss } from "@/lib/templates/rsvp-config";
import { parseSectionElementStyles, sectionElementStyleCss } from "@/lib/templates/section-element-styles";
import { nativeVisualColorFilters, nativeVisualFontFamilies, nativeVisualScopeClass, nativeVisualStyleSheet } from "@/lib/templates/native-visual-transforms";
import InvitationColorFilters from "@/components/PublicInvitation/InvitationColorFilters";
import { invitationComponentColorCss } from "@/lib/templates/component-colors";
import { instancesForSection, parseInvitationSectionLayout } from "@/lib/templates/section-layout";
import EditableSectionInstance, { type SectionInstanceEditorActions } from "@/components/PublicInvitation/EditableSectionInstance";
import { useInvitationNativeLayerOrder } from "@/components/PublicInvitation/use-native-layer-order";
import { useInvitationSectionAnimations } from "@/components/PublicInvitation/use-section-animations";
import { usePremiumSectionTimelines } from "@/components/PublicInvitation/use-premium-section-timelines";
import { useInvitationPhotoAnimations } from "@/components/PublicInvitation/use-photo-animations";
import { useInvitationCopyAnimations } from "@/components/PublicInvitation/use-copy-animations";
import { useInvitationNativeVisualAnimations } from "@/components/PublicInvitation/use-native-visual-animations";
import InvitationLayerTextContent from "@/components/PublicInvitation/InvitationLayerTextContent";
import InvitationFonts from "@/components/PublicInvitation/InvitationFonts";
import StudioPhotoCropOverlay from "@/components/InvitationStudio/StudioPhotoCropOverlay";
import ConfigurablePhotoGallery from "@/components/PublicInvitation/ConfigurablePhotoGallery";

export const romanticRoseManifest = {
  key: "romantic-rose",
  name: "Romantic Rose",
  categories: ["WEDDING"],
  sections: ["cover", "greeting", "identity", "event", "dateTime", "gallery", "countdown", "location", "rsvp", "wishes", "gift", "closing", "footer"],
  defaultOrder: ["cover", "greeting", "identity", "event", "dateTime", "gallery", "countdown", "location", "rsvp", "wishes", "gift", "closing", "footer"],
  optional: ["gallery", "rsvp", "wishes", "gift"],
  customization: { photos: true, cover: true, music: true, sections: ["rsvp", "wishes", "gift"], palette: false, fonts: false, order: false },
  animation: { envelope: true, respectReducedMotion: true },
  assets: { photos: "invitation.assets", fonts: ["Cinzel", "Fauna One"] },
  preview: { shortNames: true, longNames: true, withoutPhoto: true, manyPhotos: true, optionalSections: true },
} as const;

type RoseInvitation = {
  slug: string;
  title: string;
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
  weddingSessions?: unknown;
  ceremonyTime: string | null;
  receptionTime: string | null;
  description: string | null;
  templateKey: string;
  musicUrl?: string | null;
  weddingHashtag?: string | null;
  dressCode?: string | null;
  giftBankName?: string | null;
  giftAccountName?: string | null;
  giftAccountNumber?: string | null;
  assets: { id: string; type: "IMAGE" | "AUDIO"; url: string; title: string | null }[];
};

function readableDate(value: Date | string, timezone: string, language: "ID" | "EN") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return invitationText(language, "Tanggal belum ditentukan");
  return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: timezone }).format(date);
}

function RoseHeading({
  section,
  eyebrow,
  children,
  studioElement,
  style,
  align = "center",
  light = false,
}: {
  section: InvitationSectionKey;
  eyebrow: string;
  children: React.ReactNode;
  studioElement?: string;
  style?: React.CSSProperties;
  align?: "left" | "center" | "right";
  light?: boolean;
}) {
  const language = useInvitationLanguage();
  const alignment = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  return (
    <div data-studio-native-object={`object:${section}:heading-group`} className={`mb-8 flex flex-col ${alignment}`}>
      <span className="sr-only">{invitationText(language, eyebrow)}</span>
      <h2
        data-studio-native-heading=""
        data-studio-rsvp-element={studioElement}
        style={style}
        className={`max-w-[16ch] font-[family-name:var(--rr-display)] text-[clamp(1.9rem,7vw,3rem)] leading-[1.06] tracking-[-0.025em] ${light ? "text-[#fff8f3]" : "text-[#552d3a]"}`}
      >
        {children}
      </h2>
      <span
        data-studio-native-object={`object:${section}:divider`}
        className={`mt-5 block h-px w-20 ${light ? "bg-[#d7b598]/70" : "bg-[#a96b78]/55"}`}
      />
    </div>
  );
}

function RosePhoto({ url, alt, className, cropStyle }: { url?: string; alt: string; className: string; cropStyle?: React.CSSProperties }) {
  return url ? (
    <img src={url} alt={alt} className={className} style={cropStyle} loading="lazy" />
  ) : (
    <div role="img" aria-label={alt} className={className + " flex items-center justify-center bg-gradient-to-br from-[#f6dbe1] via-[#fdf7f4] to-[#deb4c1]"}>
      <Heart className="h-10 w-10 text-[#c58a9c]/70" strokeWidth={1} />
    </div>
  );
}

/**
 * One shared presentation template; invitation/event/asset data stays per invitation.
 * Preview uses the same section visibility as the public renderer.
 * Shared GuestWishes reads/writes only on a published invitation; previews never submit.
 */
export default function RomanticRoseTemplate({
  invitation,
  designKey,
  preview = false,
  editorPreview = preview,
  allowEnvelopeOpen = false,
  sections: sectionOverride,
  coverUrl,
  photoAssignments,
  activeCropSlot,
  onCropPhoto,
  onFinishCrop,
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
  personalGuest,
  previewRecipientLine,
}: {
  invitation: RoseInvitation;
  /** Studio override; the public renderer reads the saved design key. */
  designKey?: string;
  personalGuest?: PersonalRsvpGuest;
  preview?: boolean;
  editorPreview?: boolean;
  allowEnvelopeOpen?: boolean;
  previewRecipientLine?: string;
  sections?: InvitationSections;
  coverUrl?: string;
  photoAssignments?: PhotoAssignments;
  activeCropSlot?: CroppablePhotoSlot | null;
  onCropPhoto?: (slot: CroppablePhotoSlot, crop: PhotoCrop) => void;
  onFinishCrop?: () => void;
  onEditPhoto?: (slot: PhotoSlot) => void;
  /** Studio canvas only: synchronize the active stage after opening. */
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
}) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const [opened, setOpened] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const musicRef = useRef<InvitationMusicHandle>(null);
  const [now, setNow] = useState<number | null>(null);
  const sections = sectionOverride ?? parseInvitationSections(invitation.templateKey);
  const activeDesignKey = designKey || invitation.templateKey;
  const sectionStyles = useMemo(() => parseInvitationSectionStyles(activeDesignKey), [activeDesignKey]);
  useInvitationSectionAnimations(rootRef, sectionStyles);
  usePremiumSectionTimelines(rootRef, sectionStyles, String(opened));
  const sessions = weddingSessionsFor(invitation);
  const rsvpConfig = weddingRsvpConfig(invitation, parseInvitationRsvpConfig(activeDesignKey));
  const sectionElementStyles = parseSectionElementStyles(activeDesignKey);
  const sectionLayout = parseInvitationSectionLayout(activeDesignKey);
  useInvitationNativeLayerOrder(rootRef, activeDesignKey);
  const sectionEditorActions: SectionInstanceEditorActions | undefined = editorPreview ? {
    selectedId: selectedSectionInstanceId,
    onSelect: onSelectSectionInstance,
    onMove: onMoveSectionInstance,
    onToggle: onToggleSectionInstance,
    onDuplicate: onDuplicateSectionInstance,
    onDelete: onDeleteSectionInstance,
  } : undefined;
  const editableCopy = localizedEditableCopy(designKey || invitation.templateKey, "romantic-rose", invitation.description, language);
  const copyMotions = parseEditableCopyMotions(activeDesignKey);
  useInvitationCopyAnimations(rootRef, copyMotions, editableCopy, String(opened));
  useInvitationNativeVisualAnimations(rootRef, activeDesignKey, String(opened), { template: "romantic-rose", sectionStyles });
  const illustrationLayers = parseAssetLayers(designKey || invitation.templateKey);
  const configuredCover = coverUrl ?? parseDesignKey(invitation.templateKey).decor ?? undefined;
  const media = resolveInvitationPhotos(invitation.assets, invitation.templateKey, configuredCover, photoAssignments);
  useInvitationPhotoAnimations(rootRef, media.assignment, `${opened}-${media.gallery.length}`, { template: "romantic-rose", sectionStyles });
  const { cover, gallery, assignment } = media;
  const gallerySettings = resolveGallerySettings(assignment);
  const groomPhoto = media.personOne;
  const bridePhoto = media.personTwo;
  const editPhoto = (slot: PhotoSlot, label: string) =>
    preview && onEditPhoto && activeCropSlot !== slot ? (
      <button
        type="button"
        onClick={() => onEditPhoto(slot)}
        className="absolute inset-0 z-20 flex items-end justify-center bg-transparent pb-2 text-[11px] font-semibold text-transparent transition hover:bg-black/20 hover:text-white focus-visible:bg-black/25 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`Ganti foto ${label}`}
      >
        Ganti foto
      </button>
    ) : null;
  const cropOverlay = (slot: CroppablePhotoSlot) =>
    preview && activeCropSlot === slot && onCropPhoto && onFinishCrop ? (
      <StudioPhotoCropOverlay
        crop={resolvePhotoCrop(assignment, slot)}
        onChange={(crop) => onCropPhoto(slot, crop)}
        onDone={onFinishCrop}
      />
    ) : null;
  const displayName = [displayTitleCase(invitation.groomName), displayTitleCase(invitation.brideName)].filter(Boolean).join(" & ");
  const groomParents = localizedWeddingParentLine(language, invitation.groomFatherName, invitation.groomMotherName, invitation.groomChildOrder, "putra", invitation.groomChildPosition);
  const brideParents = localizedWeddingParentLine(language, invitation.brideFatherName, invitation.brideMotherName, invitation.brideChildOrder, "putri", invitation.brideChildPosition);
  const eventDate = readableDate(invitation.eventDate, invitation.timezone || "Asia/Jakarta", language);
  const countdown = getInvitationCountdown(invitation.eventDate, now ?? 0);
  const music = resolveInvitationMusic(invitation.templateKey, invitation.musicUrl, invitation.assets);
  const personalEnvelopeAddress = personalGuest ? formatPersonalEnvelopeAddress({ ...personalGuest, personalLanguage: language }) : preview ? previewRecipientLine ?? "" : "";
  const hasGift = Boolean(invitation.giftBankName && invitation.giftAccountNumber);
  const handleOpen = () => {
    if (preview && !allowEnvelopeOpen) return;
    musicRef.current?.playOnOpen();
    setOpened(true);
    onEnvelopeOpened?.();
  };

  useEffect(() => {
    if (!opened && sections.envelope !== false) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [opened, sections.envelope]);

  const objectOverlay = (target: StudioObjectSection, instanceId: string = target) => <InvitationAssetLayers layers={illustrationLayers} section={target} sectionInstanceId={instanceId}
    editable={preview && Boolean(onUpdateAssetLayer)} editorMode={editorMode} selectedId={selectedAssetLayerId} selectedIds={selectedAssetLayerIds} onSelect={onSelectAssetLayer} onUpdate={onUpdateAssetLayer} />;

  const renderSectionInstances = (key: InvitationSectionKey, render: (instanceId: string, style: InvitationSectionStyle | undefined) => React.ReactNode) => {
    const hidden = sections[key] === false;
    if (hidden && !editorPreview) return null;
    return instancesForSection(sectionLayout, key).map((instance) => (
      <EditableSectionInstance
        key={instance.id}
        instance={instance}
        order={instance.order}
        total={sectionLayout.length}
        preview={editorPreview}
        hidden={hidden}
        actions={sectionEditorActions}
      >
        {render(instance.id, invitationSectionInstanceStyle(sectionStyles[key], instance))}
      </EditableSectionInstance>
    ));
  };

  return (
    <main ref={rootRef} data-studio-preview-root={editorPreview ? "true" : undefined} className={`romantic-rose relative isolate ${nativeVisualScopeClass(activeDesignKey)} min-h-[760px] ${editorPreview ? "overflow-visible" : "overflow-hidden"} bg-[#f7efe9] text-[#4b2d35] [font-family:var(--rr-body)]`}>
      <style>{nativeVisualStyleSheet(activeDesignKey)}</style>
      <style>{invitationComponentColorCss(nativeVisualScopeClass(activeDesignKey), rsvpConfig, sectionElementStyles)}</style>
      <InvitationColorFilters filters={nativeVisualColorFilters(activeDesignKey)} />
      <style>{`
        .romantic-rose {
          --rr-display: "Cinzel", "Times New Roman", serif;
          --rr-body: "Fauna One", Georgia, serif;
          --rr-burgundy: #5a2e3a;
          --rr-wine: #744252;
          --rr-rose: #b97a86;
          --rr-blush: #ead3d0;
          --rr-ivory: #f7efe9;
          --rr-paper: #fffaf6;
          --rr-champagne: #c7a27f;
        }
        .romantic-rose ::selection { background: #b97a86; color: #fffaf6; }
        .romantic-rose a, .romantic-rose button { -webkit-tap-highlight-color: transparent; }
        @media (hover: hover) and (pointer: fine) {
          .romantic-rose .rr-pressable:hover { transform: translateY(-1px); }
        }
        .romantic-rose .rr-pressable:active { transform: scale(.98); }
        @media (prefers-reduced-motion: reduce) {
          .romantic-rose .rr-pressable { transition: none !important; transform: none !important; }
        }
      `}</style>
      <InvitationFonts families={nativeVisualFontFamilies(activeDesignKey)} />
      {sections.music !== false && <InvitationMusic ref={musicRef} source={music} opened={opened || sections.envelope === false} preview={preview} />}
      {!opened && sections.envelope !== false ? (
        <section data-invitation-section="envelope" style={invitationSectionStyleCss(sectionStyles.envelope)} className="relative flex min-h-[760px] flex-col items-center justify-center overflow-hidden bg-[#5a2e3a] px-6 py-16 text-center text-[#fff8f3]">
            {objectOverlay("envelope")}
          <div data-studio-native-object="object:envelope:ring-left" className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full border border-[#c7a27f]/25" />
          <div data-studio-native-object="object:envelope:ring-right" className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full border border-[#c7a27f]/20" />
          <p data-studio-native-object="object:envelope:kicker" className="mb-8 text-[10px] uppercase tracking-[0.34em] text-[#e8d4c2]">{tr("The wedding invitation")}</p>
          <div data-studio-native-object="object:envelope:card-stack" className="relative w-full max-w-[315px] drop-shadow-[0_28px_55px_rgba(34,12,18,0.32)]">
            <div data-studio-native-object="object:envelope:top-fold" className="absolute inset-x-0 top-0 h-1/2 origin-top [clip-path:polygon(0_0,100%_0,50%_100%)] bg-[#9e6570] shadow-xl" />
            <div data-studio-native-object="object:envelope:letter-card" className="relative mt-2 flex min-h-[355px] flex-col items-center justify-center border border-[#cfb69e] bg-[#fffaf6] p-7 shadow-[inset_0_0_0_1px_#ead9ca]">
              <p data-studio-native-object="object:envelope:letter-kicker" className="text-[10px] uppercase tracking-[0.24em] text-[#9a6b73]">{tr("Untuk yang terkasih")}</p>
              {personalEnvelopeAddress && (
                <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="mt-3 max-w-[250px] break-words text-xs font-semibold leading-5 text-[#713b50]">{personalEnvelopeAddress}</p>
              )}
              <span data-studio-native-object="object:envelope:heart" className="my-6 grid h-12 w-12 place-items-center rounded-full border border-[#c9a98d] font-[family-name:var(--rr-display)] text-lg text-[#744252]">R</span>
              <h1 data-studio-native-heading="" className="break-words font-[family-name:var(--font-undara-heading)] text-2xl leading-relaxed text-[#713b50]">{displayName || tr("Undangan Pernikahan")}</h1>
              <p data-studio-native-object="object:envelope:date" className="mt-5 text-xs text-[#966a7c]">{eventDate}</p>
            </div>
            <div data-studio-native-object="object:envelope:bottom-fold" className="relative -mt-9 h-24 bg-[#c98f99] [clip-path:polygon(0_0,50%_55%,100%_0,100%_100%,0_100%)]" aria-hidden />
            <span data-studio-native-object="object:envelope:seal" className="absolute bottom-6 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-[3px] border-[#e6c8b2] bg-[#6a3745] font-[family-name:var(--rr-display)] text-sm text-[#fff8f3] shadow-md">R</span>
          </div>
          <p data-studio-native-object="object:envelope:invitation-copy" className="mt-8 max-w-[28ch] text-xs leading-6 text-[#ecdcd1]">{language === "EN" ? tr("Dengan hangat kami mengundang Anda untuk merayakan hari istimewa kami.") : <>Dengan hangat kami mengundang Anda<br />untuk merayakan hari istimewa kami.</>}</p>
          <button type="button" onClick={handleOpen} data-studio-system-action={preview ? "open-invitation" : undefined} data-studio-native-object="object:envelope:open-button" className="rr-pressable mt-7 min-h-11 rounded-[var(--undara-control-radius)] border border-[#d7b598] bg-[#fff8f3] px-8 py-3 text-sm font-medium text-[#5a2e3a] shadow-[0_12px_30px_rgba(30,10,16,0.18)] transition-[transform,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7b598]">
            Buka Undangan
          </button>
        </section>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col">
          {renderSectionInstances("cover", (instanceId, sectionStyle) => (
            <section data-invitation-section="cover" style={invitationSectionStyleCss(sectionStyle)} className="relative min-h-[720px] overflow-hidden bg-[#4b2632] text-[#fff8f3]">
                        <div data-studio-native-object="object:cover:background-photo" data-invitation-photo-slot="cover" className="absolute inset-0">
                          <RosePhoto url={cover} alt="Foto sampul pasangan" cropStyle={photoCropStyle(assignment, "cover")} className="h-full w-full object-cover" />
                          {editPhoto("cover", "cover utama")}
                          {cropOverlay("cover")}
                        </div>
                        <div data-studio-native-object="object:cover:gradient-overlay" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,20,29,.18)_0%,rgba(48,20,29,.28)_42%,rgba(48,20,29,.92)_100%)]" />
                        <div data-studio-native-object="object:cover:paper-wash" className="absolute inset-x-5 top-5 h-[44%] border border-[#f0d9c4]/45" />
                        <div data-studio-native-object="object:cover:content-group" className="relative z-10 flex min-h-[720px] w-full flex-col justify-between px-7 pb-12 pt-10 text-left">
                          <div className="flex items-start justify-between gap-4">
                            <p data-studio-native-object="object:cover:kicker" className="max-w-[12ch] text-[10px] uppercase leading-5 tracking-[0.28em] text-[#f2ddcd]">{tr("The wedding of")}</p>
                            <p data-studio-native-object="object:cover:date" className="max-w-[16ch] text-right text-[11px] leading-5 tracking-[0.08em] text-[#f2ddcd]">{eventDate}</p>
                          </div>
                          <div className="max-w-[92%]">
                            <span data-studio-native-object="object:cover:accent-rule" className="mb-5 block h-px w-16 bg-[#d7b598]" />
                            <h1 data-studio-native-heading="" className="break-words font-[family-name:var(--rr-display)] text-[clamp(2.55rem,10vw,4.7rem)] leading-[.98] tracking-[-0.035em] text-[#fff8f3]">{displayName || displayTitleCase(invitation.title)}</h1>
                          </div>
                        </div>
                        {objectOverlay("cover", instanceId)}
                      </section>
          ))}

          {renderSectionInstances("greeting", (instanceId, sectionStyle) => (
            <section data-invitation-section="greeting" style={invitationSectionStyleCss(sectionStyle)} className="relative overflow-hidden bg-[#fffaf6] px-8 py-24 text-left">
                        {objectOverlay("greeting", instanceId)}
                        <RoseHeading section="greeting" eyebrow="A warm invitation" align="left">{tr("Dengan penuh sukacita")}</RoseHeading>
                        <div data-studio-native-object="object:greeting:copy-group" className="ml-auto max-w-[28rem] space-y-5 border-l border-[#c9a98d]/65 pl-6 text-sm leading-8 text-[#6a4a52]">
                          <p data-studio-copy-field="greeting" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.greeting ?? ""} unit={copyMotions.greeting?.unit} /></p>
                          <p data-studio-copy-field="attendanceRequest" className="whitespace-pre-line"><InvitationLayerTextContent text={editableCopy.attendanceRequest ?? ""} unit={copyMotions.attendanceRequest?.unit} /></p>
                        </div>
                      </section>
          ))}

          {renderSectionInstances("identity", (instanceId, sectionStyle) => (
            <>
            <section data-invitation-section="identity" style={invitationSectionStyleCss(sectionStyle)} className="relative overflow-hidden bg-[#ead3d0] px-7 py-24">
                        {objectOverlay("identity", instanceId)}
                        <RoseHeading section="identity" eyebrow="The two of us" align="left">{tr("Mempelai")}</RoseHeading>
                        <div data-studio-native-object="object:identity:couple-group" className="grid grid-cols-2 items-start gap-5">
                          <div data-studio-native-object="object:identity:personOne-group" className="min-w-0 pt-2 text-left">
                            <div data-invitation-photo-slot="personOne" className="relative overflow-hidden rounded-[999px_999px_18px_18px] border-[6px] border-[#fff8f3] shadow-[0_18px_40px_rgba(89,45,57,.15)]">
                              <RosePhoto url={groomPhoto} alt="Foto mempelai pertama" cropStyle={photoCropStyle(assignment, "personOne")} className="mx-auto aspect-[3/4] w-full object-cover shadow-lg" />
                              {editPhoto("personOne", "mempelai pertama")}
                              {cropOverlay("personOne")}
                            </div>
                            <h3 data-studio-native-object="object:identity:personOne-name" className="mt-5 break-words font-[family-name:var(--rr-display)] text-lg leading-tight text-[#5a2e3a]">{displayTitleCase(invitation.groomName) || tr("Mempelai pertama")}</h3>
                            {groomParents && <p data-studio-native-object="object:identity:personOne-parents" className="mt-3 max-w-[13rem] text-xs leading-5 text-[#75545b]">{groomParents}</p>}
                          </div>
                          <div data-studio-native-object="object:identity:personTwo-group" className="min-w-0 pt-14 text-right">
                            <div data-invitation-photo-slot="personTwo" className="relative overflow-hidden rounded-[18px_18px_999px_999px] border-[6px] border-[#fff8f3] shadow-[0_18px_40px_rgba(89,45,57,.15)]">
                              <RosePhoto url={bridePhoto} alt="Foto mempelai kedua" cropStyle={photoCropStyle(assignment, "personTwo")} className="mx-auto aspect-[3/4] w-full object-cover shadow-lg" />
                              {editPhoto("personTwo", "mempelai kedua")}
                              {cropOverlay("personTwo")}
                            </div>
                            <h3 data-studio-native-object="object:identity:personTwo-name" className="mt-5 break-words font-[family-name:var(--rr-display)] text-lg leading-tight text-[#5a2e3a]">{displayTitleCase(invitation.brideName) || tr("Mempelai kedua")}</h3>
                            {brideParents && <p data-studio-native-object="object:identity:personTwo-parents" className="ml-auto mt-3 max-w-[13rem] text-xs leading-5 text-[#75545b]">{brideParents}</p>}
                          </div>
                        </div>
                      </section>
            <OurStorySection story={editableCopy.ourStory} theme="romantic-rose" preview={preview} motionUnit={copyMotions.ourStory?.unit} />
            </>
          ))}

          {renderSectionInstances("event", (instanceId, sectionStyle) => (
            <section data-invitation-section="event" style={invitationSectionStyleCss(sectionStyle)} className="relative overflow-hidden bg-[#5a2e3a] px-8 py-24 text-left text-[#fff8f3]">
                        {objectOverlay("event", instanceId)}
                        <RoseHeading section="event" eyebrow="Save the date" align="left" light>{tr("Detail Acara")}</RoseHeading>
                        <div data-studio-native-object="object:event:details-group">
                          <p data-studio-native-object="object:event:event-title" className="max-w-[24rem] text-sm leading-7 text-[#e7d4c9]">{displayTitleCase(invitation.title) || tr("Perayaan Pernikahan")}</p>
                          <p data-studio-native-object="object:event:venue" className="mt-7 max-w-[18ch] font-[family-name:var(--rr-display)] text-[clamp(1.8rem,7vw,2.7rem)] leading-[1.08] text-[#fff8f3]">{invitation.venue || tr("Lokasi belum ditentukan")}</p>
                          {invitation.dressCode && <p data-studio-native-object="object:event:dress-code" className="mt-7 border-t border-[#d7b598]/35 pt-5 text-sm text-[#e7d4c9]">Dress code · {invitation.dressCode}</p>}
                        </div>
                      </section>
          ))}

          {renderSectionInstances("dateTime", (instanceId, sectionStyle) => (
            <section data-invitation-section="dateTime" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#f7efe9] px-8 py-24 text-left">
                        {objectOverlay("dateTime", instanceId)}
                        <RoseHeading section="dateTime" eyebrow="A day to remember" align="left">{tr("Tanggal & Waktu")}</RoseHeading>
                        {sessions.length ? <WeddingSessionSchedule sessions={sessions} timezone={invitation.timezone} date={eventDate} preview={preview} /> : <div data-studio-native-object="object:dateTime:panel" className="max-w-md border-y border-[#c9a98d]/55 py-9">
                          <CalendarDays data-studio-native-object="object:dateTime:calendar-icon" className="mb-6 h-5 w-5 text-[#8c5664]" />
                          <p data-studio-native-object="object:dateTime:date" className="font-[family-name:var(--rr-display)] text-2xl leading-tight text-[#5a2e3a]">{eventDate}</p>
                          {invitation.ceremonyTime && <p data-studio-native-object="object:dateTime:start" className="text-sm">{tr("Mulai")}: {invitation.ceremonyTime}</p>}
                          {invitation.receptionTime && <p data-studio-native-object="object:dateTime:end" className="text-sm">{tr("Selesai")}: {invitation.receptionTime === "END" ? "- end" : invitation.receptionTime}</p>}
                          <p data-studio-native-object="object:dateTime:timezone" className="text-xs text-[#916f7a]">{invitation.timezone || "Asia/Jakarta"}</p>
                        </div>}
                      </section>
          ))}

          {renderSectionInstances("gallery", (instanceId, sectionStyle) => (
            <section data-invitation-section="gallery" style={invitationSectionStyleCss(sectionStyle)} className="relative overflow-hidden bg-[#fffaf6] px-6 py-24">
                        {objectOverlay("gallery", instanceId)}
                          <RoseHeading section="gallery" eyebrow="Our memories" align="left">{tr("Galeri Foto")}</RoseHeading>
                          {preview && onEditPhoto && <button type="button" onClick={() => onEditPhoto("gallery")} className="mb-5 w-full rounded-[var(--undara-control-radius)] border border-[#dab0be] py-2 text-xs font-medium text-[#a65e69]">Atur foto galeri</button>}
                          {gallerySettings.presentation !== "template" ? (
                            <ConfigurablePhotoGallery
                              photos={gallery}
                              settings={gallerySettings}
                              preview={preview}
                              onEdit={onEditPhoto ? () => onEditPhoto("gallery") : undefined}
                            />
                          ) : gallery.length ? <div data-studio-native-object="object:gallery:grid" className="grid auto-rows-[78px] grid-cols-12 grid-flow-dense gap-3">
                            {gallery.map((photo, index) => (
                              <div key={photo.id} data-invitation-photo-slot="gallery" data-studio-photo-id={photo.id} className={index === 0 ? "col-span-7 row-span-5 overflow-hidden rounded-[18px]" : index % 3 === 1 ? "col-span-5 row-span-3 overflow-hidden rounded-[18px]" : index % 3 === 2 ? "col-span-5 row-span-4 overflow-hidden rounded-[18px]" : "col-span-7 row-span-3 overflow-hidden rounded-[18px]"}>
                                <RosePhoto url={photo.url} alt={"Foto pasangan " + (index + 1)} className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.035]" />
                              </div>
                            ))}
                          </div> : <p data-studio-native-object="object:gallery:empty-copy" className="text-sm text-[#906978]">{tr("Belum ada foto galeri.")}</p>}
                        </section>
          ))}

          {renderSectionInstances("countdown", (instanceId, sectionStyle) => (
            <section data-invitation-section="countdown" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#ead3d0] px-7 py-24 text-left">
                        {objectOverlay("countdown", instanceId)}
                        <RoseHeading section="countdown" eyebrow="Counting the moments" align="left">{tr("Menuju Hari Bahagia")}</RoseHeading>
                        {now !== null && countdown ? (
                          <div data-studio-native-object="object:countdown:grid" className="grid grid-cols-4 border-y border-[#9f6b76]/35">
                            {([["Hari", countdown.days], ["Jam", countdown.hours], ["Menit", countdown.minutes], ["Detik", countdown.seconds]] as const).map(([label, value]) => (
                              <div key={label} data-studio-native-object={`object:countdown:${label.toLowerCase()}`} className="border-r border-[#9f6b76]/35 px-1 py-6 text-center last:border-r-0">
                                <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-value`} className="font-[family-name:var(--rr-display)] text-[clamp(1.55rem,7vw,2.25rem)] leading-none text-[#5a2e3a]">{String(value).padStart(2, "0")}</p>
                                <p data-studio-native-object={`object:countdown:${label.toLowerCase()}-label`} className="mt-1 text-[10px] text-[#906978]">{tr(label)}</p>
                              </div>
                            ))}
                          </div>
                        ) : <p data-studio-native-object="object:countdown:empty-copy" className="text-sm text-[#906978]">{tr("Tanggal acara belum tersedia.")}</p>}
                      </section>
          ))}

          {renderSectionInstances("location", (instanceId, sectionStyle) => (
            <section data-invitation-section="location" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#fffaf6] px-8 py-24 text-left">
                        {objectOverlay("location", instanceId)}
                        <RoseHeading section="location" eyebrow="Find your way" align="left">{tr("Lokasi")}</RoseHeading>
                        {sessions.length ? <WeddingSessionSchedule sessions={sessions} timezone={invitation.timezone} location preview={preview} /> : <div data-studio-native-object="object:location:details-group">
                        <MapPin data-studio-native-object="object:location:map-icon" className="mb-5 h-5 w-5 text-[#8c5664]" />
                        <h3 data-studio-native-object="object:location:venue" className="max-w-[19ch] font-[family-name:var(--rr-display)] text-2xl leading-tight text-[#5a2e3a]">{invitation.venue || tr("Lokasi belum ditentukan")}</h3>
                        {invitation.address && <p data-studio-native-object="object:location:address" className="mt-4 max-w-md text-sm leading-7 text-[#6f5057]">{invitation.address}</p>}
                        {invitation.mapUrl && (
                          <a data-studio-section-element="location:button" style={sectionElementStyleCss(sectionElementStyles, "location", "button")} href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" onClick={preview ? (event) => event.preventDefault() : undefined} className="rr-pressable mt-8 inline-flex min-h-11 items-center gap-2 rounded-[var(--undara-control-radius)] bg-[#5a2e3a] px-6 py-3 text-sm text-[#fff8f3] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8c5664]">
                            <MapPin className="h-4 w-4" /> Buka Google Maps
                          </a>
                        )}
                        </div>}
                      </section>
          ))}

          {renderSectionInstances("rsvp", (instanceId, sectionStyle) => (
            <section data-invitation-section="rsvp" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#f7efe9] px-5 py-24">
                        {objectOverlay("rsvp", instanceId)}
                          <RoseHeading section="rsvp" eyebrow="Your presence means so much" studioElement="title" style={rsvpElementStyleCss(rsvpConfig, "title")}>{tr(rsvpConfig.title || "Konfirmasi Kehadiran")}</RoseHeading>
                          <div data-studio-native-object="object:rsvp:form-group">
                            <RsvpForm slug={invitation.slug} preview={preview} eventCategory="WEDDING" rsvpConfig={rsvpConfig} weddingSessions={sessions} timezone={invitation.timezone} guestId={personalGuest?.id} guestName={personalGuest?.name} guestToken={personalGuest?.token} invitedPax={personalGuest?.invitedPax} eventDate={invitation.eventDate} venue={invitation.venue} title={displayTitleCase(invitation.title) || displayName} start={invitation.ceremonyTime} description={invitation.description} />
                          </div>
                        </section>
          ))}

          {renderSectionInstances("wishes", (instanceId, sectionStyle) => (
            <section data-invitation-section="wishes" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#fffaf6] px-7 py-24 text-left">
                        {objectOverlay("wishes", instanceId)}
                          <RoseHeading section="wishes" eyebrow="A little note of love">{tr("Ucapan & Doa")}</RoseHeading>
                          <div data-studio-native-object="object:wishes:form-group">
                            <GuestWishes slug={invitation.slug} preview={preview} appearance="rose" initialName={personalGuest?.name} inputStyle={sectionElementStyleCss(sectionElementStyles, "wishes", "input")} buttonStyle={sectionElementStyleCss(sectionElementStyles, "wishes", "button")} />
                          </div>
                        </section>
          ))}

          {renderSectionInstances("gift", (instanceId, sectionStyle) => (
            <section data-invitation-section="gift" style={invitationSectionStyleCss(sectionStyle)} className="relative bg-[#5a2e3a] px-7 py-24 text-left text-[#fff8f3]">
                        {objectOverlay("gift", instanceId)}
                          <RoseHeading section="gift" eyebrow="With gratitude" align="left" light>{tr("Tanda Kasih")}</RoseHeading>
                          <Gift data-studio-native-object="object:gift:gift-icon" className="h-5 w-5 text-[#d7b598]" />
                          {hasGift ? <div data-studio-native-object="object:gift:panel" className="mt-7 max-w-sm border border-[#d7b598]/45 bg-[#fff8f3] p-7 text-[#4b2d35] shadow-[0_18px_50px_rgba(34,12,18,.18)]">
                            <p data-studio-native-object="object:gift:bank-name" className="text-sm text-[#916f7a]">{invitation.giftBankName}</p>
                            <p data-studio-native-object="object:gift:account-name" className="mt-2 text-sm font-semibold">{invitation.giftAccountName}</p>
                            <p data-studio-native-object="object:gift:account-number" className="mt-2 break-all font-[family-name:var(--font-undara-heading)] text-lg">{invitation.giftAccountNumber}</p>
                            {invitation.giftAccountNumber && <button data-studio-section-element="gift:button" style={sectionElementStyleCss(sectionElementStyles, "gift", "button")} type="button" onClick={() => { if (!preview) navigator.clipboard?.writeText(invitation.giftAccountNumber || ""); }} className="mt-5 min-h-10 rounded-[var(--undara-control-radius)] border border-[#d5a6b4] px-5 py-2 text-xs text-[#7b465a] hover:bg-[#f8eaec]">{tr("Salin nomor rekening")}</button>}
                          </div> : <p data-studio-native-object="object:gift:empty-copy" className="mt-5 text-sm text-[#906978]">{tr("Informasi tanda kasih belum ditambahkan.")}</p>}
                        </section>
          ))}

          {renderSectionInstances("closing", (instanceId, sectionStyle) => (
            <section data-invitation-section="closing" style={invitationSectionStyleCss(sectionStyle)} className="relative overflow-hidden bg-[#ead3d0] px-8 py-28 text-left">
                        {objectOverlay("closing", instanceId)}
                        <Heart data-studio-native-object="object:closing:heart" className="mb-8 h-6 w-6 text-[#8c5664]" />
                        <RoseHeading section="closing" eyebrow="Forever begins here" align="left">{tr("Terima Kasih")}</RoseHeading>
                        <div data-studio-native-object="object:closing:copy-group">
                          <p data-studio-copy-field="closing" className="max-w-sm whitespace-pre-line text-sm leading-8 text-[#6f5057]"><InvitationLayerTextContent text={editableCopy.closing ?? ""} unit={copyMotions.closing?.unit} /></p>
                          <p data-studio-copy-field="prayerWish" className="mt-5 max-w-sm whitespace-pre-line text-sm leading-8 text-[#6f5057]"><InvitationLayerTextContent text={editableCopy.prayerWish ?? ""} unit={copyMotions.prayerWish?.unit} /></p>
                          <p data-studio-native-object="object:closing:names" className="mt-10 max-w-[18ch] break-words font-[family-name:var(--rr-display)] text-2xl leading-tight text-[#5a2e3a]">{displayName}</p>
                          {invitation.weddingHashtag && <p data-studio-native-object="object:closing:hashtag" className="mt-4 text-sm text-[#765460]">{invitation.weddingHashtag}</p>}
                        </div>
                      </section>
          ))}

          {renderSectionInstances("footer", (instanceId, sectionStyle) => (
            <footer data-invitation-section="footer" style={invitationSectionStyleCss(sectionStyle)} className="relative flex items-center justify-center bg-[#5a2e3a] px-6 py-7">
                        {objectOverlay("footer", instanceId)}
                        <span aria-hidden="true" data-studio-native-object="object:footer:rule" className="h-px w-16 bg-[#d7b598] opacity-60" />
                      </footer>
          ))}


        </div>
      )}
    </main>
  );
}
