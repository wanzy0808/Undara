"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioCanvasToolbar({
  locale,
  inspectorOpen,
  templateName,
  invitationReady,
  saving,
  audioBusy,
  canUndo,
  canRedo,
  templateMode,
  savedTemplate = false,
  dirty,
  labels,
  onToggleInspector,
  onRestore,
  onUndo,
  onRedo,
  onPreview,
  onSave,
}: {
  locale: string;
  inspectorOpen: boolean;
  templateName: string;
  invitationReady: boolean;
  saving: boolean;
  audioBusy: boolean;
  canUndo: boolean;
  canRedo: boolean;
  templateMode: boolean;
  savedTemplate?: boolean;
  dirty: boolean;
  labels: {
    hidePanel: string;
    showPanel: string;
    replay: string;
    defaultsHint: string;
    undo: string;
    redo: string;
    preview: string;
    saving: string;
    save: string;
  };
  onToggleInspector: () => void;
  onRestore: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onSave: () => void;
}) {
  const busy = saving || audioBusy;

  return (
    <div className="undara-studio-canvas-toolbar">
      <button
        type="button"
        className="undara-studio-icon undara-studio-panel-toggle"
        onClick={onToggleInspector}
        aria-label={inspectorOpen ? labels.hidePanel : labels.showPanel}
        title={inspectorOpen ? labels.hidePanel : labels.showPanel}
      >
        {inspectorOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>

      <span className="min-w-0 flex-1 truncate text-sm">{templateName || "Studio"}</span>

      <Button
        size="icon-sm"
        onClick={onRestore}
        disabled={!invitationReady || busy}
        aria-label={labels.replay}
        title={labels.defaultsHint}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <div
        className="undara-studio-history-actions"
        role="group"
        aria-label={locale === "en" ? "Design history" : "Riwayat desain"}
      >
        <Button
          size="icon-sm"
          onClick={onUndo}
          disabled={!invitationReady || busy || !canUndo}
          aria-label={labels.undo}
          title={labels.undo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon-sm"
          onClick={onRedo}
          disabled={!invitationReady || busy || !canRedo}
          aria-label={labels.redo}
          title={labels.redo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onPreview}
        disabled={busy || !invitationReady}
        size="sm"
      >
        <Eye className="h-4 w-4" />
        {labels.preview}
      </Button>

      <Button
        onClick={onSave}
        disabled={busy || !invitationReady || (templateMode && !dirty)}
        size="sm"
      >
        <Save className="h-4 w-4" />
        {saving
          ? labels.saving
          : templateMode && !savedTemplate
            ? (locale === "en" ? "Save Draft" : "Simpan Draft")
            : labels.save}
      </Button>
    </div>
  );
}
