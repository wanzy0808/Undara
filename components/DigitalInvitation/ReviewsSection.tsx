"use client";

import { Quote, Star } from "lucide-react";

type Review = {
  name: string;
  review: string;
  date: string;
};

type ReviewsSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  reviews: readonly Review[];
};

export default function ReviewsSection({
  eyebrow,
  title,
  description,
  reviews,
}: ReviewsSectionProps) {
  return (
    <section className="undara-marketing-section py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="max-w-xl">
          <p className="undara-marketing-kicker">{eyebrow}</p>
          <h2 className="undara-marketing-heading mt-4 max-w-[15ch] font-[family-name:var(--font-undara-heading)] text-primary">
            {title}
          </h2>
          <p className="mt-6 text-base leading-7 text-muted-foreground md:text-base md:leading-8">
            {description}
          </p>
          <Quote className="mt-10 h-10 w-10 text-primary/25" strokeWidth={1.2} aria-hidden="true" />
        </div>

        <div>
          {reviews.map((item, index) => (
            <article
              key={`${item.name}-${item.date}`}
              className={`grid gap-5 py-8 md:grid-cols-[90px_minmax(0,1fr)] md:gap-8 md:py-10 ${index % 2 ? "lg:pl-[8%]" : "lg:pr-[5%]"}`}
            >
              <div>
                <div className="flex gap-0.5 text-primary" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                  ))}
                </div>
              </div>

              <div>
                <p className="max-w-3xl font-[family-name:var(--font-undara-heading)] text-2xl font-normal italic leading-[1.35] text-foreground/90 md:text-3xl">
                  “{item.review}”
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
                  <p className="undara-marketing-meta text-primary">
                    {item.name}
                  </p>
                  <span className="h-1 w-1 rounded-full bg-primary/35" aria-hidden="true" />
                  <span className="font-[family-name:var(--font-undara-mono)] text-[9px] tracking-[0.12em] text-muted-foreground">
                    {item.date}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
