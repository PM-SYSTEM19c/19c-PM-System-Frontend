"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "mb-1.5 block text-[13px] font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

/** Small helper for form field validation messages */
function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p className={cn("mt-1 text-xs text-destructive", className)}>{message}</p>
  );
}

export { Label, FieldError };
