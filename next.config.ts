import type { NextConfig } from "next";

const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://nodewave-backend-production-96e8.up.railway.app http://localhost:3000 https://vercel.live",
  "frame-src 'self' https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: { proxyClientMaxBodySize: "11mb" },
  async rewrites() {
    const upstream =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_BE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:3000/api/v1");
    if (!upstream) return [];
    const url = new URL(upstream);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error(
        "BACKEND_API_URL must be a fixed HTTP(S) API base without credentials/query/hash",
      );
    const base = url.href.replace(/\/+$/, "");
    // Native external rewrites bypass the Vercel Function payload limit.
    return {
      beforeFiles: [
        {
          source: "/api/v1/uploads/:path*",
          destination: `${base}/uploads/:path*`,
        },
        {
          source: "/api/v1/tasks/:id/attachments/:path*",
          destination: `${base}/tasks/:id/attachments/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
