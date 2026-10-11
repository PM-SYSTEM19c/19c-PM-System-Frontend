"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error to console
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <Card className="w-full max-w-[480px] p-8 text-center animate-fade-in border-border shadow-2xl">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="size-8" />
        </div>
        <div className="mb-2 text-xs font-bold tracking-widest text-destructive uppercase">
          Application Error
        </div>
        <h1 className="mb-3 text-[26px] font-extrabold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          {error.message ||
            "An unexpected error occurred while rendering this page. You can try refreshing the component."}
        </p>
        {error.digest && (
          <div className="mb-6 rounded-md bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
            Error ID: {error.digest}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} variant="default" className="gap-2">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link href="/dashboard">
              <Home className="size-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
