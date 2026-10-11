"use client";

import { ClipboardList, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeSelector } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "CLIENT") router.push("/dashboard");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-6 w-[200px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Client Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/90 px-4 md:px-10 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-foreground">
              Client Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <ThemeSelector />

          <span className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-foreground truncate max-w-[140px] md:max-w-none">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-mono font-bold text-zinc-900 dark:text-lime-300">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{user.name}</span>
          </span>

          <Button
            size="sm"
            variant="secondary"
            onClick={logout}
            className="rounded-full h-8 text-xs"
          >
            <LogOut className="size-3.5 md:mr-1.5" />{" "}
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 md:px-8 py-6 md:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
