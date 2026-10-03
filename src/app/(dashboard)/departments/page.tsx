"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/page";
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

  return (
    <>
      <div className="animate-fade-in">
        <PageHeader
          title="Departments"
          description={`${departments.length} department(s)`}
          actions={
            <Button
              onClick={() => {
                reset();
                setShowCreate(true);
              }}
            >
              <Plus /> New Department
            </Button>
          }
        />

        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-start gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} interactive className="flex flex-col p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Building2 className="size-5 text-primary" /> {dept.name}
                </h3>
                <div className="flex items-center gap-1">
                  <span className="rounded-lg bg-card px-2.5 py-1 font-mono text-[11px] font-semibold text-subtle">
                    {dept.code}
                  </span>
                  <Button
                    id={`delete-dept-${dept.id}`}
                    size="icon"
                    variant="ghost"
                    className="size-8 hover:bg-destructive/10"
                    onClick={() => handleDeleteDept(dept)}
                    disabled={deleteDeptMutation.isPending}
                    title="Delete department"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
              {dept.description && (
                <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
                  {dept.description}
                </p>
              )}

              <div className="mt-auto border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    Members ({dept.users?.length || 0})
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowAddMemberFor(dept.id)}
                  >
                    <UserPlus /> Add User
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {dept.users?.map((u) => (
                    <div
                      key={u.id}
                      className="group flex items-center justify-between rounded-lg bg-card p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-subtle">
                            {u.position?.name || u.role}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUserFromDept(u.id)}
                        title="Remove User"
                        className="rounded p-1 text-subtle opacity-60 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
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
