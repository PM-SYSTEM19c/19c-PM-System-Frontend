"use client";

import {
  Activity,
  Briefcase,
  Building2,
  CheckSquare,
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

const NAV_ITEMS = [
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
  {
    label: "Recent Activity",
    href: "/activity",
    icon: Activity,
    roles: ["PM"],
  },
  { label: "Users", href: "/users", icon: Users, roles: ["PM"] },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    roles: ["PM"],
  },
  { label: "Positions", href: "/positions", icon: Briefcase, roles: ["PM"] },
  { label: "Trash", href: "/trash", icon: Trash2, roles: ["PM"] },
];

export function Sidebar() {
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
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-[260px] flex-col border-r border-border bg-background-2 px-4 py-6">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-2 shadow-[0_0_20px_rgba(108,92,231,0.35)]">
          <ClipboardList className="size-5 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold">PM System</div>
          <div className="text-[11px] text-subtle">v1.0</div>
        </div>
      </div>

      {/* User info */}
      <div className="mb-6 rounded-xl bg-card px-4 py-3.5">
        <div className="mb-1 truncate text-sm font-semibold">{user.name}</div>
        <div className="mb-2 truncate text-xs text-muted-foreground">
          {user.email}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={roleVariant}>{user.role}</Badge>
          {user.department && (
            <Badge variant="secondary">{user.department.name}</Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        <div className="mb-1 px-3.5 text-[11px] font-semibold tracking-wider text-subtle uppercase">
          Menu
        </div>
        {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map(
          (item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-card hover:text-foreground",
                  isActive &&
                    "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                )}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          },
        )}
      </nav>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="mt-auto flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-[18px]" />
        Logout
      </button>
    </aside>
  );
}
