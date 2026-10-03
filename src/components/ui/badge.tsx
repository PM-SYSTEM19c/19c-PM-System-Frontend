import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/40 bg-primary/15 text-primary",
        secondary:
          "border-border bg-background-2 text-muted-foreground font-medium",
        outline: "border-border text-foreground",
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        destructive: "border-destructive/30 bg-destructive/15 text-destructive",
        teal: "border-[#00cec9]/40 bg-[#00cec9]/15 text-[#00cec9]",
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

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

/** Task status badge (replaces legacy .status-* classes) */
function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant =
    STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "secondary";
  return (
    <Badge variant={variant} className={className}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, STATUS_LABEL };
