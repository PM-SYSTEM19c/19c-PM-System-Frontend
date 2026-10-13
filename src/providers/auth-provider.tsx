"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { clearLegacyAuth } from "@/lib/session-client";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types";

// Re-export a hook that wraps Zustand for backward compat with existing components
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore identity from the backend, not persisted browser credentials.
  useEffect(() => {
    let active = true;
    try {
      clearLegacyAuth(localStorage);
    } catch {
      // Cookie authentication still works when browser storage is unavailable.
    }
    const initialRevision = useAuthStore.getState().revision;
    api
      .getMe()
      .then((res) => {
        if (
          active &&
          useAuthStore.getState().revision === initialRevision &&
          res?.data
        ) {
          useAuthStore.getState().setAuth(res.data as User);
        }
      })
      .catch((err) => {
        // Only an explicit auth rejection ends the session. A network error
        // (e.g. backend restarting) must not log the user out.
        if (
          active &&
          useAuthStore.getState().revision === initialRevision &&
          err?.error?.code === "UNAUTHORIZED"
        ) {
          useAuthStore.getState().clearAuth();
        }
      })
      .finally(() => {
        if (active) useAuthStore.getState().finishHydration();
      });
    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}

export function useAuth() {
  const router = useRouter();
  const { user, setAuth, clearAuth, isRole, hasHydrated } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      if (res?.data?.user) {
        setAuth(res.data.user as User);
        if (res.data.user.role === "CLIENT") {
          router.push("/client/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    },
    [router, setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [router, clearAuth]);

  return {
    user,
    // Guards wait for the cookie-backed session check on refresh.
    loading: !hasHydrated,
    login,
    logout,
    isRole,
  };
}
