import { ArrowDownRight } from "lucide-react";
import { plannerServices } from "@/data/services/event-planner";

export default function ServicesSection({ locale }: { locale: "id" | "en" }) {
  const en = locale === "en";

  return (
    <section className="space-y-10 md:space-y-12">
      <div className="grid gap-6 pb-8 ">
        <div>
          <p className="font-[family-name:var(--font-undara-mono)] text-[10px] uppercase tracking-[0.2em] text-primary">
            {en ? "Before we connect you" : "Sebelum kami hubungkan"}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-undara-heading)] text-3xl font-normal leading-[1.04] tracking-[-0.025em] text-primary md:text-4xl">
            {en ? "Four things are enough to get started." : "Empat hal sederhana sudah cukup untuk mulai."}
          </h2>
        </div>

        <div className="flex items-end gap-4">
          <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
            {en
              ? "You do not need a complete brief. Send whatever is already known, and the rest can be clarified during consultation."
              : "Kamu tidak perlu menyiapkan brief yang lengkap. Kirim saja informasi yang sudah ada, sisanya bisa dibicarakan saat konsultasi."}
          </p>
          <ArrowDownRight className="mb-1 hidden h-6 w-6 shrink-0 text-primary/55 lg:block" />
        </div>
      </div>

      <div className="relative grid gap-5 pb-8 md:grid-cols-2 md:gap-x-10 md:gap-y-12 md:pb-14 lg:gap-x-16">
        {plannerServices.map((service, index) => (
          <article
            key={service.title}
            style={{ gridRow: index + 1 }}
            className={`relative z-10 min-w-0 rounded-[20px] border border-primary/20 bg-background/25 p-6 backdrop-blur-[1px] sm:p-8 md:px-9 md:py-10 ${index % 2 ? "md:col-start-2" : "md:col-start-1"}`}
          >
            <div className="flex items-center gap-4 font-[family-name:var(--font-undara-mono)] text-xs tracking-[0.2em] text-primary/70">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="h-px flex-1 bg-primary/20" />
            </div>

            <h3 className="mt-10 font-[family-name:var(--font-undara-heading)] text-2xl font-normal leading-tight text-primary md:text-3xl">
              {en ? service.titleEn : service.title}
            </h3>

            <p className="mt-4 max-w-xl font-[family-name:var(--font-undara-body)] text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
              {en ? service.textEn : service.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
