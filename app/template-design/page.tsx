"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import {
  defaultInvitationSections,
} from "@/lib/templates/sections";
import { useTemplateCatalog } from "@/lib/templates/use-template-catalog";
import { TemplateCanvas, TemplateCardCanvas } from "@/components/Templates/TemplateGalleryCanvas";

export default function TemplateDesignPage() {
  const { locale } = useLanguage();
  const catalog = useTemplateCatalog();
  const deepLinkHandled = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const copy = locale === "en"
    ? {
        eyebrow: "Invitation collection",
        title: "Find a design that feels like yours.",
        description: "Find the design that feels most like your story. Explore every detail, then choose the one that feels right for your celebration.",
        search: "Search templates...",
        searchLabel: "Search invitation templates",
        all: "All",
        withPhoto: "With photos",
        withoutPhoto: "Without photos",
        sort: "Sort by",
        catalog: "Catalog order",
        nameAsc: "Name A–Z",
        nameDesc: "Name Z–A",
        available: "designs available",
        none: "No templates match your search.",
        designer: "Not yet available",
        view: "View invitation",
        viewImage: "View design",
        close: "Close preview",
        toggle: "Try showing or hiding invitation sections",
        start: "Create an invitation",
        contentLabel: "Template gallery",
        previewLabel: "Preview",
        previewCanvasLabel: "Invitation preview",
        filter: "Filter",
        photoType: "Photo use",
        categoryLabel: "Category",
        clearFilter: "Reset",
        chooseHint: "The design in the center is your active choice.",
        optionalLabels: { rsvp: "RSVP", wishes: "Guest wishes", gift: "Gift" },
      }
    : {
        eyebrow: "Koleksi undangan",
        title: "Pilih desain yang terasa personal.",
        description: "Temukan desain yang paling terasa seperti ceritamu. Lihat setiap detailnya, lalu pilih yang paling pas untuk membuka hari istimewamu.",
        search: "Cari desain...",
        searchLabel: "Cari template undangan",
        all: "Semua",
        withPhoto: "Dengan foto",
        withoutPhoto: "Tanpa foto",
        sort: "Urutkan",
        catalog: "Urutan katalog",
        nameAsc: "Nama A–Z",
        nameDesc: "Nama Z–A",
        available: "desain tersedia",
        none: "Tidak ada template yang cocok dengan pencarianmu.",
        designer: "Belum Tersedia",
        view: "Lihat undangan",
        viewImage: "Lihat desain",
        close: "Tutup pratinjau",
        toggle: "Coba tampilkan atau sembunyikan bagian undangan",
        start: "Buat Undangan",
        contentLabel: "Koleksi template undangan",
        previewLabel: "Pratinjau",
        previewCanvasLabel: "Contoh undangan",
        filter: "Filter",
        photoType: "Penggunaan foto",
        categoryLabel: "Kategori",
        clearFilter: "Reset",
        chooseHint: "Desain yang berada di tengah adalah pilihan aktifmu.",
        optionalLabels: { rsvp: "RSVP", wishes: "Ucapan", gift: "E-Angpao" },
      };
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(catalog.map((item) => item.category)))], [catalog]);
  const descriptionFor = (template: (typeof catalog)[number]) =>
    locale === "en" ? template.descriptionEn ?? template.description : template.description;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [photoFilter, setPhotoFilter] = useState<"all" | "photo" | "no-photo">("all");
  const [sort, setSort] = useState<"Katalog" | "NamaAsc" | "NamaDesc">("Katalog");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [wheelIndex, setWheelIndex] = useState(0);
  const wheelStageRef = useRef<HTMLDivElement>(null);
  const wheelIndexRef = useRef(0);
  const wheelLockRef = useRef(0);
  const wheelTouchStartRef = useRef<number | null>(null);
  const suppressWheelClickRef = useRef(false);

  const filteredTemplates = useMemo(() => {
    const result = catalog.filter((template) =>
      `${template.name} ${template.description} ${template.descriptionEn ?? ""} ${template.category}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")) &&
      (category === "Semua" || template.category === category) &&
      (photoFilter === "all" || (template.ready && (photoFilter === "photo" ? template.usesPhotos : !template.usesPhotos))),
    );
    if (sort === "NamaAsc") return [...result].sort((a, b) => a.name.localeCompare(b.name, "id"));
    if (sort === "NamaDesc") return [...result].sort((a, b) => b.name.localeCompare(a.name, "id"));
    return result;
  }, [catalog, category, query, sort, photoFilter]);

  const selected = catalog.find((item) => item.key === selectedKey);
  const activeWheelTemplate = filteredTemplates[wheelIndex] ?? null;
  const sortOptions = [
    { value: "Katalog", label: copy.catalog },
    { value: "NamaAsc", label: copy.nameAsc },
    { value: "NamaDesc", label: copy.nameDesc },
  ] as const;
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? copy.catalog;

  useEffect(() => {
    wheelIndexRef.current = 0;
    setWheelIndex(0);
  }, [query, category, photoFilter, sort]);

  useEffect(() => {
    if (wheelIndex < filteredTemplates.length) return;
    const next = Math.max(0, filteredTemplates.length - 1);
    wheelIndexRef.current = next;
    setWheelIndex(next);
  }, [filteredTemplates.length, wheelIndex]);

  function moveWheel(direction: -1 | 1) {
    setWheelIndex((current) => {
      const total = filteredTemplates.length;
      if (total <= 1) return 0;
      const next = (current + direction + total) % total;
      wheelIndexRef.current = next;
      return next;
    });
  }

  function wheelDistance(index: number) {
    const total = filteredTemplates.length;
    if (total <= 1) return 0;
    let distance = index - wheelIndex;
    const half = total / 2;
    if (distance > half) distance -= total;
    if (distance < -half) distance += total;
    return distance;
  }

  useEffect(() => {
    const stage = wheelStageRef.current;
    if (!stage || filteredTemplates.length < 2) return;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 8) return;
      const direction: -1 | 1 = delta > 0 ? 1 : -1;
      event.preventDefault();
      const now = performance.now();
      if (now - wheelLockRef.current < 170) return;
      wheelLockRef.current = now;
      const current = wheelIndexRef.current;
      const total = filteredTemplates.length;
      const next = (current + direction + total) % total;
      wheelIndexRef.current = next;
      setWheelIndex(next);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [filteredTemplates.length]);

  function handleWheelTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    wheelTouchStartRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleWheelTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const startX = wheelTouchStartRef.current;
    wheelTouchStartRef.current = null;
    if (startX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const distance = endX - startX;
    if (Math.abs(distance) < 38) return;
    suppressWheelClickRef.current = true;
    moveWheel(distance < 0 ? 1 : -1);
    window.setTimeout(() => { suppressWheelClickRef.current = false; }, 220);
  }

  // Marketing cards deep-link to a specific preview. Public preview never opens Studio.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("template");
    if (!deepLinkHandled.current && requested && catalog.some((item) => item.key === requested)) {
      deepLinkHandled.current = true;
      setSelectedKey(requested);
    }
  }, [catalog]);

  function openPreview(key: string) {
    setSelectedKey(key);
  }

  useEffect(() => {
    if (!selectedKey) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedKey(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((item) => item.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [selectedKey]);

  useEffect(() => {
    if (!sortOpen && !filterOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (sortOpen && !sortMenuRef.current?.contains(target)) setSortOpen(false);
      if (filterOpen && !filterMenuRef.current?.contains(target)) setFilterOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (sortOpen) {
        setSortOpen(false);
        sortTriggerRef.current?.focus();
      }
      if (filterOpen) setFilterOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sortOpen, filterOpen]);

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />
      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>
        <main
          tabIndex={0}
          aria-label={copy.contentLabel}
          className="undara-marketing-scroll focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <section className="undara-marketing-content font-[family-name:var(--font-undara-body)]">
            <div className="undara-marketing-section relative min-h-[calc(100dvh-185px)] py-7 sm:py-8 lg:py-9 xl:py-10">
              <aside className="undara-template-intro relative z-20 max-w-[34rem] lg:absolute lg:-left-24 lg:top-14 lg:flex lg:h-[16rem] lg:w-[27rem] min-[2200px]:-translate-x-[5cm] lg:flex-col lg:justify-between xl:-left-32 xl:top-16 xl:h-[18rem] xl:w-[29rem] 2xl:-left-40 2xl:top-18">
                <p className="undara-marketing-meta text-primary">{copy.eyebrow}</p>
                <div>
                  <h1 className="max-w-[10.5ch] font-[family-name:var(--font-undara-heading)] undara-marketing-title tracking-[-0.035em] text-primary">
                    {copy.title}
                  </h1>
                  <p className="mt-5 max-w-[30ch] text-sm font-medium leading-7 text-foreground/75 lg:hidden">{copy.description}</p>
                </div>
              </aside>

              <div className="min-w-0 lg:pt-2 xl:pt-3">
                <div className="relative z-40 mx-auto mb-8 flex w-full max-w-[940px] flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mb-9 lg:mb-10">
                  <label className="relative min-w-[160px] flex-1 sm:max-w-[250px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" aria-hidden />
                    <span className="sr-only">{copy.searchLabel}</span>
                    <input
                      aria-label={copy.searchLabel}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={copy.search}
                      className="h-11 w-full rounded-[11px] border border-primary/45 bg-background/72 pl-9 pr-3 text-[15px] font-medium text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-medium placeholder:text-foreground/62 focus:border-primary/80 focus:ring-2 focus:ring-primary/18"
                    />
                  </label>

                  <div ref={filterMenuRef} className="relative">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={filterOpen}
                      onClick={() => {
                        setFilterOpen((open) => !open);
                        setSortOpen(false);
                      }}
                      className={`flex h-11 items-center gap-2 rounded-[11px] border px-4 text-[15px] font-medium transition-colors ${filterOpen || photoFilter !== "all" || category !== "Semua" ? "border-primary/75 bg-primary/12 text-primary" : "border-primary/40 bg-background/60 text-foreground hover:border-primary/65 hover:text-primary"}`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                      {copy.filter}
                      {(photoFilter !== "all" || category !== "Semua") && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
                    </button>
                    {filterOpen && (
                      <div role="menu" aria-label={copy.filter} className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-[min(86vw,330px)] -translate-x-1/2 rounded-[16px] border border-primary/20 bg-background p-4 shadow-[0_20px_55px_rgba(45,30,35,0.16)] sm:left-0 sm:translate-x-0">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">{copy.photoType}</p>
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {([
                              ["all", copy.all],
                              ["photo", copy.withPhoto],
                              ["no-photo", copy.withoutPhoto],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setPhotoFilter(value)}
                                aria-pressed={photoFilter === value}
                                className={`min-h-10 rounded-[10px] border px-2.5 text-[13px] font-medium transition-colors ${photoFilter === value ? "border-primary bg-primary text-primary-foreground" : "border-primary/25 text-foreground/80 hover:border-primary/50 hover:text-primary"}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 border-t border-primary/12 pt-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/45">{copy.categoryLabel}</p>
                          <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                            {categories.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setCategory(item)}
                                aria-pressed={category === item}
                                className={`min-h-9 rounded-[9px] border px-3 text-[13px] font-medium transition-colors ${category === item ? "border-primary bg-primary/12 text-primary" : "border-primary/25 text-foreground/78 hover:border-primary/50 hover:text-primary"}`}
                              >
                                {item === "Semua" ? copy.all : item}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(photoFilter !== "all" || category !== "Semua") && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFilter("all");
                              setCategory("Semua");
                            }}
                            className="mt-4 text-[13px] font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
                          >
                            {copy.clearFilter}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div ref={sortMenuRef} className="relative">
                    <button
                      ref={sortTriggerRef}
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={sortOpen}
                      onClick={() => {
                        setSortOpen((open) => !open);
                        setFilterOpen(false);
                      }}
                      className="flex h-11 items-center gap-2 rounded-[11px] border border-primary/40 bg-background/60 px-4 text-[15px] font-medium text-foreground transition-colors hover:border-primary/65 hover:text-primary"
                    >
                      <span className="hidden sm:inline">{copy.sort}:</span>
                      <span>{sortLabel}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-primary transition-transform ${sortOpen ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                    {sortOpen && (
                      <div role="menu" aria-label={copy.sort} className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 rounded-[14px] border border-primary/20 bg-background p-1.5 shadow-[0_18px_45px_rgba(45,30,35,0.14)]">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={sort === option.value}
                            onClick={() => {
                              setSort(option.value);
                              setSortOpen(false);
                              sortTriggerRef.current?.focus();
                            }}
                            className={`flex min-h-10 w-full items-center rounded-[9px] px-3 text-left text-[13px] font-medium transition-colors ${sort === option.value ? "bg-primary/12 text-primary" : "text-foreground/80 hover:bg-primary/7 hover:text-primary"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {filteredTemplates.length > 0 ? (
                  <div className="relative -mx-10 overflow-hidden px-10 sm:-mx-14 sm:px-14 lg:-mx-20 lg:px-20 xl:-mx-24 xl:px-24">
                    <div
                      ref={wheelStageRef}
                      data-template-wheel
                      role="group"
                      aria-label={locale === "en" ? "Template selection wheel" : "Roda pilihan template"}
                      tabIndex={0}
                      onTouchStart={handleWheelTouchStart}
                      onTouchEnd={handleWheelTouchEnd}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          moveWheel(-1);
                        } else if (event.key === "ArrowRight") {
                          event.preventDefault();
                          moveWheel(1);
                        } else if (event.key === "Enter" && activeWheelTemplate) {
                          event.preventDefault();
                          openPreview(activeWheelTemplate.key);
                        }
                      }}
                      className="relative mx-auto h-[480px] w-full max-w-[1220px] touch-pan-y overflow-hidden outline-none [perspective:1450px] sm:h-[510px] lg:h-[535px] xl:h-[560px] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[48%] h-[68%] w-[min(70vw,580px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(112,59,59,0.095),rgba(112,59,59,0.018)_56%,transparent_72%)]" />
                      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[13%] bottom-[6%] h-px bg-gradient-to-r from-transparent via-primary/24 to-transparent" />
                      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 bottom-[4%] h-7 w-[min(44vw,330px)] -translate-x-1/2 rounded-[50%] bg-black/10 blur-xl dark:bg-black/25" />

                      {filteredTemplates.map((template, index) => {
                        const distance = wheelDistance(index);
                        const depth = Math.abs(distance);
                        const visible = depth <= 3;
                        const scale = Math.max(0.56, 1 - depth * 0.16);
                        const opacity = visible ? Math.max(0.18, 1 - depth * 0.24) : 0;
                        const rotation = distance === 0 ? 0 : distance < 0 ? 13 : -13;
                        const translateY = depth * 22;
                        return (
                          <div
                            key={template.key}
                            className="group absolute left-1/2 top-[50%] aspect-[9/19.5] [transform-style:preserve-3d] w-[clamp(166px,22vw,250px)] rounded-[42px] bg-gradient-to-br from-[#f8f8f8] via-[#a9a9aa] to-[#303032] p-[3px] shadow-[0_24px_52px_rgba(17,17,17,0.20),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[transform,opacity,filter] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:from-[#e4e4e4] dark:via-[#77777a] dark:to-[#121214]"
                            style={{
                              transform: `translate(-50%, -50%) translateX(calc(${distance} * clamp(136px, 18vw, 236px))) translateY(${translateY}px) rotateY(${rotation}deg) scale(${scale})`,
                              opacity,
                              zIndex: 20 - Math.round(depth),
                              filter: distance === 0 ? "none" : `saturate(${Math.max(0.5, 1 - depth * 0.14)}) brightness(${Math.max(0.72, 1 - depth * 0.08)})`,
                              pointerEvents: visible ? "auto" : "none",
                            }}
                          >
                            <span aria-hidden="true" className="absolute -right-[4px] top-[24%] h-11 w-[4px] rounded-r-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
                            <span aria-hidden="true" className="absolute -left-[4px] top-[21%] h-7 w-[4px] rounded-l-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
                            <span aria-hidden="true" className="absolute -left-[4px] top-[31%] h-10 w-[4px] rounded-l-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
                            <span className="relative block h-full overflow-hidden rounded-[39px] border border-black/70 bg-[#080808] p-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),inset_0_0_16px_rgba(0,0,0,0.95)] dark:border-white/20">
                              <span className="pointer-events-none absolute inset-[7px] z-20 rounded-[33px] border border-white/10" aria-hidden="true" />
                              <span className="relative block h-full overflow-hidden rounded-[32px] bg-[#f8f4f1] dark:bg-[#111111]">
                                {template.ready ? (
                                  <TemplateCardCanvas templateKey={template.key} designKey={template.designKey} phone />
                                ) : (
                                  <img src={template.previewImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                                )}
                              </span>
                              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-5 w-[34%] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.4)]">
                                <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#151515]" />
                              </span>
                              {distance === 0 && (
                                <span className="pointer-events-none absolute inset-x-7 bottom-5 z-30 rounded-full bg-black/70 px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white opacity-0 transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
                                  {copy.previewLabel}
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              aria-current={distance === 0 ? "true" : undefined}
                              aria-label={distance === 0 ? `${copy.previewLabel}: ${template.name}` : template.name}
                              tabIndex={depth <= 1 ? 0 : -1}
                              onClick={() => {
                                if (suppressWheelClickRef.current) return;
                                if (distance === 0) {
                                  openPreview(template.key);
                                } else {
                                  wheelIndexRef.current = index;
                                  setWheelIndex(index);
                                }
                              }}
                              className="absolute inset-0 z-40 rounded-[42px] bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {activeWheelTemplate && (
                      <div data-template-wheel-details aria-live="polite" className="mx-auto mt-4 max-w-2xl pb-1 text-center lg:mt-5 lg:pb-1">
                        <p className="undara-marketing-meta text-foreground/65">
                          {String(wheelIndex + 1).padStart(2, "0")} / {String(filteredTemplates.length).padStart(2, "0")} · {activeWheelTemplate.category}
                        </p>
                        <h2 className="mt-3 font-[family-name:var(--font-undara-heading)] undara-marketing-heading text-primary">
                          {activeWheelTemplate.name}
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-foreground/75">
                          {descriptionFor(activeWheelTemplate)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mx-auto mt-10 max-w-xl rounded-[16px] border border-dashed border-primary/25 px-6 py-16 text-center text-sm text-foreground/55">
                    {copy.none}
                  </div>
                )}
              </div>

              <aside className="undara-template-outro hidden lg:absolute lg:right-[-9rem] lg:top-[66%] lg:z-20 lg:flex lg:w-[33rem] min-[2200px]:translate-x-[5cm] min-[2200px]:-translate-y-1/2 lg:flex-col xl:right-[-12rem] xl:top-[67%] xl:w-[37rem] 2xl:right-[-14rem] 2xl:w-[39rem]">
                <p className="ml-auto max-w-[54ch] text-right text-[15px] font-normal leading-7 text-foreground/84">{copy.description}</p>
                <div
                  aria-hidden="true"
                  className="ml-auto mt-2 flex h-7 w-[250px] items-center justify-end text-primary/65 xl:w-[300px] dark:text-[#D6B38C]/72"
                >
                  <span
                    className="block h-full w-full bg-current"
                    style={{
                      WebkitMaskImage: 'url("/assets/landing/ornaments/botanical/branch-05.webp")',
                      maskImage: 'url("/assets/landing/ornaments/botanical/branch-05.webp")',
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "right center",
                      maskPosition: "right center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                </div>
                <div className="ml-auto mt-1 w-[80%]">
                  <p className="ml-auto mr-4 max-w-[24ch] text-right font-[family-name:var(--font-undara-heading)] text-[1.45rem] leading-snug text-primary xl:mr-8">{copy.chooseHint}</p>
                </div>
              </aside>
            </div>
          </section>
        </main>
        <MarketingFrameFooter />
      </div>

      {selected && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedKey(null); }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${copy.previewCanvasLabel} ${selected.name}`}
            className="relative flex max-h-[96dvh] w-full max-w-[560px] min-w-0 flex-col overflow-hidden rounded-[28px] bg-transparent shadow-2xl"
          >
            <button
              autoFocus
              type="button"
              onClick={() => setSelectedKey(null)}
              aria-label={copy.close}
              className="absolute right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-primary/10 p-2 sm:p-4">
              <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[26px] border-[5px] border-[#30272d] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                {selected.ready ? (
                  <TemplateCanvas key={selected.key} templateKey={selected.key} designKey={selected.designKey} sections={defaultInvitationSections} />
                ) : (
                  <div className="bg-[#fff9f7]"><img src={selected.previewImage} alt={selected.name} className="h-auto w-full object-contain" /></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
