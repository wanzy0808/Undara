"use client";

import { useState, type ReactNode } from "react";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { invitationText, type InvitationLanguage } from "@/lib/invitations/language";
import { RotateCcw } from "lucide-react";
import { invitationSectionItems } from "@/lib/templates/sections";
import type {
  InvitationSectionKey,
  InvitationSections,
} from "@/lib/templates/sections";
import { MAX_RSVP_CUSTOM_FIELDS, type InvitationRsvpConfig } from "@/lib/templates/rsvp-config";
import {
  availableEditableCopyFields,
  editableCopyMaxLength,
  invitationCopyDefaults,
  type EditableInvitationCopy,
  type EditableInvitationCopyField,
} from "@/lib/templates/editable-copy";

export function DesignerTool({
  active,
  label,
  icon,
  onClick,
  disabled = false,
  title,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className="undara-studio-tool" aria-pressed={active}>
      {icon}<span>{label}</span>
    </button>
  );
}

const studioHeadingEnglish: Record<string, string> = {
  "Isi": "Content",
};

function Heading({ title }: { title: string }) {
  const { locale } = useLanguage();
  const shownTitle = locale === "en" ? studioHeadingEnglish[title] || title : title;
  return (
    <div>
      <h2 className="font-[family-name:var(--font-undara-heading)] text-lg font-semibold text-primary">
        {shownTitle}
      </h2>
    </div>
  );
}

export { TemplatePanel } from "@/components/InvitationStudio/TemplatePanel";

const sectionNamesEnglish: Record<InvitationSectionKey, string> = {
  envelope: "Digital Envelope", cover: "Cover", greeting: "Greeting",
  identity: "Identity", event: "Event Details", dateTime: "Date & Time",
  gallery: "Gallery / Media", countdown: "Countdown", location: "Location",
  rsvp: "RSVP", wishes: "Guest Wishes", gift: "Gifts / E-Angpao",
  closing: "Closing", footer: "Footer", music: "Music",
};

export type StudioContentElementKind = "input" | "button";

const sectionFunctionalElements: Partial<Record<InvitationSectionKey, StudioContentElementKind[]>> = {
  location: ["button"],
  rsvp: ["input", "button"],
  wishes: ["input", "button"],
  gift: ["button"],
};

const copyFieldsBySection: Partial<Record<InvitationSectionKey, EditableInvitationCopyField[]>> = {
  greeting: ["greeting", "attendanceRequest", "prayerWish"],
  identity: ["ourStory"],
  closing: ["closing", "zenQuote"],
};

const copyLabels: Record<EditableInvitationCopyField, { id: string; en: string }> = {
  greeting: { id: "Salam / Pengantar", en: "Greeting / Introduction" },
  attendanceRequest: { id: "Permohonan Kehadiran", en: "Invitation Message" },
  prayerWish: { id: "Doa / Harapan", en: "Prayer / Wish" },
  closing: { id: "Ucapan Penutup", en: "Closing Message" },
  ourStory: { id: "Our Story / Tentang Kami", en: "Our Story / About Us" },
  zenQuote: { id: "Kutipan Penutup", en: "Closing Quote" },
};

export function ContentPanel({
  invitationLanguage,
  sections,
  rsvpConfig,
  eventCategory,
  templateKey,
  eventDescription,
  narrativeCopy,
  englishNarrativeCopy,
  onNarrativeCopy,
  onResetNarrativeCopy,
  onChange,
  onSelectSection,
  onSelectElement,
  onRsvpConfig,
  onAddRsvpField,
  onUpdateRsvpField,
  onRemoveRsvpField,
}: {
  invitationLanguage: InvitationLanguage;
  sections: InvitationSections;
  rsvpConfig: InvitationRsvpConfig;
  eventCategory: string;
  templateKey: string;
  eventDescription?: string | null;
  narrativeCopy: EditableInvitationCopy;
  englishNarrativeCopy: EditableInvitationCopy;
  onNarrativeCopy: (field: EditableInvitationCopyField, value: string) => void;
  onResetNarrativeCopy: (field: EditableInvitationCopyField) => void;
  onChange: (section: InvitationSectionKey, enabled: boolean) => void;
  onSelectSection: (section: InvitationSectionKey) => void;
  onSelectElement: (section: InvitationSectionKey, element: StudioContentElementKind) => void;
  onRsvpConfig: (patch: Partial<InvitationRsvpConfig>) => void;
  onAddRsvpField: () => void;
  onUpdateRsvpField: (id: string, patch: { label?: string; required?: boolean }) => void;
  onRemoveRsvpField: (id: string) => void;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [activeElement, setActiveElement] = useState("");
  const [activeCopySection, setActiveCopySection] = useState<InvitationSectionKey | null>(null);
  const availableCopy = new Set(availableEditableCopyFields(templateKey, eventCategory === "WEDDING"));
  const copyDefaults = invitationCopyDefaults(templateKey, eventDescription);

  return (
    <div>
      <Heading title="Isi" />
      <div className="mt-4 divide-y divide-primary/15">
        {invitationSectionItems.map((item) => {
          const enabled = sections[item.key] !== false;
          const elements = sectionFunctionalElements[item.key] ?? [];
          const copyFields = (copyFieldsBySection[item.key] ?? []).filter((field) => availableCopy.has(field));
          return (
            <div key={item.key} className="py-2">
              <div className="flex min-h-12 items-center gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate rounded-[10px] px-2 py-2 text-left text-sm text-foreground hover:bg-primary/5 hover:text-primary"
                  onClick={() => {
                    onSelectSection(item.key);
                    if (copyFields.length) setActiveCopySection((current) => current === item.key ? null : item.key);
                  }}
                  aria-expanded={copyFields.length ? activeCopySection === item.key : undefined}
                  title={en ? sectionNamesEnglish[item.key] : item.title}
                >
                  {en ? sectionNamesEnglish[item.key] : item.title}
                </button>
                <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center" title={enabled ? (en ? "Hide section" : "Sembunyikan section") : (en ? "Show section" : "Tampilkan section")}>
                  <input
                    type="checkbox"
                    role="switch"
                    className="peer sr-only"
                    checked={enabled}
                    onChange={(event) => onChange(item.key, event.target.checked)}
                  />
                  <span className="absolute inset-0 rounded-full bg-foreground/20 transition peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary" />
                  <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {enabled && copyFields.length > 0 && activeCopySection === item.key && (
                <div className="ml-3 mb-2 grid gap-3 border-l border-primary/20 pl-3">
                  {copyFields.map((field) => {
                    const label = en ? copyLabels[field].en : copyLabels[field].id;
                    const source = narrativeCopy[field] ?? copyDefaults[field] ?? "";
                    const value = invitationLanguage === "EN" ? englishNarrativeCopy[field] ?? invitationText("EN", source) : source;
                    return (
                      <label key={field} className="grid gap-1 text-xs text-foreground">
                        <span className="flex items-center justify-between gap-2">
                          <strong className="font-semibold text-primary">{label}</strong>
                          <button
                            type="button"
                            className="inline-flex h-7 items-center gap-1 rounded-[8px] px-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            onClick={(event) => {
                              event.preventDefault();
                              onResetNarrativeCopy(field);
                            }}
                            title={en ? "Reset content" : "Reset isi"}
                          >
                            <RotateCcw size={11} />
                            Reset
                          </button>
                        </span>
                        <textarea
                          value={value}
                          rows={field === "ourStory" ? 7 : 4}
                          maxLength={editableCopyMaxLength[field]}
                          onChange={(event) => onNarrativeCopy(field, event.target.value)}
                          className="min-h-20 w-full resize-y rounded-[var(--undara-control-radius)] border border-primary/25 bg-background px-2.5 py-2 text-sm leading-5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        <small className="text-right text-xs text-muted-foreground">{value.length}/{editableCopyMaxLength[field]}</small>
                      </label>
                    );
                  })}
                </div>
              )}

              {enabled && elements.length > 0 && (
                <div className="ml-3 mt-1 grid gap-1 border-l border-primary/20 pl-3">
                  {elements.map((element) => (
                    <div key={element}>
                      <button
                        type="button"
                        className="min-h-9 w-full rounded-[10px] px-2.5 text-left text-xs text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        aria-expanded={activeElement === `${item.key}:${element}`}
                        onClick={() => {
                          const key = `${item.key}:${element}`;
                          setActiveElement((current) => current === key ? "" : key);
                          onSelectElement(item.key, element);
                        }}
                      >
                        {element === "input" ? "Input" : "Button"}
                      </button>

                      {item.key === "rsvp" && element === "input" && activeElement === "rsvp:input" && (
                        <div className="mt-2 space-y-2 rounded-[var(--undara-control-radius)] border border-primary/20 bg-primary/[.03] p-2.5">
                          <label className="block text-xs text-foreground">
                            <span className="mb-1 block font-semibold text-primary">{en ? "RSVP title" : "Judul RSVP"}</span>
                            <input
                              className="h-8 w-full rounded-[9px] border border-primary/25 bg-background px-2 text-xs"
                              value={rsvpConfig.title ?? "Konfirmasi Kehadiran"}
                              maxLength={80}
                              onChange={(event) => onRsvpConfig({ title: event.target.value })}
                            />
                          </label>
                          <h4 className="text-xs font-semibold text-primary">{en ? "Event options" : "Pilihan acara"}</h4>
                          <label className="undara-studio-rsvp-switch">
                            <span>{en ? "Wedding Ceremony" : "Upacara Nikah"}</span>
                            <input type="checkbox" checked={rsvpConfig.ceremony} onChange={(event) => onRsvpConfig({ ceremony: event.target.checked })} />
                          </label>
                          <label className="undara-studio-rsvp-switch">
                            <span>{en ? "Reception" : "Resepsi"}</span>
                            <input type="checkbox" checked={rsvpConfig.reception} onChange={(event) => onRsvpConfig({ reception: event.target.checked })} />
                          </label>
                          <label className="undara-studio-rsvp-switch">
                            <span>{en ? "Attend all events" : "Hadiri Semua Acara"}</span>
                            <input type="checkbox" checked={rsvpConfig.attendAll} disabled={!(rsvpConfig.ceremony && rsvpConfig.reception)} onChange={(event) => onRsvpConfig({ attendAll: event.target.checked })} />
                          </label>

                          <div className="pt-1">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-primary">{en ? "Columns" : "Kolom"}</span>
                              <small className="text-xs text-muted-foreground">{rsvpConfig.customFields.length}/{MAX_RSVP_CUSTOM_FIELDS}</small>
                            </div>
                            <div className="mb-2 flex flex-wrap gap-1">
                              <small className="rounded-md border border-primary/15 px-1.5 py-1 text-xs text-muted-foreground">{en ? "Name" : "Nama"}</small>
                              <small className="rounded-md border border-primary/15 px-1.5 py-1 text-xs text-muted-foreground">WhatsApp</small>
                              <small className="rounded-md border border-primary/15 px-1.5 py-1 text-xs text-muted-foreground">{en ? "Attendance" : "Kehadiran"}</small>
                              <small className="rounded-md border border-primary/15 px-1.5 py-1 text-xs text-muted-foreground">{en ? "Companions" : "Pendamping"}</small>
                            </div>
                            <div className="space-y-1.5">
                              {rsvpConfig.customFields.map((field) => (
                                <div className="grid grid-cols-[minmax(0,1fr)_auto_24px] items-center gap-1" key={field.id}>
                                  <input className="h-8 min-w-0 rounded-[9px] border border-primary/25 bg-background px-2 text-xs" value={field.label} maxLength={60} onChange={(event) => onUpdateRsvpField(field.id, { label: event.target.value })} />
                                  <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={field.required} onChange={(event) => onUpdateRsvpField(field.id, { required: event.target.checked })} />{en ? "Req" : "Wajib"}</label>
                                  <button type="button" className="grid h-6 w-6 place-items-center rounded-[8px] text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => onRemoveRsvpField(field.id)} aria-label={en ? "Remove field" : "Hapus field"}>×</button>
                                </div>
                              ))}
                            </div>
                            <button type="button" className="mt-2 min-h-8 w-full rounded-[10px] border border-primary/35 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-40" disabled={rsvpConfig.customFields.length >= MAX_RSVP_CUSTOM_FIELDS} onClick={onAddRsvpField}>
                              + {en ? "Add column" : "Tambah Kolom"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MusicPanel } from "@/components/InvitationStudio/MusicPanel";
