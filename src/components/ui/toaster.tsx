"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast.store";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={cn(
            "pointer-events-auto flex animate-fade-in items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-md transition-all",
            t.type === "success"
              ? "border-emerald-500/30 bg-card text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-card text-red-700 dark:text-red-400",
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {t.msg}
        </button>
      ))}
    </div>
  );
}
