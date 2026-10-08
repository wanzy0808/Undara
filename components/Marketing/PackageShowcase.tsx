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
}: PackageShowcaseProps) {
  const { locale } = useLanguage();
  const packages = packageKeys.map(getServicePackage).filter(Boolean);
  const chooseLabel = locale === "en" ? "Choose package" : "Pilih paket";
  const featuredLabel = locale === "en" ? "Best value" : "Paling lengkap";

  if (editorial) {
    return (
      <section className="undara-marketing-section py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:gap-20">
          <div className="max-w-xl lg:pt-6">
            <p className="undara-marketing-kicker">{eyebrow}</p>
            <h2 className="undara-marketing-heading mt-4 max-w-[15ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
              {title}
            </h2>
            <p className="mt-6 text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
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
                    <h3 className="undara-marketing-subheading mt-5 max-w-[16ch] font-[family-name:var(--font-undara-heading)] text-primary">
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
      <div className={`grid gap-10 ${wide && packages.length === 1 ? "lg:grid-cols-[0.95fr_1.05fr] lg:gap-16" : ""}`}>
        <div className={`space-y-4 ${wide && packages.length === 1 ? "lg:pt-8" : "max-w-3xl text-left"}`}>
          <p className="undara-marketing-meta text-primary">{eyebrow}</p>
          <h2 className="undara-marketing-heading max-w-[20ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">{title}</h2>
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
