"use client";

import { AlignCenter, AlignLeft, AlignRight, RotateCcw } from "lucide-react";
import { invitationSectionItems, type InvitationSections } from "@/lib/templates/sections";
import LayerAnimationControls from "@/components/InvitationStudio/LayerAnimationControls";
import {
  studioObjectSections,
  type InvitationAssetLayer,
  type StudioObjectSection,
} from "@/lib/templates/asset-layers";
import { invitationFontFamily } from "@/lib/templates/presentation";
import InvitationFonts from "@/components/PublicInvitation/InvitationFonts";
import { invitationFontOptions } from "@/components/InvitationStudio/designer-config";
import StudioColorField from "@/components/InvitationStudio/StudioColorField";

type Props = {
  locale: string;
  layer: InvitationAssetLayer;
  selectedIndex: number;
  layerCount: number;
  maxLayers: number;
  sections: InvitationSections;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<InvitationAssetLayer>) => void;
  onPosition: (id: string, position: "front" | "forward" | "backward" | "back") => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const studioTextFontFamilies = [...new Set(invitationFontOptions.flatMap(([, item]) => [item.heading, item.body]))].sort((a, b) => a.localeCompare(b));

function LayerStackIcon({ action }: { action: "front" | "forward" | "backward" | "back" }) {
  const up = action === "front" || action === "forward";
  const edge = action === "front" || action === "back";
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
      <rect x="3.5" y="8.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "back" ? 1 : 0.38} />
      <rect x="6.5" y="5.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "forward" || action === "backward" ? 1 : 0.58} />
      <rect x="9.5" y="2.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity={action === "front" ? 1 : 0.78} />
      <path d={up ? "M18.5 18.5v-5m0 0-2 2m2-2 2 2" : "M18.5 13.5v5m0 0-2-2m2 2 2-2"} stroke="currentColor" strokeWidth={edge ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
      {edge && <path d={up ? "M16 11.5h5" : "M16 20.5h5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

export default function TextLayerInspector({
  locale,
  layer,
  selectedIndex,
  layerCount,
  maxLayers,
  sections,
  onClose,
  onUpdate,
  onPosition,
}: Props) {
  const en = locale === "en";
  const section = layer.section ?? "cover";
  const family = layer.fontFamily ?? "";
  const align = layer.textAlign ?? "center";

  const numberInput = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    suffix: string,
    patch: (value: number) => Partial<InvitationAssetLayer>,
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
            if (Number.isFinite(next)) onUpdate(layer.id, patch(clamp(next, min, max)));
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
    patch: (value: number | undefined) => Partial<InvitationAssetLayer>,
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
            if (!event.currentTarget.value) return onUpdate(layer.id, patch(undefined));
            const next = event.currentTarget.valueAsNumber;
            if (Number.isFinite(next)) onUpdate(layer.id, patch(clamp(next, min, max)));
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );

  return (
    <aside className="undara-studio-layer-side undara-studio-text-side" aria-label={en ? "Text properties" : "Properti teks"}>
      <InvitationFonts families={studioTextFontFamilies} />
      <div className="undara-studio-layer-side-head">
        <strong>{en ? "Text box" : "Kotak teks"}</strong>
        <button type="button" onClick={onClose} aria-label={en ? "Close text properties" : "Tutup properti teks"} title={en ? "Close" : "Tutup"}>×</button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{en ? "Double-click text to type." : "Klik dua kali teks untuk mengetik."}</p>

      <fieldset disabled={Boolean(layer.locked)} className="contents disabled:opacity-55">
      <label className="undara-studio-layer-select">
        <span>{en ? "Section" : "Bagian"}</span>
        <select value={section} onChange={(event) => onUpdate(layer.id, { section: event.target.value as StudioObjectSection })}>
          {invitationSectionItems
            .filter((item) => studioObjectSections.includes(item.key as StudioObjectSection) && (sections[item.key] !== false || item.key === section))
            .map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
        </select>
      </label>

      <label className="undara-studio-layer-select undara-studio-text-font">
        <span>{en ? "Font" : "Font"}</span>
        <select
          value={family}
          style={{ fontFamily: family ? invitationFontFamily(family) : undefined }}
          onChange={(event) => onUpdate(layer.id, { fontFamily: event.target.value || undefined })}
        >
          <option value="">{en ? "Template font" : "Font template"}</option>
          {studioTextFontFamilies.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
      </label>

      <div className="undara-studio-layer-grid">
        {numberInput(en ? "Size" : "Ukuran", layer.fontSize ?? 24, 10, 144, 1, "px", (fontSize) => ({ fontSize }))}
        <label className="undara-studio-layer-select">
          <span>{en ? "Weight" : "Ketebalan"}</span>
          <select value={layer.fontWeight ?? 400} onChange={(event) => onUpdate(layer.id, { fontWeight: Number(event.target.value) })}>
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
            <option value="800">Extra Bold</option>
            <option value="900">Black</option>
          </select>
        </label>
      </div>

      <div className="undara-studio-layer-field">
        <span>{en ? "Alignment" : "Perataan"}</span>
        <div className="undara-studio-align-icons" role="group" aria-label={en ? "Text alignment" : "Perataan teks"}>
          {[
            ["left", en ? "Align left" : "Rata kiri", AlignLeft],
            ["center", en ? "Align center" : "Rata tengah", AlignCenter],
            ["right", en ? "Align right" : "Rata kanan", AlignRight],
          ].map(([value, label, Icon]) => {
            const AlignmentIcon = Icon as typeof AlignLeft;
            return (
              <button
                key={String(value)}
                type="button"
                aria-pressed={align === value}
                aria-label={String(label)}
                title={String(label)}
                onClick={() => onUpdate(layer.id, { textAlign: value as "left" | "center" | "right" })}
              >
                <AlignmentIcon size={15} />
              </button>
            );
          })}
        </div>
      </div>

      <StudioColorField locale={locale} label={en ? "Text color" : "Warna teks"} value={layer.color}
        fallback="#C07A84" defaultLabel="#C07A84" onChange={(color) => onUpdate(layer.id, { color })} />
      <StudioColorField locale={locale} label={en ? "Background" : "Latar"} value={layer.background}
        transparent defaultLabel={en ? "Transparent" : "Transparan"}
        onChange={(background) => onUpdate(layer.id, { background })} />
      <StudioColorField locale={locale} label={en ? "Border" : "Garis"} value={layer.borderColor}
        defaultLabel={en ? "None" : "Tanpa garis"} fallback="#C07A84"
        onChange={(borderColor) => onUpdate(layer.id, { borderColor })} />
      {layer.borderColor && numberInput(en ? "Border width" : "Tebal garis", layer.borderWidth ?? 2, 0, 12, 0.5, "px", (borderWidth) => ({ borderWidth }))}

      <div className="undara-studio-layer-grid">
        {numberInput(en ? "Letter spacing" : "Jarak huruf", layer.letterSpacing ?? 0, -2, 12, 0.1, "px", (letterSpacing) => ({ letterSpacing }))}
        {numberInput(en ? "Line height" : "Jarak baris", layer.lineHeight ?? 1.2, 0.8, 2.5, 0.1, "×", (lineHeight) => ({ lineHeight }))}
      </div>

      <div className="undara-studio-layer-grid">
        {numberInput("X", layer.x, 0, 100, 0.1, "%", (x) => ({ x }))}
        {numberInput("Y", layer.y, 0, 100, 0.1, "%", (y) => ({ y }))}
      </div>

      <div className="undara-studio-layer-field">
        <span>{en ? "Quick position" : "Posisi cepat"}</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(layer.id, { x: 50 })}>{en ? "Center X" : "Tengah X"}</button>
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(layer.id, { y: 50 })}>{en ? "Center Y" : "Tengah Y"}</button>
          <button type="button" className="min-h-9 rounded-lg border border-primary/30 px-2 text-xs hover:bg-primary/10" onClick={() => onUpdate(layer.id, { x: 50, y: 50 })}>{en ? "Center" : "Tengah"}</button>
        </div>
      </div>
      <div className="undara-studio-layer-field">
        <span>{en ? "Shadow" : "Bayangan"}</span>
        <button
          type="button"
          className="min-h-9 rounded-[var(--undara-control-radius)] border border-primary/30 px-3 text-xs hover:bg-primary/10"
          aria-pressed={(layer.shadowOpacity ?? 0) > 0}
          onClick={() => onUpdate(layer.id, {
            shadowOpacity: (layer.shadowOpacity ?? 0) > 0 ? 0 : 0.22,
            shadowColor: layer.shadowColor ?? "#000000",
            shadowX: layer.shadowX ?? 0,
            shadowY: layer.shadowY ?? 6,
            shadowBlur: layer.shadowBlur ?? 12,
          })}
        >
          {(layer.shadowOpacity ?? 0) > 0 ? (en ? "Shadow on" : "Bayangan aktif") : (en ? "Add shadow" : "Tambah bayangan")}
        </button>
      </div>

      {(layer.shadowOpacity ?? 0) > 0 && (
        <div className="space-y-2 rounded-[var(--undara-control-radius)] border border-primary/20 p-2">
          <label className="undara-studio-layer-field">
            <span>{en ? "Shadow color" : "Warna bayangan"}</span>
            <input
              type="color"
              value={layer.shadowColor ?? "#000000"}
              onChange={(event) => onUpdate(layer.id, { shadowColor: event.target.value })}
              className="h-9 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background p-1"
            />
          </label>
          <div className="undara-studio-layer-grid">
            {numberInput("X", layer.shadowX ?? 0, -50, 50, 1, "px", (shadowX) => ({ shadowX }))}
            {numberInput("Y", layer.shadowY ?? 6, -50, 50, 1, "px", (shadowY) => ({ shadowY }))}
          </div>
          {numberInput(en ? "Blur" : "Blur", layer.shadowBlur ?? 12, 0, 60, 1, "px", (shadowBlur) => ({ shadowBlur }))}
          <label className="undara-studio-layer-opacity">
            <span>{en ? "Shadow opacity" : "Opasitas bayangan"} <output>{Math.round((layer.shadowOpacity ?? 0.22) * 100)}%</output></span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={layer.shadowOpacity ?? 0.22}
              onChange={(event) => onUpdate(layer.id, { shadowOpacity: Number(event.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="undara-studio-layer-grid">
        {numberInput(en ? "Width" : "Lebar", layer.width, 5, 85, 0.1, "%", (width) => ({ width }))}
        {optionalNumberInput(en ? "Height" : "Tinggi", layer.height, 3, 200, 0.1, "%", (height) => ({ height }))}
      </div>
      {numberInput(en ? "Rotation" : "Rotasi", layer.rotation ?? 0, -180, 180, 1, "°", (rotation) => ({ rotation }))}

      <label className="undara-studio-layer-opacity">
        <span>{en ? "Opacity" : "Opasitas"} <output>{Math.round(layer.opacity * 100)}%</output></span>
        <input type="range" min="0" max="1" step="0.05" value={layer.opacity} onChange={(event) => onUpdate(layer.id, { opacity: Number(event.target.value) })} />
      </label>

      <LayerAnimationControls locale={locale} layer={layer} onUpdate={onUpdate} />

      <div className="undara-studio-layer-field">
        <span>{en ? "Layer order" : "Urutan layer"}</span>
        <div className="undara-studio-layer-order" role="group" aria-label={en ? "Layer order" : "Urutan layer"}>
          <button type="button" onClick={() => onPosition(layer.id, "front")} disabled={selectedIndex === layerCount - 1} aria-label={en ? "Bring to front" : "Paling depan"} title={en ? "Bring to Front" : "Paling depan"}><LayerStackIcon action="front" /></button>
          <button type="button" onClick={() => onPosition(layer.id, "forward")} disabled={selectedIndex === layerCount - 1} aria-label={en ? "Bring forward" : "Naik 1 layer"} title={en ? "Bring Forward" : "Naik 1 layer"}><LayerStackIcon action="forward" /></button>
          <button type="button" onClick={() => onPosition(layer.id, "backward")} disabled={selectedIndex === 0} aria-label={en ? "Send backward" : "Turun 1 layer"} title={en ? "Send Backward" : "Turun 1 layer"}><LayerStackIcon action="backward" /></button>
          <button type="button" onClick={() => onPosition(layer.id, "back")} disabled={selectedIndex === 0} aria-label={en ? "Send to back" : "Paling belakang"} title={en ? "Send to Back" : "Paling belakang"}><LayerStackIcon action="back" /></button>
        </div>
      </div>

      <button
        type="button"
        className="undara-studio-layer-reset"
        onClick={() => onUpdate(layer.id, {
          x: 50,
          y: 42,
          width: 55,
          height: undefined,
          opacity: 1,
          rotation: 0,
          fontSize: 24,
          fontRole: "heading",
          fontFamily: undefined,
          fontWeight: 400,
          textAlign: "center",
          letterSpacing: 0,
          lineHeight: 1.2,
          color: undefined,
          background: undefined,
          borderColor: undefined,
          borderWidth: undefined,
          shadowX: undefined,
          shadowY: undefined,
          shadowBlur: undefined,
          shadowColor: undefined,
          shadowOpacity: undefined,
          animation: undefined,
          animationDuration: undefined,
          animationDelay: undefined,
          textAnimationUnit: undefined,
          animationStagger: undefined,
        })}
      >
        <RotateCcw size={14} />
        Reset
      </button>

      <p className="undara-studio-text-counter">{selectedIndex + 1}/{maxLayers}</p>
      </fieldset>
    </aside>
  );
}
