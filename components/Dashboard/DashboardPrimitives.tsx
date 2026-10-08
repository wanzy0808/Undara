import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function classes(...values: Array<string | false | null | undefined>) {
  return cn(...values);
}

export function DashboardPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes(
        "undara-dashboard-page mx-auto w-[80vw] max-w-full min-w-0 pb-16 pt-6 sm:pt-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardSurface({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      {...props}
      className={classes(
        "undara-dashboard-surface rounded-tr-[26px] border border-primary/15 bg-background shadow-[0_10px_36px_rgba(78,32,47,0.045)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DashboardMetricGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes("undara-dashboard-metric-group grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </section>
  );
}

export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
  className = "",
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <article
      className={classes(
        "undara-dashboard-metric flex min-w-0 items-center gap-3 px-4 py-5",
        className,
      )}
    >
      {Icon && (
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0">
        <p className="undara-ui-label text-[14px] leading-5 text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-[28px] font-semibold leading-none text-foreground tabular-nums">{value}</div>
      </div>
    </article>
  );
}

export function DashboardCompactStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes(
        "undara-dashboard-compact-stat min-w-0 rounded-tr-[18px] border border-border/70 bg-foreground/[0.018] px-3.5 py-3",
        className,
      )}
    >
      <p className="undara-ui-label font-[family-name:var(--font-undara-mono)] text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 break-words text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function DashboardNotice({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={classes(
        "undara-dashboard-notice rounded-tr-[18px] border border-primary/25 bg-primary/[0.065] px-4 py-3.5 text-sm leading-6 text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className={`${eyebrow ? "mt-1.5" : ""} undara-ui-title font-[family-name:var(--font-undara-heading)] text-xl font-normal leading-tight text-primary sm:text-2xl`}>
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardStatusBadge({
  children,
  active = false,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={classes(
        "inline-flex min-h-8 items-center rounded-full border px-3 py-1 font-[family-name:var(--font-undara-mono)] text-[11px] uppercase tracking-[0.08em]",
        active
          ? "border-primary/15 bg-primary/[0.08] text-primary"
          : "border-border/70 bg-background text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes(
        "undara-dashboard-empty-state flex min-h-40 flex-col items-start justify-center rounded-tr-[22px] border border-dashed border-primary/25 bg-primary/[0.035] px-5 py-7",
        className,
      )}
    >
      {Icon && (
        <span className="mb-3 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
      )}
      <p className="undara-ui-title text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Secondary controls below the single canonical Dashboard title in the sticky header. */
export function DashboardPageHeader({ eyebrow, description, actions, children }: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-primary/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-[0.1em] text-primary">{eyebrow}</p>}
        {description && <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        {children && <div>{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** One large frame per section; its contents are rows, never nested cards. */
export function DashboardPanel({ children, className, ...header }: Parameters<typeof DashboardSectionHeader>[0] & {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <DashboardSurface className={classes("undara-dashboard-panel min-w-0 overflow-hidden", className)}>
      <div className="border-b border-primary/20 px-5 py-5 sm:px-6">
        <DashboardSectionHeader {...header} />
      </div>
      {children && <div className="min-w-0 space-y-4 p-5 sm:p-6">{children}</div>}
    </DashboardSurface>
  );
}
