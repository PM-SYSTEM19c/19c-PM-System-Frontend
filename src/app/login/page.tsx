"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const QUICK_LOGINS = [
  {
    label: "PM",
    email: "pm@assessment.test",
    dot: "bg-[#6c5ce7]",
    hover: "hover:border-[#6c5ce7]",
  },
  {
    label: "UI/UX",
    email: "uiux@assessment.test",
    dot: "bg-[#e84393]",
    hover: "hover:border-[#e84393]",
  },
  {
    label: "Frontend",
    email: "frontend@assessment.test",
    dot: "bg-[#00cec9]",
    hover: "hover:border-[#00cec9]",
  },
  {
    label: "Backend",
    email: "backend@assessment.test",
    dot: "bg-[#fdcb6e]",
    hover: "hover:border-[#fdcb6e]",
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
    setValue("email", email);
    setValue("password", "Password123!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,rgba(108,92,231,0.15)_0%,transparent_60%)] px-5">
      <div className="w-full max-w-[440px] animate-fade-in">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-[0_0_40px_rgba(108,92,231,0.4)]">
            <ClipboardList className="size-7 text-white" />
          </div>
          <h1 className="mb-2 text-[28px] font-extrabold">
            Project Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your projects and tasks
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
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
              <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                {errors.root.message}
              </div>
            )}

            <Button
              id="login-submit"
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full text-[15px]"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-[13px] text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Register here
              </Link>
            </div>
          </form>
        </Card>

        {/* Quick Login Buttons */}
        <div className="mt-6">
          <p className="mb-3 text-center text-xs text-subtle">
            Quick Login (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LOGINS.map((item) => (
              <button
                key={item.email}
                type="button"
                onClick={() => quickLogin(item.email)}
                className={`flex items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] transition-all ${item.hover}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${item.dot}`} />
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => quickLogin("client@assessment.test")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] transition-all hover:border-[#636e72]"
          >
            <span className="size-2 shrink-0 rounded-full bg-[#636e72]" />
            Client Guest
          </button>
        </div>
      </div>
    </div>
  );
}
