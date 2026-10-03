import { create } from "zustand";

export type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  show: (msg: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

/** Global toast queue (Zustand) rendered by <Toaster /> in the root layout */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (msg, type = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3000,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable anywhere (components, mutation callbacks) */
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, "success"),
  error: (msg: string) => useToastStore.getState().show(msg, "error"),
};
