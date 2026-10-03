import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  primary: { text: "text-primary", bg: "bg-primary/15" },
  info: { text: "text-info", bg: "bg-info/15" },
  success: { text: "text-success", bg: "bg-success/15" },
  warning: { text: "text-warning", bg: "bg-warning/15" },
  destructive: { text: "text-destructive", bg: "bg-destructive/15" },
} as const;

export type Tone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <Card interactive className="p-5">
      <div className="mb-3 flex items-start justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            t.bg,
          )}
        >
          <Icon className={cn("size-5", t.text)} />
        </span>
        <span className={cn("text-[28px] leading-none font-extrabold", t.text)}>
          {value}
        </span>
      </div>
      <div className="text-[13px] font-medium text-muted-foreground">
        {label}
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div>
        <h1 className="mb-1 text-[28px] font-extrabold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-10 text-center text-sm text-subtle",
        className,
      )}
    >
      {Icon && <Icon className="size-10 text-subtle/70" />}
      <div>{title}</div>
    </div>
  );
}
