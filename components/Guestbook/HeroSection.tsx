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
    <section className="undara-marketing-section relative grid min-h-[calc(100dvh-170px)] items-center gap-12 overflow-hidden pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-16">
      <div className="relative z-10 min-w-0 w-full py-8 lg:py-12">
        <p className="undara-marketing-kicker">
          {en ? "Digital Guestbook / Event Day" : "Buku Tamu Digital / Hari Acara"}
        </p>

        <h1 className="undara-marketing-title mt-5 font-[family-name:var(--font-undara-heading)] tracking-[-0.04em] text-primary">
          {en ? "Welcome every guest." : "Sambut setiap tamu."}
          <span className="block text-foreground">
            {en ? "Keep every arrival clear." : "Buat setiap kedatangan terasa jelas."}
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
          {en
            ? "Bring guest verification, official QR check-in, seating, and live attendance into one calm event-day flow for the reception team."
            : "Satukan verifikasi tamu, pemindaian QR resmi, pengaturan meja, dan pemantauan kehadiran langsung dalam satu alur untuk tim penerima tamu."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/packages">
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

      <div className="relative z-10 min-h-[470px] lg:min-h-[690px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[5%] top-[3%] h-[68%] w-[65%] rounded-full bg-[radial-gradient(circle,rgba(112,59,59,0.12),transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(214,179,140,0.10),transparent_68%)]"
        />
        <div className="undara-editorial-media absolute inset-[4%_0_2%_4%]">
          <Image
            src="/assets/marketing/guestbook/hero.webp"
            alt={en ? "Guest reception at an event" : "Penerimaan tamu di acara"}
            fill
            priority
            sizes="(max-width: 1024px) 94vw, 54vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,18,16,0.82)_0%,rgba(30,18,16,0.18)_48%,transparent_72%)]" />
          <div className="absolute bottom-7 left-7 right-7 text-white md:bottom-10 md:left-10 md:right-10">
            <p className="undara-marketing-meta text-white/65">
              {en ? "Arrival experience" : "Pengalaman Kedatangan"}
            </p>
            <p className="mt-2 max-w-lg font-[family-name:var(--font-undara-heading)] text-2xl leading-tight md:text-3xl lg:text-4xl">
              {en
                ? "A warm welcome for guests, a clearer flow for the team."
                : "Hangat untuk tamu, lebih jelas untuk tim yang menyambut."}
            </p>
          </div>
        </div>

        <div className="absolute left-0 top-[16%] hidden w-[220px] rounded-[20px] border border-primary/25 bg-background/88 p-5 shadow-[0_18px_50px_rgba(58,32,32,0.11)] backdrop-blur-md md:block">
          <p className="undara-editorial-index">{en ? "Guest arrival" : "Kedatangan Tamu"}</p>
          <p className="mt-3 font-[family-name:var(--font-undara-heading)] text-xl leading-tight text-primary">
            {en ? "Verify first. Check in with confidence." : "Verifikasi dulu. Catat kedatangan dengan yakin."}
          </p>
        </div>
      </div>
    </section>
  );
}
