"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServicePackage } from "@/lib/packages/catalog";
import { useLanguage } from "@/components/I18n/LanguageProvider";

type PackageShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  packageKeys: string[];
  note?: string;
  roundedCard?: boolean;
  wide?: boolean;
  editorial?: boolean;
  compact?: boolean;
};

export default function PackageShowcase({
  eyebrow,
  title,
  description,
  packageKeys,
  note,
  roundedCard = false,
  wide = false,
  editorial = false,
  compact = false,
}: PackageShowcaseProps) {
  const { locale } = useLanguage();
  const packages = packageKeys.map(getServicePackage).filter(Boolean);
  const chooseLabel = locale === "en" ? "Choose package" : "Pilih paket";
  const featuredLabel = locale === "en" ? "Best value" : "Paling lengkap";

  if (compact) {
    const en = locale === "en";
    const blast = getServicePackage("WA_BLAST_50");
    return (
      <section id="paket-undangan" data-compact-invitation-offer className="undara-marketing-section py-14 md:py-20">
        {packages.map(item => item ? (
          <div key={item.key}>
            <h2 className="undara-marketing-heading font-[family-name:var(--font-undara-heading)] text-primary">{item.name[locale]}</h2>
            <article className="mt-7 flex flex-col gap-9 rounded-[24px] bg-primary/[0.045] p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-14 lg:p-10">
              <div className="min-w-0 lg:w-[42%] lg:shrink-0">
                <p className="font-[family-name:var(--font-undara-heading)] text-5xl leading-tight text-primary sm:text-6xl">Rp{item.price.toLocaleString("id-ID")}</p>
                <p className="mt-4 text-base leading-7 text-foreground">{en ? "For one event, one invitation and one template." : "Untuk satu acara, satu undangan dan satu template."}</p>
                <Button asChild size="lg" className="mt-6">
                  <Link href={`/packages?package=${encodeURIComponent(item.key)}`}>{chooseLabel}<ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <ul className="flex min-w-0 flex-1 flex-col gap-5">
                {item.features[locale].slice(2).map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-base leading-7 text-foreground">
                    <Check className="mt-1.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        ) : null)}
        {blast && <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 sm:px-2">
          <div className="min-w-0">
            <h3 className="undara-marketing-subheading text-primary">WA Blast <span className="ml-2 font-[family-name:var(--font-undara-body)] text-sm text-muted-foreground">{en ? "Optional" : "Opsional"}</span></h3>
            <p className="mt-1 text-base leading-7 text-muted-foreground">{en ? "50 credits for an active event, purchased separately." : "50 kuota untuk acara aktif, dibeli terpisah."}</p>
          </div>
          <p className="shrink-0 text-xl font-medium text-primary">Rp{blast.price.toLocaleString("id-ID")}</p>
        </div>}
      </section>
    );
  }

  if (editorial) {
    return (
      <section className="undara-marketing-section py-14 md:py-20">
        <div className="grid gap-12 ">
          <div className="w-full">
            <p className="undara-marketing-kicker">{eyebrow}</p>
            <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
              {title}
            </h2>
            <p className="mt-6 max-w-[70ch] text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
              {description}
            </p>
            {note ? (
              <p className="mt-7 border-l border-primary/30 pl-5 text-xs leading-6 text-muted-foreground">
                {note}
              </p>
            ) : null}
          </div>

          <div>
            {packages.map((item) => {
              if (!item) return null;
              return (
                <article
                  key={item.key}
                  className="relative space-y-8 py-9 md:py-12"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="undara-editorial-index">{locale === "en" ? "Package" : "Paket"}</span>
                      {item.key !== "GUESTBOOK_DIGITAL" && (
                        <span className="font-[family-name:var(--font-undara-mono)] text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          Undara
                        </span>
                      )}
                    </div>
                    <h3 className="undara-marketing-subheading mt-5 font-[family-name:var(--font-undara-heading)] text-primary">
                      {item.name[locale]}
                    </h3>
                    <p className="mt-5 font-[family-name:var(--font-undara-heading)] text-4xl text-foreground md:text-5xl">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                    <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                      {item.description[locale]}
                    </p>
                    {item.key === "GUESTBOOK_DIGITAL" && (
                      <Link href="/d-invitation" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        {locale === "en" ? "Digital Invitation included free · View details" : "Gratis Undangan Digital · Lihat detail"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <ul className="flex flex-1 flex-col gap-3">
                      {item.features[locale].map((feature) => (
                        <li key={feature} className="flex gap-3 pt-3 text-sm leading-6 text-foreground/85">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="lg" className="mt-8 w-fit">
                      <Link href={`/packages?package=${encodeURIComponent(item.key)}`}>
                        {chooseLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full py-14 md:py-20 ${wide ? "max-w-none" : ""}`}>
      <div className="grid gap-10">
        <div className="w-full space-y-4 text-left">
          <p className="undara-marketing-meta text-primary">{eyebrow}</p>
          <h2 className="undara-marketing-heading font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">{title}</h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">{description}</p>
        </div>
        <div className={`grid w-full gap-6 ${packages.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {packages.map((item, index) => {
            if (!item) return null;
            const featured = packageKeys.length === 3 && index === 2;
            return (
              <article key={item.key} className={`relative flex h-full w-full flex-col border p-7 md:p-10 ${roundedCard ? "rounded-[40px] border-primary/50 md:rounded-[48px]" : "rounded-3xl"} ${featured ? "border-primary bg-primary/[0.07]" : "bg-card/70"}`}>
                {featured ? <span className="absolute right-5 top-5 rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white">{featuredLabel}</span> : null}
                <p className="undara-marketing-meta text-[var(--primary)]">Undara</p>
                <h3 className="undara-marketing-subheading mt-3 max-w-[85%] font-[family-name:var(--font-undara-heading)] text-primary">{item.name[locale]}</h3>
                <p className="mt-4 text-2xl font-semibold">Rp {item.price.toLocaleString("id-ID")}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{item.description[locale]}</p>
                <ul className="mt-6 flex-1 space-y-3">{item.features[locale].map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" /><span>{feature}</span></li>)}</ul>
                <Button asChild className="mt-7 w-full text-xs uppercase tracking-[0.16em]">
                  <Link href={`/packages?package=${encodeURIComponent(item.key)}`}>{chooseLabel} <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
      {note ? <p className="mt-7 text-xs leading-6 text-muted-foreground">{note}</p> : null}
    </section>
  );
}
