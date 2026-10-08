"use client";

import { Palette, Sparkles, Users, type LucideIcon } from "lucide-react";
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
            "Invitation content and design stay together in Studio, so every event can be refined independently without turning the setup into a complicated design tool.",
        },
        {
          icon: Users,
          title: "Keep your guests connected.",
          description:
            "RSVP, plus-one information, and guest management remain scoped to the same event, so the invitation is connected to what happens after guests open it.",
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
            "Isi dan desain undangan tetap berada di Studio yang sama, sehingga setiap acara bisa dibentuk sendiri tanpa proses yang rumit.",
        },
        {
          icon: Users,
          title: "Kelola tamu dalam satu alur.",
          description:
            "RSVP, informasi tamu tambahan, dan manajemen tamu tetap terikat pada acara yang sama, jadi undangan tidak berhenti saat tamu selesai membacanya.",
        },
      ];

  return (
    <section id="fitur" className="undara-marketing-section scroll-mt-24 py-14 md:py-20">
      <div className="space-y-10 md:space-y-14">
        <div className="max-w-3xl">
          <p className="undara-marketing-kicker">
            {en ? "A complete invitation flow" : "Alur Undangan yang Utuh"}
          </p>
          <h2 className="undara-marketing-heading mt-4 max-w-[26ch] font-[family-name:var(--font-undara-heading)] text-primary">
            {en
              ? "From invitation to celebration."
              : "Dari undangan sampai hari perayaan."}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "Undara connects the visual invitation with the practical event flow without making the experience feel like an admin dashboard."
              : "Undara menghubungkan pengalaman visual undangan dengan kebutuhan acara yang praktis, tanpa membuat tamu maupun pemilik acara merasa sedang membuka dashboard admin."}
          </p>
        </div>

        <div>
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className={`group flex max-w-4xl gap-5 py-8 md:gap-8 md:py-10 ${index % 2 ? "lg:ml-auto" : "lg:mr-auto"}`}
            >
              <div className="flex shrink-0 items-start">
                <span className="grid h-11 w-11 place-items-center rounded-[16px] border border-primary/35 text-primary undara-marketing-hover-icon">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </div>

              <div>
                <h3 className="undara-marketing-subheading max-w-[32ch] font-[family-name:var(--font-undara-heading)] text-primary">
                  {title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
