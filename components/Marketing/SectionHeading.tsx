type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={`${centered ? "mx-auto text-center" : "text-left"} max-w-3xl space-y-3`}>
      <p className="undara-marketing-meta text-[var(--primary)]">
        {eyebrow}
      </p>
      <h2 className="undara-marketing-heading font-[family-name:var(--font-undara-heading)] tracking-[-0.025em]">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
