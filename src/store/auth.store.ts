import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  hasHydrated: boolean;
  revision: number;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  finishHydration: () => void;
  isRole: (role: string) => boolean;
}

/** UI identity only. Credentials live in the server-set HttpOnly cookie. */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  hasHydrated: false,
  revision: 0,
  setAuth: (user) =>
    set((state) => ({ user, hasHydrated: true, revision: state.revision + 1 })),
  clearAuth: () =>
    set((state) => ({
      user: null,
      hasHydrated: true,
      revision: state.revision + 1,
    })),
  finishHydration: () => set({ hasHydrated: true }),
  isRole: (role) => get().user?.role === role,
}));
