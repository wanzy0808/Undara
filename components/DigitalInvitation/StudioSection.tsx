"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import StudioDemo from "./StudioDemo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";

export default function StudioSection() {
  const { locale } = useLanguage();
  const en = locale === "en";

  return (
    <section id="invitation-studio" className="undara-marketing-section py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
        <div className="min-w-0 w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="undara-marketing-kicker">Invitation Studio</p>
          </div>

          <h2 className="undara-marketing-heading mt-5 font-[family-name:var(--font-undara-heading)] text-primary">
            {en
              ? "A personal touch, made simple."
              : "Sentuhan personal, tanpa proses rumit."}
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "Pick a theme, add your story, then adjust the design directly on the canvas. Your event details and RSVP stay connected."
              : "Pilih tema, isi ceritamu, lalu sesuaikan desain langsung di kanvas. Detail acara dan RSVP tetap terhubung."}
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link href="/studio">
              {en ? "Enter Studio" : "Masuk Studio"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>

        </div>

        <StudioDemo en={en} />

      </div>
    </section>
  );
}
