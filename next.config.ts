import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination:
          "https://nodewave-backend-production-96e8.up.railway.app/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
