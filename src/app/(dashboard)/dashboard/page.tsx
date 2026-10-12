"use client";

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ListTodo,
  PartyPopper,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  SectionHeader,
  StatCard,
} from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/skeleton";
import { useProjects, useTasks } from "@/lib/queries";
import { useAuth } from "@/providers/auth-provider";
import type { Project, Task, User } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } =
    useTasks("pageSize=100");

  const loading = loadingProjects || loadingTasks;

  if (loading || !user) {
    return (
      <div>
        <Skeleton className="mb-8 h-8 w-[300px]" />
        <div className="mb-8 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  if (user.role === "PM")
    return (
      <PMDashboard projects={projects} tasks={tasks} userName={user.name} />
    );
  return <InternalDashboard projects={projects} tasks={tasks} user={user} />;
}

/* ============================================
   PM DASHBOARD — Monitor projects & teams
   ============================================ */
function PMDashboard({
  projects,
  tasks,
  userName,
}: {
  projects: Project[];
  tasks: Task[];
  userName: string;
}) {
  const totalTasks = tasks.length;
  const ipTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = tasks.filter(
    (t) => t.effectiveStatus === "BLOCKED",
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const unassignedTasks = tasks.filter(
    (t) => !t.assigneeId && t.status !== "DONE",
  );
  const blockedList = tasks.filter((t) => t.effectiveStatus === "BLOCKED");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Command Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {userName.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-xl">
              Here is your overview across {projects.length} active project
              streams and engineering workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary-2 active:scale-95"
            >
              <span>Manage Projects</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* High-Density Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          tone="primary"
          subtext={`${projects.length} in active delivery`}
          trend="100% Active"
        />
        <StatCard
          label="Tasks Pipeline"
          value={totalTasks}
          icon={ClipboardList}
          tone="info"
          subtext={`${doneTasks} done · ${ipTasks} in progress`}
        />
        <StatCard
          label="Delivery Rate"
          value={`${completionRate}%`}
          icon={Target}
          tone="success"
          subtext={`${doneTasks} of ${totalTasks} completed`}
          trend={completionRate >= 50 ? "Optimal" : "Pacing"}
        />
        <StatCard
          label="Active Velocity"
          value={ipTasks}
          icon={Zap}
          tone="warning"
          subtext={
            blockedTasks > 0
              ? `${blockedTasks} blockers flagged`
              : "Zero blockers detected"
          }
        />
      </div>

      {/* Asymmetric Content Composition */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left Column — Project Delivery Progress */}
        <div className="space-y-4">
          <Card className="p-6">
            <SectionHeader
              title="Project Streams"
              icon={FolderKanban}
              badge={
                <span className="rounded-md border border-border/40 bg-surface-3/80 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {projects.length} Total
                </span>
              }
              action={
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All Projects <ArrowRight className="size-3" />
                </Link>
              }
            />

            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No active projects"
                description="Create a project to start tracking deliverables, sprints, and team velocity."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {projects.map((project) => {
                  const projTasks = tasks.filter(
                    (t) => t.projectId === project.id,
                  );
                  const projDone = projTasks.filter(
                    (t) => t.status === "DONE",
                  ).length;
                  const projIP = projTasks.filter(
                    (t) => t.status === "IN_PROGRESS",
                  ).length;
                  const projTodo = projTasks.filter(
                    (t) => t.status === "TODO",
                  ).length;
                  const projBlocked = projTasks.filter(
                    (t) => t.effectiveStatus === "BLOCKED",
                  ).length;
                  const progressVal = project.progress ?? 0;

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group relative block rounded-xl border border-border/50 bg-surface-1/60 p-5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-2/80 hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
                            {project.name}
                          </span>
                          {project.client && (
                            <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400">
                              {project.client.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold font-mono text-primary">
                            {progressVal}%
                          </span>
                        </div>
                      </div>

                      {/* Multi-segment progress visual */}
                      <div className="mb-3.5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3 flex">
                          {projTasks.length > 0 ? (
                            <>
                              <div
                                style={{
                                  width: `${(projDone / projTasks.length) * 100}%`,
                                }}
                                className="bg-primary transition-all duration-300"
                                title={`Done: ${projDone}`}
                              />
                              <div
                                style={{
                                  width: `${(projIP / projTasks.length) * 100}%`,
                                }}
                                className="bg-amber-400 transition-all duration-300"
                                title={`In Progress: ${projIP}`}
                              />
                              <div
                                style={{
                                  width: `${(projTodo / projTasks.length) * 100}%`,
                                }}
                                className="bg-slate-600/50 transition-all duration-300"
                                title={`To Do: ${projTodo}`}
                              />
                            </>
                          ) : (
                            <div
                              style={{ width: `${progressVal}%` }}
                              className="bg-primary"
                            />
                          )}
                        </div>
                      </div>

                      {/* Micro-metrics details */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 font-mono text-emerald-400/90">
                            <CheckCircle2 className="size-3 text-primary" />
                            <span>{projDone} done</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-amber-400/90">
                            <Zap className="size-3 text-amber-400" />
                            <span>{projIP} in progress</span>
                          </span>
                          {projBlocked > 0 && (
                            <span className="inline-flex items-center gap-1.5 font-mono text-destructive">
                              <Ban className="size-3 text-destructive" />
                              <span>{projBlocked} blocked</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
                            <ListTodo className="size-3" />
                            <span>{projTasks.length} tasks</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary/80 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                          Open Board →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column — Operational Health & Attention Hub */}
        <div className="space-y-4">
          {/* Blocked Sentinel Widget */}
          <Card className="p-5">
            <SectionHeader
              title="Blocker Sentinel"
              icon={Ban}
              badge={
                blockedList.length > 0 ? (
                  <span className="rounded-full bg-destructive/15 border border-destructive/25 px-2 py-0.5 text-[10px] font-mono font-bold text-destructive">
                    {blockedList.length} ACTION REQ
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                    CLEARED
                  </span>
                )
              }
            />

            {blockedList.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/25">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">
                    Zero Blockers Detected
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    All tasks are moving through pipeline without critical path
                    dependency locks.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedList.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-[13px] transition-all hover:border-destructive/50 hover:bg-destructive/15"
                  >
                    <div className="font-semibold text-foreground truncate">
                      {task.title}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{task.project?.name}</span>
                      <span className="text-destructive font-bold">LOCKED</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Allocation Health */}
          <Card className="p-5">
            <SectionHeader
              title="Team Allocation"
              icon={AlertTriangle}
              badge={
                unassignedTasks.length > 0 ? (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                    {unassignedTasks.length} Unassigned
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                    100% ASSIGNED
                  </span>
                )
              }
            />

            {unassignedTasks.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface-1/60 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-primary border border-border/60">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">
                    Workload Balanced
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    All non-completed tasks are assigned to engineers or
                    designers.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedTasks.slice(0, 4).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[13px] transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
                  >
                    <div className="font-semibold text-foreground truncate">
                      {task.title}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{task.project?.name}</span>
                      <span className="text-amber-400 font-bold">
                        Needs Assignee
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   INTERNAL DASHBOARD — My work focus
   ============================================ */
function InternalDashboard({
  projects,
  tasks,
  user: currentUser,
}: {
  projects: Project[];
  tasks: Task[];
  user: User;
}) {
  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const todo = myTasks.filter((t) => t.effectiveStatus === "TODO");
  const inProgress = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const done = myTasks.filter((t) => t.status === "DONE");
  const blocked = myTasks.filter((t) => t.effectiveStatus === "BLOCKED");
  const activeTasks = [...todo, ...inProgress, ...blocked];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Internal Member Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Hello, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              You have {activeTasks.length} active tasks across your assigned
              projects in {currentUser.department?.name ?? "Engineering"}.
            </p>
          </div>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary-2 active:scale-95"
          >
            <span>My Tasks Board</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Member Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Assigned Tasks"
          value={myTasks.length}
          icon={ClipboardList}
          tone="primary"
          subtext="Total workload assigned"
        />
        <StatCard
          label="To Do"
          value={todo.length}
          icon={ListTodo}
          tone="info"
          subtext="Ready to pick up"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          icon={Zap}
          tone="warning"
          subtext="Currently executing"
        />
        <StatCard
          label="Completed"
          value={done.length}
          icon={CheckCircle2}
          tone="success"
          subtext="Shipped deliverables"
        />
      </div>

      {/* Main Content — 2 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Active Tasks — Prioritized */}
        <Card className="p-6">
          <SectionHeader
            title="Focus Deliverables"
            icon={Zap}
            badge={
              <span className="rounded-md border border-border/40 bg-surface-3/80 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {activeTasks.length} Pending
              </span>
            }
            action={
              <Link
                href="/tasks"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View Full Board <ArrowRight className="size-3" />
              </Link>
            }
          />
          {activeTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up!"
              description="No tasks are currently waiting for your action. Check back later or review your projects."
            />
          ) : (
            <div className="space-y-2.5">
              {activeTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-surface-1/60 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-2/80"
                >
                  <div className="space-y-1">
                    <div className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <FolderKanban className="size-3 text-primary/70" />
                      <span>{task.project?.name}</span>
                    </div>
                  </div>
                  <StatusBadge status={task.effectiveStatus ?? task.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* My Projects */}
        <Card className="p-5">
          <SectionHeader
            title="Active Projects"
            icon={FolderKanban}
            action={
              <Link
                href="/projects"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All →
              </Link>
            }
          />
          <div className="space-y-2.5">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex items-center justify-between rounded-xl border border-border/40 bg-surface-1/60 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-surface-2/80"
              >
                <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {project.name}
                </span>
                <span className="text-sm font-extrabold font-mono text-primary">
                  {project.progress}%
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
