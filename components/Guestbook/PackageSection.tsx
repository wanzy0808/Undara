"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { getServicePackage } from "@/lib/packages/catalog";

const prominentFeatures = [0, 12, 13, 14, 15];

export default function PackageSection() {
  const { locale } = useLanguage();
  const en = locale === "en";
  const item = getServicePackage("GUESTBOOK_DIGITAL");
  if (!item) return null;
  const features = item.features[locale];
  return (
    <section id="paket-guestbook" className="undara-marketing-section py-14 md:py-20">
      <h2 className="undara-marketing-heading font-[family-name:var(--font-undara-heading)] text-primary">
        {en ? "Ready for your event day." : "Lengkap untuk hari acaramu."}
      </h2>
      <div className="mt-8 flex flex-col gap-9 rounded-[20px] bg-primary/[0.045] p-6 sm:p-9 lg:flex-row lg:gap-14">
        <div className="min-w-0 lg:w-[38%] lg:shrink-0">
          <h3 className="undara-marketing-subheading text-primary">{item.name[locale]}</h3>
          <p className="mt-5 font-[family-name:var(--font-undara-heading)] text-5xl leading-tight text-primary sm:text-6xl">Rp{item.price.toLocaleString("id-ID")}</p>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{en ? "For one event." : "Untuk satu acara."}</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/packages?package=GUESTBOOK_DIGITAL">{en ? "Choose package" : "Pilih paket"}<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <ul className="min-w-0 flex-1 space-y-5 lg:pt-2">
          {prominentFeatures.map(index => (
            <li key={features[index]} className="flex items-start gap-3 text-base leading-7 text-foreground">
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
              {index === 0 ? <Link href="/d-invitation" className="underline decoration-primary/40 underline-offset-4 hover:text-primary">{features[index]}</Link> : <span>{features[index]}</span>}
            </li>
          ))}
        </ul>
      </div>
      <details className="group mt-7">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-[12px] py-3 text-base font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          {en ? "More included in your package" : "Layanan lainnya dalam paket"}
          <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <ul className="mt-4 space-y-4">
          {features.filter((_, index) => !prominentFeatures.includes(index)).map(feature => (
            <li key={feature} className="flex items-start gap-3 text-base leading-7 text-foreground">
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />{feature}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-6 max-w-[80ch] text-base leading-8 text-muted-foreground">
        {en ? "Physical QR printing, gift registry and guest-group arrangements are discussed with our team." : "Cetak QR, daftar hadiah, dan pembagian kelompok tamu dibicarakan bersama tim kami."}
      </p>
    </section>
  );
}
