import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/** Call only on Vercel, where the platform replaces the visitor-IP header. */
export function signedProxyClientIpHeaders(
  request: Request,
  upstreamPath: string,
  secret: string,
  now = Date.now(),
): Record<string, string> | undefined {
  const ip = request.headers.get("x-vercel-forwarded-for");
  if (!ip || !isIP(ip) || secret.length < 32) return undefined;
  const timestamp = Math.floor(now / 1000).toString();
  const signature = createHmac("sha256", secret)
    .update(
      `${timestamp}\n${ip}\n${request.method.toUpperCase()}\n${upstreamPath}`,
    )
    .digest("hex");
  return {
    "x-pms-client-ip": ip,
    "x-pms-proxy-time": timestamp,
    "x-pms-proxy-signature": signature,
  };
}
