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
    active: "border-primary bg-primary/10 text-primary",
    count: "text-primary",
  },
  TODO: { active: "border-info bg-info/10 text-info", count: "text-info" },
  IN_PROGRESS: {
    active: "border-warning bg-warning/10 text-warning",
    count: "text-warning",
  },
  DONE: {
    active: "border-success bg-success/10 text-success",
    count: "text-success",
  },
  BLOCKED: {
    active: "border-destructive bg-destructive/10 text-destructive",
    count: "text-destructive",
  },
};

const actionBtn =
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors [&_svg]:size-3";

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
                "flex min-w-[100px] items-center gap-2 rounded-xl border px-4 py-3 transition-all",
                active
                  ? s.active
                  : "border-border bg-card text-muted-foreground hover:border-primary/50",
              )}
            >
              <span className={cn("text-[22px] font-extrabold", s.count)}>
                {item.count}
              </span>
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
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
        <Card className="p-16 text-center">
          <PartyPopper className="mx-auto mb-4 size-12 text-subtle" />
          <p className="text-[15px] font-medium text-muted-foreground">
            {filterStatus
              ? "No tasks with this status"
              : "No tasks assigned to you"}
          </p>
          <p className="mt-2 text-[13px] text-subtle">
            {filterStatus
              ? "Try a different filter"
              : "Tasks will appear here when assigned by a PM"}
          </p>
        </Card>
      ) : (
        Object.entries(projectGroups).map(([projId, group]) => (
          <div key={projId} className="mb-6">
            <Link
              href={`/projects/${projId}`}
              className="mb-3 flex items-center gap-2 py-2 hover:text-primary"
            >
              <FolderKanban className="size-4" />
              <h2 className="text-base font-bold">{group.name}</h2>
              <span className="ml-1 text-xs text-subtle">
                ({group.tasks.length})
              </span>
            </Link>
            <div className="flex flex-col gap-2">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary"
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
