"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.role === "CLIENT") {
          router.push("/client/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="sr-only">
        Project Management System | Deliverables &amp; Client Visibility
      </h1>
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-6 w-[200px]" />
        <noscript>
          <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Project Management System
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Operational backbone for managing high-value project deliverables
              with state-based permissions, cross-department dependencies, and
              client visibility.
            </p>
            <div className="flex gap-4 justify-center text-sm font-semibold">
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </div>
        </noscript>
      </div>
    </main>
  );
}
