"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const { locale } = useLanguage();
  const en = locale === "en";

  return (
    <section className="undara-marketing-section relative grid min-h-[calc(100dvh-220px)] items-center gap-8 overflow-hidden pb-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:pb-16">
      <div className="relative z-10 min-w-0 w-full py-4 lg:py-12">
        <p className="undara-marketing-kicker">
          {en ? "Digital Guestbook" : "Buku Tamu Digital"}
        </p>

        <h1 className="undara-marketing-title mt-5 font-[family-name:var(--font-undara-heading)] tracking-normal text-primary">
          {en ? "A calmer welcome for every guest." : "Sambut tamu dengan lebih tenang."}
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
          {en
            ? "Verify guests, scan their QR codes, and direct them to their seats. Keep the reception team connected to one guest list."
            : "Verifikasi tamu, pindai QR, lalu arahkan ke tempat duduknya. Tim penerima bekerja dari satu daftar tamu yang sama."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/packages?package=GUESTBOOK_DIGITAL">
              {en ? "Explore Guestbook" : "Lihat Paket Buku Tamu"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#fitur-guestbook">
              {en ? "See the guest flow" : "Lihat Alur Tamu"}
              <ArrowDownRight className="h-4 w-4" />
            </a>
          </Button>
        </div>


      </div>

      <div className="undara-editorial-media relative aspect-[4/3] w-full lg:aspect-[4/5] lg:max-h-[560px]">
        <Image
          src="/assets/marketing/guestbook/hero.webp"
          alt={en ? "Guests showing a QR code to the reception team" : "Tamu menunjukkan QR kepada tim penerima"}
          fill
          priority
          sizes="(max-width: 1023px) 90vw, 45vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
