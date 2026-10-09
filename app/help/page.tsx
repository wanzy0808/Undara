"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import FaqSection from "@/components/Marketing/FaqSection";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { getServicePackage } from "@/lib/packages/catalog";
import { terms, productTerms, privacySections } from "@/lib/help-content";

export default function HelpPage() {
  const { locale } = useLanguage();
  const scrollRoot = useRef<HTMLElement>(null);
  const en = locale === "en";
  const price = (key: string) => `Rp ${getServicePackage(key)!.price.toLocaleString(en ? "en-US" : "id-ID")}`;
  const copy = terms[locale];
  const links = [
    ["mulai", en ? "Getting started" : "Mulai di sini"],
    ["faq", en ? "Common questions" : "Pertanyaan umum"],
    ["terms", en ? "Terms & Conditions" : "Syarat & Ketentuan"],
    ["privacy", en ? "Privacy Policy" : "Kebijakan Privasi"],
    ["kontak", en ? "Contact Undara" : "Hubungi Undara"],
  ];

  // The fixed frame owns scrolling. Hash links and legacy redirects must land inside it.
  useEffect(() => {
    let active = true;
    const jump = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      const panel = scrollRoot.current;
      if (!active || !target || !panel?.contains(target)) return;
      target.querySelector<HTMLDetailsElement>("details[data-policy]")?.setAttribute("open", "");
      panel.scrollTo({ top: panel.scrollTop + target.getBoundingClientRect().top - panel.getBoundingClientRect().top - 32, behavior: "instant" });
    };
    const frame = requestAnimationFrame(jump);
    void document.fonts.ready.then(jump);
    window.addEventListener("hashchange", jump);
    return () => { active = false; cancelAnimationFrame(frame); window.removeEventListener("hashchange", jump); };
  }, []);

  const faq = en ? [
    { question: "Packages & event dates", answer: `Digital Invitation: ${price("INVITATION_BASIC")} per event. Digital Guestbook: ${price("GUESTBOOK_DIGITAL")}, including the invitation for that event. Same-day sessions can share one event; different dates need separate events and access.` },
    { question: "Save & Publish", answer: "Save keeps your Studio draft. Publish from Dashboard after event access is active. Prepare guests before publishing; check event details carefully because they lock after Publish." },
    { question: "Invitation QR & guest QR", answer: "Invitation QR opens the invitation. Personal guest QR lets authorized staff verify guests and record arrival for the right event/session. A general invitation QR does not record each visitor as attending." },
    { question: "Guest lists & seating", answer: "Personal Invitations and Table Settings share one guest list. Search existing guests to avoid duplicates; party size and table capacity determine seating." },
    { question: "WhatsApp delivery", answer: `Share personal links manually, or buy WA Blast credits: ${price("WA_BLAST_50")} for 50 sends, tied to one event with active Digital Invitation. Check recipient numbers before sending.` },
    { question: "Printing & Event Planner", answer: "Printing with Digital Invitation can be ordered individually; separate or bulk custom orders start at 300 pieces. Prices are agreed through consultation. Event Planner connects you with providers and is a separate service." },
  ] : [
    { question: "Paket & tanggal acara", answer: `Undangan Digital: ${price("INVITATION_BASIC")} per acara. Buku Tamu Digital: ${price("GUESTBOOK_DIGITAL")}, termasuk undangan untuk acara yang sama. Sesi di tanggal yang sama bisa dalam satu acara; tanggal berbeda perlu acara dan akses tersendiri.` },
    { question: "Simpan & Publish", answer: "Simpan menyimpan draft Studio. Publish melalui Dashboard setelah akses acara aktif. Tamu bisa disiapkan sebelum publikasi; periksa detail acara karena terkunci setelah Publish." },
    { question: "QR undangan & QR tamu", answer: "QR undangan membuka undangan. QR personal tamu dipindai petugas untuk verifikasi dan mencatat kedatangan pada acara/sesi yang sesuai. QR umum tidak otomatis mencatat setiap pengunjung hadir." },
    { question: "Daftar tamu & meja", answer: "Undangan Personal dan Pengaturan Meja memakai satu daftar tamu. Cari tamu tersimpan agar tidak ganda; jumlah rombongan dan kapasitas meja menentukan penempatan kursi." },
    { question: "Pengiriman WhatsApp", answer: `Bagikan tautan personal secara manual, atau beli kuota WA Blast: ${price("WA_BLAST_50")} untuk 50 pengiriman pada satu acara dengan Undangan Digital aktif. Periksa nomor penerima sebelum mengirim.` },
    { question: "Undangan Fisik & Event Planner", answer: "Cetak bersama Undangan Digital bisa satuan; cetak terpisah atau bulk custom minimum 300 pcs. Harga melalui konsultasi. Event Planner menghubungkanmu dengan penyedia layanan dan merupakan layanan terpisah." },
  ];

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />
      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header"><Navbar embedded /></div>
        <main ref={scrollRoot} tabIndex={0} aria-label={en ? "Help page content" : "Konten halaman bantuan"} className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-primary">
          <div className="undara-marketing-content flex flex-col gap-12 py-8 md:gap-16 md:py-12">
            <header className="undara-marketing-section">
              <div className="flex items-center gap-3"><CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" /><p className="undara-marketing-kicker">{en ? "Undara Help" : "Bantuan Undara"}</p></div>
              <h1 className="undara-marketing-title mt-5 text-primary">{en ? "How can we help?" : "Perlu bantuan apa?"}</h1>
              <p className="mt-6 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "Choose a topic. Read the details when you need them." : "Pilih topik, lalu buka penjelasannya saat kamu perlu."}</p>
              <nav aria-label={en ? "Help topics" : "Topik bantuan"} className="mt-8 flex flex-wrap gap-3">{links.map(([id,label]) => <a key={id} href={`#${id}`} className="rounded-[12px] border border-primary/30 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</a>)}</nav>
            </header>

            <section id="mulai" className="undara-marketing-section scroll-mt-8">
              <details className="rounded-[16px] bg-primary/[0.045] px-5 py-5 md:px-7">
                <summary className="cursor-pointer text-base font-medium text-primary">{en ? "New here? Start with these four steps." : "Baru mulai? Ikuti empat langkah ini."}</summary>
                <ol className="mt-5 max-w-[70ch] list-decimal space-y-3 pl-5 text-base leading-7 text-muted-foreground">
                  <li>{en ? "Create an event; check its date, sessions, and venue." : "Buat acara; periksa tanggal, sesi, dan lokasi."}</li>
                  <li>{en ? "Preview a suitable template, edit in Studio, and save." : "Lihat template yang sesuai, edit di Studio, lalu simpan."}</li>
                  <li>{en ? "Activate access for that event, review, then Publish from Dashboard." : "Aktifkan akses acara tersebut, periksa, lalu Publish di Dashboard."}</li>
                  <li>{en ? "Share personal links, monitor RSVP, and prepare guest reception." : "Bagikan tautan personal, pantau RSVP, dan siapkan penerimaan tamu."}</li>
                </ol>
                <div className="mt-5 flex flex-wrap gap-5"><Link href="/template-design" className="text-primary hover:underline">{en ? "Explore templates" : "Lihat template"}</Link><Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link></div>
              </details>
            </section>

            <section id="faq" className="undara-marketing-section scroll-mt-8"><FaqSection eyebrow={en ? "Questions & answers" : "Tanya jawab"} title={en ? "Common questions" : "Pertanyaan umum"} description={en ? "Packages, publishing, guests, QR codes, and other services." : "Paket, publikasi, tamu, kode QR, dan layanan lainnya."} items={faq} defaultOpen={null} wide editorial /></section>

            <section id="terms" className="undara-marketing-section scroll-mt-8" aria-labelledby="terms-title">
              <p className="undara-marketing-kicker">{en ? "Updated 9 October 2026" : "Diperbarui 9 Oktober 2026"}</p>
              <h2 id="terms-title" className="undara-marketing-heading mt-4 text-primary">{copy.title}</h2>
              <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted-foreground">{en ? "Packages apply per event. Review your details before Publish and use content you have permission to share." : "Paket berlaku per acara. Periksa detail sebelum Publish dan gunakan konten yang kamu punya izin untuk membagikannya."}</p>
              <details data-policy className="mt-5 rounded-[16px] bg-primary/[0.045] px-5 py-5 md:px-7">
                <summary className="cursor-pointer text-base font-medium text-primary">{en ? "Read the full terms" : "Baca ketentuan lengkap"}</summary>
                <PolicyTopics sections={[{ title: copy.introduction, points: copy.opening }, ...productTerms[locale], ...copy.sections]} />
              </details>
              <a href="#privacy" className="mt-6 inline-flex text-primary hover:underline">{copy.privacy}</a>
            </section>

            <section id="privacy" className="undara-marketing-section scroll-mt-8" aria-labelledby="privacy-title">
              <p className="undara-marketing-kicker">{en ? "Updated 9 October 2026" : "Diperbarui 9 Oktober 2026"}</p>
              <h2 id="privacy-title" className="undara-marketing-heading mt-4 text-primary">{en ? "Privacy Policy" : "Kebijakan Privasi"}</h2>
              <p className="mt-6 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "How account, event, and guest information is used when you use Undara." : "Cara informasi akun, acara, dan tamu digunakan saat kamu memakai Undara."}</p>
              <details data-policy className="mt-5 rounded-[16px] bg-primary/[0.045] px-5 py-5 md:px-7">
                <summary className="cursor-pointer text-base font-medium text-primary">{en ? "Read the privacy policy" : "Baca kebijakan privasi"}</summary>
                <PolicyTopics sections={privacySections[locale]} />
              </details>
            </section>

            <section id="kontak" className="undara-marketing-section scroll-mt-8 pb-12">
              <h2 className="undara-marketing-heading text-primary">{en ? "Still need a hand?" : "Masih perlu bantuan?"}</h2>
              <p className="mt-5 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "Send your event name, issue, and screenshot. Never share passwords or OTPs." : "Kirim nama acara, kendala, dan tangkapan layar. Jangan kirim kata sandi atau OTP."}</p>
              <Button asChild size="lg" className="mt-7"><a href="https://wa.me/6282124786516" target="_blank" rel="noopener noreferrer">{en ? "Contact Undara" : "Hubungi Undara"}<ArrowRight className="h-4 w-4" /></a></Button>
            </section>
          </div>
        </main>
        <MarketingFrameFooter />
      </div>
    </div>
  );
}

function PolicyTopics({ sections }: { sections: readonly { title: string; points: readonly string[] }[] }) {
  return <div className="mt-8 space-y-3">{sections.map(section => <details key={section.title} className="rounded-[16px] bg-primary/[0.045] px-5 py-5 md:px-7"><summary className="cursor-pointer text-base font-medium leading-7 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{section.title}</summary><div className="mt-5 max-w-[75ch] space-y-4 text-base leading-8 text-muted-foreground">{section.points.map(point => <p key={point}>{point}</p>)}</div></details>)}</div>;
}
