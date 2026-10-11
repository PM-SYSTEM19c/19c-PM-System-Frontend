"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DepartmentPicker } from "@/components/department-picker";
import { PageHeader, StatCard } from "@/components/page";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api";
import {
  useCreateProject,
  useDepartments,
  useProjects,
  useUsers,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  clientId: z.string().optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export default function ProjectsPage() {
  const { user } = useAuth();
  const {
    data: projects = [],
    isLoading: loading,
    refetch: refetchProjects,
  } = useProjects();
  const createProjectMutation = useCreateProject();
  const { data: allUsersRaw = [] } = useUsers("pageSize=100");
  const { data: allDepartments = [] } = useDepartments();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "ACTIVE" | "COMPLETED">(
    "ALL",
  );

  const allClients = allUsersRaw.filter((u) => u.role === "CLIENT");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
  });

  function openCreateModal() {
    setShowCreate(true);
    setSelectedDepartmentIds([]);
    reset();
  }

  function toggleDepartment(deptId: string) {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  }

  async function onCreateSubmit(data: CreateProjectFormData) {
    try {
      const res = await createProjectMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        clientId: data.clientId || undefined,
      });
      const projectId = (res.data as any)?.id;

      if (projectId && selectedDepartmentIds.length > 0) {
        await Promise.all(
          selectedDepartmentIds.map((deptId) =>
            api.addProjectDepartment(projectId, deptId),
          ),
        );
      }

      setShowCreate(false);
      toast.success("Project created!");
      refetchProjects();
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to create project");
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-8 h-8 w-[200px]" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  const pending = isSubmitting || createProjectMutation.isPending;

  const filteredProjects = projects.filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.description?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filterMode === "ACTIVE" && p.progress >= 100) return false;
    if (filterMode === "COMPLETED" && p.progress < 100) return false;
    return true;
  });

  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + (p.progress || 0), 0) /
            projects.length,
        )
      : 0;
  const activeCount = projects.filter((p) => (p.progress || 0) < 100).length;
  const totalTasksCount = projects.reduce(
    (acc, p) => acc + (p.taskStats?.total || 0),
    0,
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <PageHeader
          title="Projects"
          description="Track project lifecycle, team assignments, and client deliverables"
          actions={
            user?.role === "PM" && (
              <Button
                onClick={openCreateModal}
                className="bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary-2"
              >
                <Plus className="size-4" /> New Project
              </Button>
            )
          }
        />

        {/* Project Metrics Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            label="Total Projects"
            value={projects.length}
            icon={FolderKanban}
            tone="primary"
            subtext={`${activeCount} in progress · ${projects.length - activeCount} done`}
          />
          <StatCard
            label="Average Completion"
            value={`${avgProgress}%`}
            icon={CheckCircle2}
            tone="success"
            subtext="Portfolio progress health"
          />
          <StatCard
            label="Total Deliverables"
            value={totalTasksCount}
            icon={FolderKanban}
            tone="info"
            subtext="Tracked across all streams"
          />
          <StatCard
            label="Client Portals"
            value={allClients.length}
            icon={Users}
            tone="warning"
            subtext="External partner visibility"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface-1/60 p-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search projects by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-surface-2/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold font-mono transition-all",
                  filterMode === mode
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {mode === "ALL"
                  ? `All (${projects.length})`
                  : mode === "ACTIVE"
                    ? `Active (${activeCount})`
                    : `Done (${projects.length - activeCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="p-16 text-center">
            <FolderKanban className="mx-auto mb-4 size-12 text-muted-foreground/60" />
            <p className="mb-2 text-sm font-semibold text-foreground">
              {search || filterMode !== "ALL"
                ? "No matching projects found"
                : "No projects yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {search || filterMode !== "ALL"
                ? "Try adjusting your search query or status filter."
                : "Get started by creating your first team workspace project."}
            </p>
            {user?.role === "PM" && !search && filterMode === "ALL" && (
              <Button
                onClick={openCreateModal}
                className="bg-primary text-primary-foreground font-bold"
              >
                Create Your First Project
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block"
              >
                <Card
                  interactive
                  className="h-full flex flex-col border border-border/50 bg-surface-1/70 hover:border-primary/40 hover:bg-surface-2/80 transition-all p-5"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.client && (
                          <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400">
                            {project.client.name}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-2xl font-extrabold text-primary leading-none">
                        {project.progress}%
                      </span>
                      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Card Progress & Stats Footer */}
                  <div className="mt-auto pt-4 border-t border-border/30">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3 mb-3">
                      <div
                        style={{ width: `${project.progress || 0}%` }}
                        className="h-full bg-primary transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3 text-primary" />
                        <span>
                          {project.taskStats?.done || 0}/
                          {project.taskStats?.total || 0} tasks
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3 text-muted-foreground" />
                        <span>{project._count?.members || 0} members</span>
                      </span>
                      <span className="text-primary font-sans font-semibold group-hover:underline">
                        View Board →
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog (Radix: fixed, centered, body-scroll locked) */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl">
          <form
            onSubmit={handleSubmit(onCreateSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Set up a new project and assign the departments involved.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g. Mobile App"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <Label htmlFor="project-client">Client</Label>
                  <NativeSelect id="project-client" {...register("clientId")}>
                    <option value="">No Client (Internal Project)</option>
                    {allClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Project description..."
                  rows={3}
                  {...register("description")}
                />
              </div>
              <div>
                <Label>
                  Assign Departments
                  {selectedDepartmentIds.length > 0 && (
                    <span className="ml-2 text-primary">
                      ({selectedDepartmentIds.length} selected)
                    </span>
                  )}
                </Label>
                <DepartmentPicker
                  departments={allDepartments}
                  selected={selectedDepartmentIds}
                  onToggle={toggleDepartment}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
