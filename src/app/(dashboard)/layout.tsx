"use client";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeSelector } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user?.role === "CLIENT") {
      router.push("/client/dashboard");
    }
  }, [user, loading, router]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-6 w-[200px]" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen bg-background text-foreground transition-colors"
      style={
        {
          "--sidebar-width": isSidebarCollapsed ? "72px" : "240px",
        } as CSSProperties
      }
    >
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card p-4 border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
            <span className="text-xs font-mono font-bold">PM</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            PM System
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <button
            type="button"
            onClick={() => {
              setIsSidebarCollapsed(false);
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label={
              isMobileMenuOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={isMobileMenuOpen}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar (Responsive) */}
      <div
        className={`${isMobileMenuOpen ? "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none" : "hidden md:block"}`}
      >
        <div
          className={`${isMobileMenuOpen ? "absolute left-0 top-0 h-full w-[240px] shadow-2xl md:shadow-none" : ""}`}
        >
          <Sidebar
            collapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
            onNavClick={closeMobileMenu}
          />
        </div>
        {/* Overlay click to close */}
        {isMobileMenuOpen && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: mobile overlay backdrop
          // biome-ignore lint/a11y/noStaticElementInteractions: mobile overlay backdrop
          <div
            className="absolute inset-0 z-[-1] md:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </div>

      {/* Main Content — uses sidebar-aware left margin */}
      <main className="md:ml-[var(--sidebar-width)] flex-1 min-w-0 min-h-screen flex flex-col transition-[margin-left] duration-300 ease-out motion-reduce:transition-none">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 hidden md:flex h-16 items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-8 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>
              {user.role === "PM"
                ? "Project Management"
                : user.department?.name || "Workspace"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector (Light, Dark, System) */}
            <ThemeSelector />

            <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs text-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-[1440px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
