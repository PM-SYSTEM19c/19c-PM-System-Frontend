"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user?.role === "CLIENT") {
      router.push("/client/dashboard");
    }
  }, [user, loading, router]);

  // Close mobile menu when navigating (can be inferred by location change, but simpler just to close on any click inside main)
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-6 w-[200px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-background-2 p-4 border-b border-border sticky top-0 z-30">
        <div className="text-[15px] font-bold">PM System</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <div className={`${isMobileMenuOpen ? "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none" : "hidden md:block"}`}>
        <div className={`${isMobileMenuOpen ? "absolute left-0 top-0 h-full w-[260px] shadow-2xl md:shadow-none" : ""}`}>
          <Sidebar onNavClick={closeMobileMenu} />
        </div>
        {/* Overlay click to close */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-[-1] md:hidden" onClick={closeMobileMenu}></div>
        )}
      </div>

      {/* Main Content */}
      <main className="md:ml-[260px] flex-1 px-4 md:px-10 py-6 md:py-8 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
