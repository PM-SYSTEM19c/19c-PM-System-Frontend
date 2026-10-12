"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader, SectionHeader, StatCard } from "@/components/page-header";
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
import { Input, NativeSelect } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateUser,
  useUsers,
} from "@/lib/queries";
import { toast } from "@/store/toast.store";
import type { Department, User } from "@/types";

const createDeptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
});
type CreateDeptFormData = z.infer<typeof createDeptSchema>;

type DepartmentWithUsers = Department & { users?: User[] };

export default function DepartmentsPage() {
  const { data: departmentsRaw = [], isLoading: loading } = useDepartments();
  const departments = departmentsRaw as DepartmentWithUsers[];
  const { data: users = [] } = useUsers("pageSize=100");
  const createDeptMutation = useCreateDepartment();
  const updateUserMutation = useUpdateUser();
  const deleteDeptMutation = useDeleteDepartment();

  // Expanded departments state
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  function toggleExpand(deptId: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }

  async function handleDeleteDept(dept: DepartmentWithUsers) {
    if (
      !confirm(
        `Delete department "${dept.name}"? It will be hidden everywhere (soft delete — data is kept).`,
      )
    )
      return;
    try {
      await deleteDeptMutation.mutateAsync(dept.id);
      toast.success("Department deleted");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to delete department");
    }
  }

  // Create Dept State
  const [showCreate, setShowCreate] = useState(false);

  // Add Member State
  const [showAddMemberFor, setShowAddMemberFor] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDeptFormData>({
    resolver: zodResolver(createDeptSchema),
  });

  async function onCreateDept(data: CreateDeptFormData) {
    try {
      await createDeptMutation.mutateAsync({
        name: data.name,
        code: data.code,
        description: data.description || null,
      });
      reset();
      setShowCreate(false);
      toast.success("Department created!");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to create department");
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!showAddMemberFor || !selectedUserId) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUserId,
        data: { departmentId: showAddMemberFor },
      });
      setShowAddMemberFor(null);
      setSelectedUserId("");
      toast.success("User added to department");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to add user");
    }
  }

  async function removeUserFromDept(userId: string) {
    if (
      !confirm("Are you sure you want to remove this user from the department?")
    )
      return;
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: { departmentId: null, position: null },
      });
      toast.success("User removed from department");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to remove user");
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const creating = isSubmitting || createDeptMutation.isPending;

  const totalMembers = departments.reduce(
    (acc, d) => acc + (d.users?.length || 0),
    0,
  );
  const activeDepts = departments.filter(
    (d) => (d.users?.length || 0) > 0,
  ).length;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Departments"
          description="Cross-functional engineering and design team units"
          actions={
            <Button
              onClick={() => {
                reset();
                setShowCreate(true);
              }}
              className="bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary-2"
            >
              <Plus className="size-4" /> New Department
            </Button>
          }
        />

        {/* Department Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <StatCard
            label="Departments"
            value={departments.length}
            icon={Building2}
            tone="primary"
            subtext="Organizational functional units"
          />
          <StatCard
            label="Total Headcount"
            value={totalMembers}
            icon={Users}
            tone="info"
            subtext="Assigned department personnel"
          />
          <StatCard
            label="Staffed Units"
            value={`${activeDepts} / ${departments.length}`}
            icon={Building2}
            tone="success"
            subtext="Units with active members"
          />
        </div>

        {/* Department List — Accordion style with Grass.io tokens */}
        <div className="flex flex-col gap-3">
          {departments.map((dept) => {
            const isExpanded = expandedDepts.has(dept.id);
            const memberCount = dept.users?.length || 0;

            return (
              <Card key={dept.id} className="overflow-hidden">
                {/* Department Header Row */}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => toggleExpand(dept.id)}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-foreground truncate">
                          {dept.name}
                        </span>
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0">
                          {dept.code}
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] font-medium text-muted-foreground">
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-[11px]"
                      onClick={() => setShowAddMemberFor(dept.id)}
                    >
                      <UserPlus className="size-3" /> Add
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 hover:bg-destructive/10 hover:text-destructive rounded-full"
                      onClick={() => handleDeleteDept(dept)}
                      disabled={deleteDeptMutation.isPending}
                      title="Delete department"
                    >
                      <Trash2 className="size-3.5 text-destructive/70" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(dept.id)}
                      className="flex size-7 items-center justify-center rounded-full hover:bg-surface-3 text-muted-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Members List */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-surface-1/50 px-5 py-3">
                    {memberCount === 0 ? (
                      <div className="py-4 text-center text-[12px] text-muted-foreground">
                        No members in this department yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {dept.users?.map((u) => (
                          <div
                            key={u.id}
                            className="group flex items-center justify-between rounded-xl bg-surface-2/80 border border-border/30 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                {u.name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-foreground truncate">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {u.position?.name || u.role}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUserFromDept(u.id)}
                              title="Remove User"
                              className="rounded-full p-1 text-subtle opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Department Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={handleSubmit(onCreateDept)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
              <DialogDescription>
                Add a new team to the organization.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <Label htmlFor="dept-name">Name</Label>
                <Input
                  id="dept-name"
                  placeholder="e.g. DevOps"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label htmlFor="dept-code">Code</Label>
                <Input
                  id="dept-code"
                  placeholder="e.g. DEVOPS"
                  aria-invalid={!!errors.code}
                  {...register("code")}
                />
                <FieldError message={errors.code?.message} />
                <p className="mt-1 text-[11px] text-subtle">
                  Uppercase with underscores only
                </p>
              </div>
              <div>
                <Label htmlFor="dept-description">Description</Label>
                <Input
                  id="dept-description"
                  placeholder="Optional description"
                  {...register("description")}
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
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={!!showAddMemberFor}
        onOpenChange={(o) => !o && setShowAddMemberFor(null)}
      >
        <DialogContent className="max-w-md">
          <form
            onSubmit={handleAddMember}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Add User to Department</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Label htmlFor="member-user">Select User</Label>
              <NativeSelect
                id="member-user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Choose user...</option>
                {users
                  .filter((u) => u.departmentId !== showAddMemberFor)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}
                      {u.department
                        ? ` - currently in ${u.department.name}`
                        : ""}
                      )
                    </option>
                  ))}
              </NativeSelect>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddMemberFor(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending || !selectedUserId}
              >
                {updateUserMutation.isPending ? "Saving..." : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
