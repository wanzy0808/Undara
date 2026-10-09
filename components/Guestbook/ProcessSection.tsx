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
      <div className="space-y-6 lg:text-right">
        <div>
          <p className="undara-marketing-kicker">{en ? "From list to arrival" : "Dari Daftar sampai Kedatangan"}</p>
          <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] text-primary">
            {en ? "Ready before the first guest arrives." : "Siap sebelum tamu pertama datang."}
          </h2>
        </div>
        <p className="max-w-[75ch] text-base lg:ml-auto leading-7 text-muted-foreground md:text-base md:leading-8">
          {en
            ? "The system follows the way guests actually arrive: prepare the data, verify access, scan at the venue, then keep the team informed."
            : "Sistem mengikuti alur kedatangan tamu: siapkan data, verifikasi akses, pindai QR di lokasi, lalu pastikan seluruh tim mendapat informasi yang sama."}
        </p>
      </div>

      <div className="relative mt-12">
        {steps.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="flex flex-col gap-5 py-7 sm:flex-row sm:gap-7 md:py-8"
          >
            <div className="shrink-0">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] border border-primary/35 bg-background text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
            <h3 className="undara-marketing-subheading font-[family-name:var(--font-undara-heading)] text-primary">
              {title}
            </h3>
            <p className="mt-3 max-w-[80ch] text-base leading-8 text-muted-foreground">
              {text}
            </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
