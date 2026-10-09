"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/Marketing/SectionHeading";

type FaqItem = { question: string; answer: string };

type FaqSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  items: readonly FaqItem[];
  wide?: boolean;
  editorial?: boolean;
  defaultOpen?: number | null;
};

export default function FaqSection({
  eyebrow = "FAQ",
  title,
  description,
  items,
  wide = false,
  editorial = false,
  defaultOpen = 0,
}: FaqSectionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <section className={`mx-auto w-full space-y-8 md:space-y-10 ${wide ? "max-w-none" : "max-w-4xl"}`}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        align="left"
      />
      <div className={editorial ? "space-y-3" : "space-y-4"}>
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <div
              key={item.question}
              className={
                editorial
                  ? "rounded-[20px] bg-primary/[0.045] px-5 md:px-7"
                  : "overflow-hidden rounded-[28px] border border-primary/70 bg-[var(--card)]/75 md:rounded-[32px]"
              }
            >
              <Button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                size="sm"
                className={
                  editorial
                    ? "h-auto min-h-14 w-full min-w-0 justify-between rounded-none border-0 bg-transparent px-0 py-5 text-left text-sm text-foreground shadow-none hover:bg-transparent md:py-6 md:text-base"
                    : `h-auto min-h-11 w-full min-w-0 justify-between border-0 px-5 py-4 text-left text-sm md:px-6 md:text-base ${isOpen ? "rounded-t-[28px] rounded-b-none md:rounded-t-[32px]" : "rounded-[28px] md:rounded-[32px]"}`
                }
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words pr-4 font-undara-body font-medium">
                  {item.question}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
              {isOpen ? (
                <div
                  data-dc-text-reveal
                  className={
                    editorial
                      ? "max-w-4xl pb-6 pr-10 text-sm leading-7 text-[var(--muted-foreground)] md:pb-7 md:text-base md:leading-8"
                      : "border-t border-[var(--border)] px-5 pb-6 pt-4 text-sm leading-7 text-[var(--muted-foreground)] md:px-6"
                  }
                >
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
