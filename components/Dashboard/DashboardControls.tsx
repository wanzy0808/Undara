"use client";

import { FloatingField } from "@/components/ui/floating-field";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardMenuItem({
  icon: Icon,
  text,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  text: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`undara-dashboard-account-menu-item h-10 w-full min-w-0 justify-start rounded-[10px] border border-border/70 bg-background px-3 text-left text-xs shadow-none ${
        danger
          ? "text-red-700 hover:border-red-500/25 hover:bg-red-500/5 dark:text-red-300"
          : "text-foreground hover:border-primary/25 hover:bg-primary/[0.06] hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {text}
    </Button>
  );
}

export function DashboardField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <FloatingField label={label} className="block">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-border bg-transparent"
      />
    </FloatingField>
  );
}
