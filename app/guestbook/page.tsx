"use client";

import { useRef } from "react";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import ScrollReveal from "@/components/EventPlanner/ScrollReveal";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import HeroSection from "@/components/Guestbook/HeroSection";
import FeatureSection from "@/components/Guestbook/FeatureSection";
import ProcessSection from "@/components/Guestbook/ProcessSection";
import PackageSection from "@/components/Guestbook/PackageSection";
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
          <div className="undara-guestbook-page undara-marketing-content flex flex-col gap-12 py-8 md:gap-16 md:py-12">
            <ScrollReveal scrollRoot={scrollRoot} lift>
              <HeroSection />
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="w-full">
                <FeatureSection />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="w-full">
                <ProcessSection />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="w-full">
                <PackageSection />
              </div>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <div className="w-full [&_button[aria-expanded]]:text-base [&_[data-dc-text-reveal]]:text-base">
              <FaqSection
                eyebrow={en ? "Before event day" : "Sebelum Hari Acara"}
                title={en ? "Before guests arrive." : "Sebelum tamu datang."}
                description=""
                defaultOpen={null}
                items={faqItems}
                wide
                editorial
              />
              </div>
            </ScrollReveal>
          </div>
        </main>

        <MarketingFrameFooter />
      </div>
    </div>
  );
}
