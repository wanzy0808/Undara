"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  ImagePlus,
  Layers3,
  Type,
  LayoutTemplate,
  Music2,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { audioUploadError } from "@/lib/invitations/audio-limits";
import { defaultInvitationSections, invitationSectionItems } from "@/lib/templates/sections";
import type { EditableInvitationCopyField } from "@/lib/templates/editable-copy";
import type { EditableCopyMotion } from "@/lib/templates/editable-copy-motion";
import { Button } from "@/components/ui/button";
import { useTemplateCatalog } from "@/lib/templates/use-template-catalog";
import { defaultGallerySettings, defaultPhotoAssignments, type CroppablePhotoSlot, type GallerySettings, type PhotoCrop, type PhotoFocus, type PhotoMotion, type PhotoSlot } from "@/lib/templates/photo-slots";
import { getEventCategory } from "@/lib/events/catalog";
import { templatePhotoMotion } from "@/lib/templates/template-motion";
import { getInvitationTemplate } from "@/lib/templates/catalog";
import PhotoPanel from "@/components/InvitationStudio/PhotoPanel";
import AssetPanel from "@/components/InvitationStudio/AssetPanel";
import TextObjectPanel from "@/components/InvitationStudio/TextObjectPanel";
import StudioLayerList from "@/components/InvitationStudio/StudioLayerList";
import StudioSelectionInspector from "@/components/InvitationStudio/StudioSelectionInspector";
import StudioCanvasToolbar from "@/components/InvitationStudio/StudioCanvasToolbar";
import StudioFinalPreviewDialog from "@/components/InvitationStudio/StudioFinalPreviewDialog";
import StudioStageControls from "@/components/InvitationStudio/StudioStageControls";
import StudioCanvasFooter, { type CanvasNavigationItem } from "@/components/InvitationStudio/StudioCanvasFooter";
import StudioNativeTransformHandles from "@/components/InvitationStudio/StudioNativeTransformHandles";
import {
  defaultNativeVisualTransform,
  isNativeVisualKey,
  nativeVisualCanHide,
  nativePhotoVisualKey,
  nativeVisualInstanceId,
  nativeVisualTransformForKey,
  sanitizeNativeVisualTransforms,
  type NativeVisualTransform,
} from "@/lib/templates/native-visual-transforms";
import { isTemplateIllustration, MAX_ASSET_LAYERS, MAX_TEMPLATE_ASSET_LAYERS, studioObjectSections, type StudioObjectSection, type InvitationAssetLayer, type InvitationShapeKind } from "@/lib/templates/asset-layers";
import {
  invitationFonts,
  invitationPalettes,
} from "@/lib/templates/design";
import type { InvitationSectionKey } from "@/lib/templates/sections";
import type { InvitationSectionStyle } from "@/lib/templates/section-styles";
import { defaultInvitationRsvpConfig, MAX_RSVP_CUSTOM_FIELDS } from "@/lib/templates/rsvp-config";
import { defaultInvitationSectionLayout, invitationContentSectionKeys } from "@/lib/templates/section-layout";
import type { StudioSectionElementKind } from "@/lib/templates/section-element-styles";
import {
  ColorPanel,
  ContentPanel,
  DesignerTool,
  MusicPanel,
  TemplatePanel,
} from "@/components/InvitationStudio/DesignerPanels";
import { InvitationPreview } from "@/components/InvitationStudio/InvitationPreview";
import { getInvitationDefaultMusic } from "@/lib/templates/music";
import { clearTemplateSelection, readTemplateSelection, rememberTemplateSelection } from "@/lib/templates/template-intent";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import type { InvitationLanguage } from "@/lib/invitations/language";
import { STUDIO_REFRESH_DRAFT_KEY, makeStudioRefreshDraft, recoverStudioRefreshDraft } from "@/lib/templates/studio-refresh-draft";
import {
  invitationDecorOptions,
  invitationTemplatePresets,
} from "@/components/InvitationStudio/designer-config";
import {
  getInvitationEventIdentity,
  invitationDesignStateFromKey,
  makeInvitationDesignStateKey,
} from "@/components/InvitationStudio/designer-state";
import {
  positionAssetLayers,
  reorderAssetLayers,
  type AssetLayerPosition,
} from "@/components/InvitationStudio/designer-layer-order";
import {
  alignAssetLayerGeometry,
  distributeAssetLayerGeometry,
  type AssetLayerAlignment,
  type AssetLayerDistribution,
} from "@/components/InvitationStudio/designer-layer-geometry";
import {
  deleteStudioAsset,
  loadDesignerLibraryAssets,
  loadStudioInvitation,
  loadStudioTemplateDraft,
  makeStudioSavedState,
  makeStudioServerRevision,
  saveStudioInvitation,
  saveStudioTemplateDraft,
  uploadDesignerLibraryAsset,
  uploadStudioAsset,
  type DesignerLibraryAsset,
} from "@/components/InvitationStudio/designer-persistence";
import { useStudioCanvasPan } from "@/components/InvitationStudio/useStudioCanvasPan";
import { useStudioCanvasSelectionMarkers } from "@/components/InvitationStudio/useStudioCanvasSelectionMarkers";
import { resolveStudioCanvasSelection } from "@/components/InvitationStudio/studio-canvas-selection";
import { isStudioCanvasShortcutTarget, resolveStudioHistoryShortcut } from "@/components/InvitationStudio/studio-canvas-shortcuts";
import type {
  InvitationDesignerInvitation,
  InvitationDesignerPanel,
  InvitationDesignState,
} from "@/components/InvitationStudio/designer-types";
import { templateDemoInvitation, templateDemoPhoto } from "@/data/templates/preview-invitation";

const blankCanvasSections = {
  ...defaultInvitationSections,
  envelope: false,
  greeting: false,
  identity: false,
  event: false,
  dateTime: false,
  gallery: false,
  countdown: false,
  location: false,
  rsvp: false,
  wishes: false,
  gift: false,
  closing: false,
  footer: false,
  music: false,
};

export default function InvitationDesigner({ mode = "invitation", allowBlankCanvas = false }: { mode?: "invitation" | "template"; allowBlankCanvas?: boolean }) {
  const { locale } = useLanguage();
  const templateMode = mode === "template";
  const copy = locale === "en" ? {
    unsaved: "Unsaved changes", saved: "Design saved", empty: "Design not saved",
    defaults: "Restore Defaults", defaultsHint: "Return this template to its original design state. Uploaded files stay in your media library.",
    undo: "Undo design", redo: "Redo design", preview: "Preview", saving: "Saving...", save: "Save",
    settings: "Settings", invitation: "Invitation", tools: "Design tools",
    sections: "Content", colors: "Colors", photos: "Photos", music: "Music", assets: "Assets", text: "Text",
    envelope: "Envelope", cover: "Content",
    showPanel: "Show panel", hidePanel: "Hide panel", replay: "Restart from the beginning",
    envelopeHint: "Open the digital envelope in the canvas", coverHint: "Show invitation content without changing the saved envelope setting",
    photoFree: "Photo-free theme", retry: "Try Again",
  } : {
    unsaved: "Perubahan belum disimpan", saved: "Desain tersimpan", empty: "Belum ada desain tersimpan",
    defaults: "Kembalikan ke Default", defaultsHint: "Kembalikan template ke kondisi desain awal. File upload tetap tersimpan di koleksi media.",
    undo: "Urungkan desain", redo: "Ulangi desain", preview: "Preview", saving: "Menyimpan...", save: "Simpan",
    settings: "Pengaturan", invitation: "Undangan", tools: "Alat desain",
    sections: "Isi", colors: "Warna", photos: "Foto", music: "Musik", assets: "Aset", text: "Teks",
    envelope: "Amplop", cover: "Isi",
    showPanel: "Tampilkan panel", hidePanel: "Sembunyikan panel", replay: "Ulangi dari awal",
    envelopeHint: "Tampilkan dan coba animasi Amplop Digital di canvas", coverHint: "Lihat isi undangan tanpa mengubah pengaturan Amplop",
    photoFree: "Tema tanpa foto", retry: "Coba Lagi",
  };
  const catalog = useTemplateCatalog();
  const readyTemplates = catalog.filter((item) => item.ready);
  const maxAssetLayers = templateMode ? MAX_TEMPLATE_ASSET_LAYERS : MAX_ASSET_LAYERS;
  const [selectedCatalogKey, setSelectedCatalogKey] = useState("botanical-ivory");
  const [invitation, setInvitation] = useState<InvitationDesignerInvitation | null>(null);
  const [designerLibraryAssets, setDesignerLibraryAssets] = useState<DesignerLibraryAsset[]>([]);
  const [panel, setPanel] = useState<InvitationDesignerPanel>("template");
  const [invitationLanguage, setInvitationLanguage] = useState<InvitationLanguage>("ID");
  const [activePhotoSlot, setActivePhotoSlot] = useState<PhotoSlot>("cover");
  const [cropModeSlot, setCropModeSlot] = useState<CroppablePhotoSlot | null>(null);
  const [selectedPhotoSlot, setSelectedPhotoSlot] = useState<PhotoSlot | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState<InvitationSectionKey | null>(null);
  const [selectedSectionInstanceId, setSelectedSectionInstanceId] = useState<string | null>(null);
  const [selectedRsvpElementKey, setSelectedRsvpElementKey] = useState<string | null>(null);
  const [selectedCopyField, setSelectedCopyField] = useState<EditableInvitationCopyField | null>(null);
  const [selectedNativeKey, setSelectedNativeKey] = useState<string | null>(null);
  const [selectedSectionElement, setSelectedSectionElement] = useState<{ section: InvitationSectionKey; kind: StudioSectionElementKind } | null>(null);
  const [copiedAssetLayer, setCopiedAssetLayer] = useState<InvitationAssetLayer | null>(null);
  const [copiedAssetLayers, setCopiedAssetLayers] = useState<InvitationAssetLayer[]>([]);
  const draggedAssetSrc = useRef<string | null>(null);
  const [assetDropReady, setAssetDropReady] = useState(false);
  const [layerDragOverId, setLayerDragOverId] = useState<string | null>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const previewSurfaceRef = useRef<HTMLDivElement>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileCanvas, setMobileCanvas] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [finalPreviewOpen, setFinalPreviewOpen] = useState(false);
  const [canvasStage, setCanvasStage] = useState<"envelope" | "cover">("envelope");
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasNaturalSize, setCanvasNaturalSize] = useState({ width: 340, height: 760 });
  const pendingCanvasZoomAnchor = useRef<{ x: number; y: number } | null>(null);

  function canvasViewportGeometry() {
    const scroller = canvasScrollRef.current;
    const viewport = scroller?.querySelector<HTMLElement>(".undara-studio-preview-viewport");
    if (!scroller || !viewport) return null;
    const viewportRect = viewport.getBoundingClientRect();
    const scrollRect = scroller.getBoundingClientRect();
    return {
      scroller,
      left: viewportRect.left - scrollRect.left + scroller.scrollLeft,
      top: viewportRect.top - scrollRect.top + scroller.scrollTop,
      width: Math.max(1, viewportRect.width),
      height: Math.max(1, viewportRect.height),
    };
  }

  function centerCanvasHorizontally() {
    const geometry = canvasViewportGeometry();
    if (!geometry) return;
    geometry.scroller.scrollLeft = geometry.left + geometry.width / 2 - geometry.scroller.clientWidth / 2;
  }

  function restoreCanvasZoomAnchor(anchor: { x: number; y: number }) {
    const geometry = canvasViewportGeometry();
    if (!geometry) return;
    geometry.scroller.scrollLeft = geometry.left + geometry.width * anchor.x - geometry.scroller.clientWidth / 2;
    geometry.scroller.scrollTop = geometry.top + geometry.height * anchor.y - geometry.scroller.clientHeight / 2;
  }

  function changeCanvasZoom(nextZoom: number, centerHorizontal = false) {
    const next = Math.min(5, Math.max(0.1, Math.round(nextZoom * 100) / 100));
    const geometry = canvasViewportGeometry();
    if (geometry) {
      const focusX = geometry.scroller.scrollLeft + geometry.scroller.clientWidth / 2;
      const focusY = geometry.scroller.scrollTop + geometry.scroller.clientHeight / 2;
      pendingCanvasZoomAnchor.current = {
        x: centerHorizontal ? 0.5 : Math.min(1, Math.max(0, (focusX - geometry.left) / geometry.width)),
        y: Math.min(1, Math.max(0, (focusY - geometry.top) / geometry.height)),
      };
    }
    if (next === canvasZoom) {
      const anchor = pendingCanvasZoomAnchor.current;
      pendingCanvasZoomAnchor.current = null;
      requestAnimationFrame(() => {
        if (anchor) restoreCanvasZoomAnchor(anchor);
        else if (centerHorizontal) centerCanvasHorizontally();
      });
      return;
    }
    setCanvasZoom(next);
  }

  useEffect(() => {
    const surface = previewSurfaceRef.current;
    if (!surface) return;
    const measure = () => {
      const height = surface.offsetHeight;
      if (!height) return;
      setCanvasNaturalSize((previous) =>
        previous.height === height ? previous : { ...previous, height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const anchor = pendingCanvasZoomAnchor.current;
    pendingCanvasZoomAnchor.current = null;
    const frame = requestAnimationFrame(() => {
      if (anchor) restoreCanvasZoomAnchor(anchor);
      else centerCanvasHorizontally();
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasZoom]);

  useEffect(() => {
    const frame = requestAnimationFrame(centerCanvasHorizontally);
    return () => cancelAnimationFrame(frame);
  }, [canvasStage, inspectorOpen, mobileCanvas]);
  const [activeCanvasSectionId, setActiveCanvasSectionId] = useState("envelope");
  const {
    canvasPanReady,
    canvasPanning,
    setCanvasPanReady,
    beginCanvasPan,
    moveCanvasPan,
    endCanvasPan,
    cancelCanvasPan,
    consumeSuppressedCanvasClick,
  } = useStudioCanvasPan();
  // A click on the actual envelope advances the Studio stage selector, too.
  const handleCanvasEnvelopeOpened = useCallback(() => {
    setCanvasStage("cover");
    setActiveCanvasSectionId("cover");
  }, []);
  const [savedState, setSavedState] = useState("");
  const [serverRevision, setServerRevision] = useState("");
  const [templateDraftId, setTemplateDraftId] = useState<string | null>(null);
  const [templateDraftStatus, setTemplateDraftStatus] = useState<string | null>(null);
  const [templateCustomInvitationId, setTemplateCustomInvitationId] = useState<string | null>(null);
  const audioMutation = useRef(false);
  const requestedCatalogApplied = useRef(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("Memuat undangan...");
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [musicUrl, setMusicUrl] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [dressCode, setDressCode] = useState("");
  useEffect(() => {
    if (!templateMode) {
      setDesignerLibraryAssets([]);
      return;
    }
    let active = true;
    loadDesignerLibraryAssets()
      .then((assets) => { if (active) setDesignerLibraryAssets(assets); })
      .catch((error) => {
        if (active) setNotice(error instanceof Error ? error.message : "Library Designer belum dapat dimuat.");
      });
    return () => { active = false; };
  }, [templateMode]);

  const [design, setDesign] = useState<InvitationDesignState>({
    template: "botanical-ivory",
    palette: "pearl",
    font: "cinzelFauna",
    decor: invitationDecorOptions[0],
    sections: { ...defaultInvitationSections },
    photos: defaultPhotoAssignments(),
    copy: {},
    copyEn: {},
    copyMotion: {},
    layers: [],
    sectionStyles: {},
    rsvpConfig: { ...defaultInvitationRsvpConfig, customFields: [], elementStyles: {} },
    sectionLayout: defaultInvitationSectionLayout.map((item) => ({ ...item })),
    sectionElementStyles: {},
    nativeVisuals: {},
  });
  const assetLayerUsage = templateMode
    ? design.layers.length
    : design.layers.filter((layer) => layer.customerAccess !== "locked").length;
  const canCustomerEditLayer = (layer: InvitationAssetLayer | undefined) =>
    Boolean(layer) && (templateMode || (layer!.customerAccess !== "locked" && layer!.customerAccess !== "content"));

  async function load() {
    const params = new URLSearchParams(window.location.search);

    if (templateMode) {
      const requestedDraftId = params.get("draft")?.trim() || "";
      const savedDraft = requestedDraftId ? await loadStudioTemplateDraft(requestedDraftId) : null;
      const requested = params.get("template")?.trim() || "botanical-ivory";
      const customInvitation = savedDraft?.customInvitation ?? null;
      const customFallbackDecor =
        customInvitation?.assets.find((asset) => asset.type === "IMAGE")?.url || templateDemoPhoto;

      let initialKey: string;
      let loadedDesign: InvitationDesignState;
      let defaultMusic: string;

      if (savedDraft) {
        if (savedDraft.status !== "DRAFT" && savedDraft.status !== "REVIEW") throw new Error("Template ini sudah tidak dapat dibuka sebagai draft.");
        if (!savedDraft.designKey) throw new Error("Draft template belum memiliki design yang dapat diedit.");
        initialKey = savedDraft.designKey;
        loadedDesign = invitationDesignStateFromKey(initialKey, customFallbackDecor);
        defaultMusic = savedDraft.musicUrl || customInvitation?.musicUrl || getInvitationDefaultMusic(loadedDesign.template).url;
      } else {
        const baseKey = invitationTemplatePresets[requested] ? requested : "botanical-ivory";
        const preset = invitationTemplatePresets[baseKey] || invitationTemplatePresets["botanical-ivory"];
        initialKey = `${baseKey}::${preset.palette}::${preset.font}`;
        loadedDesign = invitationDesignStateFromKey(initialKey, templateDemoPhoto);
        defaultMusic = getInvitationDefaultMusic(baseKey).url;
      }

      const studioEntryId = savedDraft ? `template-studio-draft:${savedDraft.id}` : "template-studio-draft";
      const previewInvitation: InvitationDesignerInvitation = customInvitation
        ? {
            ...customInvitation,
            templateKey: initialKey,
            accessPaid: true,
          }
        : {
            ...templateDemoInvitation,
            id: studioEntryId,
            templateKey: initialKey,
            accessPaid: true,
          };
      const previewTag = customInvitation?.weddingHashtag || "";
      const previewDressCode = customInvitation?.dressCode || "";
      const customAssetRevision = customInvitation?.assets.map((asset) => [asset.id, asset.url]) ?? [];
      const serverBaseline = JSON.stringify([
        "template-studio",
        savedDraft?.id || "new",
        initialKey,
        defaultMusic,
        savedDraft?.updatedAt || "",
        customAssetRevision,
      ]);
      const canonicalSavedState = JSON.stringify([
        makeInvitationDesignStateKey(loadedDesign),
        defaultMusic,
        previewTag,
        previewDressCode,
      ]);
      const navigationType = (window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type ?? "navigate";
      const historyState = window.history.state as Record<string, unknown> | null;
      const sameStudioEntry = historyState?.__dcStudioDraftEntry === studioEntryId;
      let refreshed: [string, string, string, string] | null = null;
      try {
        const raw = window.sessionStorage.getItem(STUDIO_REFRESH_DRAFT_KEY);
        refreshed = recoverStudioRefreshDraft(raw, sameStudioEntry ? navigationType : "navigate", studioEntryId, serverBaseline);
        if (!refreshed) window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY);
        if (!sameStudioEntry) window.history.replaceState({ ...historyState, __dcStudioDraftEntry: studioEntryId }, "", window.location.href);
      } catch { /* Optional refresh draft. */ }

      setInvitation(previewInvitation);
      setDesign(refreshed ? invitationDesignStateFromKey(refreshed[0], customFallbackDecor) : loadedDesign);
      setMusicUrl(refreshed ? refreshed[1] : defaultMusic);
      setEventTag(refreshed ? refreshed[2] : previewTag);
      setDressCode(refreshed ? refreshed[3] : previewDressCode);
      setSavedState(canonicalSavedState);
      setServerRevision(serverBaseline);
      setTemplateDraftId(savedDraft?.id || null);
      setTemplateDraftStatus(savedDraft?.status || null);
      setTemplateCustomInvitationId(customInvitation?.id || null);
      setSelectedCatalogKey(loadedDesign.template);
      setCanvasStage("envelope");
      setSelectedLayerId(null);
      setCopiedAssetLayer(null);
      setCopiedAssetLayers([]);
      setHistory([]);
      setFuture([]);
      setNotice(savedDraft
        ? savedDraft.status === "REVIEW"
          ? `${savedDraft.isCustom ? "Custom" : "Template"} #${savedDraft.templateNo} sedang direview. Preview tersedia, editing dikunci sampai dikembalikan ke Draft.`
          : savedDraft.isCustom && customInvitation
            ? `Custom #${savedDraft.templateNo} untuk “${customInvitation.title}” dimuat. Foto user dapat diposisikan/crop tanpa menyalin file ke Library Designer.`
            : `Draft Template #${savedDraft.templateNo} dimuat.`
        : "");
      return;
    }

    const invitationId = params.get("invitationId")?.trim() || "";
    const legacyType =
      params.get("type") === "ADAT_AKAD" ? "ADAT_AKAD" : "WEDDING";
    if (!invitationId) throw new Error("Pilih acara dari Dashboard untuk membuka Studio.");
    const next = await loadStudioInvitation(invitationId, legacyType);
    setTemplateCustomInvitationId(null);
    const fallbackDecor =
      next.assets.find((asset) => asset.type === "IMAGE")?.url || invitationDecorOptions[0];
    setInvitation(next);
    setMusicUrl(next.musicUrl || "");
    setEventTag(next.weddingHashtag || "");
    setDressCode(next.dressCode || "");
    const loadedDesign = invitationDesignStateFromKey(next.templateKey, fallbackDecor);
    // A catalog CTA may select a ready theme for THIS event, but never saves that
    // selection without the owner's explicit Save Design action.
    const requestedTheme = params.get("template") || (params.get("from") === "template" ? readTemplateSelection() : null);
    const requestedPreset = requestedTheme ? invitationTemplatePresets[requestedTheme] : undefined;
    const stagedDesign: InvitationDesignState = requestedTheme && requestedTheme !== loadedDesign.template && requestedPreset
      ? { ...loadedDesign, template: requestedTheme, palette: requestedPreset.palette, font: requestedPreset.font, copy: {}, copyEn: {}, copyMotion: {}, layers: [], sectionStyles: {}, rsvpConfig: { ...defaultInvitationRsvpConfig, customFields: [], elementStyles: {} }, sectionLayout: defaultInvitationSectionLayout.map((item) => ({ ...item })), sectionElementStyles: {}, nativeVisuals: {} }
      : loadedDesign;
    // Use actual persisted fields for cache identity; fallback photo URLs can change after an upload.
    const serverBaseline = makeStudioServerRevision(next);
    const canonicalSavedState = makeStudioSavedState(makeInvitationDesignStateKey(loadedDesign), next.musicUrl || "", next.weddingHashtag || "", next.dressCode || "");
    // Restore only after a true browser refresh of this same invitation and saved revision.
    // A fresh visit, event switch, Back/Forward navigation or logout never reopens this draft.
    const navigationType = (window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type ?? "navigate";
    // PerformanceNavigationTiming describes the whole document, not each Next.js SPA route.
    // An entry marker distinguishes a real refresh of Studio from opening Studio after another page was refreshed.
    const historyState = window.history.state as Record<string, unknown> | null;
    const sameStudioEntry = historyState?.__dcStudioDraftEntry === next.id;
    let refreshed: [string, string, string, string] | null = null;
    try {
      const raw = window.sessionStorage.getItem(STUDIO_REFRESH_DRAFT_KEY);
      refreshed = recoverStudioRefreshDraft(raw, sameStudioEntry ? navigationType : "navigate", next.id, serverBaseline);
      if (!refreshed) window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY);
      if (!sameStudioEntry) window.history.replaceState({ ...historyState, __dcStudioDraftEntry: next.id }, "", window.location.href);
    } catch { /* Session storage may be disabled: ordinary editing still works. */ }
    setDesign(refreshed ? invitationDesignStateFromKey(refreshed[0], fallbackDecor) : stagedDesign);
    setSelectedCatalogKey(requestedTheme && requestedPreset ? requestedTheme : loadedDesign.template);
    if (refreshed) {
      setMusicUrl(refreshed[1]);
      setEventTag(refreshed[2]);
      setDressCode(refreshed[3]);
    }
    setSavedState(canonicalSavedState);
    setServerRevision(serverBaseline);
    setCanvasStage("envelope");
    setSelectedLayerId(null);
    setCopiedAssetLayer(null);
      setCopiedAssetLayers([]);
    setHistory([]);
    setFuture([]);
    setNotice(requestedTheme && requestedTheme !== loadedDesign.template && requestedPreset
      ? "Template dipilih. Klik Simpan untuk menerapkan."
      : "");
  }

  useEffect(() => {
    load().catch((error) => {
      setLoadError(true);
      setNotice(
        error instanceof Error
          ? error.message
          : "Undangan belum dapat dimuat.",
      );
    });
  }, []);
  useEffect(() => {
    if (templateMode || !invitation || requestedCatalogApplied.current) return;
    const requested = new URLSearchParams(window.location.search).get("template")?.trim() || "";
    if (!requested.startsWith("designer:")) return;
    const available = readyTemplates.find((item) => item.key === requested && item.designKey);
    if (!available) return;
    requestedCatalogApplied.current = true;
    selectTemplate(requested);
    setNotice("Template dipilih. Preview dulu bila perlu, lalu klik Simpan untuk menerapkan.");
  }, [catalog, invitation, templateMode]);


  const template =
    readyTemplates.find((item) => item.key === design.template) ||
    (design.template === "blank-canvas" ? getInvitationTemplate("blank-canvas") : readyTemplates[0]);
  const palette = invitationPalettes[design.palette];
  const fontPair = invitationFonts[design.font];
  const designKey = makeInvitationDesignStateKey(design);
  const selectedAssetLayer = design.layers.find((layer) => layer.id === selectedLayerId);
  const selectedAssetIndex = design.layers.findIndex((layer) => layer.id === selectedLayerId);
  const selectedAssetLayers = design.layers.filter((layer) => selectedLayerIds.includes(layer.id));
  const textTargetSection: StudioObjectSection =
    selectedSectionKey && studioObjectSections.includes(selectedSectionKey as StudioObjectSection) && design.sections[selectedSectionKey] !== false
      ? selectedSectionKey as StudioObjectSection
      : selectedAssetLayer?.section ?? (canvasStage === "envelope" ? "envelope" : "cover");
  const identity = getInvitationEventIdentity(invitation);
  const currentState = makeStudioSavedState(designKey, musicUrl, eventTag, dressCode);
  const dirty = Boolean(invitation && savedState !== currentState);
  useEffect(() => {
    if (!selectedLayerId) {
      if (selectedLayerIds.length) setSelectedLayerIds([]);
      return;
    }
    if (!selectedLayerIds.includes(selectedLayerId)) setSelectedLayerIds([selectedLayerId]);
  }, [selectedLayerId, selectedLayerIds]);

  useEffect(() => {
    // Do not auto-save to the API: this snapshot is only for Ctrl/Cmd+R in this tab.
    if (!invitation || !savedState || !serverRevision) return;
    try {
      if (dirty) window.sessionStorage.setItem(STUDIO_REFRESH_DRAFT_KEY,
        JSON.stringify(makeStudioRefreshDraft(invitation.id, serverRevision, currentState)));
      else window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY);
    } catch { /* Private mode, storage quota, or disabled storage must not break editing. */ }
  }, [invitation?.id, savedState, serverRevision, currentState, dirty]);
  useEffect(() => {
    const clearDraft = () => {
      try { window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY); } catch { /* Optional cache. */ }
    };
    // A normal navigation (including logout links) ends this editing session.
    const onLinkClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin ||
        destination.pathname !== window.location.pathname || destination.search !== window.location.search) clearDraft();
    };
    const onPageHide = (event: PageTransitionEvent) => { if (event.persisted) clearDraft(); };
    const onPageShow = (event: PageTransitionEvent) => {
      // A browser BFCache restore must not revive in-memory, unsaved Studio edits.
      if (event.persisted) { clearDraft(); window.location.reload(); }
    };
    document.addEventListener("click", onLinkClick, true);
    window.addEventListener("popstate", clearDraft);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onLinkClick, true);
      window.removeEventListener("popstate", clearDraft);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, [dirty]);
  // Couple-only photo roles are not relevant to single-host and general events.
  const supportedPhotoSlots = template?.photoSlots ?? (["cover"] as PhotoSlot[]);
  const photoSlots = getEventCategory(identity.category).nameMode === "couple"
    ? supportedPhotoSlots
    : supportedPhotoSlots.filter((slot) => slot !== "personOne" && slot !== "personTwo");

  function change(next: Partial<InvitationDesignState>) {
    setHistory((current) => [...current.slice(-14), designKey]);
    setFuture([]);
    setDesign((current) => ({ ...current, ...next }));
  }

  function startBlankCanvas() {
    if (!templateMode || !allowBlankCanvas) return;
    change({
      template: "blank-canvas",
      palette: "pearl",
      font: "cinzelFauna",
      decor: invitationDecorOptions[0],
      sections: { ...blankCanvasSections },
      photos: defaultPhotoAssignments(),
      copy: {},
      copyEn: {},
      copyMotion: {},
      layers: [],
      sectionStyles: {},
      rsvpConfig: { ...defaultInvitationRsvpConfig, customFields: [], elementStyles: {} },
      sectionLayout: defaultInvitationSectionLayout.map((item) => ({ ...item })),
      sectionElementStyles: {},
    nativeVisuals: {},
    });
    setMusicUrl("");
    setSelectedCatalogKey("blank-canvas");
    clearTemplateSelection();
    const location = new URL(window.location.href);
    location.searchParams.set("template", "blank-canvas");
    window.history.replaceState(window.history.state, "", location.pathname + location.search + location.hash);
    setActivePhotoSlot("cover");
    setSelectedPhotoSlot(null);
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
    setSelectedSectionKey(null);
    setSelectedSectionInstanceId(null);
    setSelectedRsvpElementKey(null);
    setSelectedCopyField(null);
    setSelectedSectionElement(null);
    setCopiedAssetLayer(null);
    setCopiedAssetLayers([]);
    draggedAssetSrc.current = null;
    setAssetDropReady(false);
    setCanvasStage("cover");
    setPanel("assets");
    setInspectorOpen(true);
    setNotice(locale === "en"
      ? "Blank canvas ready. Add text, assets, shapes, or enable content sections."
      : "Canvas kosong siap. Tambahkan teks, aset, bentuk, atau aktifkan section Isi.");
  }

  function selectTemplate(templateKey: string) {
    const catalogTemplate = readyTemplates.find((item) => item.key === templateKey);
    if (!catalogTemplate) {
      setNotice("Template ini masih menunggu integrasi renderer.");
      return;
    }

    if (catalogTemplate.designKey) {
      const imported = invitationDesignStateFromKey(catalogTemplate.designKey, invitationDecorOptions[0]);
      change({
        ...imported,
        layers: imported.layers.map((layer) => ({
          ...layer,
          customerAccess: layer.customerAccess ?? "locked",
        })),
        photos: {
          ...imported.photos,
          cover: null,
          personOne: null,
          personTwo: null,
          gallery: null,
        },
      });
      setMusicUrl(catalogTemplate.musicUrl || getInvitationDefaultMusic(imported.template).url);
    } else {
      const preset = invitationTemplatePresets[templateKey] || invitationTemplatePresets["botanical-ivory"];
      change({
        template: templateKey,
        palette: preset.palette,
        font: preset.font,
        copy: templateKey === design.template ? design.copy : {},
        copyEn: templateKey === design.template ? design.copyEn : {},
        copyMotion: templateKey === design.template ? design.copyMotion : {},
        layers: templateKey === design.template ? design.layers : [],
        sectionStyles: templateKey === design.template ? design.sectionStyles : {},
        rsvpConfig: templateKey === design.template ? design.rsvpConfig : { ...defaultInvitationRsvpConfig, customFields: [], elementStyles: {} },
        sectionLayout: templateKey === design.template ? design.sectionLayout : defaultInvitationSectionLayout.map((item) => ({ ...item })),
        sectionElementStyles: templateKey === design.template ? design.sectionElementStyles : {},
        nativeVisuals: templateKey === design.template ? design.nativeVisuals : {},
      });
      setMusicUrl(getInvitationDefaultMusic(templateKey).url);
    }

    setSelectedCatalogKey(templateKey);
    rememberTemplateSelection(templateKey);
    const location = new URL(window.location.href);
    location.searchParams.set("template", templateKey);
    window.history.replaceState(window.history.state, "", location.pathname + location.search + location.hash);
    setActivePhotoSlot("cover");
    setSelectedPhotoSlot(null);
    setSelectedLayerId(null);
    setSelectedSectionKey(null);
    setSelectedSectionInstanceId(null);
    setSelectedRsvpElementKey(null);
    setSelectedCopyField(null);
    setSelectedSectionElement(null);
    setCopiedAssetLayer(null);
      setCopiedAssetLayers([]);
    setCanvasStage("envelope");
  }

  function restoreDefaults() {
    const preset = invitationTemplatePresets[design.template];
    if (!preset || !invitation || saving || audioMutation.current) return;
    change({
      palette: preset.palette,
      font: preset.font,
      sections: design.template === "blank-canvas" ? { ...blankCanvasSections } : { ...defaultInvitationSections },
      photos: defaultPhotoAssignments(),
      copy: {},
      copyEn: {},
      copyMotion: {},
      layers: [],
      sectionStyles: {},
      rsvpConfig: { ...defaultInvitationRsvpConfig, customFields: [], elementStyles: {} },
      sectionLayout: defaultInvitationSectionLayout.map((item) => ({ ...item })),
      sectionElementStyles: {},
      nativeVisuals: {},
    });
    setMusicUrl("");
    setActivePhotoSlot("cover");
    clearCanvasSelection();
    setCopiedAssetLayer(null);
      setCopiedAssetLayers([]);
    draggedAssetSrc.current = null;
    setAssetDropReady(false);
    setCanvasStage("envelope");
    setPreviewVersion((value) => value + 1);
    requestAnimationFrame(() => canvasScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
    setNotice("Desain kembali ke kondisi awal template. Aset yang dipasang di canvas, posisi/ukuran/rotasi, teks dekoratif, foto slot, pilihan musik, isi template, warna, font, dan toggle bagian sudah direset. File upload tetap tersimpan di koleksi media. Klik Simpan untuk menerapkan.");
  }

  async function deleteMusic(id: string) {
    if (!invitation || audioMutation.current || saving) return;
    const asset = invitation.assets.find((item) => item.id === id && item.type === "AUDIO");
    if (!asset) return;
    audioMutation.current = true;
    setAudioBusy(true);
    try {
      await deleteStudioAsset(id);
      setInvitation((current) => current ? {
        ...current, assets: current.assets.filter((item) => item.id !== id),
        musicUrl: current.musicUrl === asset.url ? null : current.musicUrl,
      } : current);
      if (musicUrl === asset.url) setMusicUrl("");
      setNotice("Musik dihapus. Slot tersedia untuk unggahan baru.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Musik belum dapat dihapus.");
    } finally {
      audioMutation.current = false;
      setAudioBusy(false);
    }
  }

  function setNarrativeCopy(field: EditableInvitationCopyField, text: string) {
    if (invitationLanguage === "EN") change({ copyEn: { ...design.copyEn, [field]: text } });
    else change({ copy: { ...design.copy, [field]: text } });
  }

  function clearCanvasSelection() {
    setCropModeSlot(null);
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
    setSelectedPhotoSlot(null);
    setSelectedSectionKey(null);
    setSelectedSectionInstanceId(null);
    setSelectedRsvpElementKey(null);
    setSelectedCopyField(null);
    setSelectedSectionElement(null);
    setSelectedNativeKey(null);
  }

  function activateCanvasEditing(afterRender = false, target?: Element) {
    setInspectorOpen(true);
    setMobileCanvas(true);
    // Selecting an input opens its properties without interrupting native typing.
    if (target && !isStudioCanvasShortcutTarget(canvasScrollRef.current, target)) return;
    const focus = () => canvasScrollRef.current?.focus({ preventScroll: true });
    if (afterRender) requestAnimationFrame(focus);
    else focus();
  }

  function handleCanvasSelection(target: Element, canvasRoot: HTMLElement) {
    const selection = resolveStudioCanvasSelection(target, canvasRoot);
    if (selection.kind !== "clear" && selection.kind !== "ignore") activateCanvasEditing(false, target);

    switch (selection.kind) {
      case "rsvp-element":
        clearCanvasSelection();
        setSelectedRsvpElementKey(selection.key);
        if (selection.instanceId) setSelectedNativeKey(`rsvp:${selection.key}:${selection.instanceId}`);
        return;
      case "section-element":
        clearCanvasSelection();
        setSelectedSectionElement({
          section: selection.section,
          kind: selection.elementKind,
        });
        if (selection.instanceId) setSelectedNativeKey(`element:${selection.section}:${selection.elementKind}:${selection.instanceId}`);
        return;
      case "copy":
        clearCanvasSelection();
        setSelectedCopyField(selection.field);
        if (selection.instanceId) setSelectedNativeKey(`copy:${selection.field}:${selection.instanceId}`);
        return;
      case "native":
        clearCanvasSelection();
        setSelectedNativeKey(selection.key);
        return;
      case "photo":
        selectPhotoVisual(selection.slot);
        setSelectedNativeKey(nativePhotoVisualKey(selection.slot, canvasStage, selection.instanceId, selection.assetId));
        return;
      case "section":
        selectSectionInstance(selection.instanceId, selection.section);
        return;
      case "clear":
        clearCanvasSelection();
        return;
      case "ignore":
        return;
    }
  }

  function focusContentSection(section: InvitationSectionKey) {
    if (section === "music") {
      setPanel("music");
      return;
    }
    clearCanvasSelection();
    setSelectedSectionKey(section);
    const instance = design.sectionLayout.find((item) => item.key === section);
    setSelectedSectionInstanceId(instance?.id ?? null);
    if (section === "envelope") {
      setCanvasStage("envelope");
      setPreviewVersion((value) => value + 1);
    } else {
      setCanvasStage("cover");
      requestAnimationFrame(() => canvasScrollRef.current?.querySelector(`[data-invitation-section="${section}"]`)?.scrollIntoView({ block: "center" }));
    }
    activateCanvasEditing(true);
  }

  function focusContentElement(section: InvitationSectionKey, kind: StudioSectionElementKind) {
    if (section === "music") { setPanel("music"); return; }
    clearCanvasSelection();
    setCanvasStage(section === "envelope" ? "envelope" : "cover");
    activateCanvasEditing(true);
    const instanceId = sectionInstanceFor(section);

    if (section === "rsvp") {
      const key = kind === "input" ? "inputs" : "button";
      setSelectedRsvpElementKey(key);
      setSelectedNativeKey(`rsvp:${key}:${instanceId}`);
      requestAnimationFrame(() => canvasScrollRef.current?.querySelector('[data-invitation-section="rsvp"]')?.scrollIntoView({ block: "center" }));
      return;
    }

    setSelectedSectionElement({ section, kind });
    const key = `element:${section}:${kind}:${instanceId}`;
    if (isNativeVisualKey(key)) setSelectedNativeKey(key);
    requestAnimationFrame(() => canvasScrollRef.current?.querySelector(`[data-studio-section-element="${section}:${kind}"]`)?.scrollIntoView({ block: "center" }));
  }

  function setSection(section: InvitationSectionKey, enabled: boolean) {
    const sections = {
      ...design.sections,
      [section]: enabled,
    };
    if (!enabled || section === "envelope" || section === "music" || design.sectionLayout.some((item) => item.key === section)) {
      change({ sections });
      return;
    }

    const canonicalIndex = invitationContentSectionKeys.indexOf(section);
    const next = [...design.sectionLayout];
    const insertAt = next.findIndex((item) => invitationContentSectionKeys.indexOf(item.key) > canonicalIndex);
    const instance = { id: section, key: section };
    if (insertAt < 0) next.push(instance);
    else next.splice(insertAt, 0, instance);
    change({ sections, sectionLayout: next });
  }

  function setPhoto(slot: "cover" | "personOne" | "personTwo", id: string | null) {
    change({ photos: { ...design.photos, [slot]: id, crop: { ...design.photos.crop, [slot]: null } } });
  }

  function toggleGalleryPhoto(id: string) {
    const allIds = (invitation?.assets ?? []).filter((asset) => asset.type === "IMAGE").map((asset) => asset.id);
    const current = design.photos.gallery ?? allIds;
    const gallery = id === "*"
      ? design.photos.gallery === null ? [] : null
      : current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    change({ photos: { ...design.photos, gallery } });
  }

  function reorderGalleryPhoto(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const allIds = (invitation?.assets ?? []).filter((asset) => asset.type === "IMAGE").map((asset) => asset.id);
    const current = [...(design.photos.gallery ?? allIds)];
    const sourceIndex = current.indexOf(sourceId);
    const targetIndex = current.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = current.splice(sourceIndex, 1);
    current.splice(targetIndex, 0, moved);
    change({ photos: { ...design.photos, gallery: current } });
  }

  function updateGallerySettings(patch: Partial<GallerySettings>) {
    change({
      photos: {
        ...design.photos,
        gallerySettings: { ...defaultGallerySettings(), ...(design.photos.gallerySettings ?? {}), ...patch },
      },
    });
  }

  function setPhotoFocus(slot: "cover" | "personOne" | "personTwo", focus: PhotoFocus) {
    change({ photos: { ...design.photos, focus: { ...design.photos.focus, [slot]: focus }, crop: { ...design.photos.crop, [slot]: null } } });
  }

  function setPhotoCrop(slot: "cover" | "personOne" | "personTwo", crop: PhotoCrop) {
    change({ photos: { ...design.photos, crop: { ...design.photos.crop, [slot]: crop } } });
  }

  function resetPhotoCrop(slot: "cover" | "personOne" | "personTwo") {
    change({ photos: { ...design.photos, crop: { ...design.photos.crop, [slot]: null } } });
  }

  function updatePhotoMotion(slot: PhotoSlot, patch: Partial<PhotoMotion>) {
    const current = templatePhotoMotion(design.template, design.photos.motion, design.sectionStyles)[slot] ?? {};
    const next: PhotoMotion = { ...current, ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) delete (next as Record<string, unknown>)[key];
    }
    const motion = { ...(design.photos.motion ?? {}) };
    if (next.animation !== undefined || next.parallax !== undefined) motion[slot] = next;
    else delete motion[slot];
    change({ photos: { ...design.photos, motion } });
  }

  function resetPhotoMotion(slot: PhotoSlot) {
    if (!design.photos.motion?.[slot]) return;
    const motion = { ...design.photos.motion };
    delete motion[slot];
    change({ photos: { ...design.photos, motion } });
  }

  function selectPhotoVisual(slot: PhotoSlot) {
    clearCanvasSelection();
    setActivePhotoSlot(slot);
    setSelectedPhotoSlot(slot);
  }

  function editPhotoFromCanvas(slot: PhotoSlot) {
    selectPhotoVisual(slot);
    setPanel("decor");
    activateCanvasEditing();
  }

  function revealPhotoInCanvas(slot: PhotoSlot) {
    const section = slot === "cover" ? canvasStage === "envelope" ? "envelope" : "cover"
      : slot === "gallery" ? "gallery" : "identity";
    showDesignSection(section);
    requestAnimationFrame(() => canvasScrollRef.current
      ?.querySelector(`[data-invitation-section="${section}"] [data-invitation-photo-slot="${slot}"]`)
      ?.scrollIntoView({ block: "center", inline: "nearest" }));
  }

  function selectPhotoFromPanel(slot: PhotoSlot) {
    selectPhotoVisual(slot);
    const section = slot === "cover" ? canvasStage : slot === "gallery" ? "gallery" : "identity";
    setSelectedNativeKey(nativePhotoVisualKey(slot, canvasStage, sectionInstanceFor(section)));
    revealPhotoInCanvas(slot);
    activateCanvasEditing(true);
  }

  function startPhotoCrop(slot: CroppablePhotoSlot) {
    if (selectedPhotoSlot !== slot) selectPhotoFromPanel(slot);
    setCropModeSlot(slot);
    activateCanvasEditing(true);
  }

  function finishPhotoCrop() {
    setCropModeSlot(null);
    activateCanvasEditing(true);
  }

  function openPhotoPanel() {
    setInspectorOpen(true);
    setMobileCanvas(false);
    setPanel("decor");
    const slot = photoSlots.includes(activePhotoSlot) ? activePhotoSlot : photoSlots[0];
    if (template?.usesPhotos && slot) {
      selectPhotoVisual(slot);
      revealPhotoInCanvas(slot);
    }
    else clearCanvasSelection();
  }

  function fitCanvasZoom() {
    const scroller = canvasScrollRef.current;
    const layout = scroller?.querySelector<HTMLElement>(".undara-studio-canvas-layout");
    if (!scroller || !layout || !canvasNaturalSize.width) return;
    const scrollerStyle = getComputedStyle(scroller);
    const horizontalPadding = (Number.parseFloat(scrollerStyle.paddingLeft) || 0)
      + (Number.parseFloat(scrollerStyle.paddingRight) || 0);
    const layoutStyle = getComputedStyle(layout);
    const sideReserve = Number.parseFloat(layoutStyle.getPropertyValue("--undara-canvas-side-reserve")) || 508;
    const availableWidth = Math.max(34, scroller.clientWidth - horizontalPadding - sideReserve);
    changeCanvasZoom(availableWidth / canvasNaturalSize.width, true);
  }

  function showDesignSection(section: StudioObjectSection) {
    if (section === "envelope") {
      if (canvasStage !== "envelope") {
        setCanvasStage("envelope");
        setPreviewVersion((current) => current + 1);
      }
    } else if (canvasStage !== "cover") {
      setCanvasStage("cover");
    }
  }

  function sectionInstanceFor(section: StudioObjectSection) {
    if (section === "envelope") return "envelope";
    return design.sectionLayout.find((item) => item.key === section)?.id ?? section;
  }

  function addAssetLayer(src: string, position: { x: number; y: number; section?: StudioObjectSection; sectionInstanceId?: string } = { x: 50, y: 38 }) {
    const section = position.section ?? "cover";
    const sectionInstanceId = position.sectionInstanceId ?? sectionInstanceFor(section);
    if (!isTemplateIllustration(src) || assetLayerUsage >= maxAssetLayers || design.sections[section] === false) return;
    const id = crypto.randomUUID().replace(/-/g, "");
    change({ layers: [...design.layers, { id, src, x: position.x, y: position.y, section, sectionInstanceId, width: 28, opacity: 1, customerAccess: templateMode ? "locked" : "customizable" }] });
    clearCanvasSelection();
    setSelectedLayerIds([id]);
    setSelectedLayerId(id);
    showDesignSection(section);
    activateCanvasEditing(true);
  }

  function addShapeObject(shape: InvitationShapeKind) {
    const section = textTargetSection;
    if (assetLayerUsage >= maxAssetLayers || design.sections[section] === false) return;
    const id = crypto.randomUUID().replace(/-/g, "");
    const accent = palette?.accent ?? "#C07A84";
    const size = shape === "circle" ? 28 : shape === "line" ? 42 : 38;
    const height = shape === "circle" ? 28 : shape === "line" ? 3 : 22;
    change({ layers: [...design.layers, {
      id,
      kind: "shape",
      shape,
      src: "",
      section,
      sectionInstanceId: selectedSectionKey === section && selectedSectionInstanceId
        ? selectedSectionInstanceId
        : selectedAssetLayer?.section === section
          ? selectedAssetLayer.sectionInstanceId ?? sectionInstanceFor(section)
          : sectionInstanceFor(section),
      x: 50,
      y: 42,
      width: size,
      height,
      opacity: 1,
      rotation: 0,
      fill: accent,
      stroke: accent,
      strokeWidth: shape === "line" ? 2 : 0,
      radius: shape === "circle" ? 100 : 0,
      name: shape === "rectangle" ? "Rectangle" : shape === "circle" ? "Circle" : "Line",
      customerAccess: templateMode ? "locked" : "customizable",
    }] });
    clearCanvasSelection();
    setSelectedLayerIds([id]);
    setSelectedLayerId(id);
    showDesignSection(section);
    setPanel("assets");
    activateCanvasEditing(true);
  }

  function addTextObject(
    text: string,
    section: StudioObjectSection,
    position: { x: number; y: number; sectionInstanceId?: string } = { x: 50, y: 50 },
  ) {
    if (!text.trim() || assetLayerUsage >= maxAssetLayers || design.sections[section] === false) return null;
    const id = crypto.randomUUID().replace(/-/g, "");
    change({ layers: [...design.layers, {
      id, kind: "text", src: "", text: text.slice(0, 180), section,
      sectionInstanceId: position.sectionInstanceId
        ?? (selectedSectionKey === section ? selectedSectionInstanceId ?? undefined : undefined)
        ?? (selectedAssetLayer?.section === section ? selectedAssetLayer.sectionInstanceId : undefined)
        ?? sectionInstanceFor(section),
      x: position.x, y: position.y, width: 55,
      opacity: 1, fontSize: 24, fontRole: "heading", fontWeight: 400, textAlign: "center",
      letterSpacing: 0, lineHeight: 1.2, color: palette?.accent ?? "#C07A84", rotation: 0,
      customerAccess: templateMode ? "locked" : "customizable",
    }] });
    clearCanvasSelection();
    setSelectedLayerIds([id]);
    setSelectedLayerId(id);
    showDesignSection(section);
    setPanel("text");
    activateCanvasEditing(true);
    return id;
  }

  function focusDesignObject(id: string, additive = false, fromCanvas = false) {
    const layer = design.layers.find((item) => item.id === id);
    if (!layer) return;
    if (!canCustomerEditLayer(layer)) {
      clearCanvasSelection();
      return;
    }
    const targetIds = layer.groupId
      ? design.layers.filter((item) => item.groupId === layer.groupId).map((item) => item.id)
      : [id];
    const allSelected = targetIds.every((targetId) => selectedLayerIds.includes(targetId));
    const keepExistingMultiSelection = !additive
      && !layer.groupId
      && selectedLayerIds.length > 1
      && selectedLayerIds.includes(id);
    const nextIds = keepExistingMultiSelection
      ? selectedLayerIds
      : additive
        ? allSelected
          ? selectedLayerIds.filter((targetId) => !targetIds.includes(targetId))
          : [...new Set([...selectedLayerIds, ...targetIds])]
        : targetIds;
    setSelectedSectionKey(null);
    setSelectedSectionInstanceId(null);
    setSelectedRsvpElementKey(null);
    setSelectedCopyField(null);
    setSelectedSectionElement(null);
    setSelectedNativeKey(null);
    setSelectedPhotoSlot(null);
    setCropModeSlot(null);
    setSelectedLayerIds(nextIds);
    setSelectedLayerId(nextIds.includes(id) ? id : nextIds.at(-1) ?? null);
    showDesignSection(layer.section ?? "cover");
    activateCanvasEditing(!fromCanvas);
    if (!fromCanvas) requestAnimationFrame(() => {
      const section = layer.section ?? "cover";
      const instanceId = layer.sectionInstanceId ?? section;
      const instance = instanceId === "envelope"
        ? null
        : canvasScrollRef.current?.querySelector<HTMLElement>(`[data-section-instance-id="${CSS.escape(instanceId)}"]`);
      (instance?.querySelector(`[data-invitation-section="${section}"]`)
        ?? canvasScrollRef.current?.querySelector(`[data-invitation-section="${section}"]`))
        ?.scrollIntoView({ block: "center" });
    });
  }

  function groupSelectedAssetLayers() {
    const candidates = selectedAssetLayers.filter((layer) => !layer.locked);
    if (candidates.length < 2) return;
    const section = candidates[0]?.section ?? "cover";
    const instanceId = candidates[0]?.sectionInstanceId ?? section;
    if (candidates.some((layer) =>
      (layer.section ?? "cover") !== section || (layer.sectionInstanceId ?? (layer.section ?? "cover")) !== instanceId)) {
      setNotice(locale === "en" ? "Group layers inside the same section instance." : "Group hanya untuk layer dalam instance section yang sama.");
      return;
    }
    const groupId = `group-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const ids = new Set(candidates.map((layer) => layer.id));
    change({ layers: design.layers.map((layer) => ids.has(layer.id) ? { ...layer, groupId } : layer) });
    setSelectedLayerIds(candidates.map((layer) => layer.id));
    setSelectedLayerId(candidates.at(-1)?.id ?? null);
  }

  function ungroupSelectedAssetLayers() {
    const groupIds = new Set(selectedAssetLayers.map((layer) => layer.groupId).filter((value): value is string => Boolean(value)));
    if (!groupIds.size) return;
    change({
      layers: design.layers.map((layer) => {
        if (!layer.groupId || !groupIds.has(layer.groupId) || layer.locked) return layer;
        const next = { ...layer };
        delete next.groupId;
        return next;
      }),
    });
  }

  function selectedLayerGeometry(minimum: number) {
    const candidates = selectedAssetLayers.filter((layer) => !layer.locked && !layer.hidden);
    if (candidates.length < minimum) return null;
    const section = candidates[0]?.section ?? "cover";
    const instanceId = candidates[0]?.sectionInstanceId ?? section;
    if (candidates.some((layer) =>
      (layer.section ?? "cover") !== section || (layer.sectionInstanceId ?? (layer.section ?? "cover")) !== instanceId)) {
      setNotice(locale === "en" ? "Align layers inside the same section instance." : "Align hanya untuk layer dalam instance section yang sama.");
      return null;
    }
    const instanceNode = instanceId === "envelope"
      ? null
      : canvasScrollRef.current?.querySelector<HTMLElement>(`[data-section-instance-id="${CSS.escape(instanceId)}"]`);
    const sectionNode = instanceNode?.querySelector<HTMLElement>(`[data-invitation-section="${section}"]`)
      ?? canvasScrollRef.current?.querySelector<HTMLElement>(`[data-invitation-section="${section}"]`);
    const sectionRect = sectionNode?.getBoundingClientRect();
    if (!sectionRect?.width || !sectionRect.height) return null;
    const items = candidates.flatMap((layer) => {
      const node = canvasScrollRef.current?.querySelector<HTMLElement>(`[data-studio-design-object="${CSS.escape(layer.id)}"]`);
      const rect = node?.getBoundingClientRect();
      return rect?.width && rect.height ? [{ layer, rect }] : [];
    });
    return items.length >= minimum ? { items, sectionRect } : null;
  }

  function alignSelectedAssetLayers(mode: AssetLayerAlignment) {
    const geometry = selectedLayerGeometry(2);
    if (!geometry) return;
    change({
      layers: alignAssetLayerGeometry(design.layers, geometry, mode),
    });
  }

  function distributeSelectedAssetLayers(axis: AssetLayerDistribution) {
    const geometry = selectedLayerGeometry(3);
    if (!geometry) return;
    change({
      layers: distributeAssetLayerGeometry(design.layers, geometry, axis),
    });
  }

  function currentClipboardSelection(includeLocked = true) {
    const ids = selectedLayerIds.length > 1
      ? new Set(selectedLayerIds)
      : selectedAssetLayer ? new Set([selectedAssetLayer.id]) : new Set<string>();
    return design.layers.filter((layer) => ids.has(layer.id) && (includeLocked || !layer.locked));
  }

  function copySelectedAssetLayer() {
    const selected = currentClipboardSelection(true);
    if (!selected.length) return;
    const copies = selected.map((layer) => ({ ...layer }));
    setCopiedAssetLayers(copies);
    setCopiedAssetLayer(copies.at(-1) ?? null);
  }

  function cloneAssetLayers(sourceLayers: InvitationAssetLayer[]) {
    const available = maxAssetLayers - assetLayerUsage;
    if (!sourceLayers.length || sourceLayers.length > available) {
      if (sourceLayers.length > available) {
        setNotice(locale === "en" ? "Not enough layer slots to paste all selected objects." : "Slot layer tidak cukup untuk menempel semua objek terpilih.");
      }
      return [] as InvitationAssetLayer[];
    }
    const groupIds = new Map<string, string>();
    return sourceLayers.map((source) => {
      const id = crypto.randomUUID().replace(/-/g, "");
      let groupId = source.groupId;
      if (groupId) {
        if (!groupIds.has(groupId)) groupIds.set(groupId, `group-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`);
        groupId = groupIds.get(groupId);
      }
      return {
        ...source,
        id,
        ...(groupId ? { groupId } : { groupId: undefined }),
        x: Math.min(100, source.x + 5),
        y: Math.min(100, source.y + 5),
      };
    });
  }

  function pasteAssetLayer() {
    if (!invitation || saving) return;
    const source = copiedAssetLayers.length
      ? copiedAssetLayers
      : copiedAssetLayer ? [copiedAssetLayer] : [];
    const next = cloneAssetLayers(source);
    if (!next.length) return;
    change({ layers: [...design.layers, ...next] });
    const ids = next.map((layer) => layer.id);
    setSelectedLayerIds(ids);
    setSelectedLayerId(ids.at(-1) ?? null);
    showDesignSection(next[0]?.section ?? "cover");
  }

  function duplicateSelectedAssetLayer() {
    if (!invitation || saving) return;
    const source = currentClipboardSelection(false);
    const next = cloneAssetLayers(source);
    if (!next.length) return;
    change({ layers: [...design.layers, ...next] });
    const ids = next.map((layer) => layer.id);
    setSelectedLayerIds(ids);
    setSelectedLayerId(ids.at(-1) ?? null);
    showDesignSection(next[0]?.section ?? "cover");
  }

  function beginAssetDrag(src: string) {
    if (!isTemplateIllustration(src) || assetLayerUsage >= maxAssetLayers) return;
    draggedAssetSrc.current = src;
  }

  function findSectionDropTarget(clientX: number, clientY: number): HTMLElement | null {
    for (const element of canvasScrollRef.current?.querySelectorAll<HTMLElement>("[data-invitation-section]") ?? []) {
      if (!studioObjectSections.includes(element.dataset.invitationSection as StudioObjectSection)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) return element;
    }
    return null;
  }

  function onAssetDragOver(event: DragEvent<HTMLDivElement>) {
    if (!draggedAssetSrc.current || assetLayerUsage >= maxAssetLayers) return;
    event.preventDefault();
    const rect = canvasScrollRef.current?.getBoundingClientRect();
    if (rect && event.clientY > rect.bottom - 48) canvasScrollRef.current!.scrollTop += 16;
    else if (rect && event.clientY < rect.top + 48) canvasScrollRef.current!.scrollTop -= 16;
    const section = findSectionDropTarget(event.clientX, event.clientY);
    if (!section || design.sections[section.dataset.invitationSection as StudioObjectSection] === false) {
      event.dataTransfer.dropEffect = "none";
      if (assetDropReady) setAssetDropReady(false);
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    if (!assetDropReady) setAssetDropReady(true);
  }

  function onAssetDrop(event: DragEvent<HTMLDivElement>) {
    const src = draggedAssetSrc.current;
    const section = src ? findSectionDropTarget(event.clientX, event.clientY) : null;
    draggedAssetSrc.current = null;
    setAssetDropReady(false);
    if (!src || !section) return;
    event.preventDefault();
    const rect = section.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
    addAssetLayer(src, {
      x: clamp((event.clientX - rect.left) / rect.width * 100),
      y: clamp((event.clientY - rect.top) / rect.height * 100),
      section: section.dataset.invitationSection as StudioObjectSection,
      sectionInstanceId: section.closest<HTMLElement>("[data-section-instance-id]")?.dataset.sectionInstanceId
        ?? section.dataset.invitationSection,
    });
  }

  function endAssetDrag() { draggedAssetSrc.current = null; setAssetDropReady(false); }

  function updateRsvpConfig(patch: Partial<InvitationDesignState["rsvpConfig"]>) {
    change({ rsvpConfig: { ...design.rsvpConfig, ...patch } });
  }

  function updateSectionElementStyles(styles: InvitationDesignState["sectionElementStyles"]) {
    change({ sectionElementStyles: styles });
  }

  function updateCopyMotion(field: EditableInvitationCopyField, patch: Partial<EditableCopyMotion>) {
    const current = design.copyMotion[field] ?? {};
    const next: EditableCopyMotion = { ...current, ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) delete (next as Record<string, unknown>)[key];
    }
    const copyMotion = { ...design.copyMotion };
    if (next.animation && next.animation !== "none") copyMotion[field] = next;
    else delete copyMotion[field];
    change({ copyMotion });
  }

  function resetNarrativeCopy(field: EditableInvitationCopyField) {
    if (invitationLanguage === "EN") {
      const copyEn = { ...design.copyEn };
      delete copyEn[field];
      change({ copyEn });
    } else {
      const copy = { ...design.copy };
      delete copy[field];
      change({ copy });
    }
  }

  function resetCopyMotion(field: EditableInvitationCopyField) {
    const copyMotion = { ...design.copyMotion };
    delete copyMotion[field];
    change({ copyMotion });
  }

  function addRsvpCustomField() {
    if (design.rsvpConfig.customFields.length >= MAX_RSVP_CUSTOM_FIELDS) return;
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    updateRsvpConfig({
      customFields: [...design.rsvpConfig.customFields, {
        id,
        label: `Field ${design.rsvpConfig.customFields.length + 1}`,
        required: false,
      }],
    });
  }

  function updateRsvpCustomField(id: string, patch: { label?: string; required?: boolean }) {
    updateRsvpConfig({
      customFields: design.rsvpConfig.customFields.map((field) => field.id === id ? { ...field, ...patch } : field),
    });
  }

  function removeRsvpCustomField(id: string) {
    const elementStyles = { ...design.rsvpConfig.elementStyles };
    delete elementStyles[`custom:${id}`];
    updateRsvpConfig({
      customFields: design.rsvpConfig.customFields.filter((field) => field.id !== id),
      elementStyles,
    });
    if (selectedRsvpElementKey === `custom:${id}`) setSelectedRsvpElementKey(null);
  }

  function selectSectionInstance(id: string, key: InvitationSectionKey) {
    clearCanvasSelection();
    setSelectedSectionKey(key);
    setSelectedSectionInstanceId(id);
    activateCanvasEditing();
  }

  function moveSectionInstance(id: string, direction: -1 | 1) {
    const index = design.sectionLayout.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= design.sectionLayout.length) return;
    const next = [...design.sectionLayout];
    [next[index], next[target]] = [next[target], next[index]];
    change({ sectionLayout: next });
  }

  function toggleSectionInstance(id: string) {
    const instance = design.sectionLayout.find((item) => item.id === id);
    if (!instance) return;
    setSection(instance.key, design.sections[instance.key] === false);
  }

  function duplicateSectionInstance(id: string) {
    const index = design.sectionLayout.findIndex((item) => item.id === id);
    const source = design.sectionLayout[index];
    if (!source || design.sectionLayout.length >= 36) return;

    const sourceLayers = design.layers.filter((layer) =>
      (layer.section ?? "cover") === source.key
      && (layer.sectionInstanceId ?? (layer.section ?? "cover")) === source.id);
    if (assetLayerUsage + sourceLayers.length > maxAssetLayers) {
      setNotice(locale === "en"
        ? "Not enough object slots to duplicate this section."
        : "Slot objek tidak cukup untuk menduplikasi section ini.");
      return;
    }

    const copyId = `${source.key}-copy-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const next = [...design.sectionLayout];
    next.splice(index + 1, 0, { id: copyId, key: source.key });

    const groupIds = new Map<string, string>();
    const clonedLayers = sourceLayers.map((layer) => {
      let groupId = layer.groupId;
      if (groupId) {
        if (!groupIds.has(groupId)) groupIds.set(groupId, `group-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`);
        groupId = groupIds.get(groupId);
      }
      return {
        ...layer,
        id: crypto.randomUUID().replace(/-/g, ""),
        sectionInstanceId: copyId,
        ...(groupId ? { groupId } : { groupId: undefined }),
      };
    });

    const nativeVisuals = { ...design.nativeVisuals };
    for (const [key, value] of Object.entries(design.nativeVisuals)) {
      if (nativeVisualInstanceId(key) !== source.id) continue;
      nativeVisuals[`${key.slice(0, -source.id.length)}${copyId}`] = { ...value };
    }

    change({ sectionLayout: next, layers: [...design.layers, ...clonedLayers], nativeVisuals });
    setSelectedSectionKey(source.key);
    setSelectedSectionInstanceId(copyId);
  }

  function deleteSectionInstance(id: string) {
    const source = design.sectionLayout.find((item) => item.id === id);
    if (!source) return;
    const next = design.sectionLayout.filter((item) => item.id !== id);
    const hasSameSection = next.some((item) => item.key === source.key);
    const layers = design.layers.filter((layer) =>
      !((layer.section ?? "cover") === source.key
        && (layer.sectionInstanceId ?? (layer.section ?? "cover")) === id));
    const nativeVisuals = Object.fromEntries(
      Object.entries(design.nativeVisuals).filter(([key]) => nativeVisualInstanceId(key) !== id),
    );
    change({
      sectionLayout: next,
      layers,
      nativeVisuals,
      ...(!hasSameSection ? { sections: { ...design.sections, [source.key]: false } } : {}),
    });
    if (selectedSectionInstanceId === id) {
      setSelectedSectionKey(null);
      setSelectedSectionInstanceId(null);
    }
    if (selectedAssetLayer && !layers.some((layer) => layer.id === selectedAssetLayer.id)) {
      setSelectedLayerIds([]);
      setSelectedLayerId(null);
    }
  }

  function updateSectionStyle(key: InvitationSectionKey, patch: Partial<InvitationSectionStyle>) {
    const current = design.sectionStyles[key] ?? {};
    const next = { ...current, ...patch };
    for (const [property, value] of Object.entries(next)) {
      if (value === undefined) delete (next as Record<string, unknown>)[property];
    }
    const sectionStyles = { ...design.sectionStyles };
    if (Object.keys(next).length) sectionStyles[key] = next;
    else delete sectionStyles[key];
    change({ sectionStyles });
  }

  function resetSectionStyle(key: InvitationSectionKey) {
    if (!design.sectionStyles[key]) return;
    const sectionStyles = { ...design.sectionStyles };
    delete sectionStyles[key];
    change({ sectionStyles });
  }

  function updateAssetLayer(id: string, patch: Partial<InvitationAssetLayer>) {
    const source = design.layers.find((layer) => layer.id === id);
    if (!source) return;
    if (patch.section && (design.sections[patch.section] === false || !studioObjectSections.includes(patch.section))) return;

    const targetSection = patch.section ?? source.section ?? "cover";
    const nextPatch = patch.section && patch.sectionInstanceId === undefined
      ? { ...patch, sectionInstanceId: sectionInstanceFor(patch.section) }
      : patch;
    if (nextPatch.sectionInstanceId) {
      const validInstance = targetSection === "envelope"
        ? nextPatch.sectionInstanceId === "envelope"
        : design.sectionLayout.some((item) => item.id === nextPatch.sectionInstanceId && item.key === targetSection);
      if (!validInstance) return;
    }

    const patchKeys = Object.keys(nextPatch);
    const movingSelection = selectedLayerIds.length > 1
      && selectedLayerIds.includes(id)
      && patchKeys.length > 0
      && patchKeys.every((key) => key === "x" || key === "y")
      && !source.locked;

    if (movingSelection) {
      const dx = nextPatch.x === undefined ? 0 : nextPatch.x - source.x;
      const dy = nextPatch.y === undefined ? 0 : nextPatch.y - source.y;
      const sourceSection = source.section ?? "cover";
      const sourceInstanceId = source.sectionInstanceId ?? sourceSection;
      const selected = new Set(selectedLayerIds);
      change({
        layers: design.layers.map((layer) => {
          if (!selected.has(layer.id) || layer.locked || (layer.section ?? "cover") !== sourceSection
            || (layer.sectionInstanceId ?? (layer.section ?? "cover")) !== sourceInstanceId) return layer;
          return {
            ...layer,
            x: Math.min(100, Math.max(0, layer.x + dx)),
            y: Math.min(100, Math.max(0, layer.y + dy)),
          };
        }),
      });
      return;
    }

    change({ layers: design.layers.map((layer) => layer.id === id ? { ...layer, ...nextPatch } : layer) });
    if (nextPatch.section) {
      showDesignSection(nextPatch.section);
      const instanceId = nextPatch.sectionInstanceId ?? sectionInstanceFor(nextPatch.section);
      requestAnimationFrame(() => {
        const instance = instanceId === "envelope"
          ? null
          : canvasScrollRef.current?.querySelector<HTMLElement>(`[data-section-instance-id="${CSS.escape(instanceId)}"]`);
        (instance?.querySelector(`[data-invitation-section="${nextPatch.section}"]`)
          ?? canvasScrollRef.current?.querySelector(`[data-invitation-section="${nextPatch.section}"]`))
          ?.scrollIntoView({ block: "center" });
      });
    }
  }

  function removeAssetLayer(id: string) {
    const selected = selectedLayerIds.includes(id) && selectedLayerIds.length > 1
      ? selectedLayerIds
      : [id];
    const removable = new Set(selected.filter((layerId) => !design.layers.find((layer) => layer.id === layerId)?.locked));
    if (!removable.size) return;
    change({ layers: design.layers.filter((layer) => !removable.has(layer.id)) });
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
  }

  function reorderAssetLayer(sourceId: string, targetId: string) {
    const next = reorderAssetLayers(design.layers, sourceId, targetId);
    if (next === design.layers) return;
    change({ layers: next });
    setSelectedLayerIds([sourceId]);
    setSelectedLayerId(sourceId);
  }

  function positionAssetLayer(id: string, position: AssetLayerPosition) {
    const next = positionAssetLayers(design.layers, id, position);
    if (next === design.layers) return;
    change({ layers: next });
  }

  const selectedNativeTargetKey = selectedLayerId || selectedSectionKey ? null
    : selectedPhotoSlot ? (cropModeSlot ? null : selectedNativeKey ?? nativePhotoVisualKey(selectedPhotoSlot, canvasStage))
    : selectedSectionElement ? (selectedNativeKey?.startsWith(`element:${selectedSectionElement.section}:${selectedSectionElement.kind}:`) ? selectedNativeKey : `element:${selectedSectionElement.section}:${selectedSectionElement.kind}`)
    : selectedRsvpElementKey ? (selectedNativeKey?.startsWith(`rsvp:${selectedRsvpElementKey}:`) ? selectedNativeKey : `rsvp:${selectedRsvpElementKey}`)
    : selectedCopyField ? (selectedNativeKey?.startsWith(`copy:${selectedCopyField}:`) ? selectedNativeKey : `copy:${selectedCopyField}`)
    : selectedNativeKey;
  const activeNativeKey = selectedNativeTargetKey && isNativeVisualKey(selectedNativeTargetKey) ? selectedNativeTargetKey : null;
  const activeNativeTransform = activeNativeKey ? nativeVisualTransformForKey(design.nativeVisuals, activeNativeKey) : undefined;

  function commitNativeVisual(key: string, value: NativeVisualTransform) {
    if (!isNativeVisualKey(key)) return;
    const next = { ...design.nativeVisuals };
    const normalized = sanitizeNativeVisualTransforms({ [key]: value })[key];
    if (normalized) next[key] = normalized;
    else delete next[key];
    change({ nativeVisuals: next });
  }

  function hideSelectedNativeVisual(key: string) {
    if (!invitation || saving || audioBusy || !nativeVisualCanHide(key)) return false;
    const current = { ...defaultNativeVisualTransform, ...nativeVisualTransformForKey(design.nativeVisuals, key), hidden: true };
    commitNativeVisual(key, current);
    clearCanvasSelection();
    activateCanvasEditing();
    return true;
  }

  useStudioCanvasSelectionMarkers(
    canvasScrollRef,
    {
      section: selectedSectionKey,
      rsvpElement: selectedRsvpElementKey,
      sectionElement: selectedSectionElement ? `${selectedSectionElement.section}:${selectedSectionElement.kind}` : null,
      copyField: selectedCopyField,
      photoSlot: selectedPhotoSlot,
    },
    `${designKey}|${canvasStage}|${previewVersion}`,
  );

  useEffect(() => {
    function handleLayerShortcut(event: KeyboardEvent) {
      if (!invitation || saving || audioBusy || event.defaultPrevented || event.isComposing) return;
      const target = event.target;
      if (!isStudioCanvasShortcutTarget(canvasScrollRef.current, target instanceof Element ? target : null)) return;
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key === "Escape" && selectedPhotoSlot) {
        clearCanvasSelection();
        return;
      }
      const activeText = window.getSelection()?.toString();
      if (activeText) return;
      const modifier = event.ctrlKey || event.metaKey;
      const shortcutKey = event.key.toLowerCase();

      if (!modifier && !event.altKey && activeNativeKey && !selectedAssetLayer
        && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 5 : 1;
        const current = { ...defaultNativeVisualTransform, ...nativeVisualTransformForKey(design.nativeVisuals, activeNativeKey) };
        commitNativeVisual(activeNativeKey, {
          ...current,
          x: Math.min(2000, Math.max(-2000, current.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
          y: Math.min(2000, Math.max(-2000, current.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0))),
        });
        return;
      }
      if (!modifier && !event.altKey && activeNativeKey && !selectedAssetLayer
        && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        hideSelectedNativeVisual(activeNativeKey);
        return;
      }
      if (!modifier && !event.altKey && selectedSectionKey && !selectedAssetLayer
        && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        if (selectedSectionKey === "envelope") {
          change({ sections: { ...design.sections, envelope: false } });
          setCanvasStage("cover");
        } else if (selectedSectionInstanceId) {
          deleteSectionInstance(selectedSectionInstanceId);
        }
        clearCanvasSelection();
        return;
      }
      if (!modifier && !event.altKey && event.key === "Escape" && activeNativeKey && !selectedAssetLayer) {
        clearCanvasSelection();
        return;
      }
      if (selectedPhotoSlot && !activeNativeKey) return;
      if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "a") {
        event.preventDefault();
        const targetSection = selectedAssetLayer?.section ?? (canvasStage === "envelope" ? "envelope" : "cover");
        const targetInstanceId = selectedAssetLayer?.sectionInstanceId ?? targetSection;
        const ids = design.layers
          .filter((layer) => (layer.section ?? "cover") === targetSection
            && (layer.sectionInstanceId ?? (layer.section ?? "cover")) === targetInstanceId
            && !layer.hidden)
          .map((layer) => layer.id);
        setSelectedLayerIds(ids);
        setSelectedLayerId(ids.at(-1) ?? null);
      } else if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "g") {
        if (selectedLayerIds.length < 2) return;
        event.preventDefault();
        groupSelectedAssetLayers();
      } else if (modifier && !event.altKey && event.shiftKey && shortcutKey === "g") {
        if (!selectedAssetLayers.some((layer) => layer.groupId)) return;
        event.preventDefault();
        ungroupSelectedAssetLayers();
      } else if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "c") {
        if (!selectedAssetLayer) return;
        event.preventDefault();
        copySelectedAssetLayer();
      } else if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "x") {
        const cuttable = currentClipboardSelection(false);
        if (!cuttable.length) return;
        event.preventDefault();
        const copies = cuttable.map((layer) => ({ ...layer }));
        setCopiedAssetLayers(copies);
        setCopiedAssetLayer(copies.at(-1) ?? null);
        removeAssetLayer(cuttable.at(-1)!.id);
      } else if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "v") {
        if ((!copiedAssetLayers.length && !copiedAssetLayer) || assetLayerUsage >= maxAssetLayers) return;
        event.preventDefault();
        pasteAssetLayer();
      } else if (modifier && !event.altKey && !event.shiftKey && shortcutKey === "d") {
        if (!currentClipboardSelection(false).length || assetLayerUsage >= maxAssetLayers) return;
        event.preventDefault();
        duplicateSelectedAssetLayer();
      } else if (!modifier && !event.altKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        if (!selectedAssetLayer || selectedAssetLayer.locked) return;
        event.preventDefault();
        const step = event.shiftKey ? 5 : 1;
        updateAssetLayer(selectedAssetLayer.id, {
          x: Math.min(100, Math.max(0, selectedAssetLayer.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
          y: Math.min(100, Math.max(0, selectedAssetLayer.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0))),
        });
      } else if (!modifier && !event.altKey && (event.key === "Delete" || event.key === "Backspace")) {
        if (!selectedAssetLayer || selectedAssetLayer.locked) return;
        event.preventDefault();
        removeAssetLayer(selectedAssetLayer.id);
      } else if (!modifier && !event.altKey && event.key === "Escape" && selectedAssetLayer) {
        setSelectedLayerIds([]);
        setSelectedLayerId(null);
      }
    }
    window.addEventListener("keydown", handleLayerShortcut);
    return () => window.removeEventListener("keydown", handleLayerShortcut);
  }, [invitation, saving, audioBusy, canvasStage, selectedPhotoSlot, selectedAssetLayer, selectedAssetLayers, selectedLayerIds, copiedAssetLayer, copiedAssetLayers, design.layers, design.nativeVisuals, design.sections, design.sectionLayout, selectedSectionKey, selectedSectionInstanceId, activeNativeKey, locale]);

  function undo() {
    const key = history.at(-1);
    if (!key) return;
    setFuture((current) => [...current, designKey]);
    setDesign(invitationDesignStateFromKey(key, design.decor));
    setHistory((current) => current.slice(0, -1));
  }

  function redo() {
    const key = future.at(-1);
    if (!key) return;
    setHistory((current) => [...current, designKey]);
    setDesign(invitationDesignStateFromKey(key, design.decor));
    setFuture((current) => current.slice(0, -1));
  }

  async function uploadDesignerArtwork(file: File) {
    if (!templateMode) return;
    setNotice("Mengunggah artwork dan mengoptimasi ke WebP...");
    try {
      const uploaded = await uploadDesignerLibraryAsset(file);
      setDesignerLibraryAssets((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      setNotice("Artwork WebP ditambahkan ke Library Saya. Seret ke canvas untuk memakainya.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Artwork belum dapat diunggah.");
      throw error;
    }
  }

  async function uploadAsset(file: File, assetType: "IMAGE" | "AUDIO") {
    if (!invitation) return;
    if (assetType === "AUDIO") {
      if (audioMutation.current || saving) return;
      const error = audioUploadError(file, invitation.assets.filter((asset) => asset.type === "AUDIO").length);
      if (error) { setNotice(error); return; }
      audioMutation.current = true;
      setAudioBusy(true);
    }
    setNotice(assetType === "IMAGE" ? "Mengunggah foto..." : "Mengunggah musik...");
    try {
      const uploadedAsset = await uploadStudioAsset(invitation.id, assetType, file);

      setInvitation((current) =>
        current
          ? { ...current, assets: [...current.assets, uploadedAsset] }
          : current,
      );
      if (assetType === "AUDIO") setMusicUrl(uploadedAsset.url);
      setNotice(assetType === "IMAGE" ? "Foto berhasil diunggah." : "Musik berhasil diunggah.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload gagal.");
      if (assetType === "IMAGE") throw error;
    } finally {
      if (assetType === "AUDIO") { audioMutation.current = false; setAudioBusy(false); }
    }
  }

  async function save() {
    if (!invitation) return;
    if (saving || audioMutation.current) return;
    setSaving(true);
    setNotice(templateMode ? "Menyimpan template..." : "Menyimpan...");
    try {
      if (templateMode) {
        const selectedCatalog = catalog.find((item) => item.key === selectedCatalogKey);
        const cleanTemplateDesign: InvitationDesignState = templateCustomInvitationId
          ? design
          : {
              ...design,
              photos: {
                ...design.photos,
                cover: null,
                personOne: null,
                personTwo: null,
                gallery: null,
              },
            };
        const templateDesignKey = makeInvitationDesignStateKey(cleanTemplateDesign);
        const savedTemplate = await saveStudioTemplateDraft({
          designKey: templateDesignKey,
          name: `${selectedCatalog?.name || template?.name || "Template"} Studio`,
          tags: [selectedCatalog?.category || template?.category || "Designer", "studio"],
          previewUrl: selectedCatalog?.previewImage || template?.previewImage,
          category: selectedCatalog?.category || template?.category || "Designer",
          description: `Template Studio berbasis ${selectedCatalog?.name || template?.name || "desain Undara"}.`,
          usesPhotos: selectedCatalog?.usesPhotos ?? template?.usesPhotos ?? false,
          musicUrl,
        }, templateDraftId);
        setTemplateDraftId(savedTemplate.id);
        setTemplateDraftStatus(savedTemplate.status);
        setSavedState(currentState);
        try { window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY); } catch { /* Optional cache. */ }
        const studioEntryId = `template-studio-draft:${savedTemplate.id}`;
        setInvitation((current) => current ? { ...current, templateKey: templateDesignKey } : current);
        setServerRevision(JSON.stringify([
          "template-studio",
          savedTemplate.id,
          templateDesignKey,
          musicUrl,
          savedTemplate.updatedAt || "",
          templateCustomInvitationId ? invitation.assets.map((asset) => [asset.id, asset.url]) : [],
        ]));
        const location = new URL(window.location.href);
        location.searchParams.set("draft", savedTemplate.id);
        location.searchParams.delete("template");
        window.history.replaceState(
          { ...((window.history.state as Record<string, unknown> | null) ?? {}), __dcStudioDraftEntry: studioEntryId },
          "",
          location.pathname + location.search + location.hash,
        );
        setNotice(templateCustomInvitationId
          ? `Custom #${savedTemplate.templateNo} tersimpan. Foto tetap milik event user dan tidak disalin ke Library Designer.`
          : `Draft Template #${savedTemplate.templateNo} tersimpan. Draft belum tampil di katalog sebelum dipublikasikan.`);
        return;
      }

      const savedInvitation = await saveStudioInvitation(
        invitation,
        designKey,
        musicUrl,
        eventTag,
        dressCode,
      );
      setInvitation(savedInvitation);
      setSavedState(currentState);
      setServerRevision(makeStudioServerRevision(savedInvitation));
      try { window.sessionStorage.removeItem(STUDIO_REFRESH_DRAFT_KEY); } catch { /* Optional cache. */ }
      clearTemplateSelection();
      const location = new URL(window.location.href);
      location.searchParams.delete("template");
      location.searchParams.delete("from");
      window.history.replaceState(window.history.state, "", location.pathname + location.search + location.hash);
      setNotice("Desain tersimpan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : templateMode ? "Template belum dapat disimpan." : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const canvasNavigationItems: CanvasNavigationItem[] = [
    ...(design.sections.envelope !== false ? [{ id: "envelope", key: "envelope" as const, title: "Amplop Digital" }] : []),
    ...design.sectionLayout
      .filter((item) => design.sections[item.key] !== false && !item.hidden)
      .map((item) => ({
        id: item.id,
        key: item.key,
        title: invitationSectionItems.find((section) => section.key === item.key)?.title ?? item.key,
      })),
  ];

  function navigateCanvasSection(id: string) {
    setActiveCanvasSectionId(id);
    if (id === "envelope") {
      setCanvasStage("envelope");
      setPreviewVersion((value) => value + 1);
      canvasScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCanvasStage("cover");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const root = canvasScrollRef.current;
      const target = Array.from(root?.querySelectorAll<HTMLElement>("[data-section-instance-id]") ?? [])
        .find((node) => node.dataset.sectionInstanceId === id);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    }));
  }

  function syncCanvasSectionOnScroll() {
    if (canvasStage === "envelope") return;
    const root = canvasScrollRef.current;
    if (!root) return;
    const ids = new Set(canvasNavigationItems.map((item) => item.id));
    const anchor = root.getBoundingClientRect().top + Math.min(root.clientHeight * 0.35, 180);
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-section-instance-id]"))
      .filter((node) => ids.has(node.dataset.sectionInstanceId ?? ""));
    if (!sections.length) return;
    const closest = sections.reduce((best, node) =>
      Math.abs(node.getBoundingClientRect().top - anchor) < Math.abs(best.getBoundingClientRect().top - anchor) ? node : best);
    setActiveCanvasSectionId(closest.dataset.sectionInstanceId!);
  }

  if (loadError) return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center" role="alert">
      <p className="text-sm">{notice}</p>
      <Button onClick={() => window.location.reload()}>{copy.retry}</Button>
    </section>
  );

  return (
    <section className="undara-invitation-studio-shell" data-inspector={inspectorOpen} data-mobile-canvas={mobileCanvas}>

      <div className="undara-studio-mobile-view" aria-label="Studio">
        <button type="button" aria-pressed={!mobileCanvas} onClick={() => setMobileCanvas(false)}>{copy.settings}</button>
        <button type="button" aria-pressed={mobileCanvas} onClick={() => setMobileCanvas(true)}>{copy.invitation}</button>
      </div>
      <div className="undara-studio-workspace">
        <nav className="undara-studio-rail" aria-label={copy.tools}>
          <DesignerTool active={panel === "template"} label={locale === "en" ? "Catalog" : "Katalog"} icon={<LayoutTemplate className="h-4 w-4" />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("template"); }} />
          <DesignerTool active={panel === "sections"} label={copy.sections} icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("sections"); }} />
          <DesignerTool active={panel === "text"} label={copy.text} icon={<Type className="h-4 w-4" strokeWidth={2.2} />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("text"); }} />
          <DesignerTool active={panel === "decor"} label={copy.photos} icon={<ImagePlus className="h-4 w-4" />} onClick={openPhotoPanel} />
          <DesignerTool active={panel === "assets"} label={copy.assets} icon={<Layers3 className="h-4 w-4" />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("assets"); }} />
          <DesignerTool active={panel === "music"} label={copy.music} icon={<Music2 className="h-4 w-4" />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("music"); }} />
          <DesignerTool active={panel === "color"} label={copy.colors} icon={<Palette className="h-4 w-4" />} onClick={() => { setInspectorOpen(true); setMobileCanvas(false); setPanel("color"); }} />
        </nav>

        <aside className="undara-studio-inspector" aria-label="Pengaturan desain">
          <fieldset disabled={!invitation || saving} className="min-w-0 border-0 p-0 disabled:opacity-50">
          {panel === "template" && <TemplatePanel selected={selectedCatalogKey} onSelect={selectTemplate} templates={catalog} onBlankCanvas={templateMode && allowBlankCanvas ? startBlankCanvas : undefined} />}
          {panel === "sections" && (
            <ContentPanel
              invitationLanguage={invitationLanguage}
              sections={design.sections}
              rsvpConfig={design.rsvpConfig}
              eventCategory={invitation?.eventCategory ?? ""}
              templateKey={design.template}
              eventDescription={invitation?.description}
              narrativeCopy={design.copy}
              englishNarrativeCopy={design.copyEn}
              onNarrativeCopy={setNarrativeCopy}
              onResetNarrativeCopy={resetNarrativeCopy}
              onChange={setSection}
              onSelectSection={focusContentSection}
              onSelectElement={focusContentElement}
              onRsvpConfig={updateRsvpConfig}
              onAddRsvpField={addRsvpCustomField}
              onUpdateRsvpField={updateRsvpCustomField}
              onRemoveRsvpField={removeRsvpCustomField}
            />
          )}
          {panel === "color" && design.template === "romantic-rose" && <p className="text-sm leading-7 text-muted-foreground">Warna Romantic Rose mengikuti desain asli tema.</p>}
          {panel === "color" && design.template !== "romantic-rose" && <ColorPanel selected={design.palette} onSelect={(value) => change({ palette: value })} />}
          {panel === "decor" && template && !template.usesPhotos ? (
            <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h2 className="font-[family-name:var(--font-undara-heading)] text-lg text-foreground">{copy.photoFree}</h2>
              <p className="text-sm leading-7 text-muted-foreground">Desain ini menggunakan tipografi dan ilustrasi, tanpa slot foto. Koleksi foto acara tetap tersimpan jika nanti kamu mengganti tema dengan foto.</p>
              <p className="text-xs text-primary">Pilih tema bertanda “Dengan foto” untuk mengatur cover, foto individu, dan galeri.</p>
            </div>
          ) : panel === "decor" && (
            <PhotoPanel
              photos={invitation?.assets ?? []}
              slots={photoSlots}
              assignments={design.photos}
              activeSlot={activePhotoSlot}
              onActiveSlotChange={selectPhotoFromPanel}
              onSetPhoto={setPhoto}
              onToggleGallery={toggleGalleryPhoto}
              onUpload={templateMode ? undefined : (file) => uploadAsset(file, "IMAGE")}
            />
          )}
          {panel === "text" && <TextObjectPanel layers={design.layers} selectedId={selectedLayerId} targetSection={textTargetSection} selectedFont={design.font} onAdd={addTextObject} onSelect={focusDesignObject} onFontSelect={(value) => change({ font: value })} />}
          {panel === "assets" && <AssetPanel
            layers={design.layers}
            templateKey={design.template}
            onDragAssetStart={beginAssetDrag}
            onDragAssetEnd={endAssetDrag}
            onAddShape={addShapeObject}
            libraryAssets={templateMode ? designerLibraryAssets : []}
            onUploadLibraryAsset={templateMode ? uploadDesignerArtwork : undefined}
            maxLayers={maxAssetLayers}
          />}
          {panel === "music" && <MusicPanel
            musicUrl={musicUrl}
            templateKey={design.template}
            assets={invitation?.assets ?? []}
            busy={audioBusy || saving}
            setMusicUrl={setMusicUrl}
            onUpload={templateMode ? undefined : (file) => uploadAsset(file, "AUDIO")}
            onDelete={templateMode ? undefined : deleteMusic}
          />}
          </fieldset>
        </aside>

        <div className="undara-studio-canvas" onKeyDown={(event) => {
          if (!invitation || saving || audioBusy || event.altKey || event.nativeEvent.isComposing) return;
          const target = event.target;
          if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
          if (!(event.ctrlKey || event.metaKey)) return;
          const key = event.key.toLowerCase();
          const isUndo = key === "z" && !event.shiftKey;
          const isRedo = (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey);
          if (isUndo && history.length) { event.preventDefault(); undo(); }
          if (isRedo && future.length) { event.preventDefault(); redo(); }
        }}>
          <StudioCanvasToolbar
            locale={locale}
            inspectorOpen={inspectorOpen}
            templateName={template?.name || "Studio"}
            invitationReady={Boolean(invitation)}
            saving={saving}
            audioBusy={audioBusy}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            templateMode={templateMode}
            dirty={templateMode && templateDraftStatus === "REVIEW" ? false : dirty}
            labels={{
              hidePanel: copy.hidePanel,
              showPanel: copy.showPanel,
              replay: copy.replay,
              defaultsHint: copy.defaultsHint,
              undo: copy.undo,
              redo: copy.redo,
              preview: copy.preview,
              saving: copy.saving,
              save: copy.save,
            }}
            onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
            onRestore={restoreDefaults}
            onUndo={undo}
            onRedo={redo}
            onPreview={() => setFinalPreviewOpen(true)}
            onSave={save}
          />
          <div ref={canvasScrollRef} className="undara-studio-canvas-scroll" onScroll={syncCanvasSectionOnScroll} tabIndex={0} aria-label={locale === "en" ? "Invitation canvas" : "Kanvas undangan"} data-space-pan={canvasPanReady ? "true" : undefined} data-pan-enabled="true" data-panning={canvasPanning ? "true" : undefined}
          onKeyDown={(event) => {
            if (event.defaultPrevented || event.nativeEvent.isComposing) return;
            const target = event.target;
            if (!isStudioCanvasShortcutTarget(event.currentTarget, target instanceof Element ? target : null)
              || window.getSelection()?.toString()) return;
            const historyAction = resolveStudioHistoryShortcut(event.nativeEvent);
            if (historyAction) {
              if (saving || audioBusy) return;
              event.preventDefault();
              if (historyAction === "undo") undo();
              else redo();
              return;
            }
            if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey) return;
            if (target instanceof Element && target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="textbox"], [role="button"]')) return;
            event.preventDefault();
            setCanvasPanReady(true);
          }}
          onKeyUp={(event) => {
            if (event.code === "Space") setCanvasPanReady(false);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setCanvasPanReady(false);
              cancelCanvasPan();
            }
          }}
          onPointerDown={(event) => {
            if (beginCanvasPan(event, true)) return;
            const target = event.target;
            if (target instanceof Element && !target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]')) event.currentTarget.focus({ preventScroll: true });
          }}
          onPointerMove={moveCanvasPan}
          onPointerUp={endCanvasPan}
          onPointerCancel={(event) => { cancelCanvasPan(event.pointerId); setCanvasPanReady(false); }}
          onLostPointerCapture={(event) => cancelCanvasPan(event.pointerId)}
          onClickCapture={(event) => {
            const target = event.target;
            // Some protected actions stop bubbling in preview; their visual remains selectable.
            if (!(target instanceof Element) || !target.closest("[data-studio-system-action]")) return;
            if (consumeSuppressedCanvasClick()) { event.preventDefault(); event.stopPropagation(); return; }
            handleCanvasSelection(target, event.currentTarget);
          }}
          onClick={(event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest("[data-studio-system-action]")) return;
            if (consumeSuppressedCanvasClick()) return;

            handleCanvasSelection(target, event.currentTarget);
          }} onDragOver={onAssetDragOver} onDrop={onAssetDrop} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setAssetDropReady(false); }}>
          <div className="undara-studio-canvas-layout" style={{ "--undara-zoomed-stage-width": `${Math.max(340, canvasNaturalSize.width * canvasZoom)}px` } as React.CSSProperties}>
            <StudioLayerList
              locale={locale}
              layers={design.layers}
              editorMode={templateMode ? "template" : "customer"}
              maxLayers={maxAssetLayers}
              selectedId={selectedLayerId}
              selectedIds={selectedLayerIds}
              dragOverId={layerDragOverId}
              onDragOverId={setLayerDragOverId}
              onSelect={(id, additive) => focusDesignObject(id, additive)}
              onUpdate={updateAssetLayer}
              onReorder={reorderAssetLayer}
              onGroup={groupSelectedAssetLayers}
              onUngroup={ungroupSelectedAssetLayers}
              onAlign={alignSelectedAssetLayers}
              onDistribute={distributeSelectedAssetLayers}
            />

            <div className="undara-studio-preview-workspace">
              <StudioStageControls
                locale={locale}
                envelopeEnabled={design.sections.envelope !== false}
                stage={canvasStage}
                invitationLanguage={invitationLanguage}
                onInvitationLanguage={setInvitationLanguage}
                labels={{
                  envelope: copy.envelope,
                  cover: copy.cover,
                  envelopeHint: copy.envelopeHint,
                  coverHint: copy.coverHint,
                }}
                onEnvelope={() => {
                  setCanvasStage("envelope");
                  setPreviewVersion((value) => value + 1);
                }}
                onContent={() => { setCanvasStage("cover"); setActiveCanvasSectionId((current) => current === "envelope" ? canvasNavigationItems.find((item) => item.id !== "envelope")?.id ?? current : current); }}
              />
              <div className="undara-studio-preview-viewport" style={{ width: canvasNaturalSize.width * canvasZoom, height: canvasNaturalSize.height * canvasZoom }}>
              <div ref={previewSurfaceRef} className="undara-studio-preview-surface" data-asset-drop={assetDropReady} style={{ width: canvasNaturalSize.width, transform: `scale(${canvasZoom})`, transformOrigin: "top left" }}>
                <div key={`${design.template}-${design.sections.envelope !== false}-${previewVersion}`}>
                  <InvitationPreview
                    invitation={invitation}
                    invitationLanguage={invitationLanguage}
                    previewRecipientLine={invitationLanguage === "EN" ? "Dear : Mr [Name] and Mrs [Name]" : "Kepada Yth : Bapak [Nama] dan Ibu [Nama]"}
                    templateKey={design.template}
                    palette={palette}
                    fontPair={fontPair}
                    decorUrl={design.decor}
                    eventTag={eventTag}
                    dressCode={dressCode}
                    sections={canvasStage === "cover" ? { ...design.sections, envelope: false } : design.sections}
                    photoAssignments={design.photos}
                    activeCropSlot={cropModeSlot}
                    onCropPhoto={setPhotoCrop}
                    onFinishCrop={finishPhotoCrop}
                    designKey={designKey}
                    musicUrl={musicUrl}
                    selectedAssetLayerId={selectedLayerId}
                    selectedAssetLayerIds={selectedLayerIds}
                    onSelectAssetLayer={(id, additive) => focusDesignObject(id, Boolean(additive), true)}
                    onMoveAssetLayer={(id, x, y) => updateAssetLayer(id, { x, y })}
                    onUpdateAssetLayer={updateAssetLayer}
                    onEditPhoto={editPhotoFromCanvas}
                    onEnvelopeOpened={handleCanvasEnvelopeOpened}
                    editorMode={templateMode ? "template" : "customer"}
                    selectedSectionInstanceId={selectedSectionInstanceId}
                    onSelectSectionInstance={selectSectionInstance}
                    onMoveSectionInstance={moveSectionInstance}
                    onToggleSectionInstance={toggleSectionInstance}
                    onDuplicateSectionInstance={duplicateSectionInstance}
                    onDeleteSectionInstance={deleteSectionInstance}
                  />
                </div>
              </div>
              </div>
            </div>

            <StudioSelectionInspector
              locale={locale}
              design={design}
              selectedAssetLayer={selectedAssetLayer}
              selectedAssetIndex={selectedAssetIndex}
              maxAssetLayers={maxAssetLayers}
              selectedPhotoSlot={selectedPhotoSlot}
              onStartPhotoCrop={startPhotoCrop}
              photoAssets={invitation?.assets ?? []}
              photoEditingDisabled={!invitation || saving}
              selectedRsvpElementKey={selectedRsvpElementKey}
              selectedSectionElement={selectedSectionElement}
              selectedCopyField={selectedCopyField}
              selectedSectionKey={selectedSectionKey}
              selectedNativeKey={activeNativeKey}
              onUpdateNative={commitNativeVisual}
              onDeleteNative={hideSelectedNativeVisual}
              nativeEditingDisabled={!invitation || saving || audioBusy}
              onCloseNative={clearCanvasSelection}
              onCloseAsset={() => { setSelectedLayerIds([]); setSelectedLayerId(null); }}
              onUpdateAsset={updateAssetLayer}
              onPositionAsset={positionAssetLayer}
              onUpdatePhotoMotion={updatePhotoMotion}
              onSetPhotoFocus={setPhotoFocus}
              onSetPhotoCrop={setPhotoCrop}
              onResetPhotoCrop={resetPhotoCrop}
              onGallerySettings={updateGallerySettings}
              onReorderGallery={reorderGalleryPhoto}
              onResetPhotoMotion={resetPhotoMotion}
              onClosePhoto={clearCanvasSelection}
              onUpdateRsvpConfig={updateRsvpConfig}
              onCloseRsvp={() => setSelectedRsvpElementKey(null)}
              onUpdateSectionElementStyles={updateSectionElementStyles}
              onCloseSectionElement={() => setSelectedSectionElement(null)}
              onUpdateCopyMotion={updateCopyMotion}
              onResetCopyMotion={resetCopyMotion}
              onCloseCopy={() => setSelectedCopyField(null)}
              onUpdateSectionStyle={updateSectionStyle}
              onResetSectionStyle={resetSectionStyle}
              onCloseSection={() => { setSelectedSectionKey(null); setSelectedSectionInstanceId(null); }}
            />
          </div>
          <StudioNativeTransformHandles
            canvasRef={canvasScrollRef}
            targetKey={activeNativeKey}
            transform={activeNativeTransform}
            zoom={canvasZoom}
            revision={`${designKey}|${canvasStage}|${previewVersion}`}
            onCommit={commitNativeVisual}
          />
          </div>
          <StudioCanvasFooter
            locale={locale}
            items={canvasNavigationItems}
            activeId={canvasStage === "envelope" && design.sections.envelope !== false ? "envelope" : activeCanvasSectionId}
            zoom={canvasZoom}
            onNavigate={navigateCanvasSection}
            onZoomOut={() => changeCanvasZoom(canvasZoom - (canvasZoom <= 1 ? 0.1 : 0.25))}
            onZoomChange={(value) => changeCanvasZoom(value)}
            onResetZoom={() => changeCanvasZoom(1, true)}
            onFit={fitCanvasZoom}
            onZoomIn={() => changeCanvasZoom(canvasZoom + (canvasZoom < 1 ? 0.1 : 0.25))}
          />
        </div>
      </div>

      <StudioFinalPreviewDialog
        open={finalPreviewOpen}
        onOpenChange={setFinalPreviewOpen}
        invitation={invitation}
        design={design}
        designKey={designKey}
        musicUrl={musicUrl}
        eventTag={eventTag}
        dressCode={dressCode}
        locale={locale}
        invitationLanguage={invitationLanguage}
      />

      {notice && <footer className="undara-studio-status" role="status" aria-live="polite">{notice}</footer>}
    </section>
  );
}
