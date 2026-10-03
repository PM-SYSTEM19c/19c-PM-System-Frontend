import type * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--card)_25%,var(--card-hover)_50%,var(--card)_75%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-card", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-border", className)} />;
}

export { Skeleton, Progress, Separator };
