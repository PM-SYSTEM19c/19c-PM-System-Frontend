import {
  Activity,
  CircleCheckBig,
  ClipboardList,
  GitBranch,
  KanbanSquare,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import styles from "@/app/landing.module.css";

export function DashboardPreview() {
  const tasks = [
    { name: "User journey approval", team: "UI/UX", status: "Done" },
    { name: "Dashboard integration", team: "Frontend", status: "In progress" },
    { name: "Reporting endpoints", team: "Backend", status: "To do" },
  ];

  return (
    <figure
      className="relative mx-auto w-full max-w-6xl"
      aria-labelledby="product-preview-caption"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-surface-0 p-2 shadow-lg sm:rounded-[2rem] sm:p-3">
        <div className="overflow-hidden rounded-[1.1rem] border border-border bg-background sm:rounded-[1.45rem]">
          <div className="flex h-10 items-center gap-2 border-b border-border bg-card px-4">
            <span className="size-2 rounded-full bg-destructive/70" />
            <span className="size-2 rounded-full bg-warning/70" />
            <span className="size-2 rounded-full bg-success/70" />
            <div className="mx-auto hidden h-5 w-52 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-muted-foreground sm:flex">
              PM System / Project overview
            </div>
          </div>

          <div className="grid min-h-[390px] grid-cols-[64px_1fr] sm:grid-cols-[170px_1fr] lg:min-h-[520px] lg:grid-cols-[210px_1fr]">
            <aside
              className="border-r border-border bg-card p-3 sm:p-4"
              aria-hidden="true"
            >
              <div className="mb-8 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ClipboardList className="size-4" />
                </span>
                <span className="hidden text-xs font-bold sm:block">
                  PM System
                </span>
              </div>
              <div className="space-y-2">
                {[
                  [Activity, "Overview"],
                  [KanbanSquare, "Projects"],
                  [CircleCheckBig, "Tasks"],
                  [UsersRound, "Team"],
                ].map(([Icon, label], index) => {
                  const MenuIcon = Icon as typeof Activity;
                  return (
                    <div
                      key={label as string}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[10px] font-semibold ${
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <MenuIcon className="size-3.5 shrink-0" />
                      <span className="hidden sm:block">{label as string}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 hidden rounded-xl border border-border bg-secondary/60 p-3 sm:block">
                <div className="mb-2 flex items-center gap-2 text-[9px] font-bold">
                  <ShieldCheck className="size-3 text-primary-2" />
                  Department access
                </div>
                <p className="text-[8px] leading-relaxed text-muted-foreground">
                  Role and department controls are active.
                </p>
              </div>
            </aside>

            <div className="min-w-0 p-3 sm:p-5 lg:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:text-[9px]">
                    Example workspace · Demo data
                  </p>
                  <h3 className="text-base font-extrabold tracking-tight sm:text-xl lg:text-2xl">
                    Project overview
                  </h3>
                </div>
                <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-[9px] font-bold">
                  HM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                {[
                  ["Active projects", "06"],
                  ["In progress", "18"],
                  ["Completed", "42"],
                  ["Blocked", "03"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      index === 0
                        ? "border-primary/60 bg-primary/15"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-[8px] font-medium text-muted-foreground sm:text-[9px]">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-black tracking-tight sm:text-xl">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold sm:text-xs">
                        Website redesign
                      </p>
                      <p className="mt-0.5 text-[8px] text-muted-foreground sm:text-[9px]">
                        Delivery workflow
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-2 py-1 text-[8px] font-bold text-foreground">
                      68% complete
                    </span>
                  </div>
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`${styles.progressFill} h-full w-[68%] rounded-full bg-primary`}
                    />
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <div
                        key={task.name}
                        className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2 sm:px-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[9px] font-semibold sm:text-[10px]">
                            {task.name}
                          </p>
                          <p className="mt-0.5 text-[7px] text-muted-foreground sm:text-[8px]">
                            {task.team}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[7px] font-bold sm:text-[8px] ${
                            index === 0
                              ? "bg-success/15 text-success"
                              : index === 1
                                ? "bg-info/15 text-info"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden rounded-xl border border-border bg-card p-4 lg:block">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">Task dependencies</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        Work in sequence
                      </p>
                    </div>
                    <GitBranch
                      className="size-4 text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-3 border-l-2 border-primary/50 pl-3">
                    {[
                      {
                        task: "Approve UI layouts",
                        team: "UI/UX",
                        status: "Done",
                      },
                      {
                        task: "Build dashboard views",
                        team: "Frontend",
                        status: "In progress",
                      },
                      {
                        task: "Integration review",
                        team: "Backend",
                        status: "Waiting on frontend",
                      },
                    ].map((item) => (
                      <div
                        key={item.task}
                        className="rounded-lg border border-border p-2.5"
                      >
                        <p className="text-[9px] font-semibold">{item.task}</p>
                        <p className="mt-1 text-[8px] text-muted-foreground">
                          {item.team} · {item.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <figcaption
        id="product-preview-caption"
        className="mt-4 text-center text-xs text-muted-foreground"
      >
        Example interface with sample tasks and project data.
      </figcaption>
    </figure>
  );
}
