"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Layers, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ThemeSelector } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const isDemoEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

const QUICK_LOGINS = isDemoEnabled
  ? [
      {
        label: "PM",
        email: "pm@assessment.test",
        dot: "bg-lime-500",
      },
      {
        label: "UI/UX",
        email: "uiux@assessment.test",
        dot: "bg-pink-500",
      },
      {
        label: "Frontend",
        email: "frontend@assessment.test",
        dot: "bg-cyan-500",
      },
      {
        label: "Backend",
        email: "backend@assessment.test",
        dot: "bg-amber-500",
      },
    ]
  : [];

const FEATURES = [
  {
    icon: Layers,
    title: "Project Tracking",
    desc: "Kanban boards & progress monitoring",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Departments, roles & assignments",
  },
  {
    icon: Shield,
    title: "Access Control",
    desc: "Role-based permissions & visibility",
  },
];

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError("root", {
        message:
          err?.error?.message ||
          err?.message ||
          "Login failed. Please check your credentials.",
      });
    }
  };

  const quickLogin = (email: string) => {
    if (!isDemoEnabled) return;
    setValue("email", email);
    setValue("password", "Password123!");
  };

  return (
    <div className="relative flex min-h-screen bg-background text-foreground overflow-hidden transition-colors">
      {/* Top right theme selector */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeSelector />
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-card border-r border-border px-12 py-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
              <ClipboardList className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground">
                PM System
              </span>
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Network Node Active
              </span>
            </div>
          </div>

          {/* Hero Copy */}
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-foreground mb-4">
            Project Management
          </h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground mb-10 max-w-[360px]">
            Sign in to manage your high-value deliverables with real-time
            stakeholder visibility.
          </p>

          {/* Feature List */}
          <div className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 p-3 rounded-2xl border border-border bg-secondary/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-zinc-900 dark:text-lime-300">
                  <f.icon className="size-4.5" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-foreground mb-0.5">
                    {f.title}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-muted-foreground">
          Enterprise Project Management System · Inspired by Grass.io
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black shadow-xs">
              <ClipboardList className="size-6" />
            </div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-foreground">
              Project Management
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to manage your deliverables
            </p>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground mb-1">
              Welcome back
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>

          {/* Login Form */}
          <Card className="p-6 md:p-7 border-border bg-card shadow-xs">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>

              {errors.root && (
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                  {errors.root.message}
                </div>
              )}

              <Button
                id="login-submit"
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-sm font-bold"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Register here
                </Link>
              </div>
            </form>
          </Card>

          {/* Quick Login Buttons — Only rendered when demo login is enabled */}
          {isDemoEnabled && (
            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4 shadow-xs">
              <p className="mb-2.5 text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Quick Login Demo Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_LOGINS.map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => quickLogin(item.email)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-secondary hover:border-zinc-400 dark:hover:border-zinc-600"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${item.dot}`}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => quickLogin("client@assessment.test")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground"
              >
                <span className="size-2 shrink-0 rounded-full bg-cyan-500" />
                Client Stakeholder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
