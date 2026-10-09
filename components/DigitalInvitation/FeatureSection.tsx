"use client";

import { Palette, Sparkles, Users, type LucideIcon } from "lucide-react";
import DigitalNote from "./DigitalNote";
import { useLanguage } from "@/components/I18n/LanguageProvider";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function FeatureSection() {
  const { locale } = useLanguage();
  const en = locale === "en";

  const features: FeatureItem[] = en
    ? [
        {
          icon: Palette,
          title: "Choose your theme.",
          description:
            "Choose a ready invitation theme, then shape the photos, tone, copy, music, venue, and event details around your celebration.",
        },
        {
          icon: Sparkles,
          title: "Make it yours in Studio.",
          description:
            "Edit your text, photos and event details in one place. See each change directly on your invitation.",
        },
        {
          icon: Users,
          title: "Keep your guests connected.",
          description:
            "Collect RSVPs, keep your guest list organized, and plan tables and seats for the day.",
        },
      ]
    : [
        {
          icon: Palette,
          title: "Pilih tema yang kamu suka.",
          description:
            "Pilih tema undangan yang sudah siap, lalu sesuaikan foto, nuansa, isi, musik, lokasi, dan detail acara agar terasa milik perayaanmu.",
        },
        {
          icon: Sparkles,
          title: "Jadikan milikmu di Studio.",
          description:
            "Ubah teks, foto, dan detail acara di satu tempat. Lihat setiap perubahan langsung pada undanganmu.",
        },
        {
          icon: Users,
          title: "Kelola tamu dalam satu alur.",
          description:
            "Terima RSVP, rapikan daftar tamu, lalu atur meja dan tempat duduk untuk hari acara.",
        },
      ];

  return (
    <section id="fitur" className="undara-marketing-section scroll-mt-24 py-14 md:py-20">
      <div className="space-y-10 md:space-y-14">
        <div className="w-full">
          <p className="undara-marketing-kicker">
            {en ? "A complete invitation flow" : "Alur Undangan yang Utuh"}
          </p>
          <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] text-primary">
            {en
              ? "From invitation to celebration."
              : "Dari undangan sampai hari perayaan."}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "Choose a theme, make it personal, and welcome your guests. Everything stays connected to your event."
              : "Pilih tema, beri sentuhan personal, lalu sambut tamumu. Semuanya terhubung dalam satu acara."}
          </p>
        </div>

        <div>
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="group relative py-8 md:py-10"
            >
              <DigitalNote index={index} className={index % 2 ? "right-0 lg:left-0 lg:right-auto" : "right-0"} />
              <div className={`relative z-10 flex flex-col gap-5 sm:flex-row md:gap-8 lg:w-[72%] ${index % 2 ? "lg:ml-auto lg:flex-row-reverse lg:text-right" : "lg:mr-auto"}`}>
                <div className="flex shrink-0 items-start">
                  <span className="grid h-11 w-11 place-items-center rounded-[16px] border border-primary/35 text-primary undara-marketing-hover-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="undara-marketing-subheading font-[family-name:var(--font-undara-heading)] text-primary">
                    {title}
                  </h3>
                  <p className={`mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8 ${index % 2 ? "lg:ml-auto" : ""}`}>
                    {description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
