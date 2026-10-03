import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  /** True once the persisted session has been read from localStorage */
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,

      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token });
      },

      clearAuth: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null });
      },

      isRole: (role) => get().user?.role === role,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Route guards must wait for this, otherwise a page refresh sees an
      // "empty" store for one render and wrongly redirects to /login.
      // NOTE: this callback can run synchronously *during* store creation
      // (before `useAuthStore` is assigned), so defer the update.
      onRehydrateStorage: () => () => {
        queueMicrotask(() => useAuthStore.setState({ hasHydrated: true }));
      },
    },
  ),
);

// Safety net: if hydration already completed before the callback could apply
if (typeof window !== "undefined" && useAuthStore.persist.hasHydrated()) {
  queueMicrotask(() => useAuthStore.setState({ hasHydrated: true }));
}
