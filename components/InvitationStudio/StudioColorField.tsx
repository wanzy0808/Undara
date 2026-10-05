"use client";

import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeVisualColor } from "@/lib/templates/visual-colors";

export default function StudioColorField({
  locale, label, value, fallback = "#ffffff", transparent = false,
  defaultLabel, resetDisabled, onChange,
}: {
  locale: string;
  label: string;
  value?: string;
  fallback?: string;
  transparent?: boolean;
  defaultLabel?: string;
  resetDisabled?: boolean;
  onChange: (color: string | undefined) => void;
}) {
  const id = useId();
  const en = locale === "en";
  return (
    <div className="space-y-1 text-xs text-foreground">
      <label htmlFor={id} className="block font-medium">{label}</label>
      <div className="flex min-w-0 items-center gap-2">
        <input id={id} type="color" value={safeVisualColor(value) ?? fallback}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-primary/30 bg-background p-1" />
        <output className="min-w-0 flex-1 truncate text-right font-semibold text-muted-foreground">
          {value === "transparent" ? (en ? "Transparent" : "Transparan") : value?.toUpperCase() ?? defaultLabel ?? (en ? "Theme" : "Tema")}
        </output>
        <Button type="button" size="sm" className="h-9 w-9 shrink-0 px-0" disabled={resetDisabled ?? !value}
          aria-label={`Reset ${label}`} title={`Reset ${label}`} onClick={() => onChange(undefined)}>
          <RotateCcw size={14} aria-hidden="true" />
        </Button>
      </div>
      {transparent && (
        <label className="flex min-h-9 cursor-pointer items-center gap-2">
          <input type="checkbox" checked={value === "transparent"}
            onChange={(event) => onChange(event.currentTarget.checked ? "transparent" : undefined)} />
          {en ? "Transparent" : "Transparan"}
        </label>
      )}
    </div>
  );
}
