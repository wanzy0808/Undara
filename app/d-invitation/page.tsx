"use client";

import { useEffect, useRef, useState } from "react";
import PuzzleAssemble from "@/components/DigitalInvitation/PuzzleAssemble";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import HeroSection from "@/components/DigitalInvitation/HeroSection";
import FeatureSection from "@/components/DigitalInvitation/FeatureSection";
import TemplateCollection from "@/components/DigitalInvitation/TemplateSection";
import CtaStudioSection from "@/components/DigitalInvitation/StudioSection";
import PackageShowcase from "@/components/Marketing/PackageShowcase";
import FaqSection from "@/components/Marketing/FaqSection";
import ReviewsGrid from "@/components/DigitalInvitation/ReviewsSection";
import {
  digitalInvitationFaq,
  digitalInvitationReviews,
} from "@/data/services/digital-invitation";

export default function DigitalInvitationPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const [assembleReady, setAssembleReady] = useState(false);

  useEffect(() => {
    // Let the opening veil clear before the hero entrance, so the motion is visible.
    // Direct loads and refreshes start immediately.
    if (document.documentElement.dataset.undaraMarketingTransition !== "1") {
      const frame = requestAnimationFrame(() => setAssembleReady(true));
      return () => cancelAnimationFrame(frame);
    }
    let revealTimer: number | undefined;
    const onReveal = () => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => setAssembleReady(true), 700);
    };
    window.addEventListener("undara-marketing-reveal", onReveal);
    const fallback = window.setTimeout(onReveal, 4300);
    return () => {
      window.removeEventListener("undara-marketing-reveal", onReveal);
      window.clearTimeout(fallback);
      window.clearTimeout(revealTimer);
    };
  }, []);
  const copy =
    locale === "en"
      ? {
          reviewEyebrow: "Client Stories",
          reviewTitle: "Built for more than weddings",
          reviewDescription:
            "From weddings and anniversaries to baby showers and other celebrations, each event keeps its own invitation, RSVP, and guest data.",
          faqTitle: "Frequently asked",
          faqDescription:
            "About per-event pricing, templates, RSVP, guest management, publishing, and the WA Blast add-on.",
        }
      : {
          reviewEyebrow: "Cerita Klien",
          reviewTitle: "Dibuat untuk lebih dari sekadar pernikahan",
          reviewDescription:
            "Pernikahan, ulang tahun pernikahan, syukuran kelahiran, dan perayaan lain dapat memiliki undangan, RSVP, serta data tamu masing-masing.",
          faqTitle: "Yang sering ditanyakan",
          faqDescription:
            "Tentang harga per acara, tema undangan, RSVP, manajemen tamu, publikasi, dan tambahan kuota WA Blast.",
        };

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Shared woodland atmosphere behind the persistent marketing frame. */}
      <PublicMarketingAtmosphere />
      {/* Match the approved landing frame. Only the center panel scrolls; navigation stays visible. */}
      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>
        <main
          ref={scrollRoot}
          tabIndex={0}
          aria-label={locale === "en" ? "Digital invitation page content" : "Konten halaman undangan digital"}
          className="undara-marketing-scroll focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <div className="undara-digital-page undara-marketing-content flex flex-col gap-12 py-8 md:gap-16 md:py-12">
            <HeroSection ready={assembleReady} />
            <div className="undara-invitation-other-sections flex flex-col gap-12 md:gap-16">
              <PuzzleAssemble ready={assembleReady} direction="left" scrollRoot={scrollRoot} delay={0.04} className="w-full">
                <FeatureSection />
              </PuzzleAssemble>
              <PuzzleAssemble ready={assembleReady} direction="right" scrollRoot={scrollRoot} delay={0.07} className="w-full">
                <TemplateCollection />
              </PuzzleAssemble>
              <PuzzleAssemble ready={assembleReady} direction="bottom" scrollRoot={scrollRoot} delay={0.07} className="w-full">
                <CtaStudioSection />
              </PuzzleAssemble>
              <PuzzleAssemble ready={assembleReady} direction="left" scrollRoot={scrollRoot} delay={0.07} className="w-full">
                <PackageShowcase
                  eyebrow=""
                  title=""
                  description=""
                  packageKeys={["INVITATION_BASIC"]}
                  compact
                />
              </PuzzleAssemble>
              <PuzzleAssemble ready={assembleReady} direction="right" scrollRoot={scrollRoot} delay={0.07} className="w-full">
                <ReviewsGrid
                  eyebrow={copy.reviewEyebrow}
                  title={copy.reviewTitle}
                  description={copy.reviewDescription}
                  reviews={digitalInvitationReviews[locale]}
                />
              </PuzzleAssemble>
              <PuzzleAssemble ready={assembleReady} direction="bottom" scrollRoot={scrollRoot} delay={0.07} className="w-full">
                <FaqSection
                  wide
                  editorial
                  title={copy.faqTitle}
                  description={copy.faqDescription}
                  items={digitalInvitationFaq[locale]}
                />
              </PuzzleAssemble>
            </div>
          </div>
        </main>
        <MarketingFrameFooter />
      </div>
    </div>
  );
}
