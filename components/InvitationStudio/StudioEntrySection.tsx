"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/I18n/LanguageProvider";

type EventChoice = { id: string; title: string; type: "WEDDING" | "ADAT_AKAD" };

export default function StudioEntrySection({ events, selectedTemplate }: { events: EventChoice[]; selectedTemplate?: string }) {
  const { locale } = useLanguage();
  const copy = locale === "en"
    ? {
        title: events.length ? "Choose an event to edit" : "Create an event before entering Studio",
        description: events.length
          ? "Choose the event you want to continue in Studio."
          : "Studio saves designs for each event. Set up an event first so your changes are saved to the right place.",
        create: "Create an event",
      }
    : {
        title: events.length ? "Pilih acara untuk diedit" : "Buat acara sebelum masuk Studio",
        description: events.length
          ? "Pilih acara yang ingin kamu lanjutkan di Studio."
          : "Studio menyimpan desain untuk setiap acara. Siapkan satu acara terlebih dahulu agar desainmu tersimpan di tempat yang tepat.",
        create: "Buat acara",
      };

  return (
    <main className="undara-studio-entry flex min-h-dvh items-center justify-center bg-background px-5 py-16 text-foreground">
      <section className="w-full max-w-2xl space-y-7 rounded-[32px] border border-primary/50 bg-card p-6 shadow-[0_18px_60px_rgba(75,35,47,0.08)] sm:p-10">
        <p className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-[0.18em] text-primary">
          Invitation Studio
        </p>
        <h1 className="font-[family-name:var(--font-undara-heading)] text-3xl font-normal text-primary sm:text-4xl">
          {copy.title}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">{copy.description}</p>
        {events.length ? (
          <div className="space-y-3">
            {events.map((event) => (
              <Button asChild key={event.id} size="lg" className="min-h-12 w-full justify-between whitespace-normal text-left">
                <Link href={`/dashboard/editor?invitationId=${encodeURIComponent(event.id)}&type=${event.type}${selectedTemplate ? `&template=${encodeURIComponent(selectedTemplate)}` : ""}`}>
                  <span className="truncate">{event.title}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </Button>
            ))}
          </div>
        ) : (
          <Button asChild size="lg">
            <Link href={selectedTemplate ? `/dashboard?tab=events&from=template&template=${encodeURIComponent(selectedTemplate)}` : "/dashboard?tab=events"}>
              {copy.create} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </section>
    </main>
  );
}
