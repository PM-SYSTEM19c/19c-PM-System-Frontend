"use client";

import {
  CheckCircle2,
  FolderKanban,
  ListTodo,
  type LucideIcon,
  Paperclip,
  Pencil,
  RefreshCw,
  Trash2,
  UserCog,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalAuditLogs } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type Activity = { icon: LucideIcon; tone: string; label: string };

function getActivityIcon(
  changedColumn: string,
  newValue: string | null,
): Activity {
  if (changedColumn === "status") {
    if (newValue === "DONE")
      return {
        icon: CheckCircle2,
        tone: "border-success bg-success/10 text-success",
        label: "completed",
      };
    if (newValue === "IN_PROGRESS")
      return {
        icon: Zap,
        tone: "border-warning bg-warning/10 text-warning",
        label: "started working on",
      };
    if (newValue === "TODO")
      return {
        icon: ListTodo,
        tone: "border-info bg-info/10 text-info",
        label: "reverted",
      };
  }
  if (changedColumn === "assigneeId")
    return {
      icon: UserCog,
      tone: "border-primary bg-primary/10 text-primary",
      label: "reassigned",
    };
  if (changedColumn === "title")
    return {
      icon: Pencil,
      tone: "border-primary bg-primary/10 text-primary",
      label: "renamed",
    };
  if (changedColumn === "attachment")
    return {
      icon: Paperclip,
      tone: "border-primary bg-primary/10 text-primary",
      label: "added an attachment to",
    };
  if (changedColumn === "attachment_deleted")
    return {
      icon: Trash2,
      tone: "border-destructive bg-destructive/10 text-destructive",
      label: "deleted an attachment from",
    };
  if (changedColumn === "deletedAt") {
    if (newValue) {
      return {
        icon: Trash2,
        tone: "border-destructive bg-destructive/10 text-destructive",
        label: "deleted task",
      };
    } else {
      return {
        icon: RefreshCw,
        tone: "border-success bg-success/10 text-success",
        label: "restored task",
      };
    }
  }
  return {
    icon: RefreshCw,
    tone: "border-muted-foreground bg-muted-foreground/10 text-muted-foreground",
    label: `updated ${changedColumn} of`,
  };
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: auditLogs = [], isLoading: loading } = useGlobalAuditLogs();

  useEffect(() => {
    if (user && user.role !== "PM") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-[250px]" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="Recent Activity"
        description="Audit trail of all workflow changes, deliverables, and team transitions"
        badge={
          <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
            {auditLogs.length} EVENTS RECORDED
          </span>
        }
      />

      {auditLogs.length === 0 ? (
        <Card className="p-12 text-center bg-surface-1/60 border-border/50">
          <RefreshCw className="mx-auto mb-3 size-10 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">
            No recent activity recorded yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Activity events will stream here automatically as tasks are created,
            updated, or completed.
          </p>
        </Card>
      ) : (
        <Card className="p-6 border border-border/50 bg-surface-1/70">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/60" />

            <div className="flex flex-col gap-2">
              {auditLogs.map((log: any, index: number) => {
                const activity = getActivityIcon(
                  log.changedColumn,
                  log.newValue,
                );
                const Icon = activity.icon;
                return (
                  <div
                    key={log.id}
                    className="group relative flex gap-4 pl-0 py-3 hover:bg-surface-2/60 rounded-xl px-3 transition-colors border border-transparent hover:border-border/40"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border bg-surface-2 shadow-sm transition-transform duration-200 group-hover:scale-105",
                        activity.tone,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="mb-1 text-[13px]">
                        <strong className="font-semibold text-foreground">
                          {log.user?.name}
                        </strong>{" "}
                        <span className="text-muted-foreground">
                          {activity.label}
                        </span>{" "}
                        <Link
                          href={`/tasks/${log.task?.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {log.task?.title}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <FolderKanban className="size-3 text-primary/70" />{" "}
                          <span>{log.task?.project?.name}</span>
                        </span>
                        <span className="text-border">·</span>
                        <span className="font-mono text-muted-foreground/80">
                          {timeAgo(log.createdAt)}
                        </span>
                        {log.changedColumn === "status" && log.oldValue && (
                          <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1.5 font-mono">
                              <span className="rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.2 text-[10px] text-destructive font-medium">
                                {log.oldValue}
                              </span>
                              <span className="text-subtle">→</span>
                              <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary font-medium">
                                {log.newValue}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
