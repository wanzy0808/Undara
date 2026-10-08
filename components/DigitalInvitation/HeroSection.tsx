"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import PuzzleAssemble from "@/components/DigitalInvitation/PuzzleAssemble";

export default function HeroSection({ ready }: { ready: boolean }) {
  const { locale } = useLanguage();
  const copy =
    locale === "en"
      ? {
          eyebrow: "Digital Invitation for Every Event",
          title: "An invitation that feels like you.",
          accent: "One event, one invitation. Create as many as you need.",
          description:
            "Build a digital invitation for weddings, anniversaries, baby showers, birthdays, or any celebration that needs RSVP and an organized guest list.",
          explore: "Explore templates",
          tags: ["Rp150,000 / event", "RSVP included", "Guest management included"],
          eventName: "Nadia's 30th",
          date: "Saturday, 18 October 2026",
          venue: "The Garden, Jakarta",
          greeting: "You're invited",
          invitation:
            "Join us for an evening of dinner, music, and celebration",
          countdown: "Until the celebration",
          signoff: "See you there — Nadia",
          rsvp: "RSVP",
        }
      : {
          eyebrow: "Undangan Digital untuk Setiap Acara",
          title: "Undangan yang terasa personal.",
          accent: "Satu acara, satu undangan. Buat sebanyak yang kamu butuhkan.",
          description:
            "Buat undangan digital untuk pernikahan, ulang tahun pernikahan, syukuran kelahiran, ulang tahun, atau perayaan lain yang membutuhkan RSVP dan daftar tamu yang rapi.",
          explore: "Lihat Template",
          tags: ["Rp150.000 / acara", "RSVP termasuk", "Manajemen tamu termasuk"],
          eventName: "Nadia's 30th",
          date: "Sabtu, 18 Oktober 2026",
          venue: "The Garden, Jakarta",
          greeting: "Kamu diundang",
          invitation:
            "Rayakan malam penuh makan malam, musik, dan cerita bersama kami",
          countdown: "Menuju acara",
          signoff: "Sampai bertemu — Nadia",
          rsvp: "RSVP",
        };

  return (
    <section className="undara-marketing-section relative mx-auto grid min-h-[calc(100dvh-220px)] w-full min-w-0 items-center gap-12 overflow-hidden pb-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-14 lg:pb-16">
      <div className="undara-invitation-hero-copy relative z-10 min-w-0 w-full max-w-none py-8 lg:py-12">
        <PuzzleAssemble ready={ready} direction="top" delay={0.04}>
          <p className="undara-marketing-meta text-primary">
            {copy.eyebrow}
          </p>
        </PuzzleAssemble>
        <PuzzleAssemble ready={ready} direction="left" delay={0.12}>
          <h1 className="undara-marketing-title mt-5 max-w-[20ch] font-[family-name:var(--font-undara-heading)] tracking-normal text-primary">
            {copy.title}
          </h1>
        </PuzzleAssemble>
        <PuzzleAssemble ready={ready} direction="right" delay={0.22}>
          <p className="mt-6 max-w-[42ch] text-lg leading-8 text-foreground">{copy.accent}</p>
          <p className="mt-4 max-w-[56ch] font-[family-name:var(--font-undara-body)] text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {copy.description}
          </p>
        </PuzzleAssemble>
        <PuzzleAssemble ready={ready} direction="bottom" delay={0.3}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/template-design" className="gap-2">
                {copy.explore}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </PuzzleAssemble>
        <PuzzleAssemble ready={ready} direction="left" delay={0.38}>
          <div className="mt-7 flex max-w-3xl flex-wrap gap-x-7 gap-y-3 undara-marketing-meta text-muted-foreground">
            {copy.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </PuzzleAssemble>
      </div>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-xl py-8 lg:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-[10%] top-[4%] h-[72%] w-[72%] rounded-full bg-[radial-gradient(circle,rgba(112,59,59,0.12),transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(214,179,140,0.10),transparent_68%)]" />
        <PuzzleAssemble ready={ready} direction="right" delay={0.15} className="relative mx-auto w-[min(100%,300px)]">
          <div className="relative aspect-[9/19.5] overflow-visible rounded-[42px] bg-gradient-to-br from-[#f8f8f8] via-[#a9a9aa] to-[#303032] p-[3px] shadow-[0_34px_70px_rgba(17,17,17,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] dark:from-[#e4e4e4] dark:via-[#77777a] dark:to-[#121214]">
            <div
              className="absolute -right-[4px] top-[24%] h-16 w-[4px] rounded-r-full bg-[#4a4a4c] shadow-[inset_1px_0_1px_rgba(255,255,255,0.28)] dark:bg-[#8b8b8e]"
              aria-hidden="true"
            />
            <div
              className="absolute -left-[4px] top-[21%] h-9 w-[4px] rounded-l-full bg-[#4a4a4c] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.28)] dark:bg-[#8b8b8e]"
              aria-hidden="true"
            />
            <div
              className="absolute -left-[4px] top-[31%] h-14 w-[4px] rounded-l-full bg-[#4a4a4c] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.28)] dark:bg-[#8b8b8e]"
              aria-hidden="true"
            />
            <div
              className="absolute -left-[4px] top-[43%] h-14 w-[4px] rounded-l-full bg-[#4a4a4c] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.28)] dark:bg-[#8b8b8e]"
              aria-hidden="true"
            />

            <div className="relative h-full overflow-hidden rounded-[39px] border border-black/70 bg-[#080808] p-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),inset_0_0_16px_rgba(0,0,0,0.95)] dark:border-white/20">
              <div
                className="pointer-events-none absolute inset-[7px] z-20 rounded-[33px] border border-white/10"
                aria-hidden="true"
              />
              <div className="relative h-full overflow-hidden rounded-[32px] bg-[#f8f4f1] shadow-[inset_0_0_18px_rgba(0,0,0,0.18)] dark:bg-[#111111]">
                <div
                  className="absolute left-1/2 top-2.5 z-30 h-7 w-[34%] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.4)]"
                  aria-hidden="true"
                >
                  <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#151515] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
                </div>

                <div className="invitation-phone-scroll absolute inset-x-0 top-0 w-full">
                  <article className="min-h-full bg-[#f8f4f1] px-7 pb-16 pt-12 text-[#2a2220] dark:bg-[#111111] dark:text-white">
                    <div className="mx-auto max-w-[250px] text-center">
                      <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.28em] text-[#8b5d62] dark:text-primary">
                        {copy.greeting}
                      </p>
                      <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#b78b8f]/50">
                        <PartyPopper
                          className="h-5 w-5 text-[#a55d66] dark:text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="mt-8 font-[family-name:var(--font-undara-heading)] text-[12px] leading-5 text-[#72555a] dark:text-white/70">
                        {copy.invitation}
                      </p>
                      <h2 className="mt-5 font-[family-name:var(--font-undara-heading)] text-[38px] font-normal leading-[0.95] tracking-[-0.05em] text-[#3b2a2c] dark:text-white">
                        {copy.eventName}
                      </h2>
                      <div className="mx-auto my-8 h-px w-12 bg-[#a55d66]/40 dark:bg-primary/50" />
                      <p className="font-[family-name:var(--font-undara-heading)] text-[20px] italic leading-[1.1] text-[#76565b] dark:text-white/80">
                        Good people. Good food. Good memories.
                      </p>
                    </div>

                    <div className="mx-auto mt-12 aspect-[4/3] max-w-[290px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#d7c0b9] via-[#eee2dc] to-[#b58c8c] p-4 shadow-sm">
                      <div className="flex h-full items-end rounded-[18px] border border-white/40 bg-white/15 p-5 backdrop-blur-sm">
                        <p className="font-[family-name:var(--font-undara-heading)] text-2xl italic leading-[1.1] text-white">
                          Celebrate together
                        </p>
                      </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-[290px] space-y-5 border-y border-[#b78b8f]/30 py-8">
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#a55d66] dark:text-primary" />
                        <div>
                          <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.2em] opacity-55">
                            Date
                          </p>
                          <p className="mt-1 text-[12px]">{copy.date}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#a55d66] dark:text-primary" />
                        <div>
                          <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.2em] opacity-55">
                            Time
                          </p>
                          <p className="mt-1 text-[12px]">18:00 WIB — selesai</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a55d66] dark:text-primary" />
                        <div>
                          <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.2em] opacity-55">
                            Venue
                          </p>
                          <p className="mt-1 text-[12px]">{copy.venue}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-[290px] rounded-[22px] bg-[#eee3df] px-6 py-8 text-center dark:bg-white/6">
                      <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.22em] text-[#8b5d62] dark:text-primary">
                        {copy.countdown}
                      </p>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          ["120", "days"],
                          ["08", "hours"],
                          ["42", "mins"],
                        ].map(([value, label]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-[#b78b8f]/25 px-2 py-3"
                          >
                            <p className="font-[family-name:var(--font-undara-heading)] text-xl">
                              {value}
                            </p>
                            <p className="mt-1 font-[family-name:var(--font-undara-mono)] text-[6px] uppercase tracking-widest opacity-50">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-[290px] text-center">
                      <p className="font-[family-name:var(--font-undara-heading)] text-xl">
                        We would love to see you
                      </p>
                      <div className="mt-5 inline-flex rounded-full bg-[#a55d66] px-6 py-3 font-[family-name:var(--font-undara-mono)] text-[8px] uppercase tracking-[0.2em] text-white dark:bg-primary dark:text-primary-foreground">
                        {copy.rsvp}
                      </div>
                      <p className="mt-8 font-[family-name:var(--font-undara-heading)] text-lg italic leading-[1.1] opacity-70">
                        {copy.signoff}
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </PuzzleAssemble>
      </div>

      <style jsx>{`
        .invitation-phone-scroll {
          animation: invitation-phone-scroll 18s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes invitation-phone-scroll {
          0%,
          12% {
            transform: translateY(0);
          }
          44%,
          56% {
            transform: translateY(-38%);
          }
          88%,
          100% {
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .invitation-phone-scroll {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
