"use client";

import { ClipboardList, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-6 w-[200px]" />
      </div>
    );
  }

  return (
    <div>
      {/* Client Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background-2/90 px-10 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-2">
            <ClipboardList className="size-5 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold">Client Portal</span>
            <span className="ml-2 text-[11px] text-subtle">by PM System</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <UserIcon className="size-4" /> {user.name}
          </span>
          <Button size="sm" variant="secondary" onClick={logout}>
            <LogOut /> Logout
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-10 py-8">{children}</main>
    </div>
  );
}
