import type * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-secondary", className)}
      {...props}
    />
  );
}

function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full border border-border/50 bg-secondary",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-border", className)} />;
}

export { Skeleton, Progress, Separator };
