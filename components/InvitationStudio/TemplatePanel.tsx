"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogTemplate } from "@/lib/templates/use-template-catalog";
import { TemplateCardCanvas } from "@/components/Templates/TemplateGalleryCanvas";

/** Self-contained catalog browser for the event-scoped Invitation Studio.
 * Kept separate from the other studio inspectors; the renderer and saved design are unchanged.
 */
export function TemplatePanel({
  selected,
  onSelect,
  templates,
  onBlankCanvas,
  emptyMessage,
}: {
  selected: string;
  onSelect: (key: string) => void;
  templates: CatalogTemplate[];
  onBlankCanvas?: () => void;
  emptyMessage?: string;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [photoFilter, setPhotoFilter] = useState<"all" | "photo" | "no-photo">("all");
  const [sort, setSort] = useState<"selected" | "az" | "za">("selected");
  const [limit, setLimit] = useState(18);
  const activeName = selected === "blank-canvas"
    ? (en ? "Blank Canvas" : "Canvas Kosong")
    : templates.find((item) => item.key === selected)?.name;

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("id");
    const matches = templates.filter((item) => {
      if (term && !`${item.name} ${item.category} ${item.description} ${item.descriptionEn ?? ""}`.toLocaleLowerCase("id").includes(term)) return false;
      if (photoFilter === "photo" && !item.usesPhotos) return false;
      if (photoFilter === "no-photo" && item.usesPhotos) return false;
      return true;
    });
    if (sort === "az") return matches.sort((a, b) => a.name.localeCompare(b.name, "id"));
    if (sort === "za") return matches.sort((a, b) => b.name.localeCompare(a.name, "id"));
    // Keep the current selection within the first visible cards, even with hundreds of themes.
    return matches.sort((a, b) => Number(b.key === selected) - Number(a.key === selected));
  }, [templates, selected, search, photoFilter, sort]);

  if (templates.length === 0 && emptyMessage && !onBlankCanvas) return (
    <div>
      <h2 className="font-[family-name:var(--font-undara-heading)] text-lg font-semibold text-primary">{en ? "Choose a Theme" : "Pilih Tema"}</h2>
      <p role="status" className="py-5 text-sm text-foreground">{emptyMessage}</p>
    </div>
  );

  return (
    <div>
      <h2 className="font-[family-name:var(--font-undara-heading)] text-lg font-semibold text-primary">{en ? "Choose a Theme" : "Pilih Tema"}</h2>
      {activeName && <p className="mt-2 text-sm font-medium text-foreground">{en ? "Selected" : "Dipilih"}: {activeName}</p>}
      <div className="mt-4 space-y-3">
        <div className="relative">
          <button
            type="button"
            aria-label={en ? "Search templates" : "Cari template"}
            onClick={() => searchRef.current?.focus()}
            className="absolute left-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--undara-control-radius)] text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Search size={17} aria-hidden="true" />
          </button>
          <Input
            ref={searchRef}
            type="search"
            aria-label={en ? "Search by name or theme" : "Cari nama atau tema template"}
            placeholder={en ? "Search name or theme…" : "Cari nama atau tema…"}
            className="pl-11"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setLimit(18); }}
          />
        </div>
        <div role="group" aria-label={en ? "Filter templates by photos" : "Filter foto template"} className="flex flex-wrap gap-2">
          {([
            ["all", en ? "All" : "Semua"],
            ["photo", en ? "With Photos" : "Dengan foto"],
            ["no-photo", en ? "Without Photos" : "Tanpa foto"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={photoFilter === key}
              onClick={() => { setPhotoFilter(key); setLimit(18); }}
              className={`min-h-9 rounded-[var(--undara-control-radius)] border border-primary/70 px-3.5 text-xs font-medium transition-colors ${photoFilter === key ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background text-foreground hover:bg-primary/10"}`}
            >{label}</button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span aria-live="polite" className="text-xs text-foreground">{filtered.length} {en ? "templates" : "template"}</span>
          <div className="relative w-[204px] max-w-[68%] shrink-0">
            <select
              aria-label={en ? "Sort templates" : "Urutkan template"}
              value={sort}
              onChange={(event) => { setSort(event.target.value as "selected" | "az" | "za"); setLimit(18); }}
              className="h-9 w-full appearance-none rounded-[var(--undara-control-radius)] border border-primary/70 bg-background py-1 pl-4 pr-11 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <option value="selected">{en ? "Selected first" : "Pilihan aktif"}</option>
              <option value="az">{en ? "Name A–Z" : "Nama A–Z"}</option>
              <option value="za">{en ? "Name Z–A" : "Nama Z–A"}</option>
            </select>
            <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary" />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 items-start gap-2">
        {onBlankCanvas && <div
          className={`group relative w-full min-w-0 max-w-[152px] overflow-hidden rounded-[var(--undara-control-radius)] border bg-background text-left shadow-[0_8px_24px_rgba(90,40,55,0.08)] transition-shadow hover:shadow-[0_12px_30px_rgba(90,40,55,0.14)] ${
            selected === "blank-canvas"
              ? "border-primary ring-2 ring-primary/20"
              : "border-border hover:border-primary/40"
          }`}
        >
          <span className="relative block aspect-[9/19.5] w-full overflow-hidden bg-background">
            <span
              aria-hidden="true"
              className="absolute inset-3 rounded-[12px] border border-dashed border-primary/30 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--primary)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_8%,transparent)_1px,transparent_1px)] bg-[size:20px_20px]"
            />
            {selected === "blank-canvas" && (
              <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-[var(--undara-control-radius)] bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </span>
            )}
          </span>
          <span className="flex min-h-14 min-w-0 flex-col justify-center gap-1 border-t border-primary/20 bg-background px-2 py-2">
            <span className="break-words font-[family-name:var(--font-undara-heading)] text-sm font-semibold leading-snug text-foreground">{en ? "Blank Canvas" : "Canvas Kosong"}</span>
          </span>
          <button
            type="button"
            onClick={onBlankCanvas}
            aria-label={en ? "Start with a blank canvas" : "Mulai dari canvas kosong"}
            aria-pressed={selected === "blank-canvas"}
            className="absolute inset-0 z-10 rounded-[var(--undara-control-radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>}

        {filtered.slice(0, limit).map((item) => (
          <div
            key={item.key}
            className={`group relative w-full min-w-0 max-w-[152px] overflow-hidden rounded-[var(--undara-control-radius)] border bg-background text-left shadow-[0_8px_24px_rgba(90,40,55,0.08)] transition-shadow hover:shadow-[0_12px_30px_rgba(90,40,55,0.14)] ${
              selected === item.key
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <span className="relative block">
              {item.ready ? (
                <span className="block w-full overflow-hidden bg-primary/5">
                  <TemplateCardCanvas templateKey={item.key} designKey={item.designKey} studio />
                </span>
              ) : (
                <img src={item.previewImage} alt="" loading="lazy" className="aspect-[9/19.5] w-full object-contain bg-primary/5" />
              )}
              {selected === item.key && (
                <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-[var(--undara-control-radius)] bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </span>
            <span className="flex min-h-14 min-w-0 flex-col justify-center gap-1 border-t border-primary/20 bg-background px-2 py-2">
              <span className="break-words font-[family-name:var(--font-undara-heading)] text-sm font-semibold leading-snug text-foreground">{item.name}</span>
              <span className="text-xs text-primary">{!item.ready ? (en ? "Not Available" : "Belum tersedia") : item.usesPhotos ? (en ? "With Photos" : "Dengan foto") : (en ? "Without Photos" : "Tanpa foto")}</span>
            </span>
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              disabled={!item.ready}
              aria-label={item.ready ? item.name : `${item.name} ${en ? "unavailable" : "belum tersedia"}`}
              aria-pressed={selected === item.key}
              className="absolute inset-0 z-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-65"
            />
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p role="status" className="py-5 text-sm text-foreground">{en ? "No templates found." : "Template tidak ditemukan."}</p>}
      {limit < filtered.length && (
        <Button size="sm" className="mt-4 w-full" type="button" onClick={() => setLimit((count) => count + 18)}>
          {en ? "Show More" : "Tampilkan Lagi"}
        </Button>
      )}
    </div>
  );
}
