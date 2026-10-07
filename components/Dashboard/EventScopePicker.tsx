"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { FloatingField } from "@/components/ui/floating-field";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";

export type EventScopeOption = {
  id: string;
  title: string;
  venue: string;
  eventDate: string;
  isPublished: boolean;
};

type Props = {
  events: EventScopeOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
};

export default function EventScopePicker({ events, value, onChange, disabled = false, label }: Props) {
  const { d } = useDashboardI18n();

  if (!events.length) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">{d("Belum ada acara")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="relative">
        <FloatingField label={label ?? d("Pilih acara")}>
          <select
            data-dc-native-chevron="true"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            aria-label={label ?? d("Pilih acara")}
            className="min-h-11 w-full appearance-none border border-primary/25 bg-background px-4 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {displayTitleCase(event.title.trim() || d("Acara tanpa judul"))}
              </option>
            ))}
          </select>
        </FloatingField>
        <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+4px)] h-4 w-4 -translate-y-1/2 text-primary" aria-hidden="true" />
      </div>
    </div>
  );
}
