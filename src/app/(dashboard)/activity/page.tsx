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
import { PageHeader } from "@/components/page";
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
    <div className="animate-fade-in">
      <PageHeader
        title="Recent Activity"
        description="Track all recent updates and progress across your teams"
      />

      <Card className="p-6">
        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-subtle">
            No recent activity yet
          </div>
        ) : (
          <div className="flex flex-col">
            {auditLogs.map((log: any) => {
              const activity = getActivityIcon(log.changedColumn, log.newValue);
              const Icon = activity.icon;
              return (
                <div
                  key={log.id}
                  className="flex gap-4 border-b border-border py-4 last:border-b-0"
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
                      activity.tone,
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-sm">
                      <strong>{log.user?.name}</strong>{" "}
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
                    <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <FolderKanban className="size-3.5" />{" "}
                        {log.task?.project?.name}
                      </span>
                      <span>•</span>
                      <span>{timeAgo(log.createdAt)}</span>
                      {log.changedColumn === "status" && log.oldValue && (
                        <>
                          <span>•</span>
                          <span>
                            <span className="rounded bg-destructive/12 px-2 py-0.5">
                              {log.oldValue}
                            </span>
                            {" → "}
                            <span className="rounded bg-success/12 px-2 py-0.5">
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
        )}
      </Card>
    </div>
  );
}
