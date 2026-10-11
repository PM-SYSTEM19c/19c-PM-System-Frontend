"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--primary)_15%,transparent)_0%,transparent_60%)] px-5 py-10">
      <div className="w-full max-w-[440px] animate-fade-in">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-[0_0_40px_color-mix(in_srgb,var(--primary)_40%,transparent)]">
            <ClipboardList className="size-7 text-white" />
          </div>
          <h1 className="mb-2 text-[28px] font-extrabold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Join the Project Management System
          </p>
        </div>

        <Card className="p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 size-12 text-success" />
              <h2 className="mb-3 text-lg font-bold">Registration Complete!</h2>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Your account is pending PM approval. You will be able to log in
                once a manager approves your account and assigns your position.
              </p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Return to Login
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
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
                <p className="mt-1.5 text-[11px] text-subtle">
                  {role === "INTERNAL"
                    ? "For employees. A manager will assign your position."
                    : "For external clients to view projects."}
                </p>
              </div>

              {errors.root && (
                <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                  {errors.root.message}
                </div>
              )}

              <Button
                id="register-submit"
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-[15px]"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </Button>

              <div className="text-center text-[13px] text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
