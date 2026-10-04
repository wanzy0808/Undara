"use client";

import { AlignCenter, AlignLeft, AlignRight, Lock, Play, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvitationFonts from "@/components/PublicInvitation/InvitationFonts";
import { invitationFontOptions } from "@/components/InvitationStudio/designer-config";
import { invitationFontFamily } from "@/lib/templates/presentation";
import {
  defaultNativeVisualTransform,
  nativeVisualCapabilities,
  nativeVisualCanHide,
  nativeVisualSelector,
  nativeVisualSupportsAnimation,
  nativeVisualUsesSystemContent,
  type NativeVisualTextAlign,
  type NativeVisualTransform,
} from "@/lib/templates/native-visual-transforms";
import {
  getSectionAnimationPreset,
  sectionAnimationGroups,
  sectionAnimationPresets,
  type InvitationSectionAnimation,
} from "@/lib/templates/section-animations";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const nativeFontFamilies = [...new Set(
  invitationFontOptions.flatMap(([, item]) => [item.heading, item.body]),
)].sort((a, b) => a.localeCompare(b));

export default function StudioNativeVisualInspector({
  locale, targetKey, value, onChange, onClose, onDelete, disabled = false,
}: {
  locale: string;
  targetKey: string;
  value?: NativeVisualTransform;
  onChange: (value: NativeVisualTransform) => void;
  onClose: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}) {
  const en = locale === "en";
  const current: NativeVisualTransform = { ...defaultNativeVisualTransform, ...value };
  const capabilities = nativeVisualCapabilities(targetKey);
  const animationCapable = nativeVisualSupportsAnimation(targetKey);
  const systemContent = nativeVisualUsesSystemContent(targetKey);
  const section = targetKey.split(":")[1] ?? "";
  const title = targetKey.startsWith("heading:")
    ? (en ? `${section} heading` : `Judul ${section}`)
    : targetKey.startsWith("photo:")
      ? (en ? "Photo frame" : "Bingkai foto")
      : (en ? "Visual element" : "Elemen visual");
  const fields = [
    { key: "x", label: "X", unit: "%", min: -2000, max: 2000, factor: 1 },
    { key: "y", label: "Y", unit: "%", min: -2000, max: 2000, factor: 1 },
    { key: "scaleX", label: en ? "Width" : "Lebar", unit: "%", min: 25, max: 300, factor: 100 },
    { key: "scaleY", label: en ? "Height" : "Tinggi", unit: "%", min: 25, max: 300, factor: 100 },
    { key: "rotation", label: en ? "Rotation" : "Rotasi", unit: "°", min: -180, max: 180, factor: 1 },
  ] as const;
  const colors = [
    { key: "color", label: en ? "Color" : "Warna", fallback: "#222222" },
    { key: "background", label: en ? "Background" : "Latar", fallback: "#ffffff" },
    { key: "borderColor", label: en ? "Border" : "Garis", fallback: "#c07a84" },
  ] as const;
  const aligns: { value: NativeVisualTextAlign; label: string; Icon: typeof AlignLeft }[] = [
    { value: "left", label: en ? "Align left" : "Rata kiri", Icon: AlignLeft },
    { value: "center", label: en ? "Align center" : "Rata tengah", Icon: AlignCenter },
    { value: "right", label: en ? "Align right" : "Rata kanan", Icon: AlignRight },
  ];

  function patch(patchValue: Partial<NativeVisualTransform>) {
    onChange({ ...current, ...patchValue });
  }

  function previewAnimation() {
    const selector = nativeVisualSelector(targetKey);
    const node = selector
      ? document.querySelector<HTMLElement>(`.undara-studio-preview-surface ${selector}`)
      : null;
    node?.getAnimations({ subtree: true }).forEach((animation) => {
      animation.cancel();
      animation.play();
    });
    node?.dispatchEvent(new Event("invitation-replay-motion"));
  }

  const animationPreset = getSectionAnimationPreset(current.animation);

  return (
    <aside className="undara-studio-layer-side undara-studio-native-inspector" aria-label={en ? "Visual properties" : "Properti visual"}>
      <InvitationFonts families={current.fontFamily ? [current.fontFamily] : []} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold capitalize text-primary">{title}</h3>
        <button type="button" onClick={onClose} aria-label={en ? "Close properties" : "Tutup properti"}
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-primary/10"><X size={16} /></button>
      </div>
      {systemContent && (
        <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
          <Lock size={13} className="mt-0.5 shrink-0 text-primary" />
          <span>{en ? "Content from event data" : "Isi dari data acara"}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {fields.map(({ key, label, unit, min, max, factor }) => (
          <label key={key} className="text-xs text-foreground">
            <span className="mb-1 block">{label}</span>
            <span className="flex items-center rounded-lg border border-primary/30 px-2">
              <input type="number" min={min} max={max} step={1}
                value={Math.round(current[key] * factor)}
                onChange={(event) => {
                  const number = Number(event.currentTarget.value);
                  if (!Number.isFinite(number)) return;
                  onChange({ ...current, [key]: clamp(number, min, max) / factor });
                }}
                className="h-9 min-w-0 w-full bg-transparent text-sm outline-none"
                aria-label={label} />
              <span className="text-xs text-muted-foreground">{unit}</span>
            </span>
          </label>
        ))}
      </div>

      {capabilities.opacity && (
        <label className="mt-4 block text-xs text-foreground">
          <span className="mb-1 flex items-center justify-between gap-2">
            <span>{en ? "Opacity" : "Opasitas"}</span>
            <output>{Math.round((current.opacity ?? 1) * 100)}%</output>
          </span>
          <input type="range" min="0.2" max="1" step="0.05"
            value={current.opacity ?? 1}
            onChange={(event) => patch({ opacity: Number(event.currentTarget.value) })}
            className="w-full" />
        </label>
      )}

      {capabilities.colors && (
        <div className="mt-4 space-y-3 border-t border-primary/20 pt-4">
          {colors.map(({ key, label, fallback }) => (
            <div key={key} className="text-xs text-foreground">
              <span className="mb-1 block">{label}</span>
              <div className="undara-studio-native-color">
                <input type="color" value={current[key] ?? fallback} aria-label={label}
                  onChange={(event) => patch({ [key]: event.currentTarget.value } as Partial<NativeVisualTransform>)}
                  className="h-9 w-12 rounded-lg border border-primary/30 bg-background p-1" />
                <output>{current[key]?.toUpperCase() ?? (en ? "Theme" : "Tema")}</output>
              </div>
            </div>
          ))}
        </div>
      )}

      {capabilities.typography && (
        <div className="mt-4 space-y-3 border-t border-primary/20 pt-4">
          <label className="block text-xs text-foreground">
            <span className="mb-1 block">Font</span>
            <select value={current.fontFamily ?? ""}
              style={{ fontFamily: current.fontFamily ? invitationFontFamily(current.fontFamily) : undefined }}
              onChange={(event) => patch({ fontFamily: event.currentTarget.value || undefined })}
              className="h-10 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background px-2 text-sm outline-none">
              <option value="">{en ? "Template font" : "Font template"}</option>
              {nativeFontFamilies.map((family) => (
                <option key={family} value={family} style={{ fontFamily: invitationFontFamily(family) }}>{family}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-foreground">
              <span className="mb-1 block">{en ? "Text size" : "Ukuran teks"}</span>
              <span className="flex items-center rounded-lg border border-primary/30 px-2">
                <input type="number" min={8} max={160} step={1}
                  value={current.fontSize ?? ""} placeholder="Template"
                  onChange={(event) => patch({ fontSize: event.currentTarget.value ? event.currentTarget.valueAsNumber : undefined })}
                  className="h-9 min-w-0 w-full bg-transparent text-sm outline-none" />
                <span className="text-xs text-muted-foreground">px</span>
              </span>
            </label>
            <label className="text-xs text-foreground">
              <span className="mb-1 block">{en ? "Weight" : "Ketebalan"}</span>
              <select value={current.fontWeight ?? ""}
                onChange={(event) => patch({ fontWeight: event.currentTarget.value ? Number(event.currentTarget.value) : undefined })}
                className="h-9 w-full rounded-lg border border-primary/30 bg-background px-2 text-sm outline-none">
                <option value="">Template</option>
                {[300,400,500,600,700,800,900].map((weight) => <option key={weight} value={weight}>{weight}</option>)}
              </select>
            </label>
          </div>

          <div className="text-xs text-foreground">
            <span className="mb-1 block">{en ? "Alignment" : "Perataan"}</span>
            <div className="undara-studio-align-icons" role="group" aria-label={en ? "Text alignment" : "Perataan teks"}>
              {aligns.map(({ value: align, label, Icon }) => (
                <button key={align} type="button" aria-pressed={current.textAlign === align}
                  aria-label={label} title={label}
                  onClick={() => patch({ textAlign: current.textAlign === align ? undefined : align })}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-foreground">
              <span className="mb-1 block">{en ? "Letter spacing" : "Jarak huruf"}</span>
              <span className="flex items-center rounded-lg border border-primary/30 px-2">
                <input type="number" min={-5} max={20} step={0.1}
                  value={current.letterSpacing ?? ""} placeholder="Template"
                  onChange={(event) => patch({ letterSpacing: event.currentTarget.value ? event.currentTarget.valueAsNumber : undefined })}
                  className="h-9 min-w-0 w-full bg-transparent text-sm outline-none" />
                <span className="text-xs text-muted-foreground">px</span>
              </span>
            </label>
            <label className="text-xs text-foreground">
              <span className="mb-1 block">{en ? "Line height" : "Jarak baris"}</span>
              <span className="flex items-center rounded-lg border border-primary/30 px-2">
                <input type="number" min={0.7} max={3} step={0.1}
                  value={current.lineHeight ?? ""} placeholder="Template"
                  onChange={(event) => patch({ lineHeight: event.currentTarget.value ? event.currentTarget.valueAsNumber : undefined })}
                  className="h-9 min-w-0 w-full bg-transparent text-sm outline-none" />
                <span className="text-xs text-muted-foreground">×</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {animationCapable && (
        <div className="mt-4 space-y-3 border-t border-primary/20 pt-4">
          <label className="block text-xs text-foreground">
            <span className="mb-1 block">{en ? "Animation" : "Animasi"}</span>
            <select
              value={current.animation && current.animation !== "none" ? current.animation : ""}
              onChange={(event) => {
                const animation = event.currentTarget.value as InvitationSectionAnimation | "";
                patch(animation
                  ? { animation, animationDuration: undefined }
                  : { animation: "none", animationDuration: undefined, animationDelay: undefined });
              }}
              className="h-10 w-full rounded-[var(--undara-control-radius)] border border-primary/30 bg-background px-2 text-sm outline-none"
            >
              <option value="">{en ? "No animation" : "Tanpa animasi"}</option>
              {sectionAnimationGroups.map((group) => (
                <optgroup key={group.key} label={en ? group.labelEn : group.labelId}>
                  {sectionAnimationPresets
                    .filter((item) => item.group === group.key)
                    .map((item) => (
                      <option key={item.key} value={item.key}>{en ? item.labelEn : item.labelId}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>

          {current.animation && current.animation !== "none" && (
            <>
              <button type="button" onClick={previewAnimation}
                className="flex min-h-9 w-full items-center justify-center gap-2 rounded-[var(--undara-control-radius)] border border-primary/30 px-3 text-xs font-medium text-primary hover:bg-primary/10">
                <Play size={13} aria-hidden="true" />
                {en ? "Preview animation" : "Preview animasi"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-foreground">
                  <span className="mb-1 block">{en ? "Duration" : "Durasi"}</span>
                  <span className="flex items-center rounded-lg border border-primary/30 px-2">
                    <input type="number" min={0.2} max={2.5} step={0.1}
                      value={current.animationDuration ?? animationPreset?.duration ?? 0.7}
                      onChange={(event) => {
                        const value = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(value)) patch({ animationDuration: clamp(value, 0.2, 2.5) });
                      }}
                      className="h-9 min-w-0 w-full bg-transparent text-sm outline-none" />
                    <span className="text-xs text-muted-foreground">s</span>
                  </span>
                </label>
                <label className="text-xs text-foreground">
                  <span className="mb-1 block">{en ? "Delay" : "Jeda"}</span>
                  <span className="flex items-center rounded-lg border border-primary/30 px-2">
                    <input type="number" min={0} max={2} step={0.1}
                      value={current.animationDelay ?? 0}
                      onChange={(event) => {
                        const value = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(value)) patch({ animationDelay: clamp(value, 0, 2) });
                      }}
                      className="h-9 min-w-0 w-full bg-transparent text-sm outline-none" />
                    <span className="text-xs text-muted-foreground">s</span>
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
      )}

      <button type="button" onClick={() => onChange(defaultNativeVisualTransform)}
        className="undara-studio-layer-reset mt-4">
        <RotateCcw size={14} />Reset
      </button>
      {onDelete && nativeVisualCanHide(targetKey) && (
        <Button type="button" size="sm" className="mt-2 w-full" disabled={disabled} onClick={onDelete}>
          <Trash2 size={14} aria-hidden="true" />{en ? "Delete" : "Hapus"}
        </Button>
      )}
    </aside>
  );
}
