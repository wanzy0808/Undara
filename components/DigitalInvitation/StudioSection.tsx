"use client";

import Link from "next/link";
import { ArrowUpRight, ImageIcon, MapPin, Sparkles, Type, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";

export default function StudioSection() {
  const { locale } = useLanguage();
  const en = locale === "en";

  const tools = en
    ? [
        [ImageIcon, "Photos", "Choose from the event library"],
        [Type, "Copy", "Shape the words inside the theme"],
        [MapPin, "Event details", "Venue, date, time and directions"],
        [Users, "Guest flow", "RSVP and guest-facing information"],
      ] as const
    : [
        [ImageIcon, "Foto", "Pilih dari library acara"],
        [Type, "Isi", "Bentuk kata-kata di dalam tema"],
        [MapPin, "Detail acara", "Venue, tanggal, waktu, dan arah"],
        [Users, "Alur tamu", "RSVP dan informasi untuk tamu"],
      ] as const;

  return (
    <section className="undara-marketing-section py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="undara-marketing-kicker">Invitation Studio</p>
          </div>

          <h2 className="undara-marketing-heading mt-5 max-w-[26ch] font-[family-name:var(--font-undara-heading)] text-primary">
            {en
              ? "A personal touch, made simple."
              : "Sentuhan personal, tanpa proses rumit."}
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "Start from a finished theme, then personalize what matters. Studio keeps the design expressive while the event structure, RSVP, and guest flow stay connected."
              : "Mulai dari tema yang sudah selesai secara visual, lalu personalisasi bagian yang memang penting. Studio menjaga desain tetap ekspresif sementara struktur acara, RSVP, dan alur tamu tetap terhubung."}
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link href="/studio">
              {en ? "Enter Studio" : "Masuk Studio"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>

          <p className="undara-marketing-meta mt-5 max-w-lg text-muted-foreground">
            {en
              ? "Choose a theme first — publish remains controlled from Dashboard."
              : "Pilih tema lebih dulu — publish tetap dikendalikan dari Dashboard."}
          </p>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[620px]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-[7%] top-[8%] h-[70%] w-[72%] rounded-full bg-[radial-gradient(circle,rgba(112,59,59,0.12),transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(214,179,140,0.10),transparent_68%)]" />

          <div className="undara-editorial-media absolute inset-[4%_3%_5%_8%] overflow-hidden bg-card/85">
            <div className="flex h-14 items-center justify-between px-5 md:px-7">
              <div>
                <p className="font-[family-name:var(--font-undara-heading)] text-lg text-primary">
                  {en ? "Your invitation" : "Undanganmu"}
                </p>
                <p className="font-[family-name:var(--font-undara-mono)] text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  Studio
                </p>
              </div>
              <div className="flex gap-2" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full border border-primary/45" />
                <span className="h-2.5 w-2.5 rounded-full border border-primary/45" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/55" />
              </div>
            </div>

            <div className="grid h-[calc(100%-3.5rem)] grid-cols-[76px_minmax(0,1fr)] md:grid-cols-[104px_minmax(0,1fr)]">
              <div className="border-r border-primary/20 px-2 py-5 md:px-3">
                {tools.map(([Icon, label], index) => (
                  <div key={label} className={`mb-3 grid min-h-16 place-items-center rounded-xl border px-1 text-center ${index === 0 ? "border-primary/45 bg-primary/[0.07] text-primary" : "border-primary/15 text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="mt-1 text-[9px] leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden p-5 md:p-7">
                <div className="mx-auto h-full max-w-[270px] overflow-hidden rounded-[34px] border-[5px] border-[#2f2928] bg-[#fbf5ef] shadow-[0_22px_55px_rgba(34,20,18,0.18)]">
                  <div className="relative h-full overflow-hidden px-7 py-10 text-center text-[#3a2020]">
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#d6b38c]/30 blur-2xl" />
                    <p className="font-[family-name:var(--font-undara-mono)] text-[7px] uppercase tracking-[0.2em] text-[#8b5d62]">
                      {en ? "You are invited" : "Sebuah undangan"}
                    </p>
                    <h3 className="mt-7 font-[family-name:var(--font-undara-heading)] text-4xl leading-[0.94] text-[#3a2020]">
                      Una
                      <span className="block text-xl italic text-[#8a6966]">&amp;</span>
                      Dara
                    </h3>
                    <div className="mx-auto my-7 h-px w-12 bg-[#703b3b]/35" />
                    <p className="text-[11px] leading-5 text-[#6d5552]">
                      {en ? "Saturday · Jakarta · 18.00" : "Sabtu · Jakarta · 18.00"}
                    </p>
                    <div className="mx-auto mt-9 h-40 w-full rounded-[28px_8px_28px_8px] bg-[linear-gradient(145deg,#ccb6aa,#f4e7dd_52%,#a97676)]" />
                    <div className="mt-8 grid grid-cols-2 gap-2 text-left">
                      <div className="border-t border-[#703b3b]/25 pt-3 text-[9px]">
                        <p className="font-[family-name:var(--font-undara-mono)] uppercase tracking-[0.12em] text-[#8b5d62]">RSVP</p>
                        <p className="mt-1">120 {en ? "guests" : "tamu"}</p>
                      </div>
                      <div className="border-t border-[#703b3b]/25 pt-3 text-[9px]">
                        <p className="font-[family-name:var(--font-undara-mono)] uppercase tracking-[0.12em] text-[#8b5d62]">{en ? "Sections" : "Bagian"}</p>
                        <p className="mt-1">15 {en ? "controls" : "kontrol"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-4 hidden w-[220px] rounded-[20px] border border-primary/30 bg-background/90 p-4 shadow-xl backdrop-blur-md md:block">
                  <p className="undara-editorial-index">{en ? "Selected object" : "Objek terpilih"}</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full bg-primary/12"><div className="h-full w-[72%] bg-primary/45" /></div>
                    <div className="h-2 w-full bg-primary/12"><div className="h-full w-[48%] bg-primary/30" /></div>
                  </div>
                  <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                    {en ? "Style the presentation without breaking the event flow." : "Atur tampilannya tanpa merusak alur acara."}
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
