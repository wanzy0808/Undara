"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAnimationFrame, useInView } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
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
const plannerCards = [0, 1, 2].flatMap((copy) => plannerPackages.map((item) => ({ item, copy })));

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
  const serviceMotion = useRef({ position: 0, cycle: 0, pauseUntil: 0, suppressClickUntil: 0, renderedScroll: 0, pendingWheel: 0 });
  const serviceDrag = useRef<{ id: number; startX: number; lastX: number; moved: boolean } | null>(null);
  const servicesInView = useInView(serviceRail, { root: scrollRoot, amount: 0.15 });

  function pauseServices(duration = 2000) {
    serviceMotion.current.pauseUntil = performance.now() + duration;
  }

  const loopPosition = useCallback((position: number) => {
    const cycle = serviceMotion.current.cycle;
    return cycle ? cycle + ((position - cycle) % cycle + cycle) % cycle : position;
  }, []);

  const writeServicePosition = useCallback((position: number) => {
    const rail = serviceRail.current;
    if (!rail) return;
    serviceMotion.current.position = loopPosition(position);
    rail.scrollLeft = serviceMotion.current.position;
    serviceMotion.current.renderedScroll = rail.scrollLeft;
  }, [loopPosition]);

  useEffect(() => {
    const rail = serviceRail.current;
    if (!rail) return;
    const measure = () => {
      const first = rail.querySelector<HTMLElement>("article");
      const middle = rail.querySelector<HTMLElement>('[data-service-copy="1"]');
      if (!first || !middle) return;
      const previousCycle = serviceMotion.current.cycle;
      const cycle = middle.offsetLeft - first.offsetLeft;
      if (cycle <= 0) return;
      const relative = previousCycle ? (rail.scrollLeft - previousCycle) / previousCycle : 0;
      serviceMotion.current.cycle = cycle;
      writeServicePosition(cycle + relative * cycle);
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      const unit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? rail.clientWidth : 1;
      event.preventDefault();
      pauseServices();
      if (reduced) writeServicePosition(serviceMotion.current.position + delta * unit * 2.4);
      else {
        const state = serviceMotion.current;
        // Reversing the wheel responds immediately instead of fighting old momentum.
        if (Math.sign(delta) !== Math.sign(state.pendingWheel)) state.pendingWheel = 0;
        state.pendingWheel += delta * unit * 2.4;
      }
    };
    const scroll = () => {
      const wrapped = loopPosition(rail.scrollLeft);
      if (Math.abs(wrapped - rail.scrollLeft) > 1) writeServicePosition(wrapped);
      else if (Math.abs(rail.scrollLeft - serviceMotion.current.renderedScroll) > 1) {
        // Native touch/keyboard scrolling owns its position; discard only its old remainder.
        serviceMotion.current.pendingWheel = 0;
        writeServicePosition(rail.scrollLeft);
      }
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(rail);
    rail.addEventListener("wheel", wheel, { passive: false });
    rail.addEventListener("scroll", scroll, { passive: true });
    return () => {
      resize.disconnect();
      rail.removeEventListener("wheel", wheel);
      rail.removeEventListener("scroll", scroll);
    };
  }, [reduced, loopPosition, writeServicePosition]);

  useAnimationFrame((_, delta) => {
    const rail = serviceRail.current;
    if (!rail || !serviceMotion.current.cycle) return;
    const state = serviceMotion.current;
    const keyboardFocus = rail.matches(":focus-visible") || rail.querySelector(":focus-visible");
    if (reduced || !servicesInView || document.hidden || serviceDrag.current) return;
    const elapsed = Math.min(delta, 40);
    if (Math.abs(state.pendingWheel) > 0.1) {
      const movement = state.pendingWheel * (1 - Math.exp(-elapsed / 110));
      state.pendingWheel -= movement;
      writeServicePosition(state.position + movement);
      return;
    }
    if (state.pendingWheel) {
      writeServicePosition(state.position + state.pendingWheel);
      state.pendingWheel = 0;
    }
    if (keyboardFocus || performance.now() < state.pauseUntil) return;
    // Preserve the existing 40px/s autoplay; smoothing applies only to wheel input.
    writeServicePosition(state.position + elapsed * 0.04);
  });

  function startServiceDrag(event: ReactPointerEvent<HTMLDivElement>) {
    pauseServices();
    serviceMotion.current.pendingWheel = 0;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    serviceDrag.current = { id: event.pointerId, startX: event.clientX, lastX: event.clientX, moved: false };
  }

  function dragServices(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = serviceDrag.current;
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(event.clientX - drag.startX) < 5) return;
    event.preventDefault();
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    writeServicePosition(serviceMotion.current.position - (event.clientX - drag.lastX) * 1.5);
    drag.lastX = event.clientX;
  }

  function finishServiceDrag(event: ReactPointerEvent<HTMLDivElement>) {
    pauseServices();
    const drag = serviceDrag.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) serviceMotion.current.suppressClickUntil = performance.now() + 300;
    serviceDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveServices(direction: number) {
    pauseServices();
    serviceMotion.current.pendingWheel = 0;
    const rail = serviceRail.current;
    const card = rail?.querySelector<HTMLElement>("article");
    if (!rail || !card) return;
    writeServicePosition(rail.scrollLeft + direction * (card.offsetWidth + 24));
  }

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
              <section className="undara-marketing-section relative mx-auto grid min-h-[calc(100dvh-170px)] w-full max-w-[1560px] items-center gap-10 overflow-hidden pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-16">
                <PlannerNote
                  src="/assets/note1.webp"
                  className="-right-[5%] top-[3%] h-[52%] w-[40%] opacity-[0.12] lg:opacity-[0.16] dark:opacity-[0.08]"
                  motionY={12}
                  rotate={7}
                  reduced={reduced}
                />

                <div className="relative z-10 min-w-0 w-full py-8 lg:py-12">
                  <p className="font-[family-name:var(--font-undara-mono)] text-[10px] font-medium uppercase tracking-[0.22em] text-primary md:text-xs">
                    {en ? "Event Planner via Undara" : "Event Planner via Undara"}
                  </p>

                  <h1 className="mt-5 font-[family-name:var(--font-undara-heading)] text-[clamp(2.25rem,3.6vw,3.75rem)] font-normal leading-[1.12] tracking-[-0.035em] text-primary">
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
                    <Button asChild size="lg" className="rounded-xl">
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

                    <Button asChild size="lg" variant="outline" className="rounded-xl">
                      <a href="#cara-mulai">
                        {en ? "See How to Start" : "Lihat Cara Mulai"}
                        <ArrowDownRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                </div>

                <div className="relative z-10 min-h-[460px] lg:min-h-[680px]">
                  <motion.div
                    className="undara-editorial-media planner-hero-media absolute inset-[4%_0_2%_4%]"
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
                    <p className="font-[family-name:var(--font-undara-mono)] text-[10px] font-medium uppercase tracking-[0.2em] text-primary/80">
                      {en ? "Service Direction" : "Pilihan Layanan"}
                    </p>
                    <h2 className="mt-4 font-[family-name:var(--font-undara-heading)] text-[clamp(1.875rem,2.6vw,2.75rem)] font-normal leading-[1.02] tracking-[-0.035em] text-primary">
                      {en ? "What can you ask about?" : "Apa yang bisa kamu tanyakan?"}
                    </h2>
                  </div>

                  <div className="max-w-3xl">
                    <p className="font-undara-body text-base font-normal leading-7 text-muted-foreground md:text-lg">
                      {en
                        ? "Start with the service that feels closest to your event."
                        : "Mulai dari layanan yang paling mendekati kebutuhan acaramu."}
                    </p>
                  </div>
                </div>

                <div
                  ref={serviceRail}
                  id="planner-service-rail"
                  role="region"
                  aria-roledescription="carousel"
                  aria-label={en ? "Event planning services" : "Pilihan layanan acara"}
                  tabIndex={0}
                  onPointerDown={startServiceDrag}
                  onPointerMove={dragServices}
                  onPointerUp={finishServiceDrag}
                  onPointerCancel={finishServiceDrag}
                  onLostPointerCapture={finishServiceDrag}
                  onDragStart={(event) => event.preventDefault()}
                  onClickCapture={(event) => {
                    if (performance.now() < serviceMotion.current.suppressClickUntil) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      moveServices(event.key === "ArrowLeft" ? -1 : 1);
                    }
                  }}
                  className="relative z-10 mt-10 flex cursor-grab select-none items-start gap-6 active:cursor-grabbing overflow-x-auto overscroll-x-contain rounded-[20px] px-1 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {plannerCards.map(({ item, copy }) => {
                    const features = en ? item.featuresEn : item.features;

                    return (
                      <article
                        key={`${copy}-${item.key}`}
                        data-service-copy={copy}
                        aria-hidden={copy !== 1 ? true : undefined}
                        role="group"
                        aria-roledescription={en ? "slide" : "kartu"}
                        aria-label={en ? item.nameEn : item.name}
                        className="undara-editorial-surface flex min-h-[360px] w-[88%] shrink-0 flex-col gap-6 rounded-[20px] p-7 font-undara-body text-foreground sm:w-[540px] md:p-9"
                      >
                        <div>
                          <h3 className="max-w-3xl font-undara-heading text-2xl font-normal md:text-3xl leading-[1.08] text-primary">
                            {en ? item.nameEn : item.name}
                          </h3>
                          <p className="mt-4 max-w-xl text-[15px] leading-7 opacity-80">
                            {en ? item.descriptionEn : item.description}
                          </p>
                        </div>

                        <div className="flex flex-1 flex-col">
                          <ul className="mb-8 grid gap-2">
                            {features.map((feature) => (
                              <li
                                key={feature}
                                className="text-sm leading-6 opacity-85"
                              >
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                            <a
                              className="mt-auto inline-flex w-fit items-center gap-3 rounded-sm py-2 text-sm font-medium underline decoration-current/40 underline-offset-8 transition-[gap] duration-200 hover:gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transition-none"
                              tabIndex={copy === 1 ? undefined : -1}
                              href={consultationUrl(en ? item.waMessageEn : item.waMessage)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {en ? "Discuss with Undara" : "Tanyakan ke Undara"}
                              <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot}>
              <section className="mx-auto grid w-full max-w-[1500px] gap-8 pb-14 lg:pb-16">
                <div>
                  <p className="font-[family-name:var(--font-undara-mono)] text-[10px] uppercase tracking-[0.2em] text-primary">
                    {en ? "Already using Undara?" : "Sudah pakai Undara?"}
                  </p>
                  <h2 className="mt-4 font-[family-name:var(--font-undara-heading)] text-3xl font-normal leading-[1.04] tracking-[-0.025em] text-primary md:text-4xl">
                    {en ? "Digital invitations can stay separate." : "Undangan Digital tetap bisa dipakai terpisah."}
                  </h2>
                </div>

                <div className="flex flex-col gap-7">
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "If you need RSVP and guest management, Undara Digital Invitations can be used independently from the Event Planner consultation."
                      : "Kalau kamu membutuhkan RSVP dan manajemen tamu, Undangan Digital Undara tetap bisa digunakan terpisah dari konsultasi Event Planner."}
                  </p>
                  <Button asChild variant="outline" className="w-fit rounded-xl">
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
                    <h2 className="mt-3 font-[family-name:var(--font-undara-heading)] text-3xl font-normal leading-[1.03] tracking-[-0.025em] text-primary md:text-4xl">
                      {en ? "Send the event details you already have." : "Kirim detail acara yang sudah kamu punya."}
                    </h2>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                      {en
                        ? "Even if it is only the date and type of event, that is enough to begin the conversation."
                        : "Walaupun baru ada tanggal dan jenis acaranya saja, itu sudah cukup untuk mulai ngobrol."}
                    </p>
                  </div>

                  <Button asChild size="lg" className="w-fit rounded-xl">
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
