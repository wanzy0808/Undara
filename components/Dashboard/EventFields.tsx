"use client";

import { FloatingField } from "@/components/ui/floating-field";
import { useId, useRef, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import {
  displayDateToIso,
  formatDateInput,
  formatTimeInput,
  isValidTime24,
  isoDateToDisplay,
} from "@/components/Dashboard/event-panel-helpers";
import {
  weddingParentLine,
  type WeddingChildKind,
  type WeddingChildPosition,
} from "@/lib/events/parents";

const timeHours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const timeMinutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

export function WeddingFamilyFields({
  title,
  kind,
  father,
  mother,
  order,
  position,
  onPosition,
  onFather,
  onMother,
  onOrder,
}: {
  title: string;
  kind: WeddingChildKind;
  father: string;
  mother: string;
  order: string;
  position: WeddingChildPosition | "";
  onPosition: (value: WeddingChildPosition) => void;
  onFather: (value: string) => void;
  onMother: (value: string) => void;
  onOrder: (value: string) => void;
}) {
  const { d } = useDashboardI18n();
  const parsedOrder = order.trim() ? Number(order) : null;
  const familyLine = weddingParentLine(
    father,
    mother,
    Number.isInteger(parsedOrder) ? parsedOrder : null,
    kind,
    position || null,
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">{title}</p>
      <ChildOrderField value={order} position={position} onPosition={onPosition} onChange={onOrder} />
      <EventField label={d("Nama bapak")} value={father} onChange={onFather} />
      <EventField label={d("Nama ibu")} value={mother} onChange={onMother} />
      {familyLine && (
        <p className="rounded-lg border border-border/70 bg-background px-3 py-2 text-[11px] leading-5 text-muted-foreground">
          {familyLine}
        </p>
      )}
    </div>
  );
}

function ChildOrderField({
  value,
  position,
  onPosition,
  onChange,
}: {
  value: string;
  position: WeddingChildPosition | "";
  onPosition: (value: WeddingChildPosition) => void;
  onChange: (value: string) => void;
}) {
  const { d } = useDashboardI18n();
  const fieldId = useId();
  const options: { value: WeddingChildPosition; label: string }[] = [
    { value: "ELDEST", label: d("Anak Tertua") },
    { value: "YOUNGEST", label: d("Anak Termuda") },
    { value: "NUMBER", label: d("Anak Keberapa") },
  ];

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-xs font-semibold">{d("Urutan Anak")} ({d("opsional")})</legend>
      <div className="flex flex-wrap gap-2" role="group">
        {options.map((option) => (
          <label key={option.value} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${position === option.value ? "border-primary bg-primary/10 text-foreground" : "border-primary/30 text-foreground hover:border-primary"}`}>
            <input
              type="radio"
              name={`child-position-${fieldId}`}
              checked={position === option.value}
              onChange={() => onPosition(option.value)}
              className="size-4 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
      {position === "NUMBER" && (
        <FloatingField label={d("Anak Keberapa")} className="block">
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={d("Contoh: 2")}
          />
        </FloatingField>
      )}
    </fieldset>
  );
}

export function EventDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { d } = useDashboardI18n();
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const isoValue = displayDateToIso(value);

  function openCalendar() {
    const picker = pickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") picker.showPicker();
    else picker.click();
  }

  return (
    <div>
      <div className="relative flex items-end gap-2">
        <FloatingField label={label} className="min-w-0 flex-1">
          <Input
            inputMode="numeric"
            maxLength={10}
            value={value}
            onChange={(event) => onChange(formatDateInput(event.target.value))}
            placeholder="dd/mm/yyyy"
          />
        </FloatingField>
        <Button
          type="button"
          size="icon"
          onClick={openCalendar}
          aria-label={d("Pilih tanggal")}
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
        <input
          ref={pickerRef}
          type="date"
          value={isoValue}
          onChange={(event) => onChange(isoDateToDisplay(event.target.value))}
          className="pointer-events-none absolute right-0 top-0 h-11 w-11 opacity-0"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

export function EventTimeField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { d } = useDashboardI18n();
  const [open, setOpen] = useState(false);
  const [hour, minute] = isValidTime24(value)
    ? value.split(":")
    : ["00", "00"];

  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <FloatingField label={label} className="min-w-0 flex-1">
          <Input
            disabled={disabled}
            inputMode="numeric"
            maxLength={5}
            value={value}
            onChange={(event) => onChange(formatTimeInput(event.target.value))}
            placeholder="00:00"
            className="font-[family-name:var(--font-undara-mono)]"
          />
        </FloatingField>
        <Button
          type="button"
          size="icon"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          aria-label={d("Pilih waktu")}
        >
          <Clock3 className="h-4 w-4" />
        </Button>
      </div>

      {open && !disabled && (
        <div className="absolute right-0 z-40 mt-2 grid w-full min-w-52 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-border bg-background p-3 shadow-xl">
          <select
            data-dc-native-chevron="true"
            value={hour}
            onChange={(event) =>
              onChange(`${event.target.value}:${minute}`)
            }
            className="h-11 rounded-[10px] border border-border bg-background px-2 text-sm"
          >
            {timeHours.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <span>:</span>
          <select
            data-dc-native-chevron="true"
            value={minute}
            onChange={(event) =>
              onChange(`${hour}:${event.target.value}`)
            }
            className="h-11 rounded-[10px] border border-border bg-background px-2 text-sm"
          >
            {timeMinutes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="col-span-3"
            onClick={() => setOpen(false)}
          >
            {d("Selesai memilih")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function EventField({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <FloatingField label={label} className="block">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </FloatingField>
  );
}

export function EventTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FloatingField label={label} className="block">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full resize-y rounded-[10px] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </FloatingField>
  );
}
