"use client";

import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestoreTrash, useTrash } from "@/lib/queries";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/store/toast.store";

export default function TrashPage() {
  const { user } = useAuth();
  const { data: trashItems = [], isLoading } = useTrash();
  const restoreMutation = useRestoreTrash();

  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (user?.role !== "PM") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 size-12 text-destructive" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">
          Only Project Managers can access the trash.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-8 h-8 w-[200px]" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
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

  const allItems = [
    ...(trashItems.projects || []).map((p: any) => ({
      ...p,
      type: "projects",
      name: p.name || p.title,
    })),
    ...(trashItems.tasks || []).map((t: any) => ({
      ...t,
      type: "tasks",
      name: t.title,
    })),
    ...(trashItems.departments || []).map((d: any) => ({
      ...d,
      type: "departments",
      name: d.name,
    })),
    ...(trashItems.positions || []).map((pos: any) => ({
      ...pos,
      type: "positions",
      name: pos.name,
    })),
  ].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Trash"
        description={`${allItems.length} soft-deleted item(s)`}
      />

      {allItems.length === 0 ? (
        <Card className="p-16 text-center">
          <Trash2 className="mx-auto mb-4 size-12 text-subtle" />
          <p className="text-muted-foreground">Trash is empty</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item: any) => {
            const isRestoring = restoringId === item.id;

            return (
              <Card
                key={`${item.type}-${item.id}`}
                className="p-5 flex flex-col justify-between group"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="text-base font-bold truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {item.type}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {item.restoreBlockedReason && (
                    <div className="mt-2 text-xs text-destructive flex items-start gap-1">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>{item.restoreBlockedReason}</span>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-subtle">
                    Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center group-hover:border-primary/50 group-hover:bg-primary/5"
                  onClick={() => handleRestore(item.type, item.id)}
                  disabled={
                    isRestoring ||
                    restoreMutation.isPending ||
                    !!item.restoreBlockedReason
                  }
                >
                  <RotateCcw className="size-3.5 mr-2" />
                  {isRestoring ? "Restoring..." : "Restore"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
