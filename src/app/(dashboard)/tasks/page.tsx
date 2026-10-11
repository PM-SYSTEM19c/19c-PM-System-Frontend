"use client";

import {
  Building2,
  CheckCircle2,
  FolderKanban,
  Link2,
  PartyPopper,
  Play,
  Search,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BlockedBy } from "@/components/blocked-by";
import { PageHeader } from "@/components/page";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useUpdateTaskStatus } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";
import type { Task } from "@/types";

const FILTER_STYLES: Record<string, { active: string; count: string }> = {
  "": {
    active:
      "border-primary/40 bg-primary/20 text-zinc-950 dark:text-lime-300 font-bold",
    count: "text-zinc-950 dark:text-lime-300",
  },
  TODO: {
    active:
      "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-300 font-bold",
    count: "text-sky-700 dark:text-sky-400",
  },
  IN_PROGRESS: {
    active:
      "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold",
    count: "text-amber-700 dark:text-amber-400",
  },
  DONE: {
    active:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold",
    count: "text-emerald-700 dark:text-emerald-400",
  },
  BLOCKED: {
    active:
      "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300 font-bold",
    count: "text-red-700 dark:text-red-400",
  },
};

const actionBtn =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 [&_svg]:size-3 active:scale-95";

export default function YourTasksPage() {
  const { user } = useAuth();
  const { data: allTasks = [], isLoading: loading } = useTasks("pageSize=100");
  const updateStatusMutation = useUpdateTaskStatus();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function updateStatus(
    taskId: string,
    newStatus: string,
    version: number,
  ) {
    try {
      await updateStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus,
        version,
        expectedStatus: allTasks.find((t) => t.id === taskId)?.status,
      });
      toast.success("Task status updated!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to update status");
    }
  }

  // Filter: hanya task yang di-assign ke user ini
  const myTasks = allTasks.filter((t) => t.assigneeId === user?.id);

  const filteredTasks = myTasks.filter((t) => {
    if (
      filterStatus &&
      t.effectiveStatus !== filterStatus &&
      t.status !== filterStatus
    )
      return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Group by project
  const projectGroups = filteredTasks.reduce(
    (acc, task) => {
      const projName = task.project?.name || "Unknown";
      const projId = task.projectId;
      if (!acc[projId]) acc[projId] = { name: projName, tasks: [] };
      acc[projId].tasks.push(task);
      return acc;
    },
    {} as Record<string, { name: string; tasks: Task[] }>,
  );

  // Counts
  const counts = {
    total: myTasks.length,
    todo: myTasks.filter((t) => t.effectiveStatus === "TODO").length,
    inProgress: myTasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: myTasks.filter((t) => t.status === "DONE").length,
    blocked: myTasks.filter((t) => t.effectiveStatus === "BLOCKED").length,
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-8 h-8 w-[300px]" />
        <div className="mb-6 flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const filters = [
    { key: "", label: "All", count: counts.total },
    { key: "TODO", label: "To Do", count: counts.todo },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.inProgress },
    { key: "DONE", label: "Done", count: counts.done },
    ...(counts.blocked > 0
      ? [{ key: "BLOCKED", label: "Blocked", count: counts.blocked }]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Your Tasks"
        description="Tasks assigned to you"
        className="mb-6"
      />

      {/* Status Summary Cards */}
      <div className="mb-6 flex flex-wrap gap-2.5">
        {filters.map((item) => {
          const s = FILTER_STYLES[item.key] ?? FILTER_STYLES[""]!;
          const active = filterStatus === item.key;
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={cn(
                "flex min-w-[110px] items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5",
                active
                  ? s.active
                  : "border-border/80 bg-card/70 text-muted-foreground hover:border-primary/40 hover:bg-card",
              )}
            >
              <span
                className={cn(
                  "text-[24px] font-mono font-extrabold leading-none",
                  s.count,
                )}
              >
                {item.count}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <Input
          placeholder="Search your tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tasks grouped by project */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center bg-surface-1/60 border-border/50">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-surface-2 text-muted-foreground mb-4">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <p className="text-[15px] font-bold text-foreground">
            {filterStatus
              ? "No tasks with this filter"
              : "No tasks assigned to you"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {filterStatus
              ? "Try selecting a different status filter to view deliverables."
              : "Tasks assigned to you by your project manager will appear directly in this board."}
          </p>
        </Card>
      ) : (
        Object.entries(projectGroups).map(([projId, group]) => (
          <div key={projId} className="mb-6">
            <Link
              href={`/projects/${projId}`}
              className="mb-3 inline-flex items-center gap-2 py-1.5 text-foreground hover:text-primary transition-colors group"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <FolderKanban className="size-3.5" />
              </div>
              <h2 className="text-base font-bold">{group.name}</h2>
              <span className="ml-1 rounded-full bg-card px-2 py-0.5 text-xs font-mono font-semibold text-subtle border border-border">
                {group.tasks.length}
              </span>
            </Link>
            <div className="flex flex-col gap-2">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 transition-all duration-150 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs"
                >
                  <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
                    <div className="mb-1 text-sm font-semibold">
                      {task.title}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3" /> {task.department?.name}
                      </span>
                      {task.assignee && (
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="size-3" /> {task.assignee.name}{" "}
                          {task.assignee.position &&
                            `(${task.assignee.position.name})`}
                        </span>
                      )}
                      {task.dependencies?.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Link2 className="size-3" />{" "}
                          {task.dependencies.length} deps
                        </span>
                      )}
                    </div>
                    {task.effectiveStatus === "BLOCKED" && (
                      <BlockedBy
                        tasks={task.blockedBy}
                        compact
                        className="mt-2 inline-flex"
                      />
                    )}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2.5">
                    {/* Quick status actions */}
                    {task.effectiveStatus !== "BLOCKED" && (
                      <div className="flex gap-1">
                        {task.status === "TODO" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(task.id, "IN_PROGRESS", task.version)
                            }
                            className={cn(
                              actionBtn,
                              "border-warning/30 bg-warning/15 text-warning hover:bg-warning/25",
                            )}
                          >
                            <Play /> Start
                          </button>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(task.id, "DONE", task.version)
                            }
                            className={cn(
                              actionBtn,
                              "border-success/30 bg-success/15 text-success hover:bg-success/25",
                            )}
                          >
                            <CheckCircle2 /> Done
                          </button>
                        )}
                      </div>
                    )}
                    <StatusBadge status={task.effectiveStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
