import { proxySessionRequest } from "@/lib/server/session-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxySessionRequest(request, path, {
    backendUrl:
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_BE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:3000/api/v1"),
    secureCookies: process.env.NODE_ENV === "production",
    siteOrigin: process.env.SESSION_SITE_ORIGIN,
    vercel: process.env.VERCEL === "1",
    proxySecret: process.env.API_PROXY_SECRET,
  });
}

export {
  handle as GET,
  handle as HEAD,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
