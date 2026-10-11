"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type Theme, useTheme } from "@/providers/theme-provider";

/**
 * Grass.io inspired 3-way theme selector (Light, Dark, System)
 */
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-8 w-[104px] rounded-full border border-border bg-surface-2",
          className,
        )}
      />
    );
  }

  const options: { key: Theme; label: string; icon: typeof Sun }[] = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Laptop },
  ];

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-border bg-surface-2 p-0.5 transition-colors",
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.key;
        return (
          <button
            key={opt.key}
            id={`theme-btn-${opt.key}`}
            type="button"
            onClick={() => setTheme(opt.key)}
            title={`Switch to ${opt.label} mode`}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs transition-all duration-150",
              isActive
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
