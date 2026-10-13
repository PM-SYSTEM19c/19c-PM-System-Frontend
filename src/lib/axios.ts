import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { getCsrfToken } from "./session-client";

export const axiosInstance = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Session cookies are sent by the browser, never read by JavaScript.
axiosInstance.interceptors.request.use(async (config) => {
  if (
    !["get", "head", "options"].includes(config.method?.toLowerCase() ?? "get")
  )
    config.headers["X-CSRF-Token"] = await getCsrfToken();
  return config;
});

// Response interceptor: handle 401 globally (token invalid or expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.url !== "/auth/me" &&
      typeof window !== "undefined"
    ) {
      useAuthStore.getState().clearAuth();
      if (
        error.config?.url !== "/auth/me" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);
