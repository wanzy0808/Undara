"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Layers3,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import ScrollReveal from "@/components/EventPlanner/ScrollReveal";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";

const WHATSAPP = "https://wa.me/6281285009609?text=";

export default function UndanganFisikPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const en = locale === "en";

  const steps = en
    ? [
        ["Tell us about your event", "Let us know whether you are pairing it with a Digital Invitation or ordering separately, then share the quantity, date, delivery city, and design direction."],
        ["Choose the tactile details", "Discuss paper character, envelope treatment, color, print technique, and finishing touches."],
        ["Review the proof carefully", "Check names, wording, date, venue, layout, and production details before print approval."],
        ["Confirm production & delivery", "Production and delivery timing are confirmed around the final specification and order quantity."],
      ]
    : [
        ["Ceritakan acaramu", "Sampaikan apakah undangan fisik digabung dengan Undangan Digital atau dipesan terpisah, lalu bagikan jumlah, tanggal, kota pengiriman, dan arah desainnya."],
        ["Pilih detail yang terasa di tangan", "Diskusikan karakter kertas, amplop, warna, teknik cetak, dan sentuhan akhir."],
        ["Periksa contoh cetak dengan teliti", "Pastikan nama, isi, tanggal, lokasi, tata letak, dan detail produksi tepat sebelum persetujuan cetak."],
        ["Konfirmasi produksi & pengiriman", "Jadwal produksi dan pengiriman mengikuti spesifikasi akhir serta jumlah pesanan yang disepakati."],
      ];

  const materials = en
    ? [
        [Layers3, "Paper", "Weight, texture, and tone create the first tactile impression before the invitation is even read."],
        [Mail, "Envelope", "The envelope frames the experience and can carry color, lining, seals, or other agreed details."],
        [Sparkles, "Finishing", "Small production details can add contrast and character without making the invitation feel overly decorated."],
      ] as const
    : [
        [Layers3, "Kertas", "Gramatur, tekstur, dan nuansa warna membentuk kesan pertama bahkan sebelum undangannya mulai dibaca."],
        [Mail, "Amplop", "Amplop membingkai pengalaman dan dapat membawa warna, lapisan dalam, segel, atau detail lain yang disepakati."],
        [Sparkles, "Sentuhan Akhir", "Detail produksi kecil dapat memberi kontras dan karakter tanpa membuat undangan terasa terlalu ramai."],
      ] as const;

  const waMessage = en
    ? "Hi Undara, I would like to discuss printed invitations, either with a Digital Invitation or as a separate custom order."
    : "Halo Undara, aku ingin konsultasi undangan fisik, baik bersama Undangan Digital maupun pesanan khusus terpisah.";
  const customWaMessage = en
    ? "Hi Undara, I would like to discuss a standalone/custom printed invitation order of at least 300 pieces."
    : "Halo Undara, aku ingin konsultasi pesanan undangan fisik terpisah atau khusus minimal 300 lembar.";

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
          aria-label={en ? "Printed invitation page content" : "Konten halaman Undangan Fisik"}
          className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <div className="undara-marketing-content flex flex-col gap-24 py-8 md:gap-28 md:py-12">
            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section className="undara-marketing-section grid min-h-[calc(100dvh-170px)] items-center gap-12 overflow-hidden pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-16">
                <div className="relative z-10 max-w-3xl py-8 lg:py-12">
                  <p className="undara-marketing-kicker">
                    {en ? "Printed Invitations / Undara" : "Undangan Fisik / Undara"}
                  </p>

                  <h1 className="undara-marketing-title mt-5 max-w-[22ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.04em] text-primary">
                    {en ? "A keepsake in every detail." : "Kabar bahagia yang bisa disimpan."}
                    <span className="block text-foreground">
                      {en ? "Made to be held." : "Terasa hingga di tangan."}
                    </span>
                  </h1>

                  <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "Pair it with a Digital Invitation and order printed copies individually, or make a separate custom order starting at 300 pieces. We will shape the design, paper, and finishing together."
                      : "Gabungkan dengan Undangan Digital untuk memesan undangan cetak secara satuan, atau pesan terpisah dengan desain khusus mulai 300 lembar. Desain, kertas, dan sentuhan akhir dibicarakan bersama."}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                      <a href={WHATSAPP + encodeURIComponent(waMessage)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        {en ? "Discuss your invitation" : "Konsultasi Undangan"}
                      </a>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <a href="#proses">
                        {en ? "See the process" : "Lihat Proses"}
                        <ArrowDownRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                </div>

                <div className="relative z-10 min-h-[470px] lg:min-h-[690px]">
                  <div className="undara-editorial-media absolute inset-[4%_0_2%_4%]">
                    <Image
                      src="/assets/marketing/physical-invitation/hero.webp"
                      alt={en ? "Printed invitation stationery" : "Undangan cetak dan perlengkapan kertas"}
                      fill
                      priority
                      sizes="(max-width: 1024px) 94vw, 54vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,18,16,0.76)_0%,rgba(30,18,16,0.12)_50%,transparent_70%)]" />
                    <div className="absolute bottom-7 left-7 right-7 text-white md:bottom-10 md:left-10 md:right-10">
                      <p className="undara-marketing-meta text-white/65">
                        {en ? "Paper becomes part of the story" : "Kertas Menjadi Bagian dari Cerita"}
                      </p>
                      <p className="mt-2 max-w-lg font-[family-name:var(--font-undara-heading)] text-2xl leading-tight md:text-3xl lg:text-4xl">
                        {en ? "A moment guests can carry home." : "Sebuah momen yang bisa dibawa pulang."}
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-0 top-[15%] hidden w-[220px] rounded-[20px] border border-primary/25 bg-background/88 p-5 shadow-[0_18px_50px_rgba(58,32,32,0.11)] backdrop-blur-md md:block">
                    <p className="undara-editorial-index">{en ? "Printed invitation" : "Undangan Cetak"}</p>
                    <p className="mt-3 font-[family-name:var(--font-undara-heading)] text-xl leading-tight text-primary">
                      {en ? "Texture, proportion, and quiet details matter." : "Tekstur, proporsi, dan detail kecil ikut berbicara."}
                    </p>
                  </div>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section className="undara-marketing-section undara-editorial-offset-right py-14 md:py-20">
                <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end lg:gap-16">
                  <div>
                    <p className="undara-marketing-kicker">{en ? "Tactile direction" : "Arah Material"}</p>
                    <h2 className="undara-marketing-heading mt-4 max-w-[16ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                      {en ? "The design is not only what guests see." : "Desainnya bukan hanya apa yang tamu lihat."}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "Printed invitations have weight, texture, edges, folds, and production constraints. Those details become part of the design rather than an afterthought."
                      : "Undangan fisik punya berat, tekstur, tepian, lipatan, dan batas produksi. Detail itu menjadi bagian dari desain, bukan dipikirkan paling akhir."}
                  </p>
                </div>

                <div className="mt-12 space-y-5">
                  {materials.map(([Icon, title, detail], index) => (
                    <article
                      key={title}
                      className={`max-w-3xl py-8 md:py-10 ${index % 2 ? "lg:ml-auto" : "lg:mr-auto"}`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                      </div>
                      <h3 className="undara-marketing-subheading mt-8 font-[family-name:var(--font-undara-heading)] text-primary">
                        {title}
                      </h3>
                      <p className="mt-4 text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                        {detail}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section id="proses" className="undara-marketing-section undara-editorial-offset-left scroll-mt-24 py-14 md:py-20">
                <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
                  <div>
                    <p className="undara-marketing-kicker">{en ? "From idea to delivery" : "Dari Ide hingga Diterima"}</p>
                    <h2 className="undara-marketing-heading mt-4 max-w-[17ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                      {en ? "A slower process, for a more considered object." : "Proses yang lebih pelan untuk hasil yang lebih dipikirkan."}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "Design direction, print specifications, proofing, production, and delivery are discussed in sequence so expectations stay clear before anything is printed."
                      : "Arah desain, spesifikasi cetak, proofing, produksi, dan pengiriman dibicarakan berurutan supaya ekspektasi jelas sebelum apa pun masuk mesin cetak."}
                  </p>
                </div>

                <div className="mt-12">
                  {steps.map(([title, detail], index) => (
                    <article
                      key={title}
                      className={`grid gap-6 py-8 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] md:items-center md:gap-9 md:py-11 ${index % 2 ? "lg:pl-[6%]" : "lg:pr-[5%]"}`}
                    >
                      <h3 className="undara-marketing-subheading max-w-[17ch] font-[family-name:var(--font-undara-heading)] text-primary">
                        {title}
                      </h3>
                      <p className="flex max-w-xl gap-3 text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                        <Check className="mt-2 h-4 w-4 shrink-0 text-primary" />
                        {detail}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section className="undara-marketing-section undara-editorial-offset-right pb-14">
                <p className="undara-marketing-kicker">{en ? "Ways to order" : "Pilihan Pemesanan"}</p>
                <h2 className="undara-marketing-heading mt-4 max-w-[18ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                  {en ? "A few keepsakes or a full print run." : "Beberapa untuk disimpan, atau satu produksi penuh."}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {en
                    ? "Choose how the printed invitation fits your event. The order size depends on whether it accompanies a Digital Invitation."
                    : "Pilih cara undangan fisik melengkapi acaramu. Jumlah pemesanan bergantung pada apakah undangan cetak digabung dengan Undangan Digital."}
                </p>

                <div className="mt-10 flex flex-col gap-7 lg:gap-10">
                  <article className="flex max-w-3xl flex-col rounded-[20px] bg-primary/[0.055] p-7 md:p-9">
                    <p className="undara-marketing-kicker">{en ? "With Digital Invitation" : "Bersama Undangan Digital"}</p>
                    <h3 className="undara-marketing-subheading mt-5 font-[family-name:var(--font-undara-heading)] text-primary">
                      {en ? "Order individually." : "Bisa pesan satuan."}
                    </h3>
                    <p className="mt-5 flex-1 text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                      {en
                        ? "Add printed invitations alongside the digital invitation for your event. You can request the number of physical copies you need, even a single piece."
                        : "Lengkapi undangan digital acaramu dengan undangan cetak. Kamu bisa menyesuaikan jumlah fisik yang dibutuhkan, termasuk satu buah."}
                    </p>
                    <Link href="/d-invitation" className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline">
                      {en ? "Explore Digital Invitations" : "Lihat Undangan Digital"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </article>

                  <article className="flex max-w-3xl flex-col rounded-[20px] bg-background/55 lg:ml-auto p-7 shadow-[0_16px_44px_rgba(58,32,32,0.07)] md:p-9">
                    <p className="undara-marketing-kicker">{en ? "Standalone / Custom" : "Terpisah / Khusus"}</p>
                    <h3 className="undara-marketing-subheading mt-5 font-[family-name:var(--font-undara-heading)] text-primary">
                      {en ? "Minimum 300 pieces." : "Minimal 300 lembar."}
                    </h3>
                    <p className="mt-5 flex-1 text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                      {en
                        ? "For a separate printed invitation or a custom bulk order, production starts at 300 pieces. Tell us your design idea and quantity so we can discuss the right specification."
                        : "Untuk undangan fisik yang dipesan terpisah atau produksi khusus dalam jumlah besar, jumlah minimalnya 300 lembar. Ceritakan ide desain dan jumlahnya agar spesifikasinya bisa dibahas bersama."}
                    </p>
                    <a href={WHATSAPP + encodeURIComponent(customWaMessage)} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline">
                      {en ? "Discuss a custom order" : "Konsultasi Pesanan Khusus"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </article>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
              <section className="undara-marketing-section undara-editorial-offset-left relative mb-4 overflow-hidden py-14 md:py-20">
                <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
                  <div>
                    <p className="undara-marketing-kicker">{en ? "Start with the specification" : "Mulai dari Spesifikasinya"}</p>
                    <h2 className="undara-marketing-heading mt-4 max-w-[20ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                      {en ? "Tell us what you want guests to hold." : "Ceritakan apa yang ingin kamu letakkan di tangan tamu."}
                    </h2>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                      {en
                        ? "There is no one fixed price: the quote depends on design complexity and the agreed print specifications. Share the order type, quantity, event date, and delivery city; we will discuss the price and production schedule with you."
                        : "Tidak ada satu harga tetap: penawaran bergantung pada tingkat kesulitan desain dan spesifikasi cetak yang disepakati. Bagikan jenis pesanan, jumlah, tanggal acara, dan kota pengiriman; harga serta jadwal produksi dibahas saat konsultasi."}
                    </p>
                  </div>
                  <Button asChild size="lg" className="w-fit">
                    <a href={WHATSAPP + encodeURIComponent(waMessage)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp Undara
                    </a>
                  </Button>
                </div>
              </section>
            </ScrollReveal>
          </div>
        </main>

        <MarketingFrameFooter />
      </div>
    </div>
  );
}
