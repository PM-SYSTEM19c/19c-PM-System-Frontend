"use client";

import {
  AlertTriangle,
  BarChart2,
  Building2,
  Calendar,
  Lock,
  Search,
  User as UserIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bar: string; text: string; bg: string }> =
  {
    TODO: {
      bar: "#0284c7",
      text: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
    },
    IN_PROGRESS: {
      bar: "#d97706",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    DONE: {
      bar: "#16a34a",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    BLOCKED: {
      bar: "#ef4444",
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
  };

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "Berjalan",
  DONE: "Selesai",
  BLOCKED: "Terblokir",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  return new Date(s);
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GanttRow {
  task: Task;
  start: Date;
  end: Date;
  durationDays: number;
  status: string;
  hasSchedule: boolean;
  isOverdue: boolean;
}

interface GanttChartProps {
  tasks: Task[];
}

const COL_WIDTH_PRESETS = [24, 32, 48, 64]; // px per day

export function GanttChart({ tasks }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayLineRef = useRef<HTMLDivElement>(null);

  const [colWidthIdx, setColWidthIdx] = useState(1); // default 32px/day
  const colWidth = COL_WIDTH_PRESETS[colWidthIdx];

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Hover state for interactive tooltip
  const [hoveredRow, setHoveredRow] = useState<GanttRow | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const labelWidth = 270; // px — wider for title + assignee + department
  const ROW_HEIGHT = 46;
  const HEADER_HEIGHT = 56;

  // ── Build rows ────────────────────────────────────────────────────────────
  const allRows: GanttRow[] = useMemo(() => {
    return tasks
      .map((t) => {
        const hasSchedule = Boolean(t.startDate || t.dueDate);
        const start = parseDate(t.startDate ?? t.createdAt);
        const rawEnd = parseDate(t.dueDate ?? t.updatedAt);
        const end = rawEnd <= start ? addDays(start, 1) : rawEnd;
        const isOverdue =
          hasSchedule && t.effectiveStatus !== "DONE" && end < new Date();
        return {
          task: t,
          start,
          end,
          durationDays: Math.max(1, daysBetween(start, end)),
          status: t.effectiveStatus,
          hasSchedule,
          isOverdue,
        };
      })
      .sort((a, b) => {
        if (a.hasSchedule !== b.hasSchedule) {
          return a.hasSchedule ? -1 : 1;
        }

        const startDifference = a.start.getTime() - b.start.getTime();
        if (startDifference !== 0) return startDifference;

        return (
          new Date(a.task.createdAt).getTime() -
          new Date(b.task.createdAt).getTime()
        );
      });
  }, [tasks]);

  // Filtered rows based on toolbar filters
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "BLOCKED" && r.status === "BLOCKED") ||
        (statusFilter === "ACTIVE" &&
          (r.status === "TODO" || r.status === "IN_PROGRESS")) ||
        r.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.task.title.toLowerCase().includes(q) ||
        r.task.assignee?.name.toLowerCase().includes(q) ||
        r.task.department?.name.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [allRows, statusFilter, searchQuery]);

  // ── Timeline boundaries (calculated from all tasks to maintain scale) ──────
  const hasRows = allRows.length > 0;
  const minDate = hasRows
    ? new Date(Math.min(...allRows.map((r) => r.start.getTime())))
    : new Date();
  const maxDate = hasRows
    ? new Date(Math.max(...allRows.map((r) => r.end.getTime())))
    : new Date();
  const timelineStart = minDate;
  const timelineEnd = maxDate;
  const totalDays = Math.max(1, daysBetween(timelineStart, timelineEnd));
  const totalWidth = totalDays * colWidth;

  // Today marker
  const todayOffset = daysBetween(timelineStart, new Date());
  const todayX = todayOffset * colWidth;
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  // Count stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.effectiveStatus === "DONE").length;
    const blocked = tasks.filter((t) => t.effectiveStatus === "BLOCKED").length;
    const inProgress = tasks.filter(
      (t) => t.effectiveStatus === "IN_PROGRESS",
    ).length;
    return { total, done, blocked, inProgress };
  }, [tasks]);

  // ── Scroll to today on mount / colWidth change ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (scrollRef.current && showToday) {
      const target = Math.max(0, todayX - scrollRef.current.clientWidth / 2);
      scrollRef.current.scrollLeft = target;
    }
  }, [colWidth]);

  if (!hasRows) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-subtle">
        <BarChart2 className="mb-3 size-10 opacity-30" />
        <p className="text-sm font-medium">
          Belum ada tugas untuk ditampilkan di timeline
        </p>
      </div>
    );
  }

  // ── Header months ─────────────────────────────────────────────────────────
  const months: { label: string; days: number; startDay: number }[] = [];
  let cursor = new Date(timelineStart);
  let dayIdx = 0;
  while (cursor <= timelineEnd) {
    const month = cursor.getMonth();
    const year = cursor.getFullYear();
    let count = 0;
    const startDay = dayIdx;
    while (
      cursor <= timelineEnd &&
      cursor.getMonth() === month &&
      cursor.getFullYear() === year
    ) {
      count++;
      dayIdx++;
      cursor = addDays(cursor, 1);
    }
    months.push({
      label: new Date(year, month, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      days: count,
      startDay,
    });
  }

  // Day labels — adaptive interval
  const dayInterval =
    colWidth <= 24 ? 7 : colWidth <= 32 ? 5 : colWidth <= 48 ? 3 : 1;
  const dayHeaders: { label: string; index: number }[] = [];
  for (let i = 0; i < totalDays; i += dayInterval) {
    dayHeaders.push({
      label: formatDateShort(addDays(timelineStart, i)),
      index: i,
    });
  }

  function getTooltipPosition() {
    const tooltipWidth = 288;
    const tooltipHeight = 260;
    const gap = 10;
    const timelineBounds = scrollRef.current?.getBoundingClientRect();
    const viewportWidth =
      timelineBounds?.right ??
      (typeof window !== "undefined" ? window.innerWidth : 1200);
    const viewportLeft = timelineBounds?.left ?? 0;
    const viewportTop = timelineBounds?.top ?? 0;
    const viewportBottom =
      timelineBounds?.bottom ??
      (typeof window !== "undefined" ? window.innerHeight : 800);
    const fitsRight = mousePos!.x + gap + tooltipWidth <= viewportWidth - 8;
    const fitsBelow = mousePos!.y + gap + tooltipHeight <= viewportBottom - 8;
    const preferredLeft = fitsRight
      ? mousePos!.x + gap
      : mousePos!.x - tooltipWidth - gap;
    const preferredTop = fitsBelow
      ? mousePos!.y + gap
      : mousePos!.y - tooltipHeight - gap;

    return {
      left: Math.min(
        Math.max(viewportLeft + 8, preferredLeft),
        viewportWidth - tooltipWidth - 8,
      ),
      top: Math.min(
        Math.max(viewportTop + 8, preferredTop),
        viewportBottom - tooltipHeight - 8,
      ),
    };
  }

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari tugas, PIC, divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 rounded-lg border border-border bg-card pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-md px-2.5 py-1 transition",
                statusFilter === "ALL"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={cn(
                "rounded-md px-2.5 py-1 transition",
                statusFilter === "ACTIVE"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Aktif (
              {stats.inProgress +
                (stats.total - stats.done - stats.blocked - stats.inProgress)}
              )
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("BLOCKED")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 transition",
                statusFilter === "BLOCKED"
                  ? "bg-destructive/15 text-destructive font-semibold"
                  : "text-muted-foreground hover:text-destructive",
              )}
            >
              <Lock className="size-3 text-destructive" />
              Blocked ({stats.blocked})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DONE")}
              className={cn(
                "rounded-md px-2.5 py-1 transition",
                statusFilter === "DONE"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Done ({stats.done})
            </button>
          </div>
        </div>

        {/* Right: Date Range & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs text-subtle lg:flex">
            <span className="font-semibold text-foreground">
              {formatDate(minDate)}
            </span>
            <span>→</span>
            <span className="font-semibold text-foreground">
              {formatDate(maxDate)}
            </span>
            <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
              {daysBetween(minDate, maxDate)} hari
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              type="button"
              onClick={() => setColWidthIdx((i) => Math.max(0, i - 1))}
              disabled={colWidthIdx === 0}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="min-w-[48px] text-center font-mono text-[11px] text-subtle">
              {colWidth}px
            </span>
            <button
              type="button"
              onClick={() =>
                setColWidthIdx((i) =>
                  Math.min(COL_WIDTH_PRESETS.length - 1, i + 1),
                )
              }
              disabled={colWidthIdx === COL_WIDTH_PRESETS.length - 1}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>

            {showToday && (
              <button
                type="button"
                onClick={() => {
                  if (scrollRef.current) {
                    const target = Math.max(
                      0,
                      todayX - scrollRef.current.clientWidth / 2,
                    );
                    scrollRef.current.scrollTo({
                      left: target,
                      behavior: "smooth",
                    });
                  }
                }}
                className="ml-1 inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/20"
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: colors.bar }}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                {STATUS_LABELS[status] ?? status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        <span className="text-[11px] text-subtle">
          Menampilkan {filteredRows.length} dari {allRows.length} tugas
        </span>
      </div>

      {/* ── Chart ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex">
          {/* Left: Task labels column */}
          <div
            className="relative z-10 shrink-0 border-r border-border bg-card shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]"
            style={{ width: labelWidth }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-border bg-surface-2 px-3"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="text-[11px] font-bold tracking-wider text-subtle uppercase">
                Tugas & PIC ({filteredRows.length})
              </span>
              <span className="text-[10px] text-subtle">Divisi</span>
            </div>

            {/* Rows */}
            {filteredRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center p-4 text-center text-xs text-subtle">
                Tidak ada tugas yang cocok dengan filter
              </div>
            ) : (
              filteredRows.map((row, idx) => {
                const colors = STATUS_COLORS[row.status] || STATUS_COLORS.TODO;
                const isHovered = hoveredRow?.task.id === row.task.id;
                const isBlocked = row.status === "BLOCKED";

                return (
                  <div
                    key={row.task.id}
                    style={{ height: ROW_HEIGHT }}
                    className={cn(
                      "flex flex-col justify-center border-b border-border/60 px-3 transition-colors",
                      isHovered
                        ? "bg-primary/5"
                        : idx % 2 === 0
                          ? "bg-card"
                          : "bg-surface-2/30",
                    )}
                  >
                    {/* Line 1: Status dot, Title, Lock if blocked */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors.bar }}
                      />
                      <Link
                        href={`/tasks/${row.task.id}`}
                        className="truncate text-[12px] font-semibold text-foreground transition hover:text-primary hover:underline"
                        title={row.task.title}
                      >
                        {row.task.title}
                      </Link>
                      {isBlocked && (
                        <span
                          className="inline-flex shrink-0 items-center text-destructive"
                          title="Tugas ini terblokir (Blocked)"
                        >
                          <Lock className="size-3" />
                        </span>
                      )}
                    </div>

                    {/* Line 2: Department Tag + Assignee Name */}
                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <UserIcon className="size-2.5 shrink-0 text-subtle" />
                        <span className="truncate">
                          {row.task.assignee?.name || "Unassigned"}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-sm bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium text-subtle">
                        {row.task.department?.name || "-"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Scrollable timeline */}
          <div
            ref={scrollRef}
            className="min-w-0 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            <div
              style={{
                width: totalWidth,
                minWidth: "100%",
                position: "relative",
              }}
            >
              {/* Month header row */}
              <div
                className="flex border-b border-border bg-surface-2"
                style={{ height: 28 }}
              >
                {months.map((m) => (
                  <div
                    key={`${m.label}-${m.startDay}`}
                    className="flex shrink-0 items-center border-r border-border/50 px-2"
                    style={{ width: m.days * colWidth }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day header row */}
              <div
                className="relative border-b border-border bg-surface-3/50"
                style={{ height: 28 }}
              >
                {dayHeaders.map((d) => (
                  <div
                    key={d.index}
                    className="absolute flex items-center"
                    style={{
                      left: d.index * colWidth,
                      height: 28,
                      width: dayInterval * colWidth,
                    }}
                  >
                    <span className="pl-1 font-mono text-[9px] text-subtle">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task bar rows */}
              {filteredRows.map((row, idx) => {
                const startOffset = daysBetween(timelineStart, row.start);
                const barWidth = Math.max(row.durationDays * colWidth - 2, 8);
                const barLeft = startOffset * colWidth + 1;
                const colors = STATUS_COLORS[row.status] || STATUS_COLORS.TODO;
                const isHovered = hoveredRow?.task.id === row.task.id;
                const isBlocked = row.status === "BLOCKED";

                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: tooltip hover
                  <div
                    key={row.task.id}
                    onMouseEnter={(e) => {
                      setHoveredRow(row);
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) =>
                      setMousePos({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredRow(null)}
                    className={cn(
                      "relative border-b border-border/60 transition-colors",
                      isHovered
                        ? "bg-primary/5"
                        : idx % 2 === 0
                          ? "bg-card"
                          : "bg-surface-2/20",
                    )}
                    style={{ height: ROW_HEIGHT, width: totalWidth }}
                  >
                    {/* Grid lines */}
                    {dayHeaders.map((d) => (
                      <div
                        key={d.index}
                        className="pointer-events-none absolute top-0 h-full border-l border-border/15"
                        style={{ left: d.index * colWidth }}
                      />
                    ))}

                    {/* Today column highlight */}
                    {showToday && (
                      <div
                        className="pointer-events-none absolute top-0 h-full bg-primary/5"
                        style={{ left: todayX - colWidth / 2, width: colWidth }}
                      />
                    )}

                    {/* Gantt Bar */}
                    <div
                      className={cn(
                        "group absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-sm border shadow-xs transition-colors",
                        isHovered
                          ? "ring-2 ring-primary ring-offset-1 z-10"
                          : "",
                        isBlocked ? "border border-destructive/60" : "",
                        row.isOverdue
                          ? "border-red-500 bg-red-500/20"
                          : !row.hasSchedule
                            ? "border-dashed border-muted-foreground/60 bg-muted-foreground/10"
                            : "",
                      )}
                      style={{
                        left: barLeft,
                        width: barWidth,
                        height: 18,
                        backgroundColor:
                          row.isOverdue || !row.hasSchedule
                            ? undefined
                            : colors.bar,
                        opacity: row.status === "DONE" ? 0.7 : 1,
                      }}
                    ></div>
                  </div>
                );
              })}

              {/* Today vertical line */}
              {showToday && (
                <div
                  ref={todayLineRef}
                  className="pointer-events-none absolute top-0 z-20 w-px bg-primary/80"
                  style={{
                    left: todayX,
                    height: HEADER_HEIGHT + filteredRows.length * ROW_HEIGHT,
                  }}
                >
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground whitespace-nowrap">
                    HARI INI
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Floating Tooltip Card ────────────────────── */}
      {hoveredRow && mousePos && (
        <div
          className="pointer-events-none fixed z-50 w-72 rounded-xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md transition-all text-xs"
          style={getTooltipPosition()}
        >
          {/* Header: Title & Status */}
          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
            <span className="font-bold text-foreground line-clamp-2">
              {hoveredRow.task.title}
            </span>
            <StatusBadge status={hoveredRow.status} />
          </div>

          {/* Details */}
          <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
            {/* PIC / Assignee */}
            <div className="flex items-center gap-2">
              <UserIcon className="size-3 text-subtle" />
              <span className="text-subtle">PIC:</span>
              <span className="font-medium text-foreground">
                {hoveredRow.task.assignee?.name || "Belum ditugaskan"}
              </span>
              {hoveredRow.task.assignee?.position?.name && (
                <span className="text-[10px] text-subtle">
                  ({hoveredRow.task.assignee.position.name})
                </span>
              )}
            </div>
            {hoveredRow.isOverdue && (
              <div className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle className="size-3" />
                <span>Task melewati due date</span>
              </div>
            )}
            {!hoveredRow.hasSchedule && (
              <div className="text-[10px] text-subtle">
                Task ini belum memiliki jadwal. Tanggal yang tampil adalah
                fallback dari waktu pembuatan/perubahan.
              </div>
            )}

            {/* Department */}
            <div className="flex items-center gap-2">
              <Building2 className="size-3 text-subtle" />
              <span className="text-subtle">Divisi:</span>
              <span className="font-medium text-foreground">
                {hoveredRow.task.department?.name || "-"}
              </span>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-2">
              <Calendar className="size-3 text-subtle" />
              <span className="text-subtle">Durasi:</span>
              <span className="font-medium text-foreground">
                {formatDate(hoveredRow.start)} → {formatDate(hoveredRow.end)}
              </span>
              <span className="font-mono text-[10px] text-primary font-bold">
                ({hoveredRow.durationDays} hari)
              </span>
            </div>
          </div>

          {/* Blocked by Alert inside Tooltip */}
          {hoveredRow.status === "BLOCKED" && (
            <div className="mt-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Terblokir (Prasyarat Belum Selesai)</span>
              </div>
              {hoveredRow.task.blockedBy &&
              hoveredRow.task.blockedBy.length > 0 ? (
                <ul className="mt-1 list-disc pl-4 text-[10px] space-y-0.5">
                  {hoveredRow.task.blockedBy.map((b) => (
                    <li key={b.id}>
                      <span className="font-semibold">{b.title}</span> (
                      {b.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[10px] text-destructive/80">
                  Menunggu tugas prasyarat yang belum berstatus DONE.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
