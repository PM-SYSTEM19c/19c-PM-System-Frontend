"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Columns3,
  List,
  ListTodo,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BlockedBy } from "@/components/blocked-by";
import { EmptyState } from "@/components/page";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Progress, Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import {
  queryKeys,
  useCreateTask,
  useDeleteProject,
  useDepartments,
  useProject,
  useProjectAuditLogs,
  useTasks,
  useUpdateProject,
  useUpdateTaskStatus,
  useUsers,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";
import type { Task, User } from "@/types";

const KANBAN_COLUMNS = [
  {
    key: "BLOCKED",
    label: "Blocked",
    icon: Ban,
    text: "text-destructive",
    border: "border-b-destructive",
    chip: "border border-destructive/30 bg-destructive/15 text-destructive",
  },
  {
    key: "TODO",
    label: "To Do",
    icon: ListTodo,
    text: "text-info",
    border: "border-b-info",
    chip: "border border-info/30 bg-info/15 text-info",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    icon: Zap,
    text: "text-warning",
    border: "border-b-warning",
    chip: "border border-warning/30 bg-warning/15 text-warning",
  },
  {
    key: "DONE",
    label: "Done",
    icon: CheckCircle2,
    text: "text-primary",
    border: "border-b-primary",
    chip: "border border-primary/30 bg-primary/15 text-primary",
  },
] as const;

const quickBtn =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150 [&_svg]:size-3 active:scale-95";

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientId: z.string().optional(),
});
type EditProjectFormData = z.infer<typeof editProjectSchema>;

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  assigneeId: z.string().optional(),
  clientVisible: z.boolean(),
});
type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const projectId = id as string;

  const { data: project, isLoading: loading } = useProject(projectId);
  const { data: tasks = [] } = useTasks(
    `filter[projectId]=${projectId}&pageSize=100`,
  );
  const { data: auditLogs = [] } = useProjectAuditLogs(projectId);
  const { data: allDepartments = [] } = useDepartments();
  const { data: allUsersRaw = [] } = useUsers("pageSize=100");

  const createTaskMutation = useCreateTask();
  const updateProjectMutation = useUpdateProject(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteProjectMutation = useDeleteProject();

  async function handleDeleteProject() {
    if (
      !confirm(
        `Delete project "${project?.name}"? It will be hidden from all users (soft delete — data is kept).`,
      )
    )
      return;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to delete project");
    }
  }

  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [addingDepartment, setAddingDepartment] = useState<string | null>(null);
  const [removingDepartment, setRemovingDepartment] = useState<string | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskView, setTaskView] = useState<"kanban" | "list">("kanban");

  const allClients = allUsersRaw.filter((u) => u.role === "CLIENT");

  const editForm = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
  });

  const taskForm = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { clientVisible: true },
  });

  const watchedDeptId = taskForm.watch("departmentId");

  async function addDepartment(departmentId: string) {
    setAddingDepartment(departmentId);
    try {
      await api.addProjectDepartment(projectId, departmentId);
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      toast.success("Department added!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to add department");
    } finally {
      setAddingDepartment(null);
    }
  }

  async function removeDepartment(departmentId: string) {
    setRemovingDepartment(departmentId);
    try {
      await api.removeProjectDepartment(projectId, departmentId);
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      toast.success("Department removed");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to remove department");
    } finally {
      setRemovingDepartment(null);
    }
  }

  function startEditing() {
    if (!project) return;
    editForm.reset({
      name: project.name,
      description: project.description || "",
      clientId: project.clientId || "",
    });
    setEditing(true);
  }

  async function onSaveEdit(data: EditProjectFormData) {
    try {
      await updateProjectMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        clientId: data.clientId || null,
      });
      setEditing(false);
      toast.success("Project updated!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to update");
    }
  }

  function openCreateTaskModal() {
    taskForm.reset({
      title: "",
      description: "",
      departmentId: "",
      assigneeId: "",
      clientVisible: true,
    });
    setShowCreateTask(true);
  }

  async function onCreateTask(data: CreateTaskFormData) {
    try {
      await createTaskMutation.mutateAsync({
        projectId,
        title: data.title,
        description: data.description || null,
        departmentId: data.departmentId || undefined,
        assigneeId: data.assigneeId || undefined,
        clientVisible: data.clientVisible,
      });
      setShowCreateTask(false);
      toast.success("Task created!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to create task");
    }
  }

  // Get members for assignee dropdown — only INTERNAL members matching the selected department
  const assignableMembersForTask: User[] =
    project?.departments
      ?.flatMap((d) => d.department.users || [])
      .filter(
        (u) =>
          u.role === "INTERNAL" &&
          (!watchedDeptId || u.departmentId === watchedDeptId),
      ) || [];

  async function updateTaskStatus(
    taskId: string,
    newStatus: string,
    version: number,
  ) {
    try {
      await updateTaskStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus,
        version,
        expectedStatus: tasks.find((t) => t.id === taskId)?.status,
      });
      toast.success("Task status updated!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to update status");
    }
  }

  function canChangeTaskStatus(task: Task) {
    return (
      user?.role === "PM" ||
      (user?.role === "INTERNAL" &&
        user?.departmentId === task.departmentId &&
        task.assigneeId === user?.id)
    );
  }

  // Group tasks for Kanban columns
  const grouped: Record<string, Task[]> = {
    BLOCKED: tasks.filter((t) => t.effectiveStatus === "BLOCKED"),
    TODO: tasks.filter((t) => t.effectiveStatus === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  if (loading || !project) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const assignedDeptIds = new Set(
    project.departments?.map((d) => d.department.id) || [],
  );
  const availableDepartments = allDepartments.filter(
    (d) => !assignedDeptIds.has(d.id),
  );

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.effectiveStatus === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
    blocked: tasks.filter((t) => t.effectiveStatus === "BLOCKED").length,
  };

  const creatingTask =
    taskForm.formState.isSubmitting || createTaskMutation.isPending;
  const savingEdit =
    editForm.formState.isSubmitting || updateProjectMutation.isPending;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Project Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left Column: Project Identity & Scope */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Back button & Active badge */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-2/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to Projects
              </button>
            </div>

            {editing ? (
              <form
                onSubmit={editForm.handleSubmit(onSaveEdit)}
                className="max-w-2xl space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4"
              >
                <div>
                  <Label htmlFor="proj-name">Project Name *</Label>
                  <Input
                    id="proj-name"
                    {...editForm.register("name")}
                    className="h-11 text-xl font-extrabold"
                  />
                  <FieldError
                    message={editForm.formState.errors.name?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="proj-desc">Description</Label>
                  <Textarea
                    id="proj-desc"
                    {...editForm.register("description")}
                    placeholder="Project description..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="proj-client">Client</Label>
                  <NativeSelect
                    id="proj-client"
                    {...editForm.register("clientId")}
                  >
                    <option value="">No Client (Internal Project)</option>
                    {allClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
                    {project.name}
                  </h1>
                  {project.client ? (
                    <Badge variant="teal" className="text-xs">
                      Client: {project.client.name}{" "}
                      {project.client.email && `(${project.client.email})`}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground font-mono"
                    >
                      Internal Project
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground lg:text-sm">
                    {project.description}
                  </p>
                )}
              </div>
            )}

            {/* Assigned Departments Cluster */}
            <div className="border-t border-border/50 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Building2 className="size-3.5 text-primary" />
                  <span>Departments ({project.departments?.length || 0}):</span>
                </div>
                {project.departments?.map((d) => (
                  <div
                    key={d.department.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface-2/60 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:border-border"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {d.department.name.substring(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold text-foreground">
                      {d.department.name}
                    </span>
                    <span className="text-[10px] font-mono text-subtle">
                      ({d.department.users?.length || 0})
                    </span>
                    {user?.role === "PM" && (
                      <button
                        type="button"
                        onClick={() => removeDepartment(d.department.id)}
                        disabled={removingDepartment === d.department.id}
                        className="ml-0.5 rounded p-0.5 text-subtle transition-colors hover:bg-destructive/20 hover:text-destructive"
                        title="Remove department"
                      >
                        {removingDepartment === d.department.id ? (
                          "..."
                        ) : (
                          <X className="size-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
                {user?.role === "PM" && (
                  <button
                    type="button"
                    onClick={() => setShowAddDepartment(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
                  >
                    <Plus className="size-3" /> Add Department
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Telemetry & Action Deck */}
          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-border/70 bg-surface-1/90 p-5 shadow-inner backdrop-blur-md lg:w-80">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  Delivery Velocity
                </div>
                <div className="font-mono text-3xl font-extrabold tracking-tight text-primary">
                  {project.progress}%
                </div>
              </div>
              {user?.role === "PM" && !editing && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startEditing}
                    className="h-8 gap-1 px-2.5 text-xs font-semibold"
                  >
                    <Pencil className="size-3" /> Edit
                  </Button>
                  <Button
                    id="delete-project-btn"
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteProject}
                    disabled={deleteProjectMutation.isPending}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Segmented Progress Visual */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                style={{ width: `${project.progress || 0}%` }}
                className="h-full bg-primary transition-all duration-300"
              />
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-info/20 bg-info/5 px-2.5 py-1.5 text-info">
                <span className="flex items-center gap-1.5 text-[11px] font-bold">
                  <ListTodo className="size-3.5" /> TODO
                </span>
                <span className="font-mono font-extrabold">{stats.todo}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/5 px-2.5 py-1.5 text-warning">
                <span className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Zap className="size-3.5" /> Active
                </span>
                <span className="font-mono font-extrabold">
                  {stats.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 px-2.5 py-1.5 text-success">
                <span className="flex items-center gap-1.5 text-[11px] font-bold">
                  <CheckCircle2 className="size-3.5" /> Done
                </span>
                <span className="font-mono font-extrabold">{stats.done}</span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl border px-2.5 py-1.5",
                  stats.blocked > 0
                    ? "border-destructive/30 bg-destructive/10 text-destructive font-bold"
                    : "border-border/50 bg-surface-2/30 text-subtle font-medium",
                )}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-bold">
                  <Ban className="size-3.5" /> Blocked
                </span>
                <span className="font-mono font-extrabold">
                  {stats.blocked}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Department Dialog */}
      <Dialog open={showAddDepartment} onOpenChange={setShowAddDepartment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Assign another department to this project.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="p-0">
            {availableDepartments.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-subtle">
                All departments are already assigned
              </div>
            ) : (
              availableDepartments.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between border-b border-border px-6 py-3 transition-colors last:border-b-0 hover:bg-card"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#00cec9]/20">
                      <Building2 className="size-4 text-[#00cec9]" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold">{d.name}</div>
                      <div className="text-[11px] text-subtle">{d.code}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addDepartment(d.id)}
                    disabled={addingDepartment === d.id}
                  >
                    {addingDepartment === d.id ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus /> Add
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAddDepartment(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog — fixed & centered; only the body scrolls, page scroll is locked */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-2xl">
          <form
            onSubmit={taskForm.handleSubmit(onCreateTask)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Add a new task to{" "}
                <span className="font-semibold text-foreground">
                  {project.name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5">
              <div>
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  placeholder="e.g. Implement Login Page"
                  aria-invalid={!!taskForm.formState.errors.title}
                  {...taskForm.register("title")}
                />
                <FieldError
                  message={taskForm.formState.errors.title?.message}
                />
              </div>

              <div>
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="What needs to be done? Add acceptance criteria, links, etc."
                  rows={4}
                  {...taskForm.register("description")}
                />
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 text-xs font-semibold tracking-wider text-subtle uppercase">
                  Assignment
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="task-department">Department *</Label>
                    <NativeSelect
                      id="task-department"
                      {...taskForm.register("departmentId", {
                        onChange: (e) => {
                          const matchingDept = project.departments?.find(
                            (d) => d.department.id === e.target.value,
                          );
                          const matchingUser =
                            matchingDept?.department.users?.find(
                              (u) => u.role === "INTERNAL",
                            );
                          taskForm.setValue(
                            "assigneeId",
                            matchingUser ? matchingUser.id : "",
                          );
                        },
                      })}
                    >
                      <option value="">Select department...</option>
                      {project.departments?.map((d) => (
                        <option key={d.department.id} value={d.department.id}>
                          {d.department.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div>
                    <Label htmlFor="task-assignee">Assignee *</Label>
                    <NativeSelect
                      id="task-assignee"
                      {...taskForm.register("assigneeId")}
                    >
                      <option value="">Select assignee...</option>
                      {assignableMembersForTask.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (
                          {u.position?.name || u.department?.name || "No role"})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background/60 p-4">
                <div>
                  <Label
                    htmlFor="task-client-visible"
                    className="mb-0.5 text-foreground"
                  >
                    Visible to Client
                  </Label>
                  <p className="text-[11px] text-subtle">
                    If enabled, the client can see this task&apos;s title and
                    status (no internal details).
                  </p>
                </div>
                <Controller
                  control={taskForm.control}
                  name="clientVisible"
                  render={({ field }) => (
                    <Switch
                      id="task-client-visible"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateTask(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingTask}>
                {creatingTask ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tasks — Kanban + List Toggle */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold">Tasks ({tasks.length})</h3>
          <div className="flex items-center gap-2">
            {user?.role === "PM" && (
              <Button size="sm" onClick={openCreateTaskModal}>
                <Plus /> Create Task
              </Button>
            )}
            <div className="flex rounded-full border border-border/80 bg-background-2/80 p-0.5">
              <button
                type="button"
                onClick={() => setTaskView("kanban")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                  taskView === "kanban"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns3 className="size-3.5" /> Kanban
              </button>
              <button
                type="button"
                onClick={() => setTaskView("list")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                  taskView === "list"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="size-3.5" /> List
              </button>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={
              <>
                No tasks yet.{" "}
                {user?.role === "PM" && "Click '+ Create Task' to get started."}
              </>
            }
          />
        ) : taskView === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = grouped[col.key] || [];
              const Icon = col.icon;
              return (
                <div
                  key={col.key}
                  className="min-h-[420px] min-w-[260px] flex-1 rounded-2xl border border-border bg-card/60 backdrop-blur-xs"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between border-b px-4 py-3.5",
                      col.border,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("size-4", col.text)} />
                      <span className="text-[13px] font-bold text-foreground">
                        {col.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-mono font-bold",
                        col.chip,
                      )}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="py-2">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="mx-3 my-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs"
                      >
                        <Link
                          href={`/tasks/${task.id}`}
                          className="mb-1.5 block text-[13px] font-semibold hover:text-primary"
                        >
                          {task.title}
                        </Link>
                        <div className="mb-2 flex flex-wrap gap-1">
                          <span className="rounded border border-border bg-background-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {task.department?.name}
                          </span>
                        </div>
                        {task.assignee && (
                          <div className="mb-2 flex items-center gap-1 text-[11px] text-subtle">
                            <UserIcon className="size-3" /> {task.assignee.name}{" "}
                            {task.assignee.position &&
                              `(${task.assignee.position.name})`}
                          </div>
                        )}
                        {task.effectiveStatus === "BLOCKED" && (
                          <BlockedBy tasks={task.blockedBy} compact />
                        )}
                        {/* Quick status buttons */}
                        {canChangeTaskStatus(task) &&
                          task.effectiveStatus !== "BLOCKED" && (
                            <div className="flex flex-wrap gap-1">
                              {task.status === "TODO" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTaskStatus(
                                      task.id,
                                      "IN_PROGRESS",
                                      task.version,
                                    )
                                  }
                                  className={cn(
                                    quickBtn,
                                    "border-warning/30 bg-warning/15 text-warning hover:bg-warning/25",
                                  )}
                                >
                                  <Play /> Start
                                </button>
                              )}
                              {task.status === "IN_PROGRESS" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTaskStatus(
                                        task.id,
                                        "DONE",
                                        task.version,
                                      )
                                    }
                                    disabled={task.assigneeId !== user?.id}
                                    title={
                                      task.assigneeId !== user?.id
                                        ? "Only the assigned executor can complete this task"
                                        : ""
                                    }
                                    className={cn(
                                      quickBtn,
                                      "border-success/30 bg-success/15 text-success enabled:hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-40",
                                    )}
                                  >
                                    <CheckCircle2 /> Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTaskStatus(
                                        task.id,
                                        "TODO",
                                        task.version,
                                      )
                                    }
                                    className={cn(
                                      quickBtn,
                                      "border-info/30 bg-info/15 text-info hover:bg-info/25",
                                    )}
                                  >
                                    <Undo2 /> Revert
                                  </button>
                                </>
                              )}
                              {task.status === "DONE" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTaskStatus(
                                      task.id,
                                      "IN_PROGRESS",
                                      task.version,
                                    )
                                  }
                                  className={cn(
                                    quickBtn,
                                    "border-warning/30 bg-warning/15 text-warning hover:bg-warning/25",
                                  )}
                                >
                                  <RotateCcw /> Reopen
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-subtle">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-[10px] border border-border bg-card px-4 py-3 transition-all hover:border-primary"
              >
                <div>
                  <div className="mb-1 text-sm font-medium">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3" /> {task.department?.name}
                    </span>
                    {task.assignee && (
                      <span className="inline-flex items-center gap-1">
                        · <UserIcon className="size-3" /> {task.assignee.name}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={task.effectiveStatus} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Project Audit Logs */}
      {auditLogs.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="mb-5 text-base font-bold">
            Project Audit Trail ({auditLogs.length})
          </h3>
          <div className="flex flex-col gap-2">
            {auditLogs.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px]"
              >
                <div className="mb-1 flex justify-between">
                  <span className="font-semibold">{log.user.name}</span>
                  <span className="text-[11px] text-subtle">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Task{" "}
                  <strong className="text-foreground">
                    {log.task?.title || "Unknown Task"}
                  </strong>
                  : Changed{" "}
                  <strong className="text-foreground">
                    {log.changedColumn}
                  </strong>
                  {log.oldValue && (
                    <>
                      {" "}
                      from{" "}
                      <code className="rounded bg-destructive/15 px-1.5 py-px">
                        {log.oldValue}
                      </code>
                    </>
                  )}
                  {log.newValue && (
                    <>
                      {" "}
                      to{" "}
                      <code className="rounded bg-success/15 px-1.5 py-px">
                        {log.newValue}
                      </code>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
