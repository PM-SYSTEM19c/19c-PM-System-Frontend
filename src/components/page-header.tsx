import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  primary: {
    text: "text-foreground",
    accent: "text-lime-600 dark:text-lime-400",
    bg: "bg-card",
    border: "border-border",
    icon: "bg-primary/20 text-zinc-900 dark:text-lime-300 border-primary/30",
  },
  info: {
    text: "text-foreground",
    accent: "text-sky-600 dark:text-sky-400",
    bg: "bg-card",
    border: "border-border",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25",
  },
  success: {
    text: "text-foreground",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-card",
    border: "border-border",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  warning: {
    text: "text-foreground",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-card",
    border: "border-border",
    icon: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  },
  destructive: {
    text: "text-foreground",
    accent: "text-red-600 dark:text-red-400",
    bg: "bg-card",
    border: "border-border",
    icon: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  },
} as const;

export type Tone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  trend,
  subtext,
  badge,
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: string;
  subtext?: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs",
        className,
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </span>
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg border",
            t.icon,
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </div>

      {/* Value Row */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight leading-none text-foreground">
          {value}
        </div>
        {trend && (
          <span className="rounded-full bg-primary/20 text-zinc-900 dark:text-lime-300 font-semibold px-2 py-0.5 text-[10px] font-mono border border-primary/30">
            {trend}
          </span>
        )}
        {badge}
      </div>

      {/* Subtext Footnote */}
      {subtext && (
        <div className="mt-2.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5",
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  icon: Icon,
  badge,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 mb-4",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
            <Icon className="size-3.5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
