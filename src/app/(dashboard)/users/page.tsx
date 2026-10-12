"use client";

import {
  Briefcase,
  Building2,
  Check,
  LayoutGrid,
  List,
  Pencil,
  Search,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageHeader, StatCard } from "@/components/page-header";
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
  PM: "bg-primary/20 text-zinc-900 dark:text-lime-300 border border-primary/30 font-mono",
  INTERNAL:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-mono",
  CLIENT:
    "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25 font-mono",
} as const;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading: loading } = useUsers("pageSize=100");
  const { data: positions = [] } = usePositions();
  const updateUserMutation = useUpdateUser();

  // Search, Filter & View State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  const internalCount = users.filter((u) => u.role === "INTERNAL").length;
  const pmCount = users.filter((u) => u.role === "PM").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const pendingCount = users.filter((u) => u.status === "PENDING").length;

  const filteredUsers = users.filter((u) => {
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (roleFilter === "PM" && u.role !== "PM") return false;
    if (roleFilter === "INTERNAL" && u.role !== "INTERNAL") return false;
    if (roleFilter === "CLIENT" && u.role !== "CLIENT") return false;
    if (roleFilter === "PENDING" && u.status !== "PENDING") return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage organizational accounts, roles, and system access rights"
      />

      {/* Users Summary Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Accounts"
          value={users.length}
          icon={UsersIcon}
          tone="primary"
          subtext="Active system identities"
        />
        <StatCard
          label="Internal Team"
          value={internalCount}
          icon={UserCheck}
          tone="info"
          subtext="Engineers and designers"
        />
        <StatCard
          label="Project Managers"
          value={pmCount}
          icon={ShieldCheck}
          tone="success"
          subtext="Workflow administrators"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={Briefcase}
          tone={pendingCount > 0 ? "warning" : "primary"}
          subtext={pendingCount > 0 ? "Action required" : "All users vetted"}
        />
      </div>

      {/* Search, Filter & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface-1/60 p-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-surface-2/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Role Filter Chips */}
          <div className="flex items-center gap-1">
            {[
              { key: "ALL", label: `All (${users.length})` },
              { key: "PM", label: `PM (${pmCount})` },
              { key: "INTERNAL", label: `Internal (${internalCount})` },
              { key: "CLIENT", label: `Clients (${clientCount})` },
              ...(pendingCount > 0
                ? [{ key: "PENDING", label: `Pending (${pendingCount})` }]
                : []),
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono transition-all",
                  roleFilter === tab.key
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 bg-surface-2/60 p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "table"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table View"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Presentation */}
      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center bg-surface-1/60 border-border/50">
          <UsersIcon className="mx-auto mb-3 size-10 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">
            No matching users found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search query or filter selection.
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredUsers.map((u) => (
            <Card
              key={u.id}
              interactive
              className="p-4 flex flex-col border border-border/50 bg-surface-1/70 hover:border-primary/40 hover:bg-surface-2/80 transition-all"
            >
              {/* User Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm",
                      ROLE_AVATAR[u.role],
                    )}
                  >
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-foreground truncate">
                      {u.name}
                    </div>
                    <div className="text-[12px] font-mono text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                </div>
                {currentUser?.role === "PM" && (
                  <div className="flex gap-1 shrink-0">
                    {u.status === "PENDING" ? (
                      <>
                        <Button
                          size="icon"
                          className="size-7 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary-2"
                          onClick={() => {
                            setApprovingUser(u);
                            setEditPosition("");
                          }}
                          title="Approve"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="size-7 rounded-full"
                          onClick={() => handleReject(u.id)}
                          title="Reject"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-lg text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                        onClick={() => {
                          setEditingUser(u);
                          setEditRole(u.role);
                          setEditPosition(u.position?.id || "");
                        }}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t border-border/40">
                <Badge variant={ROLE_VARIANT[u.role]} className="text-[10px]">
                  {u.role}
                </Badge>
                <Badge
                  variant={
                    u.status === "PENDING"
                      ? "warning"
                      : u.status === "REJECTED"
                        ? "destructive"
                        : "success"
                  }
                  className="text-[10px]"
                >
                  {u.status || "APPROVED"}
                </Badge>
                {u.position && (
                  <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-surface-3/80 border border-border/30">
                    {u.position.name}
                  </span>
                )}
                {u.department && (
                  <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-surface-3/80 border border-border/30">
                    {u.department.name}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* High-Density Grass Table View */
        <Card className="overflow-hidden border border-border/50 bg-surface-1/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-surface-2/60 text-muted-foreground font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department / Position</th>
                  <th className="py-3 px-4">Status</th>
                  {currentUser?.role === "PM" && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-2/60 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            ROLE_AVATAR[u.role],
                          )}
                        >
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {u.name}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={ROLE_VARIANT[u.role]}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.department && (
                          <span className="rounded-md bg-surface-3/80 border border-border/30 px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {u.department.name}
                          </span>
                        )}
                        {u.position && (
                          <span className="rounded-md bg-surface-3/80 border border-border/30 px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {u.position.name}
                          </span>
                        )}
                        {!u.department && !u.position && (
                          <span className="text-muted-foreground/50 text-[11px]">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          u.status === "PENDING"
                            ? "warning"
                            : u.status === "REJECTED"
                              ? "destructive"
                              : "success"
                        }
                        className="text-[10px]"
                      >
                        {u.status || "APPROVED"}
                      </Badge>
                    </td>
                    {currentUser?.role === "PM" && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.status === "PENDING" ? (
                            <>
                              <Button
                                size="icon"
                                className="size-6 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary-2"
                                onClick={() => {
                                  setApprovingUser(u);
                                  setEditPosition("");
                                }}
                                title="Approve"
                              >
                                <Check className="size-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="size-6 rounded-full"
                                onClick={() => handleReject(u.id)}
                                title="Reject"
                              >
                                <X className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                              onClick={() => {
                                setEditingUser(u);
                                setEditRole(u.role);
                                setEditPosition(u.position?.id || "");
                              }}
                              title="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
