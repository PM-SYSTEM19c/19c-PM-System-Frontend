"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositions, useUpdateUser, useUsers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";
import type { User } from "@/types";

const ROLE_VARIANT = {
  PM: "default",
  INTERNAL: "teal",
  CLIENT: "secondary",
} as const;
const ROLE_AVATAR = {
  PM: "bg-primary/20 text-primary",
  INTERNAL: "bg-[#00cec9]/20 text-[#00cec9]",
  CLIENT: "bg-[#636e72]/30 text-[#b2bec3]",
} as const;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading: loading } = useUsers("pageSize=100");
  const { data: positions = [] } = usePositions();
  const updateUserMutation = useUpdateUser();

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPosition, setEditPosition] = useState("");

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: {
          role: editRole,
          positionId: editRole === "INTERNAL" ? editPosition || null : null,
          ...(editRole !== "INTERNAL" && { departmentId: null }),
        },
      });
      toast.success("User updated successfully");
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to update user");
    }
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: approvingUser.id,
        data: {
          status: "APPROVED",
          positionId: approvingUser.role === "INTERNAL" ? editPosition : null,
        },
      });
      toast.success("User approved successfully");
      setApprovingUser(null);
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to approve user");
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Are you sure you want to reject this user?")) return;
    try {
      await updateUserMutation.mutateAsync({
        id,
        data: { status: "REJECTED" },
      });
      toast.success("User rejected");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to reject user");
    }
  }

  if (loading && users.length === 0) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users" description={`${users.length} user(s)`} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Name",
                  "Email",
                  "Role",
                  "Status",
                  "Position",
                  "Department",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-subtle uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-card/40"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-sm font-bold",
                          ROLE_AVATAR[u.role],
                        )}
                      >
                        {u.name[0]}
                      </div>
                      <span className="text-sm font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        u.status === "PENDING"
                          ? "warning"
                          : u.status === "REJECTED"
                            ? "destructive"
                            : "success"
                      }
                    >
                      {u.status || "APPROVED"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                    {u.position?.name || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                    {u.department?.name || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {currentUser?.role === "PM" && (
                      <div className="flex gap-2">
                        {u.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setApprovingUser(u);
                                setEditPosition("");
                              }}
                            >
                              <Check /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(u.id)}
                            >
                              <X /> Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingUser(u);
                              setEditRole(u.role);
                              setEditPosition(u.position?.id || "");
                            }}
                          >
                            <Pencil /> Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
      >
        <DialogContent className="max-w-md">
          <form
            onSubmit={handleSaveEdit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editingUser?.name ?? ""} disabled />
              </div>
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <NativeSelect
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                >
                  <option value="PM">Project Manager (PM)</option>
                  <option value="INTERNAL">Internal Team</option>
                  <option value="CLIENT">Client</option>
                </NativeSelect>
              </div>
              {editRole === "INTERNAL" && (
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <NativeSelect
                    id="edit-position"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                  >
                    <option value="">No position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={!!approvingUser}
        onOpenChange={(o) => !o && setApprovingUser(null)}
      >
        <DialogContent className="max-w-md">
          <form
            onSubmit={handleApprove}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Approve {approvingUser?.role}</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={approvingUser?.name ?? ""} disabled />
              </div>
              {approvingUser?.role === "INTERNAL" && (
                <div>
                  <Label htmlFor="approve-position">Assign Position *</Label>
                  <NativeSelect
                    id="approve-position"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    required
                  >
                    <option value="">Select a position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setApprovingUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Approving..." : "Approve User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
