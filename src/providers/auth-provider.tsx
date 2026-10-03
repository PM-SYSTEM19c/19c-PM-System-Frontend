"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types";

// Re-export a hook that wraps Zustand for backward compat with existing components
export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, setAuth, hasHydrated } = useAuthStore();

  // Once the persisted session is restored, revalidate it with the server.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once after hydration
  useEffect(() => {
    if (!hasHydrated || !token) return;
    api
      .getMe()
      .then((res) => {
        if (res?.data) {
          setAuth(res.data as User, token);
        }
      })
      .catch((err) => {
        // Only an explicit auth rejection ends the session. A network error
        // (e.g. backend restarting) must not log the user out.
        if (err?.error?.code === "UNAUTHORIZED") {
          useAuthStore.getState().clearAuth();
        }
      });
  }, [hasHydrated]);

  return <>{children}</>;
}

export function useAuth() {
  const router = useRouter();
  const { user, token, setAuth, clearAuth, isRole, hasHydrated } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      if (res?.data?.accessToken) {
        setAuth(res.data.user as User, res.data.accessToken);
        if (res.data.user.role === "CLIENT") {
          router.push("/client/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    },
    [router, setAuth],
  );

  const logout = useCallback(() => {
    api.logout();
    clearAuth();
    router.push("/login");
  }, [router, clearAuth]);

  return {
    user,
    // Still loading until the stored session is read (prevents refresh → /login)
    loading: !hasHydrated || (token !== null && user === null),
    login,
    logout,
    isRole,
  };
}
