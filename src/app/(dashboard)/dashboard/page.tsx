"use client";

import {
  AlertTriangle,
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
import { EmptyState, PageHeader, StatCard } from "@/components/page";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/skeleton";
import { useProjects, useTasks } from "@/lib/queries";
import { useAuth } from "@/providers/auth-provider";
import type { Project, Task, User } from "@/types";

const rowLink =
  "block rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-px hover:border-primary";

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
    <div className="animate-fade-in">
      <PageHeader
        title="Project Manager Dashboard"
        description={`Hi ${userName.split(" ")[0]}, here is your team progress overview`}
      />

      {/* Overview Stats */}
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <StatCard
          label="Projects"
          value={projects.length}
          icon={FolderKanban}
          tone="primary"
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={ClipboardList}
          tone="info"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          tone="success"
        />
        <StatCard
          label="In Progress"
          value={ipTasks}
          icon={Zap}
          tone="warning"
        />
        {blockedTasks > 0 && (
          <StatCard
            label="Blocked"
            value={blockedTasks}
            icon={Ban}
            tone="destructive"
          />
        )}
        {unassignedTasks.length > 0 && (
          <StatCard
            label="Unassigned"
            value={unassignedTasks.length}
            icon={AlertTriangle}
            tone="warning"
          />
        )}
      </div>

      {/* Projects Progress */}
      <Card className="mb-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">Project Progress</h2>
          <Link
            href="/projects"
            className="text-[13px] text-primary hover:underline"
          >
            Manage Projects →
          </Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" />
        ) : (
          <div className="flex flex-col gap-3.5">
            {projects.map((project) => {
              const projTasks = tasks.filter((t) => t.projectId === project.id);
              const projDone = projTasks.filter(
                (t) => t.status === "DONE",
              ).length;
              const projIP = projTasks.filter(
                (t) => t.status === "IN_PROGRESS",
              ).length;
              const projBlocked = projTasks.filter(
                (t) => t.effectiveStatus === "BLOCKED",
              ).length;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`${rowLink} px-5 py-4`}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[15px] font-bold">
                      {project.name}
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress ?? 0} className="mb-2.5" />
                  <div className="flex flex-wrap gap-4 text-xs text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-success" />{" "}
                      {projDone} done
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="size-3.5 text-warning" /> {projIP} in
                      progress
                    </span>
                    {projBlocked > 0 && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <Ban className="size-3.5" /> {projBlocked} blocked
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <ListTodo className="size-3.5" /> {projTasks.length} total
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Blocked Tasks */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
            <Ban className="size-4 text-destructive" /> Blocked Tasks
            {blockedList.length > 0 && (
              <span className="text-[13px] text-destructive">
                ({blockedList.length})
              </span>
            )}
          </h2>
          {blockedList.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title="No blocked tasks!"
              className="p-6"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {blockedList.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="rounded-lg border border-destructive/15 bg-destructive/5 px-3.5 py-2.5 text-[13px] transition hover:border-destructive/40"
                >
                  <div className="mb-0.5 font-semibold">{task.title}</div>
                  <div className="text-[11px] text-subtle">
                    {task.project?.name} · {task.department?.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Unassigned Tasks */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="size-4 text-warning" /> Unassigned Tasks
            {unassignedTasks.length > 0 && (
              <span className="text-[13px] text-warning">
                ({unassignedTasks.length})
              </span>
            )}
          </h2>
          {unassignedTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All tasks are assigned!"
              className="p-6"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {unassignedTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="rounded-lg border border-warning/15 bg-warning/5 px-3.5 py-2.5 text-[13px] transition hover:border-warning/40"
                >
                  <div className="mb-0.5 font-semibold">{task.title}</div>
                  <div className="text-[11px] text-subtle">
                    {task.project?.name} · {task.department?.name} ·{" "}
                    {task.status}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
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
    <div className="animate-fade-in">
      <PageHeader
        title={`Hi, ${currentUser.name.split(" ")[0]} 👋`}
        description={`${currentUser.department?.name ?? ""} Department · ${activeTasks.length} active tasks`}
      />

      {/* My Stats */}
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <StatCard
          label="My Tasks"
          value={myTasks.length}
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="To Do"
          value={todo.length}
          icon={ListTodo}
          tone="info"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          icon={Zap}
          tone="warning"
        />
        <StatCard
          label="Completed"
          value={done.length}
          icon={CheckCircle2}
          tone="success"
        />
        {blocked.length > 0 && (
          <StatCard
            label="Blocked"
            value={blocked.length}
            icon={Ban}
            tone="destructive"
          />
        )}
      </div>

      {/* Active Tasks — Prioritized */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Active Tasks</h2>
          <Link
            href="/tasks"
            className="text-[13px] text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        {activeTasks.length === 0 ? (
          <EmptyState icon={PartyPopper} title="No pending tasks. Great job!" />
        ) : (
          <div className="flex flex-col gap-2">
            {activeTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className={`${rowLink} flex items-center justify-between px-4 py-3.5`}
              >
                <div>
                  <div className="mb-0.5 text-sm font-semibold">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-subtle">
                    <FolderKanban className="size-3.5" /> {task.project?.name}
                  </div>
                </div>
                <StatusBadge status={task.effectiveStatus ?? task.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* My Projects */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">My Projects</h2>
          <Link
            href="/projects"
            className="text-[13px] text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={`${rowLink} flex items-center justify-between px-4 py-3`}
            >
              <span className="text-sm font-semibold">{project.name}</span>
              <span className="text-sm font-bold text-primary">
                {project.progress}%
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
