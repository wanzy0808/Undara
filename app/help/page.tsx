"use client";

import { useRef } from "react";
import ScrollReveal from "@/components/EventPlanner/ScrollReveal";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import FaqSection from "@/components/Marketing/FaqSection";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const en = locale === "en";

  const helpFaq = en
    ? [
        {
          question: "What is the difference between Digital Invitation and Digital Guestbook?",
          answer:
            "Digital Invitation focuses on the public invitation page, RSVP, publishing, and invitation features. Digital Guestbook focuses on event-day guest reception, official QR check-in, live attendance, seating, and the Usher App.",
        },
        {
          question: "Can I preview invitation templates before buying a package?",
          answer:
            "Yes. Public template previews are available before purchase. Publishing and personal event assets follow the active Digital Invitation entitlement for the selected event.",
        },
        {
          question: "How do guests enter the venue?",
          answer:
            "A valid QR is the official check-in credential. If a registered guest arrives without an RSVP or QR, the usher can verify the guest in the event list, issue an official QR through the Usher App, then scan that QR for check-in.",
        },
        {
          question: "How do I choose a package?",
          answer:
            "Choose the service that matches the event workflow you need. After payment is confirmed, the relevant entitlement becomes active for the selected event.",
        },
        {
          question: "What should I do if I have trouble using the dashboard?",
          answer:
            "Make sure you are signed in and the required package is active for the selected event. If the issue remains, keep the error message or relevant screen details so the Undara team can check it more accurately.",
        },
      ]
    : [
        {
          question: "Apa perbedaan Undangan Digital dan Buku Tamu Digital?",
          answer:
            "Undangan Digital berfokus pada halaman undangan publik, RSVP, dan publikasi. Buku Tamu Digital menambahkan penerimaan tamu di hari acara, pemindaian QR resmi, pemantauan kehadiran, pengaturan meja, dan aplikasi penerima tamu. Paket Buku Tamu sudah termasuk Undangan Digital untuk acara yang sama.",
        },
        {
          question: "Apakah saya bisa melihat template sebelum membeli paket?",
          answer:
            "Bisa. Pratinjau tema undangan dapat dilihat sebelum pembelian. Publikasi dan foto acara tersedia setelah paket Undangan Digital atau Buku Tamu Digital aktif untuk acara yang dipilih.",
        },
        {
          question: "Bagaimana tamu masuk ke venue?",
          answer:
            "QR yang valid adalah bukti resmi untuk mencatat kedatangan. Jika tamu terdaftar datang tanpa RSVP atau QR, petugas dapat memverifikasi data tamu, menerbitkan QR resmi melalui aplikasi penerima tamu, lalu memindainya.",
        },
        {
          question: "Bagaimana cara memilih paket?",
          answer:
            "Pilih layanan sesuai kebutuhan acaramu. Setelah pembayaran dikonfirmasi, akses layanan yang sesuai aktif untuk acara yang dipilih.",
        },
        {
          question: "Saya mengalami masalah saat menggunakan dashboard, harus bagaimana?",
          answer:
            "Pastikan akun sudah masuk dan paket yang dibutuhkan aktif untuk acara yang dipilih. Jika masalah tetap terjadi, simpan pesan kesalahan atau tangkapan layar agar tim Undara dapat memeriksanya.",
        },
      ];

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />

      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>

        <main ref={scrollRoot} tabIndex={0} aria-label={en ? "Help page content" : "Konten halaman bantuan"} className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-primary">
          <div className="undara-marketing-content flex flex-col gap-24 py-8 md:gap-28 md:py-12">
            <ScrollReveal scrollRoot={scrollRoot} lift>
            <section className="undara-marketing-section grid min-h-[min(68dvh,690px)] items-center gap-10 pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
              <div>
                <div className="flex items-center gap-3">
                  <CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="undara-marketing-kicker">{en ? "Undara Help" : "Bantuan Undara"}</p>
                </div>

                <h1 className="undara-marketing-title mt-5 max-w-[22ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.035em] text-primary">
                  {en
                    ? "Start with the question that blocks your next step."
                    : "Mulai dari pertanyaan yang menghambat langkah berikutnya."}
                </h1>
              </div>

              <div className="max-w-xl border-l border-primary/30 py-6 pl-7 md:pl-12">
                <p className="text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {en
                    ? "A practical guide to invitations, packages, templates, publishing, RSVP, Digital Guestbook, and the main Undara workflow."
                    : "Panduan praktis mengenai undangan, paket, template, publikasi, RSVP, Guestbook Digital, dan alur utama penggunaan Undara."}
                </p>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                  <Link
                    href="/d-invitation"
                    className="inline-flex items-center gap-2 border-b border-primary/45 pb-2 text-sm text-primary transition-colors hover:border-primary"
                  >
                    {en ? "Digital Invitation" : "Undangan Digital"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/guestbook"
                    className="inline-flex items-center gap-2 border-b border-primary/45 pb-2 text-sm text-primary transition-colors hover:border-primary"
                  >
                    {en ? "Digital Guestbook" : "Guestbook Digital"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/template-design"
                    className="inline-flex items-center gap-2 border-b border-primary/45 pb-2 text-sm text-primary transition-colors hover:border-primary"
                  >
                    {en ? "Template Collection" : "Koleksi Template"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
            <section className="undara-marketing-section undara-editorial-offset-right pb-16">
              <FaqSection
                eyebrow={en ? "Common questions" : "Pertanyaan Umum"}
                title={en ? "Clear answers before you continue." : "Jawaban yang jelas sebelum kamu lanjut."}
                description={
                  en
                    ? "Product boundaries and event flow should be understandable before you have to make a purchase or configuration decision."
                    : "Batas produk dan alur acara sebaiknya sudah mudah dipahami sebelum kamu harus mengambil keputusan pembelian atau konfigurasi."
                }
                items={helpFaq}
                wide
                editorial
              />
            </section>
            </ScrollReveal>

            <ScrollReveal scrollRoot={scrollRoot} lift>
            <section className="undara-marketing-section undara-editorial-offset-left relative mb-4 overflow-hidden py-14 md:py-20">
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
                <div>
                  <p className="undara-marketing-kicker">{en ? "Next step" : "Langkah Berikutnya"}</p>
                  <h2 className="undara-marketing-heading mt-4 max-w-[18ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                    {en ? "Ready to continue your event setup?" : "Siap melanjutkan persiapan acaramu?"}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                    {en
                      ? "Explore the available services, or sign in to continue the event you are already preparing."
                      : "Lihat layanan yang tersedia, atau masuk untuk melanjutkan event yang sedang kamu siapkan."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/d-invitation">
                      {en ? "Explore services" : "Lihat Layanan"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">{en ? "Sign in" : "Masuk"}</Link>
                  </Button>
                </div>
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
