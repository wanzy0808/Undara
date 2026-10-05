"use client";

import { RotateCcw } from "lucide-react";
import type { InvitationAssetLayer } from "@/lib/templates/asset-layers";
import { studioObjectSections, type StudioObjectSection } from "@/lib/templates/asset-layers";
import { invitationSectionItems, type InvitationSections } from "@/lib/templates/sections";
import LayerAnimationControls from "@/components/InvitationStudio/LayerAnimationControls";
import StudioColorField from "@/components/InvitationStudio/StudioColorField";

type AssetLayerInspectorProps = {
  locale: string;
  selectedAssetLayer: InvitationAssetLayer | undefined;
  selectedAssetIndex: number;
  layerCount: number;
  maxLayers: number;
  sections: InvitationSections;
  onDeselect: () => void;
  onUpdate: (id: string, patch: Partial<InvitationAssetLayer>) => void;
  onPosition: (id: string, position: "front" | "forward" | "backward" | "back") => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function LayerStackIcon({ action }: { action: "front" | "forward" | "backward" | "back" }) {
  const up = action === "front" || action === "forward";
  const edge = action === "front" || action === "back";
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
      <rect x="3.5" y="8.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "back" ? 1 : 0.38} />
      <rect x="6.5" y="5.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "forward" || action === "backward" ? 1 : 0.58} />
      <rect x="9.5" y="2.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "front" ? 1 : 0.78} />
      <path
        d={up ? "M18.5 18.5v-5m0 0-2 2m2-2 2 2" : "M18.5 13.5v5m0 0-2-2m2 2 2-2"}
        stroke="currentColor"
        strokeWidth={edge ? 1.8 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {edge && <path d={up ? "M16 11.5h5" : "M16 20.5h5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

export default function AssetLayerInspector({
  locale,
  selectedAssetLayer,
  selectedAssetIndex,
  layerCount,
  maxLayers,
  sections,
  onDeselect,
  onUpdate,
  onPosition,
}: AssetLayerInspectorProps) {
  if (!selectedAssetLayer) return null;
  const en = locale === "en";
  const section = selectedAssetLayer.section ?? "cover";

  const numberInput = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    suffix: string,
    update: (next: number) => void,
  ) => (
    <label className="undara-studio-layer-field">
      <span>{label}</span>
      <span className="undara-studio-layer-number">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isInteger(value) ? value : Number(value.toFixed(1))}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const next = event.currentTarget.valueAsNumber;
            if (Number.isFinite(next)) update(clamp(next, min, max));
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );

  const optionalNumberInput = (
    label: string,
    value: number | undefined,
    min: number,
    max: number,
    step: number,
    suffix: string,
    update: (next: number | undefined) => void,
  ) => (
    <label className="undara-studio-layer-field">
      <span>{label}</span>
      <span className="undara-studio-layer-number">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          placeholder={en ? "Auto" : "Otomatis"}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            if (!event.currentTarget.value) return update(undefined);
            const next = event.currentTarget.valueAsNumber;
            if (Number.isFinite(next)) update(clamp(next, min, max));
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );

  return (
    <aside className="undara-studio-layer-side" aria-label={en ? "Asset properties" : "Properti aset"}>
      <div className="undara-studio-layer-side-head">
        <strong>{selectedAssetLayer.kind === "shape" ? (en ? "Shape" : "Bentuk") : (en ? "Asset" : "Asset")} {selectedAssetIndex + 1}/{maxLayers}</strong>
        <button type="button" onClick={onDeselect} aria-label={en ? "Close asset properties" : "Tutup properti aset"} title={en ? "Close" : "Tutup"}>×</button>
      </div>

      <fieldset disabled={Boolean(selectedAssetLayer.locked)} className="contents disabled:opacity-55">
      <label className="undara-studio-layer-select">
        <span>{en ? "Section" : "Bagian"}</span>
        <select
          value={section}
          onChange={(event) => onUpdate(selectedAssetLayer.id, { section: event.target.value as StudioObjectSection })}
        >
          {invitationSectionItems
            .filter((item) => studioObjectSections.includes(item.key as StudioObjectSection) && (sections[item.key] !== false || item.key === section))
            .map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
        </select>
      </label>

      <div className="undara-studio-layer-grid">
        {numberInput("X", selectedAssetLayer.x, 0, 100, 0.1, "%", (x) => onUpdate(selectedAssetLayer.id, { x }))}
        {numberInput("Y", selectedAssetLayer.y, 0, 100, 0.1, "%", (y) => onUpdate(selectedAssetLayer.id, { y }))}
      </div>

      <div className="undara-studio-layer-field">
        <span>{en ? "Quick position" : "Posisi cepat"}</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(selectedAssetLayer.id, { x: 50 })}>{en ? "Center X" : "Tengah X"}</button>
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(selectedAssetLayer.id, { y: 50 })}>{en ? "Center Y" : "Tengah Y"}</button>
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(selectedAssetLayer.id, { x: 50, y: 50 })}>{en ? "Center" : "Tengah"}</button>
        </div>
      </div>

      <div className="undara-studio-layer-field">
        <span>{en ? "Flip" : "Balik"}</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" aria-pressed={Boolean(selectedAssetLayer.flipX)} onClick={() => onUpdate(selectedAssetLayer.id, { flipX: selectedAssetLayer.flipX ? undefined : true })}>{en ? "Horizontal" : "Horizontal"}</button>
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" aria-pressed={Boolean(selectedAssetLayer.flipY)} onClick={() => onUpdate(selectedAssetLayer.id, { flipY: selectedAssetLayer.flipY ? undefined : true })}>{en ? "Vertical" : "Vertikal"}</button>
        </div>
      </div>

      {selectedAssetLayer.kind !== "shape" && (
        <div className="space-y-3 border-t border-border pt-3">
          <StudioColorField locale={locale} label="Tint" value={selectedAssetLayer.color} fallback="#C07A84"
            defaultLabel={en ? "Original" : "Asli"} onChange={(color) => onUpdate(selectedAssetLayer.id, { color })} />
          <StudioColorField locale={locale} label={en ? "Background" : "Latar"} value={selectedAssetLayer.background}
            transparent defaultLabel={en ? "Transparent" : "Transparan"}
            onChange={(background) => onUpdate(selectedAssetLayer.id, { background })} />
          <StudioColorField locale={locale} label={en ? "Border" : "Garis"} value={selectedAssetLayer.borderColor}
            defaultLabel={en ? "None" : "Tanpa garis"} fallback="#C07A84"
            onChange={(borderColor) => onUpdate(selectedAssetLayer.id, { borderColor })} />
          {selectedAssetLayer.borderColor && numberInput(en ? "Border width" : "Tebal garis", selectedAssetLayer.borderWidth ?? 2, 0, 12, 0.5, "px", (borderWidth) => onUpdate(selectedAssetLayer.id, { borderWidth }))}
        </div>
      )}

      {selectedAssetLayer.kind === "shape" && (
        <div className="space-y-3 border-t border-border pt-3">
          <label className="undara-studio-layer-select">
            <span>{en ? "Shape" : "Bentuk"}</span>
            <select
              value={selectedAssetLayer.shape ?? "rectangle"}
              onChange={(event) => {
                const shape = event.target.value as "rectangle" | "circle" | "line";
                onUpdate(selectedAssetLayer.id, {
                  shape,
                  radius: shape === "circle" ? 100 : selectedAssetLayer.radius ?? 0,
                  strokeWidth: shape === "line" ? Math.max(1, selectedAssetLayer.strokeWidth ?? 2) : selectedAssetLayer.strokeWidth ?? 0,
                });
              }}
            >
              <option value="rectangle">{en ? "Rectangle" : "Kotak"}</option>
              <option value="circle">{en ? "Circle" : "Lingkaran"}</option>
              <option value="line">{en ? "Line" : "Garis"}</option>
            </select>
          </label>

          {selectedAssetLayer.shape !== "line" ? (
            <div className="undara-studio-layer-grid">
              <label className="undara-studio-layer-field">
                <span>{en ? "Fill" : "Isi"}</span>
                <input
                  type="color"
                  value={selectedAssetLayer.fill ?? "#C07A84"}
                  onChange={(event) => onUpdate(selectedAssetLayer.id, { fill: event.target.value })}
                  className="h-10 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background p-1"
                />
              </label>
              <label className="undara-studio-layer-field">
                <span>{en ? "Border" : "Garis tepi"}</span>
                <input
                  type="color"
                  value={selectedAssetLayer.stroke ?? "#C07A84"}
                  onChange={(event) => onUpdate(selectedAssetLayer.id, { stroke: event.target.value })}
                  className="h-10 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background p-1"
                />
              </label>
            </div>
          ) : (
            <label className="undara-studio-layer-field">
              <span>{en ? "Line color" : "Warna garis"}</span>
              <input
                type="color"
                value={selectedAssetLayer.stroke ?? "#C07A84"}
                onChange={(event) => onUpdate(selectedAssetLayer.id, { stroke: event.target.value })}
                className="h-10 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background p-1"
              />
            </label>
          )}

          {numberInput(
            selectedAssetLayer.shape === "line" ? (en ? "Thickness" : "Ketebalan") : (en ? "Border width" : "Tebal garis"),
            selectedAssetLayer.strokeWidth ?? (selectedAssetLayer.shape === "line" ? 2 : 0),
            0,
            12,
            0.5,
            "px",
            (strokeWidth) => onUpdate(selectedAssetLayer.id, { strokeWidth }),
          )}
          {selectedAssetLayer.shape === "rectangle" && numberInput(
            en ? "Corner radius" : "Radius sudut",
            selectedAssetLayer.radius ?? 0,
            0,
            100,
            1,
            "px",
            (radius) => onUpdate(selectedAssetLayer.id, { radius }),
          )}
        </div>
      )}

      {selectedAssetLayer.kind !== "shape" && selectedAssetLayer.kind !== "text" && numberInput(
        en ? "Corner radius" : "Radius sudut",
        selectedAssetLayer.radius ?? 0,
        0,
        100,
        1,
        "px",
        (radius) => onUpdate(selectedAssetLayer.id, { radius }),
      )}

      <div className="undara-studio-layer-field">
        <span>{en ? "Shadow" : "Bayangan"}</span>
        <button
          type="button"
          className="min-h-9 rounded-[var(--undara-control-radius)] border border-primary/30 px-3 text-xs hover:bg-primary/10"
          aria-pressed={(selectedAssetLayer.shadowOpacity ?? 0) > 0}
          onClick={() => onUpdate(selectedAssetLayer.id, {
            shadowOpacity: (selectedAssetLayer.shadowOpacity ?? 0) > 0 ? 0 : 0.22,
            shadowColor: selectedAssetLayer.shadowColor ?? "#000000",
            shadowX: selectedAssetLayer.shadowX ?? 0,
            shadowY: selectedAssetLayer.shadowY ?? 8,
            shadowBlur: selectedAssetLayer.shadowBlur ?? 18,
          })}
        >
          {(selectedAssetLayer.shadowOpacity ?? 0) > 0 ? (en ? "Shadow on" : "Bayangan aktif") : (en ? "Add shadow" : "Tambah bayangan")}
        </button>
      </div>

      {(selectedAssetLayer.shadowOpacity ?? 0) > 0 && (
        <div className="space-y-2 rounded-[var(--undara-control-radius)] border border-primary/20 p-2">
          <label className="undara-studio-layer-field">
            <span>{en ? "Shadow color" : "Warna bayangan"}</span>
            <input
              type="color"
              value={selectedAssetLayer.shadowColor ?? "#000000"}
              onChange={(event) => onUpdate(selectedAssetLayer.id, { shadowColor: event.target.value })}
              className="h-9 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background p-1"
            />
          </label>
          <div className="undara-studio-layer-grid">
            {numberInput("X", selectedAssetLayer.shadowX ?? 0, -50, 50, 1, "px", (shadowX) => onUpdate(selectedAssetLayer.id, { shadowX }))}
            {numberInput("Y", selectedAssetLayer.shadowY ?? 8, -50, 50, 1, "px", (shadowY) => onUpdate(selectedAssetLayer.id, { shadowY }))}
          </div>
          {numberInput(en ? "Blur" : "Blur", selectedAssetLayer.shadowBlur ?? 18, 0, 60, 1, "px", (shadowBlur) => onUpdate(selectedAssetLayer.id, { shadowBlur }))}
          <label className="undara-studio-layer-opacity">
            <span>{en ? "Shadow opacity" : "Opasitas bayangan"} <output>{Math.round((selectedAssetLayer.shadowOpacity ?? 0.22) * 100)}%</output></span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={selectedAssetLayer.shadowOpacity ?? 0.22}
              onChange={(event) => onUpdate(selectedAssetLayer.id, { shadowOpacity: Number(event.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="undara-studio-layer-grid">
        {numberInput(en ? "Width" : "Lebar", selectedAssetLayer.width, 5, 85, 0.1, "%", (width) => onUpdate(selectedAssetLayer.id, { width }))}
        {optionalNumberInput(en ? "Height" : "Tinggi", selectedAssetLayer.height, 3, 200, 0.1, "%", (height) => onUpdate(selectedAssetLayer.id, { height }))}
      </div>
      {numberInput(en ? "Rotation" : "Rotasi", selectedAssetLayer.rotation ?? 0, -180, 180, 1, "°", (rotation) => onUpdate(selectedAssetLayer.id, { rotation }))}

      <label className="undara-studio-layer-opacity">
        <span>{en ? "Opacity" : "Opasitas"} <output>{Math.round(selectedAssetLayer.opacity * 100)}%</output></span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={selectedAssetLayer.opacity}
          aria-label={en ? "Asset opacity" : "Opasitas aset"}
          onChange={(event) => onUpdate(selectedAssetLayer.id, { opacity: Number(event.target.value) })}
        />
      </label>

      <LayerAnimationControls locale={locale} layer={selectedAssetLayer} onUpdate={onUpdate} />

      <div className="undara-studio-layer-field">
        <span>{en ? "Layer order" : "Urutan layer"}</span>
        <div className="undara-studio-layer-order" role="group" aria-label={en ? "Layer order" : "Urutan layer"}>
          <button
            type="button"
            onClick={() => onPosition(selectedAssetLayer.id, "front")}
            disabled={selectedAssetIndex === layerCount - 1}
            aria-label={en ? "Bring to front" : "Paling depan"}
            title={en ? "Bring to Front" : "Paling depan"}
          >
            <LayerStackIcon action="front" />
          </button>
          <button
            type="button"
            onClick={() => onPosition(selectedAssetLayer.id, "forward")}
            disabled={selectedAssetIndex === layerCount - 1}
            aria-label={en ? "Bring forward one layer" : "Naik 1 layer"}
            title={en ? "Bring Forward" : "Naik 1 layer"}
          >
            <LayerStackIcon action="forward" />
          </button>
          <button
            type="button"
            onClick={() => onPosition(selectedAssetLayer.id, "backward")}
            disabled={selectedAssetIndex === 0}
            aria-label={en ? "Send backward one layer" : "Turun 1 layer"}
            title={en ? "Send Backward" : "Turun 1 layer"}
          >
            <LayerStackIcon action="backward" />
          </button>
          <button
            type="button"
            onClick={() => onPosition(selectedAssetLayer.id, "back")}
            disabled={selectedAssetIndex === 0}
            aria-label={en ? "Send to back" : "Paling belakang"}
            title={en ? "Send to Back" : "Paling belakang"}
          >
            <LayerStackIcon action="back" />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="undara-studio-layer-reset"
        onClick={() => onUpdate(selectedAssetLayer.id, {
          x: 50,
          y: selectedAssetLayer.section === "envelope" ? 38 : 42,
          width: selectedAssetLayer.kind === "shape" ? (selectedAssetLayer.shape === "line" ? 42 : 38) : 28,
          height: selectedAssetLayer.kind === "shape" ? (selectedAssetLayer.shape === "circle" ? 28 : selectedAssetLayer.shape === "line" ? 3 : 22) : undefined,
          opacity: 1,
          rotation: 0,
          flipX: undefined,
          flipY: undefined,
          color: undefined,
          background: undefined,
          borderColor: undefined,
          borderWidth: undefined,
          fill: undefined,
          stroke: undefined,
          strokeWidth: undefined,
          shadowX: undefined,
          shadowY: undefined,
          shadowBlur: undefined,
          shadowColor: undefined,
          shadowOpacity: undefined,
          animation: undefined,
          animationDuration: undefined,
          animationDelay: undefined,
        })}
      >
        <RotateCcw size={14} />
        Reset
      </button>
      </fieldset>
    </aside>
  );
}
