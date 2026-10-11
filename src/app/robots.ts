import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://nodewave-frontend-plum.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/tasks",
          "/tasks/*",
          "/projects",
          "/projects/*",
          "/users",
          "/users/*",
          "/departments",
          "/departments/*",
          "/positions",
          "/positions/*",
          "/activity",
          "/activity/*",
          "/trash",
          "/trash/*",
          "/client",
          "/client/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
