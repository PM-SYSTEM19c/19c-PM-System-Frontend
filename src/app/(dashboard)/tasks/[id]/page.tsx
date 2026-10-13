"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Paperclip,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BlockedBy } from "@/components/blocked-by";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { getAttachmentProxyUrl } from "@/lib/attachment-url";
import { axiosInstance } from "@/lib/axios";
import {
  queryKeys,
  useAddTaskDependency,
  useDeleteTask,
  useProject,
  useRemoveTaskDependency,
  useTask,
  useTaskAttachments,
  useTaskAuditLogs,
  useTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";
import type { EditableTaskField, User, VersionConflictDetails } from "@/types";

const editTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  assigneeId: z.string().optional(),
  clientVisible: z.boolean(),
});
type EditTaskFormData = z.infer<typeof editTaskSchema>;

const ATTACHMENT_TYPES = [
  { key: "link", label: "Link", icon: Link2 },
  { key: "image", label: "Image Upload", icon: ImageIcon },
  { key: "file", label: "File Upload", icon: FileText },
] as const;

const FIELD_LABELS: Record<EditableTaskField | "status", string> = {
  title: "Title",
  description: "Description",
  departmentId: "Department",
  assigneeId: "Assignee",
  clientVisible: "Client Visible",
  status: "Status",
};

type TaskBaseline = Record<EditableTaskField, string | boolean | null>;
interface PendingEdit {
  payload: Record<string, unknown>;
  details: VersionConflictDetails;
}

function AttachmentImagePreview({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const proxyUrl = getAttachmentProxyUrl(
      fileUrl,
      process.env.NEXT_PUBLIC_BE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000/api/v1",
      window.location.origin,
    );
    if (!proxyUrl) {
      setBlobUrl(fileUrl);
      setLoading(false);
      return;
    }

    fetch(proxyUrl, {
      credentials: "same-origin",
      redirect: "error",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load image preview");
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-subtle">
        Loading preview...
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex h-16 items-center justify-center text-xs text-subtle">
        Preview unavailable
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: Authenticated blob URLs are loaded locally and cannot be fetched by the Next image optimizer.
    <img
      src={blobUrl}
      alt={fileName}
      className="block max-h-[300px] max-w-full rounded-lg object-contain"
    />
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const taskId = id as string;

  const { data: task, isLoading: loading } = useTask(taskId);
  const { data: auditLogs = [] } = useTaskAuditLogs(taskId);
  const { data: attachments = [] } = useTaskAttachments(taskId);

  // Load project tasks for dependency selection (only when needed)
  const { data: projectTasks = [] } = useTasks(
    task ? `filter[projectId]=${task.projectId}&pageSize=100` : "",
  );

  const updateStatusMutation = useUpdateTaskStatus();
  const updateTaskMutation = useUpdateTask(taskId);
  const addDepMutation = useAddTaskDependency(taskId);
  const removeDepMutation = useRemoveTaskDependency(taskId);
  const deleteTaskMutation = useDeleteTask();

  async function handleDeleteTask() {
    if (
      !confirm(
        `Delete task "${task?.title}"? It will be hidden from the board (soft delete — data and history are kept).`,
      )
    )
      return;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast.success("Task deleted");
      router.push(task ? `/projects/${task.projectId}` : "/tasks");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to delete task");
    }
  }

  const [showAddDep, setShowAddDep] = useState(false);
  const [depSearch, setDepSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [attFileName, setAttFileName] = useState("");
  const [attFileUrl, setAttFileUrl] = useState("");
  const [attFile, setAttFile] = useState<File | null>(null);
  const [attType, setAttType] = useState<string>("link");
  const [addingAtt, setAddingAtt] = useState(false);
  /** Values the PM saw when they opened the editor (for safe 3-way merge) */
  const [baseline, setBaseline] = useState<TaskBaseline | null>(null);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [conflict, setConflict] = useState<PendingEdit | null>(null);

  async function handleOpenAttachment(fileUrl: string, fileName: string) {
    const proxyUrl = getAttachmentProxyUrl(
      fileUrl,
      process.env.NEXT_PUBLIC_BE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000/api/v1",
      window.location.origin,
    );
    if (!proxyUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const res = await fetch(proxyUrl, {
        credentials: "same-origin",
        redirect: "error",
      });

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("You do not have permission to access this attachment");
        } else {
          toast.error("Failed to download attachment");
        }
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const isViewable =
        blob.type.startsWith("image/") ||
        blob.type === "application/pdf" ||
        Boolean(fileName.match(/\.(png|jpe?g|gif|webp|pdf)$/i));

      if (isViewable) {
        window.open(objectUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      toast.error("Failed to load attachment");
    }
  }

  const editForm = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
  });

  const watchedEditDeptId = editForm.watch("departmentId");

  // Use project to get departments for edit
  const { data: projectData } = useProject(task?.projectId || "");
  const projectDepartments = projectData?.departments || [];

  async function updateStatus(newStatus: string) {
    if (!task) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus,
        version: task.version,
        expectedStatus: task.status,
      });
      toast.success("Status updated!");
    } catch (err: any) {
      if (err?.error?.code === "VERSION_CONFLICT") {
        toast.error(
          "Status task sudah diubah pengguna lain. Data terbaru telah dimuat — silakan cek ulang.",
        );
      } else {
        toast.error(err?.error?.message || "Failed to update");
      }
    }
  }

  async function addDependency(dependsOnTaskId: string) {
    try {
      await addDepMutation.mutateAsync(dependsOnTaskId);
      toast.success(
        "Dependency added! Task will be BLOCKED until this dependency is DONE.",
      );
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to add dependency");
    }
  }

  async function removeDependency(dependsOnTaskId: string) {
    try {
      await removeDepMutation.mutateAsync(dependsOnTaskId);
      toast.success("Dependency removed");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to remove dependency");
    }
  }

  async function addAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    setAddingAtt(true);
    try {
      let payload: any;
      if (attType === "link") {
        payload = {
          fileName: attFileName,
          fileUrl: attFileUrl,
          mimeType: "text/uri-list",
        };
      } else {
        if (!attFile) throw new Error("Please select a file to upload");
        payload = new FormData();
        payload.append("file", attFile);
        payload.append("fileName", attFileName);
      }
      await api.addTaskAttachment(taskId, payload);
      qc.invalidateQueries({ queryKey: queryKeys.taskAttachments(taskId) });
      setShowAddAttachment(false);
      setAttFileName("");
      setAttFileUrl("");
      setAttFile(null);
      setAttType("link");
      toast.success("Attachment added!");
    } catch (err: any) {
      toast.error(
        err?.error?.message || err?.message || "Failed to add attachment",
      );
    } finally {
      setAddingAtt(false);
    }
  }

  async function deleteAttachment(attId: string) {
    if (!task) return;
    try {
      await axiosInstance.delete(`/tasks/${taskId}/attachments/${attId}`);
      qc.invalidateQueries({ queryKey: queryKeys.taskAttachments(taskId) });
      toast.success("Attachment deleted");
    } catch {
      toast.error("Failed to delete attachment");
    }
  }

  function startEditing() {
    if (!task) return;
    editForm.reset({
      title: task.title,
      description: task.description || "",
      departmentId: task.departmentId,
      assigneeId: task.assigneeId || "",
      clientVisible: task.clientVisible,
    });
    setBaseline({
      title: task.title,
      description: task.description,
      departmentId: task.departmentId,
      assigneeId: task.assigneeId,
      clientVisible: task.clientVisible,
    });
    setBaseVersion(task.version);
    setEditing(true);
  }

  async function submitEdit(payload: Record<string, unknown>) {
    try {
      const res = await updateTaskMutation.mutateAsync(payload);
      setEditing(false);
      setConflict(null);
      const c = res?.data?.concurrency;
      if (c?.merged) {
        toast.success(
          `Task diubah pengguna lain saat Anda mengedit — perubahan Anda (${c.appliedFields.join(", ")}) digabung dengan aman ke versi terbaru.`,
        );
      } else {
        toast.success("Task updated!");
      }
    } catch (err: any) {
      if (err?.error?.code === "VERSION_CONFLICT") {
        setConflict({ payload, details: err.error.details });
      } else {
        toast.error(err?.error?.message || "Failed to update task");
      }
    }
  }

  async function onSaveEdit(data: EditTaskFormData) {
    if (!task) return;
    await submitEdit({
      title: data.title,
      description: data.description || null,
      departmentId: data.departmentId,
      assigneeId: data.assigneeId || null,
      clientVisible: data.clientVisible,
      // Version + baseline from when editing STARTED (not the refetched task),
      // so the server can detect and safely merge concurrent changes.
      version: baseVersion ?? task.version,
      ...(baseline ? { baseline } : {}),
    });
  }

  /** Explicit, informed overwrite: re-apply my values on top of the latest version */
  async function overwriteWithMine() {
    if (!conflict?.details.current) return;
    const cur = conflict.details.current;
    // Only re-send fields I actually changed — other users' non-conflicting
    // edits on the latest version must survive the overwrite.
    const fields = Object.keys(FIELD_LABELS).filter(
      (f) => f !== "status",
    ) as EditableTaskField[];
    const norm = (v: unknown) => (v === "" || v === undefined ? null : v);
    const mine: Record<string, unknown> = {};
    for (const f of fields) {
      const next = conflict.payload[f];
      if (next === undefined) continue;
      if (!baseline || norm(next) !== norm(baseline[f])) mine[f] = next;
    }
    await submitEdit({
      ...mine,
      version: conflict.details.currentVersion,
      baseline: {
        title: cur.title,
        description: cur.description,
        departmentId: cur.departmentId,
        assigneeId: cur.assigneeId,
        clientVisible: cur.clientVisible,
      },
    });
  }

  function discardMine() {
    setConflict(null);
    setEditing(false);
    toast.success("Menampilkan versi terbaru dari server.");
  }

  function displayValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (field === "departmentId") {
      return (
        projectDepartments.find((d) => d.department.id === value)?.department
          .name ?? String(value)
      );
    }
    if (field === "assigneeId") {
      const u = projectDepartments
        .flatMap((d) => d.department.users || [])
        .find((x) => x.id === value);
      return u?.name ?? String(value);
    }
    return String(value).replace("_", " ");
  }

  const editableMembers: User[] = projectDepartments
    .flatMap((d) => d.department.users || [])
    .filter(
      (u) =>
        u.role === "INTERNAL" &&
        (!watchedEditDeptId || u.departmentId === watchedEditDeptId),
    );

  if (loading || !task) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-[300px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const canChangeStatus =
    user?.role === "PM" ||
    (user?.role === "INTERNAL" &&
      user?.departmentId === task.departmentId &&
      task.assigneeId === user?.id);
  // Mirrors backend rule: only the assigned executor can move IN_PROGRESS → DONE (PM cannot)
  const canComplete = task.assigneeId === user?.id;
  const isBlocked = task.effectiveStatus === "BLOCKED";
  const canManageAttachments =
    user?.role === "PM" ||
    (user?.role === "INTERNAL" && user?.departmentId === task.departmentId);

  // Filter available tasks for dependency (exclude self and already-dependent)
  const existingDepIds = new Set(
    task.dependencies?.map((d) => d.dependsOnId) || [],
  );
  const availableForDep = projectTasks.filter((t) => {
    if (t.id === task.id) return false;
    if (existingDepIds.has(t.id)) return false;
    if (depSearch && !t.title.toLowerCase().includes(depSearch.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Task Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-xs">
        <div className="flex flex-col gap-4">
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-2/60 px-3 py-1 font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <span className="text-subtle">/</span>
              <Link
                href={`/projects/${task.projectId}`}
                className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground transition hover:text-primary"
              >
                <FolderKanban className="size-3.5" />
                {task.project?.name || "Project"}
              </Link>
              <span className="text-subtle">/</span>
              <span className="font-mono text-[11px] text-primary">
                Task #{task.id.slice(0, 8)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                v{task.version}
              </span>
              {task.clientVisible ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Client Visible
                </span>
              ) : (
                <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Internal Only
                </span>
              )}
            </div>
          </div>

          {/* Title & Key Badges */}
          <div>
            <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
              {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={task.effectiveStatus}
                className="px-3.5 py-1 text-xs"
              />
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                <Building2 className="size-3.5" /> {task.department?.name}
              </Badge>
              {task.assignee && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-2/50 px-3 py-1 text-xs font-medium text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{task.assignee.name}</span>
                  {task.assignee.position && (
                    <span className="text-[10px] text-subtle">
                      ({task.assignee.position.name})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Main Content (Left Column) */}
        <div className="space-y-6">
          {/* Scope & Description Card */}
          <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                Deliverable Scope & Specification
              </span>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {task.description ||
                  "No detailed specification provided for this task."}
              </p>
            </div>
          </Card>

          {/* Prerequisites & Dependencies Sentinel */}
          <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Prerequisites & Dependencies
                </h3>
                <span className="rounded-full border border-border/60 bg-surface-2/70 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                  {task.dependencies?.length || 0}
                </span>
              </div>
              {user?.role === "PM" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setDepSearch("");
                    setShowAddDep(true);
                  }}
                  className="h-8 gap-1 px-3 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Dependency
                </Button>
              )}
            </div>

            {/* Dependency Status Sentinel Callout */}
            {task.dependencyStatus && !task.dependencyStatus.allDone ? (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs leading-relaxed text-destructive">
                <Ban className="mt-0.5 size-4 shrink-0" />
                <div>
                  <strong className="block font-semibold">
                    BLOCKED BY UNRESOLVED PREREQUISITES
                  </strong>
                  <span>
                    Task ini terkunci karena{" "}
                    {task.dependencyStatus.pendingCount} dependency belum
                    selesai (DONE). Tindakan eksekusi dinonaktifkan sampai semua
                    prasyarat terpenuhi.
                  </span>
                </div>
              </div>
            ) : task.dependencies && task.dependencies.length > 0 ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-2.5 text-xs text-success">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  <strong>All prerequisites cleared.</strong> Semua dependency
                  telah diselesaikan.
                </span>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-surface-2/40 px-4 py-2.5 text-xs text-subtle">
                <Lightbulb className="size-4 text-warning shrink-0" />
                <span>
                  <strong>Independent Deliverable:</strong> Task ini tidak
                  memiliki hambatan dependency dan dapat dikerjakan secara
                  langsung.
                </span>
              </div>
            )}

            {task.dependencies && task.dependencies.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {task.dependencies.map((dep) => {
                  const removing =
                    removeDepMutation.isPending &&
                    removeDepMutation.variables === dep.dependsOnId;
                  return (
                    <div
                      key={dep.dependsOnId}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        {dep.dependsOn.status === "DONE" ? (
                          <div className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success">
                            <CheckCircle2 className="size-4" />
                          </div>
                        ) : (
                          <div className="flex size-7 items-center justify-center rounded-full bg-warning/15 text-warning">
                            <Clock className="size-4" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/tasks/${dep.dependsOnId}`}
                            className="text-sm font-semibold text-foreground transition hover:text-primary"
                          >
                            {dep.dependsOn.title}
                          </Link>
                          <div className="text-[11px] font-mono text-subtle">
                            Status: {dep.dependsOn.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={dep.dependsOn.status} />
                        {user?.role === "PM" && (
                          <button
                            type="button"
                            onClick={() => removeDependency(dep.dependsOnId)}
                            disabled={removing}
                            className="rounded p-1 text-subtle transition-colors hover:bg-destructive/20 hover:text-destructive"
                            title="Remove dependency"
                          >
                            {removing ? "..." : <X className="size-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Card>

          {/* Attachments Section */}
          <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Deliverables & Attachments
                </h3>
                <span className="rounded-full border border-border/60 bg-surface-2/70 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                  {attachments.length}
                </span>
              </div>
              {canManageAttachments && (
                <Button
                  size="sm"
                  onClick={() => setShowAddAttachment(true)}
                  disabled={isBlocked}
                  title={
                    isBlocked ? "Cannot add attachment to a BLOCKED task" : ""
                  }
                  className="h-8 gap-1 px-3 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Attachment
                </Button>
              )}
            </div>

            {attachments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-8 text-center">
                <Paperclip className="mx-auto mb-2 size-8 text-subtle opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">
                  No attachments or external assets linked yet.
                </p>
                {canManageAttachments && !isBlocked && (
                  <button
                    type="button"
                    onClick={() => setShowAddAttachment(true)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    + Add first file or URL link
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {attachments.map((att) => {
                  const isImage = att.mimeType?.startsWith("image");
                  const isLink = att.mimeType === "text/uri-list";
                  const AttIcon = isImage
                    ? ImageIcon
                    : isLink
                      ? Link2
                      : FileText;
                  return (
                    <div
                      key={att.id}
                      className="rounded-2xl border border-border/70 bg-card/80 p-4 transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <AttIcon className="size-4" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenAttachment(att.fileUrl, att.fileName)
                              }
                              className="cursor-pointer text-left text-sm font-semibold text-primary hover:underline"
                            >
                              {att.fileName}
                            </button>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-subtle">
                              <UserIcon className="size-3" /> {att.user?.name} ·{" "}
                              {new Date(att.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {(user?.role === "PM" ||
                          att.uploadedBy === user?.id) && (
                          <button
                            type="button"
                            onClick={() => deleteAttachment(att.id)}
                            disabled={isBlocked}
                            className="rounded p-1 text-subtle transition-colors enabled:hover:bg-destructive/20 enabled:hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                            title={
                              isBlocked
                                ? "Cannot delete attachment of a BLOCKED task"
                                : "Delete attachment"
                            }
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      {isImage && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAttachment(att.fileUrl, att.fileName)
                          }
                          className="mt-3 block w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-background/50 p-1 text-left transition-opacity hover:opacity-90"
                          title="Click to view full image"
                        >
                          <AttachmentImagePreview
                            fileUrl={att.fileUrl}
                            fileName={att.fileName}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Audit Logs */}
          {auditLogs.length > 0 && (
            <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-6 shadow-sm backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  Audit Trail History ({auditLogs.length})
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {auditLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-border/60 bg-card/70 p-3.5 text-xs backdrop-blur-sm"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {log.user.name}
                      </span>
                      <span className="font-mono text-[11px] text-subtle">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Changed{" "}
                      <strong className="text-foreground">
                        {log.changedColumn}
                      </strong>
                      {log.oldValue && (
                        <>
                          {" "}
                          from{" "}
                          <code className="rounded bg-destructive/15 px-1.5 py-0.5 text-[11px] text-destructive">
                            {log.oldValue}
                          </code>
                        </>
                      )}
                      {log.newValue && (
                        <>
                          {" "}
                          to{" "}
                          <code className="rounded bg-success/15 px-1.5 py-0.5 text-[11px] text-success">
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

        {/* Right Sidebar (Execution & Metadata Deck) */}
        <div className="space-y-5">
          {/* Action Console */}
          {canChangeStatus && (
            <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-5 shadow-lg backdrop-blur-md">
              <div className="mb-3.5 flex items-center justify-between border-b border-border/40 pb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  Execution Console
                </span>
                <span className="text-[10px] font-mono text-primary">
                  LIVE SYNC
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {task.status === "TODO" && (
                  <Button
                    className="w-full h-10 font-bold"
                    onClick={() => updateStatus("IN_PROGRESS")}
                    disabled={isBlocked}
                    title={
                      isBlocked
                        ? "Task is BLOCKED due to incomplete dependencies"
                        : ""
                    }
                  >
                    <Play className="size-4" /> Start Execution
                  </Button>
                )}
                {task.status === "IN_PROGRESS" && (
                  <>
                    <Button
                      className="w-full h-11 bg-primary text-primary-foreground font-bold hover:bg-primary-2 shadow-xs transition-all"
                      onClick={() => updateStatus("DONE")}
                      disabled={!canComplete || isBlocked}
                      title={
                        isBlocked
                          ? "Task is BLOCKED due to incomplete dependencies"
                          : canComplete
                            ? ""
                            : "Only the assigned executor can complete this task"
                      }
                    >
                      <CheckCircle2 className="size-4" /> Complete Deliverable
                      (Done)
                    </Button>
                    {!canComplete && (
                      <p className="rounded-xl border border-warning/20 bg-warning/5 p-2.5 text-[11px] text-warning">
                        Hanya pelaksana tugas (
                        {task.assignee?.name || "Assignee"}) yang berhak
                        menandai selesai.
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={() => updateStatus("TODO")}
                      disabled={isBlocked}
                    >
                      <Undo2 className="size-3.5" /> Revert to TODO
                    </Button>
                  </>
                )}
                {task.status === "DONE" && (
                  <Button
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => updateStatus("IN_PROGRESS")}
                    disabled={isBlocked}
                  >
                    <RotateCcw className="size-3.5" /> Reopen Task
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Blocked Alert Banner if locked */}
          {isBlocked && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-xs text-destructive">
              <div className="mb-3 flex items-start gap-2">
                <Ban className="mt-0.5 size-4 shrink-0" />
                <span>
                  Task ini <strong>BLOCKED</strong> karena{" "}
                  {task.dependencyStatus?.pendingCount || 0} dependency belum
                  selesai. Aksi status dinonaktifkan.
                </span>
              </div>
              <BlockedBy
                tasks={
                  task.blockedBy ??
                  (task.dependencyStatus?.pendingDependencies as any)
                }
              />
            </div>
          )}

          {/* Details & Governance Deck */}
          <Card className="overflow-hidden border border-border/80 bg-surface-1/90 p-5 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                Task Governance
              </span>
              {user?.role === "PM" && !editing && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startEditing}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <Pencil className="size-3" /> Edit
                  </Button>
                  <Button
                    id="delete-task-btn"
                    variant="secondary"
                    size="sm"
                    onClick={handleDeleteTask}
                    disabled={deleteTaskMutation.isPending}
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <form
                onSubmit={editForm.handleSubmit(onSaveEdit)}
                className="flex flex-col gap-3"
              >
                <div>
                  <Label className="text-[11px]">Title</Label>
                  <Input
                    {...editForm.register("title")}
                    className="h-10 text-[13px]"
                  />
                  <FieldError
                    message={editForm.formState.errors.title?.message}
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Description</Label>
                  <Textarea
                    {...editForm.register("description")}
                    rows={3}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Department</Label>
                  <NativeSelect
                    className="h-10 text-[13px]"
                    {...editForm.register("departmentId", {
                      onChange: (e) => {
                        const dept = projectDepartments.find(
                          (d) => d.department.id === e.target.value,
                        );
                        const match = dept?.department.users?.find(
                          (u) => u.role === "INTERNAL",
                        );
                        editForm.setValue("assigneeId", match ? match.id : "");
                      },
                    })}
                  >
                    <option value="">Select...</option>
                    {projectDepartments.map((d) => (
                      <option key={d.department.id} value={d.department.id}>
                        {d.department.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <Label className="text-[11px]">Assignee</Label>
                  <NativeSelect
                    className="h-10 text-[13px]"
                    {...editForm.register("assigneeId")}
                  >
                    <option value="">Select Assignee...</option>
                    {editableMembers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (
                        {u.position?.name || u.department?.name || "No role"})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-client-visible" className="mb-0 text-xs">
                    Client Visible
                  </Label>
                  <Controller
                    control={editForm.control}
                    name="clientVisible"
                    render={({ field }) => (
                      <Switch
                        id="edit-client-visible"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1"
                    disabled={updateTaskMutation.isPending}
                  >
                    {updateTaskMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="flex flex-col gap-3 text-[13px]">
                <DetailRow label="Assignee">
                  {task.assignee ? (
                    <>
                      {task.assignee.name}
                      {task.assignee.position && (
                        <span className="ml-1 text-subtle">
                          ({task.assignee.position.name})
                        </span>
                      )}
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </DetailRow>
                <DetailRow label="Department">
                  {task.department?.name}
                </DetailRow>
                <DetailRow label="Client Visible">
                  {task.clientVisible ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-subtle">
                      <X className="size-3.5" /> No
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Version">v{task.version}</DetailRow>
                <DetailRow label="Created">
                  {new Date(task.createdAt).toLocaleDateString()}
                </DetailRow>
                <DetailRow label="Updated">
                  {new Date(task.updatedAt).toLocaleDateString()}
                </DetailRow>
              </dl>
            )}
          </Card>
        </div>
      </div>

      {/* Version Conflict Dialog (409) */}
      <Dialog
        open={!!conflict}
        onOpenChange={(open) => !open && setConflict(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" /> Konflik
              perubahan
            </DialogTitle>
            <DialogDescription>
              Pengguna lain mengubah task ini saat Anda sedang mengedit (versi
              Anda v{baseVersion} → server v{conflict?.details.currentVersion}).
              Field berikut diubah oleh kedua pihak, jadi tidak bisa digabung
              otomatis. Tidak ada data yang tertimpa.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {(conflict?.details.conflictingFields?.length
              ? conflict.details.conflictingFields
              : (Object.keys(FIELD_LABELS) as EditableTaskField[]).filter(
                  (f) =>
                    f !== ("status" as string) &&
                    conflict?.payload[f] !== undefined &&
                    displayValue(f, conflict?.payload[f]) !==
                      displayValue(f, (conflict?.details.current as any)?.[f]),
                )
            ).map((field) => (
              <div
                key={field}
                className="rounded-xl border border-border bg-background/60 p-3"
              >
                <div className="mb-2 text-xs font-semibold tracking-wider text-subtle uppercase">
                  {FIELD_LABELS[field]}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5">
                    <div className="mb-1 text-[10px] font-bold text-primary uppercase">
                      Perubahan Anda
                    </div>
                    <div className="text-[13px] break-words whitespace-pre-wrap">
                      {displayValue(field, conflict?.payload[field])}
                    </div>
                  </div>
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-2.5">
                    <div className="mb-1 text-[10px] font-bold text-warning uppercase">
                      Versi terbaru (server)
                    </div>
                    <div className="text-[13px] break-words whitespace-pre-wrap">
                      {displayValue(
                        field,
                        (conflict?.details.current as any)?.[field],
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={discardMine}>
              <RefreshCw /> Pakai versi terbaru
            </Button>
            <Button
              onClick={overwriteWithMine}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending
                ? "Menyimpan..."
                : "Timpa dengan perubahan saya"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDep} onOpenChange={setShowAddDep}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Pilih task yang harus selesai <strong>sebelum</strong> &quot;
              {task.title}&quot; bisa dikerjakan.
            </DialogDescription>
          </DialogHeader>
          <div className="shrink-0 px-6 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
              <Input
                placeholder="Search tasks in this project..."
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          <DialogBody>
            <div className="overflow-hidden rounded-[10px] border border-border bg-background">
              {availableForDep.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-subtle">
                  {depSearch
                    ? "No matching tasks"
                    : "No available tasks to add as dependency"}
                </div>
              ) : (
                availableForDep.map((t) => {
                  const adding =
                    addDepMutation.isPending &&
                    addDepMutation.variables === t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-card"
                    >
                      <div className="min-w-0">
                        <div className="mb-0.5 truncate text-[13px] font-semibold">
                          {t.title}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-subtle">
                          <Building2 className="size-3" /> {t.department?.name}
                          {t.assignee && (
                            <>
                              {" "}
                              · <UserIcon className="size-3" />{" "}
                              {t.assignee.name}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={t.effectiveStatus} />
                        <Button
                          size="sm"
                          onClick={() => addDependency(t.id)}
                          disabled={adding}
                        >
                          {adding ? (
                            "..."
                          ) : (
                            <>
                              <Link2 /> Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddDep(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Attachment Dialog */}
      <Dialog open={showAddAttachment} onOpenChange={setShowAddAttachment}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={addAttachment}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Add Attachment</DialogTitle>
              <DialogDescription>
                Attach a link, image, or file to this task.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ATTACHMENT_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setAttType(t.key);
                          setAttFile(null);
                          setAttFileUrl("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition",
                          attType === t.key
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        <Icon className="size-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="att-name">Name *</Label>
                <Input
                  id="att-name"
                  value={attFileName || ""}
                  onChange={(e) => setAttFileName(e.target.value)}
                  placeholder={
                    attType === "link"
                      ? "e.g. Figma Design"
                      : attType === "image"
                        ? "e.g. Screenshot Homepage"
                        : "e.g. API Documentation"
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="att-source">
                  {attType === "link" ? "URL *" : "Select File *"}
                </Label>
                {attType === "link" ? (
                  <Input
                    id="att-source"
                    key="link-input"
                    value={attFileUrl || ""}
                    onChange={(e) => setAttFileUrl(e.target.value)}
                    placeholder="https://figma.com/..."
                    type="url"
                    required
                  />
                ) : (
                  <Input
                    id="att-source"
                    key="file-input"
                    type="file"
                    className="h-auto py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
                    accept={attType === "image" ? "image/*" : "*/*"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setAttFile(f);
                        if (attType === "image") {
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setAttFileUrl(ev.target?.result as string);
                          reader.readAsDataURL(f);
                        }
                      }
                    }}
                    required
                  />
                )}
              </div>
              {attType === "image" && attFileUrl && (
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  {/* biome-ignore lint/performance/noImgElement: local data URL preview */}
                  <img
                    src={attFileUrl}
                    alt="Preview"
                    className="mx-auto block max-h-[150px] max-w-full"
                  />
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddAttachment(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingAtt}>
                {addingAtt ? "Adding..." : "Add Attachment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right text-xs font-semibold text-foreground">
        {children}
      </dd>
    </div>
  );
}
