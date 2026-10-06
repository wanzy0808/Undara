"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { useDashboardI18n } from "@/components/Dashboard/useDashboardI18n";
import { displayTitleCase } from "@/lib/text/display-title-case";
import { formatPersonalEnvelopeAddress } from "@/lib/guests/personal-envelope";
import type { PersonalInvitationGuest } from "@/components/Dashboard/personal-invitation-types";

export type GuestInvitationForm = {
  recipientType: "INDIVIDUAL" | "COUPLE" | "FAMILY" | "GROUP";
  invitedPax: number;
  category: string;
  groupText: string;
  personalAddressee: string;
  personalGreeting: string;
  personalEnvelopeEnabled: boolean;
  personalLanguage: "ID" | "EN";
};

export const emptyGuestInvitationForm: GuestInvitationForm = {
  recipientType: "INDIVIDUAL",
  invitedPax: 1,
  category: "REGULAR",
  groupText: "",
  personalAddressee: "",
  personalGreeting: "",
  personalEnvelopeEnabled: true,
  personalLanguage: "ID",
};

export function guestInvitationFormFrom(guest: PersonalInvitationGuest): GuestInvitationForm {
  return {
    recipientType: guest.recipientType ?? "INDIVIDUAL",
    invitedPax: guest.invitedPax ?? 1,
    category: guest.category || "REGULAR",
    groupText: (guest.tags ?? []).join(", "),
    personalAddressee: guest.personalAddressee || "",
    personalGreeting: guest.personalGreeting || "",
    personalEnvelopeEnabled: guest.personalEnvelopeEnabled !== false,
    personalLanguage: guest.personalLanguage === "EN" ? "EN" : "ID",
  };
}

/** Category and grouping reuse Guest.category and Guest.tags, not new tables. */
export function guestInvitationProfilePayload(value: GuestInvitationForm) {
  return {
    recipientType: value.recipientType,
    invitedPax: value.invitedPax,
    category: value.category,
    tags: Array.from(new Set(value.groupText.split(",").map((item) => item.trim()).filter(Boolean))),
    personalAddressee: value.personalAddressee.trim(),
    personalGreeting: value.personalGreeting.trim(),
    personalEnvelopeEnabled: value.personalEnvelopeEnabled,
    personalLanguage: value.personalLanguage,
  };
}

export function PersonalInvitationGuestFields({
  value,
  guestName = "",
  onChange,
  disabled = false,
  compact = false,
  children,
}: {
  value: GuestInvitationForm;
  guestName?: string;
  onChange: (next: GuestInvitationForm) => void;
  disabled?: boolean;
  compact?: boolean;
  children?: ReactNode;
}) {
  const { d } = useDashboardI18n();
  const envelopePreview = formatPersonalEnvelopeAddress({
    name: guestName,
    personalAddressee: value.personalAddressee,
    recipientType: value.recipientType,
    personalEnvelopeEnabled: value.personalEnvelopeEnabled,
    personalLanguage: value.personalLanguage,
  });
  function set<K extends keyof GuestInvitationForm>(key: K, next: GuestInvitationForm[K]) {
    onChange({ ...value, [key]: next });
  }

  const mainFields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium text-foreground">
          {d("Jenis penerima")}
          <select
            value={value.recipientType}
            onChange={(event) => {
              const recipientType = event.target.value as GuestInvitationForm["recipientType"];
              onChange({
                ...value,
                recipientType,
                invitedPax: value.invitedPax === 1 && recipientType === "COUPLE" ? 2 : value.invitedPax,
              });
            }}
            disabled={disabled}
            className="mt-1.5 min-h-11 w-full border border-primary/25 bg-background px-3 text-sm text-foreground"
          >
            <option value="INDIVIDUAL">{d("Perorangan")}</option>
            <option value="COUPLE">{d("Pasangan")}</option>
            <option value="FAMILY">{d("Keluarga")}</option>
            <option value="GROUP">{d("Rombongan")}</option>
          </select>
        </label>
        <label className="block min-w-0 text-sm font-medium text-foreground">
          {d("Jumlah tamu yang diundang")}
          <Input
            type="number"
            min={1}
            max={30}
            step={1}
            value={value.invitedPax}
            onChange={(event) => set("invitedPax", Number(event.target.value))}
            disabled={disabled}
            className="mt-1.5"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {d("Batas RSVP, bukan jumlah yang sudah hadir.")}
          </span>
        </label>
      </div>
      <label className="block min-w-0 text-sm font-medium text-foreground">
        {d("Kategori tamu")}
        <select
          value={value.category}
          onChange={(event) => set("category", event.target.value)}
          disabled={disabled}
          className="mt-1.5 min-h-11 w-full border border-primary/25 bg-background px-3 text-sm text-foreground"
        >
          {value.category && !["REGULAR", "VIP", "VVIP"].includes(value.category) && (
            <option value={value.category}>{displayTitleCase(value.category)}</option>
          )}
          <option value="REGULAR">{d("Reguler")}</option>
          <option value="VIP">VIP</option>
          <option value="VVIP">VVIP</option>
        </select>
      </label>
    </>
  );
  const additionalFields = (
    <div className="space-y-4">
      <div className="rounded-[var(--undara-control-radius)] border border-primary/20 bg-primary/[.025] p-3">
        <label className="flex items-start justify-between gap-4">
          <span className="min-w-0">
            <strong className="block text-sm font-semibold text-foreground">{d("Tampilkan nama penerima di amplop")}</strong>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{d("Matikan untuk memakai amplop umum tanpa nama tamu.")}</span>
          </span>
          <input
            type="checkbox"
            checked={value.personalEnvelopeEnabled}
            onChange={(event) => set("personalEnvelopeEnabled", event.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 accent-primary"
            aria-label={d("Tampilkan nama penerima di amplop")}
          />
        </label>
        {value.personalEnvelopeEnabled && (
          <label className="mt-3 block min-w-0 text-sm font-medium text-foreground">
            {d("Bahasa sapaan amplop")}
            <select
              value={value.personalLanguage}
              onChange={(event) => set("personalLanguage", event.target.value as "ID" | "EN")}
              disabled={disabled}
              className="mt-1.5 min-h-10 w-full border border-primary/25 bg-background px-3 text-sm text-foreground"
            >
              <option value="ID">Indonesia</option>
              <option value="EN">English</option>
            </select>
          </label>
        )}
        {!compact && value.personalEnvelopeEnabled && (
          <p className="mt-3 break-words text-xs leading-5 text-muted-foreground" aria-live="polite">
            {envelopePreview || (value.recipientType === "COUPLE"
              ? value.personalLanguage === "EN" ? "Dear : Mr Andi and Mrs Sari" : "Kepada Yth : Bapak Andi dan Ibu Sari"
              : value.personalLanguage === "EN" ? "Dear : [Name]" : "Kepada Yth : [Nama]")}
          </p>
        )}
      </div>
      <label className="block min-w-0 text-sm font-medium text-foreground">
        {d("Nama di amplop (opsional)")}
        <Input
          value={value.personalAddressee}
          maxLength={160}
          onChange={(event) => set("personalAddressee", event.target.value)}
          placeholder={value.recipientType === "COUPLE" ? d("Contoh: Andi & Sari") : d("Contoh: Bapak Andi & Keluarga")}
          disabled={disabled || !value.personalEnvelopeEnabled}
          className="mt-1.5"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          {d("Kosongkan untuk memakai nama tamu di daftar.")}
          {value.recipientType === "COUPLE" && (
            <> {d("Untuk pasangan, tulis dua nama dengan tanda & agar sapaan Bapak/Ibu atau Mr/Mrs terbentuk otomatis.")}</>
          )}
        </span>
      </label>
      <label className="block min-w-0 text-sm font-medium text-foreground">
        {d("Kelompok tamu (opsional)")}
        <Input
          value={value.groupText}
          onChange={(event) => set("groupText", event.target.value)}
          placeholder={d("Keluarga, sahabat, rekan kerja")}
          disabled={disabled}
          className="mt-1.5"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          {d("Pisahkan beberapa kelompok dengan koma.")}
        </span>
      </label>
      <label className="block min-w-0 text-sm font-medium text-foreground">
        {d("Pesan khusus (opsional)")}
        <textarea
          value={value.personalGreeting}
          maxLength={280}
          onChange={(event) => set("personalGreeting", event.target.value)}
          placeholder={d("Sapaan atau pesan singkat untuk penerima")}
          disabled={disabled}
          rows={3}
          className="mt-1.5 min-h-24 w-full resize-y border border-primary/25 bg-background px-3 py-2.5 text-sm text-foreground"
        />
      </label>
    </div>
  );
  return compact ? (
    <details className="border-t border-primary/15 pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary">{d("Pengaturan tambahan")}</summary>
      <div className="mt-4 space-y-4">{children}{mainFields}{additionalFields}</div>
    </details>
  ) : (
    <div className="space-y-4">
      {children}{mainFields}
      <details className="border-t border-primary/15 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">{d("Pengaturan tambahan")}</summary>
        <div className="mt-4">{additionalFields}</div>
      </details>
    </div>
  );
}
