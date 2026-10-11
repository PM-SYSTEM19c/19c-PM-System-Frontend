"use client";

import { Building2, Check, Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";

/** Searchable multi-select list of departments (used in project create form) */
export function DepartmentPicker({
  departments,
  selected,
  onToggle,
  maxHeightClass = "max-h-40",
}: {
  departments: Department[];
  selected: string[];
  onToggle: (id: string) => void;
  maxHeightClass?: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = departments.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const d = departments.find((x) => x.id === id);
            if (!d) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {d.name}
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  className="text-destructive/80 hover:text-destructive"
                  aria-label={`Remove ${d.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      <div
        className={cn(
          "overflow-y-auto rounded-[10px] border border-border bg-background",
          maxHeightClass,
        )}
      >
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-subtle">
            No departments found
          </div>
        ) : (
          filtered.map((d) => {
            const isSelected = selected.includes(d.id);
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => onToggle(d.id)}
                className={cn(
                  "flex w-full items-center justify-between border-b border-border/80 px-3.5 py-2.5 text-left transition-colors last:border-b-0",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-card text-foreground",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
                    <Building2 className="size-3.5 text-primary" />
                  </span>
                  <span className="text-[13px] font-semibold">{d.name}</span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-2 border-border",
                  )}
                >
                  {isSelected && <Check className="size-3.5 stroke-[3]" />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
