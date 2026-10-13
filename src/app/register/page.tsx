"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ThemeSelector } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["INTERNAL", "CLIENT"]),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "INTERNAL" },
  });

  const role = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await api.register(data);
      setSuccess(true);
    } catch (err: any) {
      setError("root", {
        message:
          err?.error?.message ||
          err?.message ||
          "Registration failed. Please try again.",
      });
    }
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
            </div>
          </div>

          {/* Hero Copy */}
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-foreground mb-4">
            Create Account
          </h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground mb-10 max-w-[360px]">
            Join the Project Management System to collaborate with managers,
            developers, and clients.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-4">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Fill in your details to get started",
              },
              {
                step: "02",
                title: "Wait for approval",
                desc: "A project manager will review your request",
              },
              {
                step: "03",
                title: "Start collaborating",
                desc: "Access projects, tasks and your dashboard",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-3.5 p-3 rounded-2xl border border-border bg-secondary/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-zinc-900 dark:text-lime-300 text-[12px] font-bold font-mono">
                  {s.step}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-foreground mb-0.5">
                    {s.title}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Join the Project Management System
            </p>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground mb-1">
              Get started
            </h2>
            <p className="text-xs text-muted-foreground">
              Create your account to join the team
            </p>
          </div>

          <Card className="p-6 md:p-7 border-border bg-card shadow-xs">
            {success ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-8" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  Registration Complete!
                </h2>
                <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
                  Your account is pending PM approval. You will be able to log
                  in once a manager approves your account and assigns your
                  position.
                </p>
                <Button
                  className="w-full font-bold"
                  onClick={() => router.push("/login")}
                >
                  Return to Login
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    placeholder="John Doe"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError message={errors.email?.message} />
                </div>

                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="At least 8 characters"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FieldError message={errors.password?.message} />
                </div>

                <div>
                  <Label htmlFor="register-role">Account Type</Label>
                  <NativeSelect id="register-role" {...register("role")}>
                    <option value="INTERNAL">Internal Team</option>
                    <option value="CLIENT">Client</option>
                  </NativeSelect>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {role === "INTERNAL"
                      ? "For team members. A manager will assign your position."
                      : "For external clients to view deliverables."}
                  </p>
                </div>

                {errors.root && (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                    {errors.root.message}
                  </div>
                )}

                <Button
                  id="register-submit"
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full text-sm font-bold"
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
