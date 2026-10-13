"use client";

import {
  Activity,
  Briefcase,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const NAV_GROUPS = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["PM", "INTERNAL"],
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        roles: ["PM", "INTERNAL"],
      },
      {
        label: "Your Tasks",
        href: "/tasks",
        icon: CheckSquare,
        roles: ["INTERNAL"],
      },
    ],
  },
  {
    title: "ORGANIZATION",
    items: [
      { label: "Users", href: "/users", icon: Users, roles: ["PM"] },
      {
        label: "Departments",
        href: "/departments",
        icon: Building2,
        roles: ["PM"],
      },
      {
        label: "Positions",
        href: "/positions",
        icon: Briefcase,
        roles: ["PM"],
      },
    ],
  },
  {
    title: "AUDIT & ARCHIVE",
    items: [
      {
        label: "Recent Activity",
        href: "/activity",
        icon: Activity,
        roles: ["PM"],
      },
      { label: "Trash", href: "/trash", icon: Trash2, roles: ["PM"] },
    ],
  },
];

export function Sidebar({
  collapsed,
  onCollapsedChange,
  onNavClick,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleVariant =
    user.role === "PM"
      ? "default"
      : user.role === "INTERNAL"
        ? "teal"
        : "secondary";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r border-border bg-card text-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
            <ClipboardList className="size-4.5" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight text-foreground">
              PM System
            </span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(user.role),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150",
                      collapsed && "justify-center px-0 py-2.5",
                      isActive
                        ? "bg-[#E2F793] text-zinc-950 font-bold border border-zinc-900/10 dark:bg-primary/20 dark:text-lime-300 dark:border-primary/25 shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        isActive
                          ? "text-zinc-950 dark:text-lime-300"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="hidden md:block px-3 py-1.5 border-t border-border">
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center rounded-lg py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* User Section + Theme Selector + Logout */}
      <div className="border-t border-border p-3 bg-secondary/30">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 bg-card border border-border shadow-xs",
            collapsed && "justify-center p-1.5 border-0 bg-transparent",
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-zinc-900 dark:text-lime-300">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-foreground leading-tight">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">
                {user.email}
              </div>
            </div>
          )}
        </div>

        {/* Role badge (only when expanded) */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-1 mt-2 mb-2">
            <Badge variant={roleVariant} className="text-[10px] px-2 py-0">
              {user.role}
            </Badge>
            {user.department && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {user.department.name}
              </Badge>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            logout();
            if (onNavClick) onNavClick();
          }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
