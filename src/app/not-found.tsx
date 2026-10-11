import { Compass, Home, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <Card className="w-full max-w-[480px] p-8 text-center animate-fade-in border-border shadow-2xl">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Compass className="size-8 animate-pulse" />
        </div>
        <div className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">
          Error 404
        </div>
        <h1 className="mb-3 text-[26px] font-extrabold text-foreground">
          Page Not Found
        </h1>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          The page you are looking for does not exist, has been removed, or is
          temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href="/dashboard">
              <Home className="size-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link href="/login">
              <LogIn className="size-4" />
              Sign In
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
