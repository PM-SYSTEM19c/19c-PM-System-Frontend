"use client";

import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Inbox,
  Info,
  ListTodo,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientProjects, useClientProjectTasks } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading: loading } = useClientProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { data: tasks = [], isLoading: loadingTasks } = useClientProjectTasks(
    selectedProject || "",
  );

  // Auto-select first project when loaded
  useEffect(() => {
    const first = projects[0];
    if (first && !selectedProject) {
      setSelectedProject(first.id);
    }
  }, [projects, selectedProject]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-3xl" />
        <Skeleton className="h-[300px] rounded-3xl" />
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProject);
  const completedTasksCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || "Client"} 👋`}
        description="Real-time visibility portal into active production milestones and delivery velocity."
        badge="CLIENT VISIBILITY PORTAL"
      />

      {projects.length === 0 ? (
        <Card className="rounded-3xl border border-border/80 bg-surface-1/70 p-16 text-center backdrop-blur-md">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-subtle">
            <Inbox className="size-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            No Projects Assigned
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            You do not have any active client project portals provisioned yet.
          </p>
        </Card>
      ) : (
        <>
          {/* Executive Client Portal Telemetry */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Assigned Portals"
              value={projects.length}
              trend={`${projects.length} active engagements`}
              icon={FolderKanban}
              subtext="Real-time synchronized"
            />
            <StatCard
              label="Current Project Velocity"
              value={`${activeProject?.progress ?? 0}%`}
              trend={activeProject?.name || "Portfolio"}
              icon={Zap}
              subtext="Calculated from tasks"
            />
            <StatCard
              label="Synced Deliverables"
              value={tasks.length}
              trend={`${completedTasksCount} complete`}
              icon={ListTodo}
              subtext="Visible deliverables"
            />
            <StatCard
              label="Completed Milestones"
              value={completedTasksCount}
              trend={`${tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}% milestone rate`}
              icon={ShieldCheck}
              subtext="Verified by team"
            />
          </div>

          {/* Project Selector Ribbon (when multiple projects) */}
          {projects.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-surface-1/70 p-3 backdrop-blur-md">
              <span className="mr-2 text-xs font-mono font-bold text-subtle uppercase">
                Switch Project:
              </span>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProject(p.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    selectedProject === p.id
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-surface-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <FolderKanban className="size-3.5" />
                  <span>{p.name}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    {p.progress}%
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Project Command Deck */}
          {activeProject && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-xs">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      LIVE CLIENT VISIBILITY
                    </span>
                    <span className="text-[10px] font-mono text-subtle">
                      ID: #{activeProject.id.slice(0, 8)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
                    {activeProject.name}
                  </h2>
                  {activeProject.description && (
                    <p className="text-xs lg:text-sm leading-relaxed text-muted-foreground">
                      {activeProject.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-start rounded-2xl border border-border/70 bg-surface-1/90 p-5 shadow-inner backdrop-blur-md md:items-end">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    Milestone Progress
                  </span>
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-primary">
                    {activeProject.progress}%
                  </div>
                  <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-surface-3">
                    <div
                      style={{ width: `${activeProject.progress || 0}%` }}
                      className="h-full bg-primary transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visible Deliverables */}
          <Card className="overflow-hidden rounded-3xl border border-border/80 bg-surface-1/80 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Visible Deliverables
                </h3>
                <p className="text-xs text-muted-foreground">
                  Curated work items synchronized by the development team for
                  stakeholder transparency.
                </p>
              </div>
              <span className="rounded-full border border-border/60 bg-surface-2/60 px-3 py-1 text-xs font-mono font-bold text-muted-foreground">
                {tasks.length} items
              </span>
            </div>

            {loadingTasks ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-12 text-center">
                <ListTodo className="mx-auto mb-2 size-8 text-subtle opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">
                  No deliverables are currently flagged for client visibility in
                  this project.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4.5 transition-all duration-150 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {task.status === "DONE" ? (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                            <CheckCircle2 className="size-3.5" />
                          </div>
                        ) : (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning">
                            <Clock className="size-3.5" />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-subtle pl-7">
                        <span>
                          Updated{" "}
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      status={task.status}
                      className="self-start sm:self-auto px-3.5 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info notice */}
          <div className="flex items-start gap-3 rounded-2xl border border-info/30 bg-info/10 p-4 text-xs leading-relaxed text-info backdrop-blur-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <div>
              <strong className="block font-semibold">
                Stakeholder Privacy & Governance
              </strong>
              <span>
                You are viewing client-scoped deliverables. Internal technical
                tasks and private discussion threads remain restricted to
                project developers. Contact your designated Project Manager for
                custom roadmap inquiries.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
