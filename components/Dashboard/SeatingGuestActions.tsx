"use client";

import { Menu } from "@base-ui/react/menu";
import { GripVertical, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "./useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import type { SeatingGuest } from "./seating-chart-types";

export default function SeatingGuestActions({ guest, disabled, onEdit, onDelete }: {
  guest: SeatingGuest;
  disabled: boolean;
  onEdit: (guest: SeatingGuest) => void;
  onDelete: (guest: SeatingGuest) => void;
}) {
  const { d } = useDashboardI18n();
  return (
    <Menu.Root>
      <Menu.Trigger disabled={disabled} draggable={false}
        aria-label={`${d("Aksi tamu")}: ${displayTitleCase(guest.name)}`}
        onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
        render={<Button type="button" variant="ghost" size="icon-sm" className="min-h-11 min-w-11 shrink-0 text-muted-foreground" />}
      >
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className={cn(controlStyles.menu, "static w-36 max-w-[calc(100vw-2rem)] outline-none")}>
            <Menu.Item disabled={disabled} onClick={() => { if (!disabled) onEdit(guest); }}
              className={cn(controlStyles.option, "cursor-pointer gap-2 border-transparent px-3 text-sm data-highlighted:bg-primary/10")}>
              <PencilLine aria-hidden="true" className="h-4 w-4" />{d("Edit")}
            </Menu.Item>
            <Menu.Item disabled={disabled} onClick={() => { if (!disabled) onDelete(guest); }}
              className={cn(controlStyles.option, "cursor-pointer gap-2 border-transparent px-3 text-sm text-destructive data-highlighted:bg-destructive/10")}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />{d("Hapus")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
