import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-normal transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-primary/40 bg-primary/20 text-zinc-900 dark:text-lime-300 font-semibold",
        secondary:
          "border-border bg-secondary text-muted-foreground font-medium",
        outline: "border-border text-foreground bg-transparent",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        info: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
        destructive:
          "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
        teal: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

const STATUS_VARIANT = {
  TODO: "info",
  IN_PROGRESS: "warning",
  DONE: "success",
  BLOCKED: "destructive",
} as const;

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  DONE: "bg-emerald-500",
  BLOCKED: "bg-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

/** Task status badge (Grass style with clean pill and indicator dot) */
function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant =
    STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "secondary";
  const dotClass = STATUS_DOT[status] ?? "bg-subtle";
  return (
    <Badge variant={variant} className={cn("pl-2", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", dotClass)} />
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, STATUS_LABEL };
