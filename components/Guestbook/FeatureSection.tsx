"use client";

import { useState } from "react";
import { ArrowRight, ScanLine, Search, BarChart3, Armchair, MonitorUp, Gift } from "lucide-react";
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
          badge: "Venue Entry",
          description:
            "Every official check-in uses a valid QR credential, so arrival status is tied to the right guest record instead of a manual guess.",
          highlights: ["Unique guest QR", "Camera scan or token input", "Duplicate check-in protection"],
        },
        {
          icon: Search,
          title: "Guest Verification",
          badge: "Usher App",
          description:
            "When a guest arrives without an RSVP or QR, the usher can verify them against the event list before issuing an official QR.",
          highlights: ["Search name / WhatsApp", "Verify access", "Issue QR then scan"],
        },
        {
          icon: BarChart3,
          title: "Realtime Attendance",
          badge: "Live Monitoring",
          description:
            "Follow who has arrived, who has not, and plus-one attendance from the same event data while the event is running.",
          highlights: ["Live attendance", "RSVP + check-in status", "One event data source"],
        },
        {
          icon: Armchair,
          title: "Table & VIP Management",
          badge: "Seating",
          description:
            "Keep table names, seat capacity, guest table numbers, and priority information visible to the reception team.",
          highlights: ["Table identity", "Seat capacity", "Guest + plus-one seating"],
        },
        {
          icon: MonitorUp,
          title: "Guest Greeting",
          badge: "Experience",
          description:
            "Create a more personal arrival moment by showing guest names and event greetings on a venue display.",
          highlights: ["Guest name", "Digital greeting", "Custom venue display"],
        },
        {
          icon: Gift,
          title: "Gift Corner & Giving",
          badge: "After Check-in",
          description:
            "Keep gift-corner and giving records organized so the event team has a clearer operational trail after guests arrive.",
          highlights: ["Gift tracking", "Giving records", "Centralized history"],
        },
      ]
    : [
        {
          icon: ScanLine,
          title: "Pemindaian QR Resmi",
          badge: "Akses Lokasi",
          description:
            "Setiap kedatangan resmi memakai QR yang valid, sehingga status kehadiran terikat ke data tamu yang tepat dan bukan sekadar pencarian nama.",
          highlights: ["QR unik per tamu", "Pindai kamera atau masukkan kode", "Cegah pencatatan ganda"],
        },
        {
          icon: Search,
          title: "Verifikasi Tamu",
          badge: "Aplikasi Penerima Tamu",
          description:
            "Saat tamu datang tanpa RSVP atau QR, petugas dapat memverifikasi data tamu terlebih dulu sebelum menerbitkan QR resmi.",
          highlights: ["Cari nama / WhatsApp", "Verifikasi akses", "Terbitkan lalu pindai QR"],
        },
        {
          icon: BarChart3,
          title: "Pantau Kehadiran Langsung",
          badge: "Pemantauan Kedatangan",
          description:
            "Pantau siapa yang sudah datang, siapa yang belum, dan kehadiran tamu tambahan dari data acara yang sama selama acara berlangsung.",
          highlights: ["Kehadiran langsung", "Status RSVP dan kedatangan", "Satu sumber data acara"],
        },
        {
          icon: Armchair,
          title: "Pengaturan Meja dan Tamu VIP",
          badge: "Tempat Duduk",
          description:
            "Nama meja, kapasitas kursi, nomor meja tamu, dan informasi prioritas tetap terlihat jelas oleh tim penerima tamu.",
          highlights: ["Identitas meja", "Kapasitas kursi", "Tempat duduk tamu tambahan"],
        },
        {
          icon: MonitorUp,
          title: "Sapaan Tamu",
          badge: "Pengalaman Tamu",
          description:
            "Buat momen kedatangan terasa lebih personal dengan menampilkan nama tamu dan sapaan acara pada layar di lokasi.",
          highlights: ["Nama tamu", "Ucapan digital", "Tampilan khusus di lokasi"],
        },
        {
          icon: Gift,
          title: "Pojok Hadiah dan Pemberian",
          badge: "Setelah Check-in",
          description:
            "Catat hadiah dan pemberian agar tim acara memiliki riwayat yang lebih rapi setelah tamu datang.",
          highlights: ["Pencatatan hadiah", "Catatan pemberian", "Riwayat terpusat"],
        },
      ];

  const selected = features[active];

  return (
    <section id="fitur-guestbook" className="undara-marketing-section scroll-mt-24 py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div>
          <p className="undara-marketing-kicker">{en ? "Guest Arrival System" : "Sistem Kedatangan Tamu"}</p>
          <h2 className="undara-marketing-heading mt-4 max-w-[15ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
            {en ? "One reception flow. Less room for confusion." : "Satu alur penerimaan. Lebih sedikit ruang untuk bingung."}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "Digital Guestbook is designed around what the reception team actually needs on the event day: verify, check in, seat, and monitor."
              : "Buku Tamu Digital dirancang untuk tim penerima tamu saat hari acara: verifikasi, catat kedatangan, arahkan ke meja, dan pantau kehadiran."}
          </p>

          <div className="mt-10">
            {features.map((feature, index) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={active === index}
                className={`group flex w-full items-center gap-4 rounded-[16px] px-3 py-5 text-left transition-colors duration-200 ${active === index ? "text-primary" : "text-foreground/65 hover:text-primary"}`}
              >
                <span className="flex-1 font-[family-name:var(--font-undara-heading)] text-xl leading-tight md:text-2xl">
                  {feature.title}
                </span>
                <ArrowRight className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active === index ? "translate-x-0" : "-translate-x-1 opacity-50 group-hover:translate-x-0"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div aria-live="polite" className="undara-editorial-surface relative overflow-hidden p-7 sm:p-9 md:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(112,59,59,0.12),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(214,179,140,0.10),transparent_70%)]"
            />
            <div key={selected.title} className="undara-marketing-detail-in relative z-10">
              <div className="flex items-center justify-between gap-5">
                <span className="undara-marketing-kicker">{selected.badge}</span>
                <selected.icon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="undara-marketing-subheading mt-8 max-w-[15ch] font-[family-name:var(--font-undara-heading)] text-primary">
                {selected.title}
              </h3>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                {selected.description}
              </p>
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 pt-6">
                {selected.highlights.map((item) => (
                  <li key={item} className="border-l border-primary/25 pl-4 text-sm leading-6 text-foreground/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
