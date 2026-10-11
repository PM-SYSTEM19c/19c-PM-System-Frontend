"use client";

import {
  AlertTriangle,
  ArchiveRestore,
  Briefcase,
  Building2,
  FolderKanban,
  ListTodo,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { PageHeader, StatCard } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestoreTrash, useTrash } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";

type TrashFilterType =
  | "ALL"
  | "projects"
  | "tasks"
  | "departments"
  | "positions";

export default function TrashPage() {
  const { user } = useAuth();
  const { data: trashItems = [], isLoading } = useTrash();
  const restoreMutation = useRestoreTrash();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TrashFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (user?.role !== "PM") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 size-12 text-destructive" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">
          Only Project Managers can access the trash and archive registry.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[240px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  async function handleRestore(type: string, id: string) {
    try {
      setRestoringId(id);
      await restoreMutation.mutateAsync({ type, id });
      toast.success(`${type} restored successfully`);
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to restore item");
    } finally {
      setRestoringId(null);
    }
  }

  const allProjects = trashItems.projects || [];
  const allTasks = trashItems.tasks || [];
  const allDepartments = trashItems.departments || [];
  const allPositions = trashItems.positions || [];

  const allItems = [
    ...allProjects.map((p: any) => ({
      ...p,
      type: "projects",
      name: p.name || p.title,
      icon: FolderKanban,
    })),
    ...allTasks.map((t: any) => ({
      ...t,
      type: "tasks",
      name: t.title,
      icon: ListTodo,
    })),
    ...allDepartments.map((d: any) => ({
      ...d,
      type: "departments",
      name: d.name,
      icon: Building2,
    })),
    ...allPositions.map((pos: any) => ({
      ...pos,
      type: "positions",
      name: pos.name,
      icon: Briefcase,
    })),
  ].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );

  const filteredItems = allItems.filter((item) => {
    if (filterType !== "ALL" && item.type !== filterType) return false;
    if (
      searchQuery.trim() &&
      !item.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Trash & Archive Registry"
        description="Audit soft-deleted workspace records with zero permanent data loss."
        badge="REVERSIBLE STORAGE"
      />

      {/* Telemetry Metric Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Soft-Deleted"
          value={allItems.length}
          trend={`${allItems.length} preserved`}
          icon={Trash2}
          subtext="Retained indefinitely"
        />
        <StatCard
          label="Archived Projects"
          value={allProjects.length}
          trend="Can restore board"
          icon={FolderKanban}
          subtext="Keeps task relationships"
        />
        <StatCard
          label="Archived Tasks"
          value={allTasks.length}
          trend="Dependencies intact"
          icon={ListTodo}
          subtext="History preserved"
        />
        <StatCard
          label="Org Units"
          value={allDepartments.length + allPositions.length}
          trend={`${allDepartments.length} depts, ${allPositions.length} pos`}
          icon={ArchiveRestore}
          subtext="Safe recovery"
        />
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface-1/80 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            placeholder="Search archived items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "All Items", count: allItems.length },
            { key: "projects", label: "Projects", count: allProjects.length },
            { key: "tasks", label: "Tasks", count: allTasks.length },
            {
              key: "departments",
              label: "Depts",
              count: allDepartments.length,
            },
            {
              key: "positions",
              label: "Positions",
              count: allPositions.length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key as TrashFilterType)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150",
                filterType === tab.key
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-surface-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                  filterType === tab.key
                    ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                    : "bg-background/80 text-subtle",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid */}
      {filteredItems.length === 0 ? (
        <Card className="rounded-3xl border border-border bg-card p-16 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-subtle">
            <Trash2 className="size-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {allItems.length === 0
              ? "Trash is Empty"
              : "No Matching Items Found"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {allItems.length === 0
              ? "All project workspaces and task deliverables are currently active."
              : "Try adjusting your filter selection or search query."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item: any) => {
            const isRestoring = restoringId === item.id;
            const ItemIcon = item.icon;

            return (
              <Card
                key={`${item.type}-${item.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-150 hover:border-zinc-400 dark:hover:border-zinc-700"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ItemIcon className="size-4" />
                      </div>
                      <h3
                        className="truncate text-sm font-bold text-foreground"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="capitalize shrink-0 text-[10px] font-mono"
                    >
                      {item.type}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}

                  {item.restoreBlockedReason && (
                    <div className="mb-3 flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                      <span>{item.restoreBlockedReason}</span>
                    </div>
                  )}

                  <div className="mb-4 flex items-center justify-between text-[11px] font-mono text-subtle">
                    <span>Deleted:</span>
                    <span>{new Date(item.deletedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-xl border-border/80 bg-surface-2/50 font-semibold group-hover:border-primary/50 group-hover:bg-primary/15 group-hover:text-primary transition-all duration-200"
                  onClick={() => handleRestore(item.type, item.id)}
                  disabled={
                    isRestoring ||
                    restoreMutation.isPending ||
                    !!item.restoreBlockedReason
                  }
                >
                  <RotateCcw className="mr-2 size-3.5" />
                  {isRestoring ? "Restoring..." : "Restore Entity"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
