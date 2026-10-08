"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  Check,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/Layout/Navbar/Navbar";
import EventPlannerBotanicalAtmosphere from "@/components/EventPlanner/EventPlannerBotanicalAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import ScrollReveal from "@/components/EventPlanner/ScrollReveal";
import ServicesSection from "@/components/EventPlanner/ServicesSection";
import FaqSection from "@/components/Marketing/FaqSection";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { plannerFaq, plannerPackages } from "@/data/services/event-planner";

const WHATSAPP_NUMBER = "6281285009609";

function consultationUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function PlannerNote({
  src,
  className,
  motionY = 10,
  rotate = 0,
  reduced,
}: {
  src: string;
  className: string;
  motionY?: number;
  rotate?: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 ${className}`}
      animate={
        reduced
          ? undefined
          : {
              y: [0, -motionY, 0],
              rotate: [rotate, rotate + 1.4, rotate],
            }
      }
      transition={{ duration: 10 + motionY * 0.18, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image src={src} alt="" fill sizes="36vw" className="object-contain" />
    </motion.div>
  );
}

export default function EventPlannerPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const reduced = Boolean(useReducedMotion());
  const en = locale === "en";
  const serviceRail = useRef<HTMLDivElement>(null);
  const servicePauseUntil = useRef(0);
  const [servicesPlaying, setServicesPlaying] = useState(true);
  const [railEdges, setRailEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = serviceRail.current;
    if (!rail) return;
    const updateEdges = () => setRailEdges({
      start: rail.scrollLeft <= 2,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2,
    });
    updateEdges();
    rail.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const rail = serviceRail.current;
    if (!rail || reduced || !servicesPlaying) return;
    let frame = 0;
    let previousTime = 0;
    let direction = 1;
    let hovered = window.matchMedia("(hover: hover)").matches && rail.matches(":hover");
    let focused = rail.contains(document.activeElement);
    const pauseInteraction = () => { servicePauseUntil.current = performance.now() + 4000; };
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") hovered = true; };
    const leave = () => { hovered = false; };
    const focus = () => { focused = true; };
    const blur = (event: FocusEvent) => { focused = rail.contains(event.relatedTarget as Node | null); };
    const animate = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 40) : 0;
      previousTime = time;
      if (!document.hidden && !hovered && !focused && time >= servicePauseUntil.current) {
        const max = rail.scrollWidth - rail.clientWidth;
        if (max > 0) {
          if (rail.scrollLeft >= max - 1) direction = -1;
          else if (rail.scrollLeft <= 1) direction = 1;
          rail.scrollLeft += direction * elapsed * 0.024;
        }
      }
      frame = requestAnimationFrame(animate);
    };
    rail.addEventListener("pointerenter", enter);
    rail.addEventListener("pointerleave", leave);
    rail.addEventListener("pointerdown", pauseInteraction);
    rail.addEventListener("wheel", pauseInteraction, { passive: true });
    rail.addEventListener("keydown", pauseInteraction);
    rail.addEventListener("focusin", focus);
    rail.addEventListener("focusout", blur);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("pointerenter", enter);
      rail.removeEventListener("pointerleave", leave);
      rail.removeEventListener("pointerdown", pauseInteraction);
      rail.removeEventListener("wheel", pauseInteraction);
      rail.removeEventListener("keydown", pauseInteraction);
      rail.removeEventListener("focusin", focus);
      rail.removeEventListener("focusout", blur);
    };
  }, [reduced, servicesPlaying]);

  function moveServices(direction: number, keyboard = false) {
    servicePauseUntil.current = performance.now() + 4000;
    const rail = serviceRail.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("article");
    if (!card) return;
    rail.scrollBy({
      left: direction * (card.offsetWidth + 24),
      behavior: reduced || keyboard ? "instant" : "smooth",
    });
  }

  const scope = en
    ? ["Wedding", "Birthday", "Family Celebrations", "Corporate Events"]
    : ["Pernikahan", "Ulang Tahun", "Perayaan Keluarga", "Acara Perusahaan"];

  const faqItems = plannerFaq.map((item) => ({
    question: en ? item.questionEn : item.question,
    answer: en ? item.answerEn : item.answer,
  }));

  return (
    <div className="event-planner-shell relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <EventPlannerBotanicalAtmosphere />
      <div data-undara-marketing-frame className="undara-marketing-frame event-planner-frame">

        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>

        <main
          ref={scrollRoot}
          tabIndex={0}
          aria-label={en ? "Event Planner page content" : "Konten halaman Event Planner"}
          className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <div className="undara-marketing-content flex w-full max-w-none flex-col gap-24 py-8 md:gap-28 md:py-12">
            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="undara-marketing-section relative mx-auto grid min-h-[calc(100dvh-170px)] w-full max-w-[1560px] items-center gap-10 overflow-hidden pb-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:pb-16">
                <PlannerNote
                  src="/assets/note1.webp"
                  className="-right-[5%] top-[3%] h-[52%] w-[40%] opacity-[0.12] lg:opacity-[0.16] dark:opacity-[0.08]"
                  motionY={12}
                  rotate={7}
                  reduced={reduced}
                />

                <div className="relative z-10 max-w-3xl py-8 lg:py-12">
                  <p className="font-[family-name:var(--font-undara-mono)] text-[10px] font-semibold uppercase tracking-[0.22em] text-primary md:text-xs">
                    {en ? "Event Planner via Undara" : "Event Planner via Undara"}
                  </p>

                  <h1 className="mt-5 max-w-[15ch] font-[family-name:var(--font-undara-heading)] text-[clamp(3rem,6vw,6.6rem)] leading-[0.94] tracking-[-0.035em] text-primary">
                    {en ? "Need an Event Planner?" : "Butuh Event Planner?"}
                    <span className="block text-foreground">
                      {en ? "Tell us about the event first." : "Ceritakan dulu acaranya."}
                    </span>
                  </h1>

                  <p className="mt-7 max-w-2xl font-[family-name:var(--font-undara-body)] text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "Send the event type, date, city, venue if available, and estimated guest count. Undara will help collect the initial requirements and connect you for the next discussion."
                      : "Kirim jenis acara, tanggal, kota, tempat kalau sudah ada, dan perkiraan jumlah tamu. Undara membantu menerima kebutuhan awal lalu menghubungkan kamu untuk pembahasan berikutnya."}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button asChild size="lg">
                      <a
                        href={consultationUrl(
                          en
                            ? "Hi, I would like to ask about Event Planner services via Undara."
                            : "Halo, aku ingin tanya mengenai layanan Event Planner via Undara.",
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {en ? "Chat on WhatsApp" : "Tanya via WhatsApp"}
                      </a>
                    </Button>

                    <Button asChild size="lg" variant="outline">
                      <a href="#cara-mulai">
                        {en ? "See How to Start" : "Lihat Cara Mulai"}
                        <ArrowDownRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="mt-10 flex max-w-3xl flex-wrap gap-x-7 gap-y-3 pt-5">
                    {scope.map((item) => (
                      <p
                        key={item}
                        className="font-[family-name:var(--font-undara-mono)] text-[9px] uppercase tracking-[0.13em] text-muted-foreground"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 min-h-[460px] lg:min-h-[680px]">
                  <motion.div
                    className="undara-editorial-media absolute inset-[4%_0_2%_4%]"
                    initial={reduced ? false : { opacity: 0, scale: 1.025, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Image
                      src="/assets/marketing/event-planner/hero.webp"
                      alt={
                        en
                          ? "Event planning consultation and preparation"
                          : "Konsultasi dan persiapan kebutuhan Event Planner"
                      }
                      fill
                      priority
                      sizes="(max-width: 1024px) 94vw, 54vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(24,16,12,0.74)_0%,rgba(24,16,12,0.12)_48%,transparent_72%)]" />
                    <div className="absolute bottom-6 left-6 right-6 text-white md:bottom-8 md:left-8 md:right-8">
                      <p className="font-[family-name:var(--font-undara-mono)] text-[9px] uppercase tracking-[0.17em] text-white/70">
                        {en ? "Useful details to prepare" : "Informasi yang berguna untuk disiapkan"}
                      </p>
                      <p className="mt-2 max-w-lg font-[family-name:var(--font-undara-heading)] text-2xl leading-tight md:text-3xl">
                        {en
                          ? "Date, venue, guest count, and the kind of help you are looking for."
                          : "Tanggal, tempat, jumlah tamu, dan bantuan seperti apa yang sedang kamu cari."}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section id="cara-mulai" className="relative mx-auto w-full max-w-[1500px] scroll-mt-24 py-4">
                <PlannerNote
                  src="/assets/note2.webp"
                  className="-left-[8%] top-[4%] h-[62%] w-[36%] -rotate-6 opacity-[0.09] lg:opacity-[0.13] dark:opacity-[0.06]"
                  motionY={8}
                  rotate={-6}
                  reduced={reduced}
                />
                <div className="relative z-10 lg:pl-[8%]">
                  <ServicesSection locale={locale} />
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="relative mx-auto w-full max-w-[1500px] py-12 md:py-16 lg:py-20">
                <PlannerNote
                  src="/assets/note3.webp"
                  className="-right-[5%] top-[2%] h-[64%] w-[36%] rotate-6 opacity-[0.09] lg:opacity-[0.14] dark:opacity-[0.06]"
                  motionY={11}
                  rotate={6}
                  reduced={reduced}
                />

                <div className="relative z-10 flex flex-col gap-6 md:gap-8">
                  <div>
                    <p className="font-[family-name:var(--font-undara-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                      {en ? "Service Direction" : "Pilihan Layanan"}
                    </p>
                    <h2 className="mt-4 max-w-[22ch] font-[family-name:var(--font-undara-heading)] text-[clamp(2.75rem,4.8vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.035em] text-primary">
                      {en ? "What can you ask about?" : "Apa yang bisa kamu tanyakan?"}
                    </h2>
                  </div>

                  <div className="max-w-3xl">
                    <p className="font-[family-name:var(--font-undara-heading)] text-xl font-bold leading-snug text-foreground md:text-2xl">
                      {en
                        ? "Start with the service that feels closest to your event."
                        : "Mulai dari layanan yang paling mendekati kebutuhan acaramu."}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-8 flex justify-end gap-3">
                  {!reduced && (
                    <Button
                      variant="outline"
                      onClick={() => setServicesPlaying((playing) => !playing)}
                      aria-controls="planner-service-rail"
                    >
                      {servicesPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {servicesPlaying ? (en ? "Pause" : "Jeda") : (en ? "Play" : "Putar")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={en ? "Previous service" : "Layanan sebelumnya"}
                    aria-controls="planner-service-rail"
                    disabled={railEdges.start}
                    onClick={(event) => moveServices(-1, event.detail === 0)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={en ? "Next service" : "Layanan berikutnya"}
                    aria-controls="planner-service-rail"
                    disabled={railEdges.end}
                    onClick={(event) => moveServices(1, event.detail === 0)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div
                  ref={serviceRail}
                  id="planner-service-rail"
                  role="region"
                  aria-roledescription="carousel"
                  aria-label={en ? "Event planning services" : "Pilihan layanan acara"}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      moveServices(event.key === "ArrowLeft" ? -1 : 1, true);
                    }
                  }}
                  className="relative z-10 mt-5 flex gap-6 overflow-x-auto overscroll-x-contain rounded-[24px] pb-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {plannerPackages.map((item) => {
                    const features = en ? item.featuresEn : item.features;

                    return (
                      <article
                        key={item.key}
                        role="group"
                        aria-roledescription={en ? "slide" : "kartu"}
                        aria-label={en ? item.nameEn : item.name}
                        className="flex w-[88%] max-w-[440px] shrink-0 flex-col gap-5 rounded-[24px] border border-primary/25 bg-background p-6 sm:w-[440px] md:p-8"
                      >
                        <div>
                          <h3 className="max-w-3xl font-[family-name:var(--font-undara-heading)] text-3xl font-bold leading-[1.08] text-primary">
                            {en ? item.nameEn : item.name}
                          </h3>
                          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                            {en ? item.descriptionEn : item.description}
                          </p>
                        </div>

                        <div className="flex flex-1 flex-col">
                          <ul className="mb-7 grid gap-3">
                            {features.map((feature) => (
                              <li
                                key={feature}
                                className="flex gap-3 text-sm leading-6 text-foreground/85"
                              >
                                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
                            <a
                              href={consultationUrl(en ? item.waMessageEn : item.waMessage)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {en ? "Ask about this" : "Tanya layanan ini"}
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="mx-auto grid w-full max-w-[1500px] gap-8 pb-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16 lg:pb-16">
                <div>
                  <p className="font-[family-name:var(--font-undara-mono)] text-[10px] uppercase tracking-[0.2em] text-primary">
                    {en ? "Already using Undara?" : "Sudah pakai Undara?"}
                  </p>
                  <h2 className="mt-4 max-w-[18ch] font-[family-name:var(--font-undara-heading)] text-4xl font-bold leading-[1.04] tracking-[-0.025em] text-primary md:text-5xl">
                    {en ? "Digital invitations can stay separate." : "Undangan Digital tetap bisa dipakai terpisah."}
                  </h2>
                </div>

                <div className="flex flex-col gap-7">
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "If you need RSVP and guest management, Undara Digital Invitations can be used independently from the Event Planner consultation."
                      : "Kalau kamu membutuhkan RSVP dan manajemen tamu, Undangan Digital Undara tetap bisa digunakan terpisah dari konsultasi Event Planner."}
                  </p>
                  <Button asChild variant="outline" className="w-fit">
                    <Link href="/d-invitation">
                      {en ? "Explore Digital Invitations" : "Lihat Undangan Digital"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="mx-auto w-full max-w-[1400px]">
                <FaqSection
                  eyebrow={en ? "Frequently asked" : "Yang sering ditanyakan"}
                  title={en ? "Before you send the first message" : "Sebelum mengirim chat pertama"}
                  description={
                    en
                      ? "A few practical details about how this Event Planner connection works."
                      : "Beberapa hal praktis tentang cara layanan Event Planner ini berjalan."
                  }
                  items={faqItems}
                  wide
                  editorial
                />
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="relative mx-auto mb-4 w-full max-w-[1500px] overflow-hidden py-14 md:py-20">
                <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-14">
                  <div>
                    <p className="font-[family-name:var(--font-undara-mono)] text-[10px] uppercase tracking-[0.2em] text-primary">
                      {en ? "Start here" : "Mulai dari sini"}
                    </p>
                    <h2 className="mt-3 max-w-[22ch] font-[family-name:var(--font-undara-heading)] text-4xl font-bold leading-[1.03] tracking-[-0.025em] text-primary md:text-6xl">
                      {en ? "Send the event details you already have." : "Kirim detail acara yang sudah kamu punya."}
                    </h2>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                      {en
                        ? "Even if it is only the date and type of event, that is enough to begin the conversation."
                        : "Walaupun baru ada tanggal dan jenis acaranya saja, itu sudah cukup untuk mulai ngobrol."}
                    </p>
                  </div>

                  <Button asChild size="lg" className="w-fit">
                    <a
                      href={consultationUrl(
                        en
                          ? "Hi, I would like to ask about Event Planner services via Undara."
                          : "Halo, aku ingin tanya mengenai layanan Event Planner via Undara.",
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {en ? "WhatsApp Undara" : "WhatsApp Undara"}
                    </a>
                  </Button>
                </div>
              </section>
            </ScrollReveal>
          </div>
        </main>

        <div className="event-planner-footer relative z-20">
          <MarketingFrameFooter />
        </div>
      </div>
    </div>
  );
}
