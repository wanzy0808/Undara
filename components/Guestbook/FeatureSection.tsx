"use client";

import { useState } from "react";
import { Check, ScanLine, Search, BarChart3, Armchair, MonitorUp, Gift } from "lucide-react";
import { useLanguage } from "@/components/I18n/LanguageProvider";

export default function FeatureSection() {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [active, setActive] = useState(0);

  const features = en
    ? [
        {
          icon: ScanLine,
          title: "Official QR Check-in",
          description:
            "Every official check-in uses a valid QR credential, so arrival status is tied to the right guest record instead of a manual guess.",
          highlights: ["Unique guest QR", "Camera scan or token input", "Duplicate check-in protection"],
        },
        {
          icon: Search,
          title: "Guest Verification",
          description:
            "When a guest arrives without an RSVP or QR, the usher can verify them against the event list before issuing an official QR.",
          highlights: ["Search name / WhatsApp", "Verify access", "Issue QR then scan"],
        },
        {
          icon: BarChart3,
          title: "Realtime Attendance",
          description:
            "Follow who has arrived, who has not, and plus-one attendance from the same event data while the event is running.",
          highlights: ["Live attendance", "RSVP + check-in status", "One event data source"],
        },
        {
          icon: Armchair,
          title: "Table & VIP Management",
          description:
            "Keep table names, seat capacity, guest table numbers, and priority information visible to the reception team.",
          highlights: ["Table identity", "Seat capacity", "Guest + plus-one seating"],
        },
        {
          icon: MonitorUp,
          title: "Guest Greeting",
          description:
            "Create a more personal arrival moment by showing guest names and event greetings on a venue display.",
          highlights: ["Guest name", "Digital greeting", "Custom venue display"],
        },
        {
          icon: Gift,
          title: "Gift Corner & Giving",
          description:
            "Discuss gift-corner and giving records with our team when planning your event.",
          highlights: ["Discuss gift records", "Agree the reception flow", "Coordinate with our team"],
        },
      ]
    : [
        {
          icon: ScanLine,
          title: "Pemindaian QR Resmi",
          description:
            "Setiap kedatangan resmi memakai QR yang valid, sehingga status kehadiran terikat ke data tamu yang tepat dan bukan sekadar pencarian nama.",
          highlights: ["QR unik per tamu", "Pindai kamera atau masukkan kode", "Cegah pencatatan ganda"],
        },
        {
          icon: Search,
          title: "Verifikasi Tamu",
          description:
            "Saat tamu datang tanpa RSVP atau QR, petugas dapat memverifikasi data tamu terlebih dulu sebelum menerbitkan QR resmi.",
          highlights: ["Cari nama / WhatsApp", "Verifikasi akses", "Terbitkan lalu pindai QR"],
        },
        {
          icon: BarChart3,
          title: "Pantau Kehadiran Langsung",
          description:
            "Pantau siapa yang sudah datang, siapa yang belum, dan kehadiran tamu tambahan dari data acara yang sama selama acara berlangsung.",
          highlights: ["Kehadiran langsung", "Status RSVP dan kedatangan", "Satu sumber data acara"],
        },
        {
          icon: Armchair,
          title: "Pengaturan Meja dan Tamu VIP",
          description:
            "Nama meja, kapasitas kursi, nomor meja tamu, dan informasi prioritas tetap terlihat jelas oleh tim penerima tamu.",
          highlights: ["Identitas meja", "Kapasitas kursi", "Tempat duduk tamu tambahan"],
        },
        {
          icon: MonitorUp,
          title: "Sapaan Tamu",
          description:
            "Buat momen kedatangan terasa lebih personal dengan menampilkan nama tamu dan sapaan acara pada layar di lokasi.",
          highlights: ["Nama tamu", "Ucapan digital", "Tampilan khusus di lokasi"],
        },
        {
          icon: Gift,
          title: "Pojok Hadiah dan Pemberian",
          description:
            "Bicarakan pencatatan hadiah dan pemberian bersama tim kami saat menyiapkan acara.",
          highlights: ["Diskusikan catatan hadiah", "Sepakati alur penerimaan", "Koordinasi bersama tim"],
        },
      ];

  const selected = features[active];

  return (
    <section id="fitur-guestbook" className="undara-marketing-section scroll-mt-24 py-14 md:py-20">
      <div>
        <p className="undara-marketing-kicker">{en ? "At the reception" : "Di Meja Penerima"}</p>
        <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] text-primary">
          {en ? "Everything the reception team needs." : "Yang dibutuhkan tim penerima tamu."}
        </h2>
        <p className="mt-6 max-w-[70ch] text-base leading-8 text-muted-foreground">
          {en ? "From guest verification to seating, keep the arrival flow clear." : "Dari verifikasi sampai tempat duduk, alur kedatangan tetap jelas."}
        </p>
      </div>

      <div className="mt-10 flex gap-3 overflow-x-auto overscroll-x-contain py-2 sm:flex-wrap sm:overflow-visible" aria-label={en ? "Guestbook features" : "Fitur Buku Tamu"}>
        {features.map((feature, index) => (
          <button key={feature.title} type="button" onClick={() => setActive(index)} aria-pressed={active === index}
            aria-controls="guestbook-feature-detail"
            className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-[14px] px-4 py-3 text-left text-base transition-colors motion-reduce:transition-none ${active === index ? "bg-primary text-primary-foreground" : "bg-primary/5 text-foreground hover:bg-primary/10"}`}>
            <feature.icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {feature.title}
          </button>
        ))}
      </div>

      <div id="guestbook-feature-detail" aria-live="polite" className="mt-10 min-h-[300px] sm:min-h-[240px]">
        <div key={selected.title} className="undara-marketing-detail-in flex flex-col gap-8 lg:flex-row lg:gap-16">
          <div className="min-w-0 flex-[1.6]">
            <h3 className="undara-marketing-subheading font-[family-name:var(--font-undara-heading)] text-primary">{selected.title}</h3>
            <p className="mt-5 max-w-[70ch] text-base leading-8 text-muted-foreground">{selected.description}</p>
          </div>
          <ul className="flex-1 space-y-4 lg:pt-2">
            {selected.highlights.map(item => (
              <li key={item} className="flex items-start gap-3 text-base leading-7 text-foreground">
                <Check className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />{item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
