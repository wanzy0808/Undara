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
      panel.scrollTo({ top: panel.scrollTop + target.getBoundingClientRect().top - panel.getBoundingClientRect().top - 32, behavior: "instant" });
    };
    const frame = requestAnimationFrame(jump);
    void document.fonts.ready.then(jump);
    window.addEventListener("hashchange", jump);
    return () => { active = false; cancelAnimationFrame(frame); window.removeEventListener("hashchange", jump); };
  }, []);

  const faq = en ? [
    { question: "Does one package cover every event in my account?", answer: `No. Digital Invitation (${price("INVITATION_BASIC")}) covers one event. You can prepare multiple events; each needs its own access before publication. Digital Guestbook (${price("GUESTBOOK_DIGITAL")}) includes Digital Invitation for that same event.` },
    { question: "What is the difference between Save and Publish?", answer: "Save in Studio stores your draft. Publish from Dashboard when the event has active access and the required details are complete. RSVP and Guest Management can be prepared before publishing. Check Event Setup carefully: published event details are locked for users." },
    { question: "Can I use two sessions or two event dates?", answer: "Two sessions on the same date can belong to one event, with their own time and venue. Different dates require separate events and package access. Personal invitations and RSVP follow the sessions assigned to each guest." },
    { question: "Does scanning an invitation QR record a guest’s arrival?", answer: "The invitation QR opens the event invitation. A personal guest QR is different: authorized reception staff scan it to verify the guest and record arrival for the appropriate event/session. A general invitation QR does not identify every visitor as an attending guest." },
    { question: "Are guest lists and seating managed separately?", answer: "Personal Invitations and Table Settings use the same event guest list. Search existing guests rather than entering duplicates. Party size determines the seats needed; assigned guests stay within the selected table’s capacity." },
    { question: "Is WhatsApp delivery included?", answer: `You can share personal invitations manually. Paid WA Blast uses event-specific credits; ${price("WA_BLAST_50")} adds 50 credits to an event with active Digital Invitation access. Additional credits can be purchased again. Verify recipient numbers before sending.` },
    { question: "Can I preview templates and change the invitation design?", answer: "Browse real template previews before buying. Choose a theme that supports your event category and edit the available content in Studio. Saving your invitation does not change the master template or another customer’s invitation." },
    { question: "How do Printed Invitation and Event Planner orders work?", answer: "Printed invitations combined with Digital Invitation can be ordered individually; separate or bulk custom printing has a 300-piece minimum, with prices agreed through consultation. Undara’s Event Planner service connects you with providers after discussing your needs; it is not automatically included in the invitation package." },
    { question: "My access, payment, or QR is not appearing. What should I send support?", answer: "Check the selected event and account first. Send the event name, relevant invoice/reference, error message, and screenshot to Undara. Do not send passwords or OTPs. A package for a different event does not unlock the event you are viewing." },
  ] : [
    { question: "Apakah satu paket berlaku untuk semua acara di akun saya?", answer: `Tidak. Undangan Digital (${price("INVITATION_BASIC")}) berlaku untuk satu acara. Kamu dapat menyiapkan beberapa acara; masing-masing memerlukan akses sebelum diterbitkan. Buku Tamu Digital (${price("GUESTBOOK_DIGITAL")}) sudah termasuk Undangan Digital untuk acara yang sama.` },
    { question: "Apa bedanya Simpan dan Publish?", answer: "Simpan di Studio menyimpan draft. Publish dilakukan melalui Dashboard setelah akses acara aktif dan detail wajib lengkap. RSVP dan Manajemen Tamu bisa disiapkan sebelum publikasi. Periksa Rangkaian Acara dengan teliti karena detail acara yang sudah terbit terkunci untuk pengguna." },
    { question: "Bisa memakai dua sesi atau dua tanggal acara?", answer: "Dua sesi pada tanggal yang sama dapat berada dalam satu acara, dengan waktu dan lokasi masing-masing. Tanggal berbeda memerlukan acara dan akses paket tersendiri. Undangan personal dan RSVP mengikuti sesi yang diundangkan kepada tiap tamu." },
    { question: "Apakah scan QR undangan langsung mencatat tamu hadir?", answer: "QR undangan membuka halaman undangan acara. QR personal tamu berbeda: petugas penerima tamu yang berwenang memindainya untuk memverifikasi tamu dan mencatat kedatangan pada acara/sesi yang sesuai. QR undangan umum tidak otomatis mengenali setiap pengunjung sebagai tamu hadir." },
    { question: "Apakah daftar tamu dan pengaturan meja terpisah?", answer: "Undangan Personal dan Pengaturan Meja memakai daftar tamu acara yang sama. Cari tamu tersimpan supaya tidak membuat data ganda. Jumlah anggota rombongan menentukan kebutuhan kursi; penempatan tamu tetap mengikuti kapasitas meja yang dipilih." },
    { question: "Apakah pengiriman WhatsApp sudah termasuk?", answer: `Undangan personal dapat dibagikan manual. WA Blast berbayar memakai kuota per acara; ${price("WA_BLAST_50")} menambah 50 kuota untuk acara dengan Undangan Digital aktif. Kuota bisa dibeli lagi sesuai kebutuhan. Periksa nomor penerima sebelum mengirim.` },
    { question: "Bisa melihat template dan mengubah desain undangan?", answer: "Lihat pratinjau template sebelum membeli. Pilih tema yang mendukung kategori acaramu, lalu edit konten yang tersedia di Studio. Menyimpan undanganmu tidak mengubah template utama atau undangan pelanggan lain." },
    { question: "Bagaimana pemesanan Undangan Fisik dan Event Planner?", answer: "Undangan Fisik yang digabung dengan Undangan Digital dapat dipesan satuan; pesanan cetak terpisah atau bulk custom minimum 300 pcs, dengan harga melalui konsultasi. Event Planner melalui Undara menghubungkanmu dengan penyedia layanan setelah kebutuhan dibahas; tidak otomatis termasuk paket undangan." },
    { question: "Akses, pembayaran, atau QR belum muncul. Apa yang perlu dikirim ke bantuan?", answer: "Periksa akun dan acara yang dipilih terlebih dahulu. Kirim nama acara, nomor invoice/referensi terkait, pesan kesalahan, dan tangkapan layar kepada Undara. Jangan kirim kata sandi atau OTP. Paket untuk acara lain tidak membuka akses acara yang sedang kamu lihat." },
  ];

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />
      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header"><Navbar embedded /></div>
        <main ref={scrollRoot} tabIndex={0} aria-label={en ? "Help page content" : "Konten halaman bantuan"} className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-primary">
          <div className="undara-marketing-content flex flex-col gap-20 py-8 md:gap-24 md:py-12">
            <header className="undara-marketing-section">
              <div className="flex items-center gap-3"><CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" /><p className="undara-marketing-kicker">{en ? "Undara Help" : "Bantuan Undara"}</p></div>
              <h1 className="undara-marketing-title mt-5 text-primary">{en ? "Everything you need to continue." : "Semua yang kamu perlukan untuk lanjut."}</h1>
              <p className="mt-6 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "Find the event guide, package answers, service terms, and privacy information in one place." : "Temukan panduan acara, jawaban soal paket, ketentuan layanan, dan informasi privasi dalam satu tempat."}</p>
              <nav aria-label={en ? "Help topics" : "Topik bantuan"} className="mt-8 flex flex-wrap gap-3">{links.map(([id,label]) => <a key={id} href={`#${id}`} className="rounded-[12px] border border-primary/30 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</a>)}</nav>
            </header>

            <section id="mulai" className="undara-marketing-section scroll-mt-8">
              <h2 className="undara-marketing-heading text-primary">{en ? "From your first draft to your guests’ arrival." : "Dari draft pertama sampai tamu datang."}</h2>
              <ol className="mt-8 space-y-8">
                {[
                  [en ? "Prepare your event" : "Siapkan acaramu", en ? "Sign in, create an event, and check the category, date, sessions, and venue." : "Masuk, buat acara, lalu periksa kategori, tanggal, sesi, dan lokasi."],
                  [en ? "Design and save" : "Desain dan simpan", en ? "Choose a suitable template, edit your content in Studio, and save your draft. Prepare guests and seating in Dashboard." : "Pilih template yang sesuai, edit isi melalui Studio, lalu simpan draft. Siapkan tamu dan meja di Dashboard."],
                  [en ? "Activate and publish" : "Aktifkan dan terbitkan", en ? "Activate the package for that event, review the invitation, and Publish from Dashboard." : "Aktifkan paket untuk acara tersebut, periksa undangannya, lalu Publish melalui Dashboard."],
                  [en ? "Share and welcome guests" : "Bagikan dan sambut tamu", en ? "Share personal links, monitor RSVP, and use personal guest QR check-in with Digital Guestbook." : "Bagikan tautan personal, pantau RSVP, dan gunakan pemindaian QR personal tamu melalui Buku Tamu Digital."],
                ].map(([title,body]) => <li key={title}><h3 className="undara-marketing-subheading text-primary">{title}</h3><p className="mt-3 max-w-[70ch] text-base leading-8 text-muted-foreground">{body}</p></li>)}
              </ol>
              <div className="mt-8 flex flex-wrap gap-5"><Link href="/template-design" className="inline-flex items-center gap-2 text-primary hover:underline">{en ? "Explore templates" : "Lihat template"}<ArrowRight className="h-4 w-4" /></Link><Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:underline">Dashboard<ArrowRight className="h-4 w-4" /></Link></div>
            </section>

            <section id="faq" className="undara-marketing-section scroll-mt-8"><FaqSection eyebrow={en ? "Questions & answers" : "Tanya jawab"} title={en ? "Clear answers for your event." : "Jawaban yang jelas untuk acaramu."} description={en ? "Packages, publishing, guests, QR codes, and other services." : "Paket, publikasi, tamu, kode QR, dan layanan lainnya."} items={faq} wide editorial /></section>

            <section id="terms" className="undara-marketing-section scroll-mt-8" aria-labelledby="terms-title">
              <p className="undara-marketing-kicker">{en ? "Updated 9 October 2026" : "Diperbarui 9 Oktober 2026"}</p>
              <h2 id="terms-title" className="undara-marketing-heading mt-4 text-primary">{copy.title}</h2>
              <div className="mt-6 max-w-[75ch] space-y-4 text-base leading-8 text-muted-foreground">{copy.opening.map(p => <p key={p}>{p}</p>)}</div>
              <PolicyTopics sections={[...productTerms[locale], ...copy.sections]} />
              <a href="#privacy" className="mt-6 inline-flex text-primary hover:underline">{copy.privacy}</a>
            </section>

            <section id="privacy" className="undara-marketing-section scroll-mt-8" aria-labelledby="privacy-title">
              <p className="undara-marketing-kicker">{en ? "Updated 9 October 2026" : "Diperbarui 9 Oktober 2026"}</p>
              <h2 id="privacy-title" className="undara-marketing-heading mt-4 text-primary">{en ? "Privacy Policy" : "Kebijakan Privasi"}</h2>
              <p className="mt-6 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "How account, event, and guest information is used when you use Undara." : "Cara informasi akun, acara, dan tamu digunakan saat kamu memakai Undara."}</p>
              <PolicyTopics sections={privacySections[locale]} />
            </section>

            <section id="kontak" className="undara-marketing-section scroll-mt-8 pb-12">
              <h2 className="undara-marketing-heading text-primary">{en ? "Still need a hand?" : "Masih perlu bantuan?"}</h2>
              <p className="mt-5 max-w-[70ch] text-base leading-8 text-muted-foreground">{en ? "Send your event name and the issue you encountered. For personal-data requests, explain which account or event the request concerns." : "Kirim nama acara dan kendala yang kamu temui. Untuk permintaan terkait data pribadi, jelaskan akun atau acara yang dimaksud."}</p>
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
