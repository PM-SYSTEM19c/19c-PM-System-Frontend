"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DepartmentPicker } from "@/components/department-picker";
import { PageHeader } from "@/components/page";
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
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  const pending = isSubmitting || createProjectMutation.isPending;

  return (
    <>
      <div className="animate-fade-in">
        <PageHeader
          title="Projects"
          description={`${projects.length} project(s)`}
          actions={
            user?.role === "PM" && (
              <Button onClick={openCreateModal}>
                <Plus /> New Project
              </Button>
            )
          }
        />

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="p-16 text-center">
            <FolderKanban className="mx-auto mb-4 size-12 text-subtle" />
            <p className="mb-4 text-muted-foreground">No projects yet</p>
            {user?.role === "PM" && (
              <Button onClick={openCreateModal}>
                Create Your First Project
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group"
              >
                <Card
                  interactive
                  className="h-full p-6 group-hover:-translate-y-0.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    <span className="text-lg font-extrabold text-primary">
                      {project.progress}%
                    </span>
                  </div>
                  {project.client && (
                    <Badge variant="teal" className="mb-3">
                      Client: {project.client.name}
                    </Badge>
                  )}
                  {project.description && (
                    <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <Progress value={project.progress} className="mb-4" />
                  <div className="flex justify-between text-xs text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-success" />
                      {project.taskStats.done}/{project.taskStats.total} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" />
                      {project._count?.members || 0} members
                    </span>
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
