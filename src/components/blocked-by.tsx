import { Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlockingTask } from "@/types";

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-info",
  IN_PROGRESS: "bg-warning",
  DONE: "bg-success",
};

/**
 * Shows which prerequisite tasks are still blocking a task.
 * Data comes from the API (`blockedBy`), so the board explains *why* a card is locked.
 */
export function BlockedBy({
  tasks,
  compact = false,
  className,
}: {
  tasks?: BlockingTask[];
  compact?: boolean;
  className?: string;
}) {
  if (!tasks?.length) return null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive",
          className,
        )}
        title={tasks.map((t) => `${t.title} (${t.status})`).join("\n")}
      >
        <Lock className="mt-px size-3 shrink-0" />
        <span className="min-w-0">
          Menunggu{" "}
          <span className="font-semibold">
            {tasks
              .slice(0, 2)
              .map((t) => t.title)
              .join(", ")}
          </span>
          {tasks.length > 2 && ` +${tasks.length - 2} lainnya`}
        </span>
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {tasks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tasks/${t.id}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-background/40 px-3 py-2 text-[13px] text-foreground transition-colors hover:border-destructive/50"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STATUS_DOT[t.status] ?? "bg-subtle",
                )}
              />
              <span className="truncate font-medium">{t.title}</span>
            </span>
            <span className="shrink-0 text-[11px] text-subtle">
              {t.status.replace("_", " ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
