"use client";

import { useRef } from "react";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import MarketingTextReveal from "@/components/DigitalInvitation/MarketingTextReveal";
import ScrollReveal from "@/components/EventPlanner/ScrollReveal";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import HeroSection from "@/components/Guestbook/HeroSection";
import FeatureSection from "@/components/Guestbook/FeatureSection";
import ProcessSection from "@/components/Guestbook/ProcessSection";
import PackageShowcase from "@/components/Marketing/PackageShowcase";
import FaqSection from "@/components/Marketing/FaqSection";
import { guestbookFaq } from "@/data/services/guestbook";

export default function GuestbookPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const en = locale === "en";

  const faqItems = guestbookFaq.map((item) => ({
    question: en ? item.questionEn : item.question,
    answer: en ? item.answerEn : item.answer,
  }));

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />
      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>

        <main
          ref={scrollRoot}
          tabIndex={0}
          aria-label={en ? "Guestbook page content" : "Konten halaman Buku Tamu Digital"}
          className="undara-marketing-scroll focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <MarketingTextReveal
            className="undara-marketing-content flex flex-col gap-24 py-8 md:gap-28 md:py-12"
            scrollRoot={scrollRoot}
            ready
            locale={locale}
          >
            <ScrollReveal scrollRoot={scrollRoot} lift>
              <HeroSection />
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="undara-editorial-offset-left">
                <FeatureSection />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="undara-editorial-offset-right">
                <ProcessSection />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="undara-editorial-offset-left">
              <PackageShowcase
                eyebrow={en ? "Digital Guestbook" : "Buku Tamu Digital"}
                title={
                  en
                    ? "Event-day guest operations that stay organized."
                    : "Operasional tamu yang tetap rapi saat acara berlangsung."
                }
                description={
                  en
                    ? "Digital Guestbook is a dedicated event-day service for official QR check-in, the Usher App, seating, guest displays, and attendance monitoring at the venue."
                    : "Buku Tamu Digital membantu penerimaan tamu di hari acara: pemindaian QR resmi, aplikasi penerima tamu, pengaturan meja, tampilan sapaan, dan pemantauan kehadiran di lokasi."
                }
                packageKeys={["GUESTBOOK_DIGITAL"]}
                wide
                editorial
                note={
                  en
                    ? "The package includes a Digital Invitation for this event at no extra charge. Physical QR printing, gift registry, and guest-group arrangements are discussed with our team."
                    : "Paket ini sudah termasuk Undangan Digital untuk acara yang sama tanpa biaya tambahan. Cetak QR, daftar hadiah, dan pembagian kelompok tamu dibicarakan bersama tim kami."
                }
              />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section className="undara-marketing-section undara-editorial-offset-right grid gap-8 pb-14 ">
                <div>
                  <p className="undara-marketing-kicker">{en ? "One event, one source" : "Satu Acara, Satu Sumber Data"}</p>
                  <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                    {en ? "One guest list for the whole reception team." : "Satu daftar tamu untuk seluruh tim penerima."}
                  </h2>
                </div>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {en
                    ? "The usher verifies arrivals and scans valid QR codes while the event team follows attendance and seating from the same event-scoped data."
                    : "Petugas penerima tamu memverifikasi kedatangan dan memindai QR yang valid, sementara tim acara memantau kehadiran dan meja dari data acara yang sama."}
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="undara-editorial-offset-left">
              <FaqSection
                eyebrow={en ? "Before event day" : "Sebelum Hari Acara"}
                title={en ? "Questions the reception team should settle early." : "Pertanyaan yang sebaiknya jelas sebelum tamu datang."}
                description={
                  en
                    ? "Official check-in, usher verification, seating, and product boundaries are explained up front so the venue team can work with a predictable flow."
                    : "Aturan pencatatan kedatangan, verifikasi petugas, pengaturan meja, dan cakupan layanan dijelaskan sejak awal agar tim di lokasi bekerja dengan alur yang jelas."
                }
                items={faqItems}
                wide
                editorial
              />
              </div>
            </ScrollReveal>
          </MarketingTextReveal>
        </main>

        <MarketingFrameFooter />
      </div>
    </div>
  );
}
