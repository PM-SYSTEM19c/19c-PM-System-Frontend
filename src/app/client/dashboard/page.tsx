"use client";

import { Inbox, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/skeleton";
import { useClientProjects, useClientProjectTasks } from "@/lib/queries";
import { useAuth } from "@/providers/auth-provider";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading: loading } = useClientProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { data: tasks = [], isLoading: loadingTasks } = useClientProjectTasks(
    selectedProject || "",
  );

  // Auto-select first project when loaded
  useEffect(() => {
    const first = projects[0];
    if (first && !selectedProject) {
      setSelectedProject(first.id);
    }
  }, [projects, selectedProject]);

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-8 h-8 w-[300px]" />
        <Skeleton className="mb-6 h-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name} 👋`}
        description="Track the progress of your projects"
      />

      {projects.length === 0 ? (
        <Card className="p-16 text-center">
          <Inbox className="mx-auto mb-4 size-12 text-subtle" />
          <p className="text-muted-foreground">
            No projects assigned to you yet.
          </p>
        </Card>
      ) : (
        <>
          {/* Project Selector */}
          {projects.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-3">
              {projects.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={selectedProject === p.id ? "default" : "secondary"}
                  onClick={() => setSelectedProject(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}

          {/* Project Progress */}
          {activeProject && (
            <Card className="mb-6 p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[22px] font-bold">{activeProject.name}</h2>
                <div className="bg-gradient-to-br from-primary to-success bg-clip-text text-4xl font-extrabold text-transparent">
                  {activeProject.progress}%
                </div>
              </div>
              {activeProject.description && (
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {activeProject.description}
                </p>
              )}
              <Progress value={activeProject.progress} className="h-3.5" />
            </Card>
          )}

          {/* Tasks */}
          <Card className="p-6">
            <h3 className="mb-5 text-base font-bold">
              Visible Tasks
              <span className="ml-2 text-xs font-normal text-subtle">
                (Tasks made visible by the team)
              </span>
            </h3>

            {loadingTasks ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[60px]" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-10 text-center text-subtle">
                No visible tasks yet
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
                  >
                    <div>
                      <div className="mb-1 text-[15px] font-semibold">
                        {task.title}
                      </div>
                      <div className="text-xs text-subtle">
                        Updated {new Date(task.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge
                      status={task.status}
                      className="px-4 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info notice */}
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-info/15 bg-info/8 px-5 py-3.5 text-[13px] leading-relaxed text-info">
            <Info className="mt-0.5 size-4 shrink-0" />
            You can only see tasks that the team has made visible to you.
            Contact your project manager for more details.
          </div>
        </>
      )}
    </div>
  );
}
