"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { useTemplateCatalog } from "@/lib/templates/use-template-catalog";
import { invitationTemplates } from "@/lib/templates/catalog";
import { TemplateCardCanvas } from "@/components/Templates/TemplateGalleryCanvas";

const previewLimit = 3;

function randomKeys(keys: string[]) {
  const shuffled = [...keys];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const choice = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[choice]] = [shuffled[choice], shuffled[index]];
  }
  return shuffled.slice(0, previewLimit);
}

export default function TemplateCollection() {
  const { locale } = useLanguage();
  const templates = useTemplateCatalog();
  // Deterministic initial render prevents an SSR hydration mismatch.
  // The public endpoint replaces this with paid-event popularity or a random
  // choice when no template has been sold.
  const [featuredKeys, setFeaturedKeys] = useState<string[]>(
    () => invitationTemplates.slice(0, previewLimit).map((template) => template.key),
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/templates/featured", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Featured templates unavailable");
        return response.json() as Promise<{ keys: string[] }>;
      })
      .then(({ keys }) => {
        if (!controller.signal.aborted && Array.isArray(keys)) {
          const allowed = new Set(invitationTemplates.map((template) => template.key));
          const uniqueKeys = [...new Set(keys.filter((key) => allowed.has(key)))];
          if (uniqueKeys.length) setFeaturedKeys(uniqueKeys.slice(0, previewLimit));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          // Database may be offline in local development: show a neutral random
          // selection, never label it a verified top-seller.
          setFeaturedKeys(randomKeys(invitationTemplates.map((template) => template.key)));
        }
      });
    return () => controller.abort();
  }, []);

  const featuredTemplates = featuredKeys.flatMap((key) => {
    const template = templates.find((item) => item.key === key && item.ready);
    return template ? [template] : [];
  });

  const copy =
    locale === "en"
      ? {
          eyebrow: "Template Collection",
          title: "Choose a visual direction that fits your event.",
          description: "A small selection to get you started. Explore the full collection and preview any design without signing in.",
          all: "Explore all templates",
          preview: "View preview",
          ready: "Available in Studio",
        }
      : {
          eyebrow: "Koleksi Template",
          title: "Pilih visual yang paling cocok dengan suasana acaramu.",
          description: "Tiga pilihan untuk inspirasi awal. Jelajahi koleksi lengkap dan lihat pratinjau tanpa login.",
          all: "Lihat semua template",
          preview: "Lihat pratinjau",
          ready: "Tersedia di Studio",
        };

  return (
    <section className="undara-marketing-section space-y-14 py-14 md:space-y-16 md:py-20">
      <div className="w-full pb-8">
        <div className="mx-auto flex w-full flex-col justify-between gap-6 sm:flex-row sm:items-end sm:gap-12">
          <div className="max-w-2xl">
            <p className="undara-marketing-meta text-primary">
              {copy.eyebrow}
            </p>
            <h2 className="undara-marketing-heading mt-4 max-w-[18ch] font-[family-name:var(--font-undara-heading)] text-primary">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-xl font-[family-name:var(--font-undara-body)] text-base leading-7 text-foreground/65">
              {copy.description}
            </p>
          </div>
          <Button asChild size="sm" className="min-w-0 shrink-0 text-xs normal-case tracking-normal">
            <Link href="/template-design">
              {copy.all}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid justify-items-center gap-12 md:grid-cols-3 md:gap-7 lg:gap-10">
        {featuredTemplates.map((template, index) => (
          <article key={template.key} className={`group flex w-full min-w-0 max-w-[300px] flex-col items-center ${index === 1 ? "md:translate-y-10" : ""}`}>
            <div className="relative mx-auto aspect-[9/19.5] w-full max-w-[246px] rounded-[42px] bg-gradient-to-br from-[#f8f8f8] via-[#a9a9aa] to-[#303032] p-[3px] shadow-[0_28px_55px_rgba(17,17,17,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-500 group-hover:-translate-y-1.5 dark:from-[#e4e4e4] dark:via-[#77777a] dark:to-[#121214]">
              <span aria-hidden="true" className="absolute -right-[4px] top-[24%] h-12 w-[4px] rounded-r-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
              <span aria-hidden="true" className="absolute -left-[4px] top-[21%] h-7 w-[4px] rounded-l-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
              <span aria-hidden="true" className="absolute -left-[4px] top-[31%] h-10 w-[4px] rounded-l-full bg-[#4a4a4c] dark:bg-[#8b8b8e]" />
              <div className="relative h-full overflow-hidden rounded-[39px] border border-black/70 bg-[#080808] p-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),inset_0_0_16px_rgba(0,0,0,0.95)] dark:border-white/20">
                <div className="pointer-events-none absolute inset-[7px] z-20 rounded-[33px] border border-white/10" aria-hidden="true" />
                <div className="relative h-full overflow-hidden rounded-[32px] bg-[#f8f4f1] dark:bg-[#111111]">
                  <TemplateCardCanvas templateKey={template.key} designKey={template.designKey} phone />
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-5 w-[34%] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.4)]">
                  <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#151515]" />
                </div>
              </div>
              <Link
                href={`/template-design?template=${encodeURIComponent(template.key)}`}
                className="absolute inset-0 z-40 rounded-[42px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                aria-label={`${copy.preview}: ${template.name}`}
              />
            </div>
            <div className="mt-6 flex w-full max-w-[276px] flex-col items-start text-left">
              <div className="flex w-full items-center justify-between gap-4">
                <p className="undara-marketing-meta text-muted-foreground">
                  {template.category}
                </p>
              </div>
              <h3 className="undara-marketing-subheading mt-2 font-[family-name:var(--font-undara-heading)] text-primary">
                {template.name}
              </h3>
              <p className="mt-2 text-xs leading-6 text-foreground/60">
                {locale === "en" ? template.descriptionEn ?? template.description : template.description}
              </p>
              <p className="undara-marketing-meta mt-2 text-foreground/40">
                {copy.ready}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
