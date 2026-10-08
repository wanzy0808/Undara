"use client";

import { Armchair, BarChart3, ClipboardList, ScanLine } from "lucide-react";
import { useLanguage } from "@/components/I18n/LanguageProvider";

export default function ProcessSection() {
  const { locale } = useLanguage();
  const en = locale === "en";

  const steps = en
    ? [
        {
          icon: ClipboardList,
          title: "Prepare the guest list",
          text: "Set up guest identities, WhatsApp numbers, RSVP status, plus-one information, and table assignments before the event begins.",
        },
        {
          icon: ScanLine,
          title: "Issue official QR access",
          text: "Send QR credentials to guests. If someone arrives without one, the usher verifies the guest first and issues an official QR.",
        },
        {
          icon: Armchair,
          title: "Scan and direct at the venue",
          text: "A valid scan confirms arrival, then the guest and seating information can immediately guide the reception team.",
        },
        {
          icon: BarChart3,
          title: "Follow attendance live",
          text: "The event team can follow arrivals and guest status in real time from the same event data while the venue flow continues.",
        },
      ]
    : [
        {
          icon: ClipboardList,
          title: "Siapkan daftar tamu",
          text: "Rapikan identitas tamu, WhatsApp, status RSVP, tamu tambahan, dan penempatan meja sebelum acara dimulai.",
        },
        {
          icon: ScanLine,
          title: "Terbitkan akses QR resmi",
          text: "Kirim QR kepada tamu. Jika seseorang datang tanpa QR, petugas memverifikasi terlebih dulu lalu menerbitkan QR resmi.",
        },
        {
          icon: Armchair,
          title: "Pindai dan arahkan di lokasi",
          text: "Pemindaian yang valid mengonfirmasi kedatangan, lalu informasi tamu dan meja membantu tim penerima memberi arahan.",
        },
        {
          icon: BarChart3,
          title: "Pantau kehadiran langsung",
          text: "Tim acara dapat mengikuti kedatangan dan status tamu dari data acara yang sama selama penerimaan berlangsung.",
        },
      ];

  return (
    <section className="undara-marketing-section py-14 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
        <div>
          <p className="undara-marketing-kicker">{en ? "From list to arrival" : "Dari Daftar sampai Kedatangan"}</p>
          <h2 className="undara-marketing-heading mt-4 max-w-[17ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
            {en ? "A clear sequence for the busiest part of the day." : "Urutan yang jelas untuk bagian hari yang paling sibuk."}
          </h2>
        </div>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
          {en
            ? "The system follows the way guests actually arrive: prepare the data, verify access, scan at the venue, then keep the team informed."
            : "Sistem mengikuti alur kedatangan tamu: siapkan data, verifikasi akses, pindai QR di lokasi, lalu pastikan seluruh tim mendapat informasi yang sama."}
        </p>
      </div>

      <div className="relative mt-12">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <article
            key={title}
            className={`relative max-w-4xl py-8 md:py-11 ${index % 2 ? "lg:ml-auto" : "lg:mr-auto"}`}
          >
            <div className="relative z-10 mb-5 flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] border border-primary/35 bg-background text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
            <h3 className="undara-marketing-subheading max-w-[18ch] font-[family-name:var(--font-undara-heading)] text-primary">
              {title}
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              {text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
