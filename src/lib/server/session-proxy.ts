import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { signedProxyClientIpHeaders } from "./proxy-client-ip.ts";

interface ProxyOptions {
  backendUrl: string;
  secureCookies: boolean;
  siteOrigin?: string;
  fetchUpstream?: typeof fetch;
  vercel?: boolean;
  proxySecret?: string;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PUBLIC_PATHS = new Set(["auth/login", "auth/register", "health"]);
const RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "retry-after",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
];

export function sessionCookieNames(secure: boolean) {
  const prefix = secure ? "__Host-" : "";
  return { session: `${prefix}pms-session`, csrf: `${prefix}pms-csrf-seed` };
}

function readCookie(request: Request, name: string): string | undefined {
  const values = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  // Reject ambiguous/shadow cookies instead of picking an untrusted value.
  if (values.length !== 1) return undefined;
  try {
    return decodeURIComponent(values[0].slice(name.length + 1));
  } catch {
    return undefined;
  }
}

function cookie(name: string, value: string, secure: boolean, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function csrfToken(secret: string) {
  return createHmac("sha256", secret).update("pms-csrf-v1").digest("hex");
}

function validCsrf(supplied: string | null, secret: string | undefined) {
  if (!secret || !supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(csrfToken(secret)));
}

function jsonError(status: number, code: string, message: string) {
  return Response.json(
    { success: false, error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Read expiry only for cookie lifetime. Backend JWT verification remains authoritative. */
function tokenLifetime(token: string): number | undefined {
  try {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
      return undefined;
    const { exp } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    if (!Number.isSafeInteger(exp)) return undefined;
    const remaining = exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : undefined;
  } catch {
    return undefined;
  }
}

/** Fixed-upstream browser boundary; never forward browser credentials or upstream cookies. */
export async function proxySessionRequest(
  request: Request,
  path: string[],
  options: ProxyOptions,
): Promise<Response> {
  if (
    path.length === 0 ||
    path.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        /[\\/%?#]/.test(part) ||
        Array.from(part).some((character) => character.charCodeAt(0) < 32),
    )
  )
    return jsonError(400, "INVALID_PATH", "Invalid API path");

  const route = path.join("/");
  const names = sessionCookieNames(options.secureCookies);
  const token = readCookie(request, names.session);
  if (token && !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
    return jsonError(401, "UNAUTHORIZED", "Invalid session cookie");
  const seed = readCookie(request, names.csrf);
  const secret = token || seed;
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const expectedOrigin = options.siteOrigin || new URL(request.url).origin;
  if (
    site === "cross-site" ||
    (origin !== null && origin !== expectedOrigin) ||
    (!SAFE_METHODS.has(request.method) && origin !== expectedOrigin)
  )
    return jsonError(403, "CSRF_INVALID", "Request origin is not allowed");

  if (route === "auth/csrf") {
    if (request.method !== "GET")
      return jsonError(
        405,
        "METHOD_NOT_ALLOWED",
        "Use GET for CSRF initialization",
      );
    const csrfSecret = secret || randomBytes(32).toString("hex");
    const response = Response.json(
      { success: true, data: { csrfToken: csrfToken(csrfSecret) } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    if (!secret)
      response.headers.append(
        "Set-Cookie",
        cookie(names.csrf, csrfSecret, options.secureCookies, 3600),
      );
    return response;
  }

  if (
    !SAFE_METHODS.has(request.method) &&
    !validCsrf(request.headers.get("x-csrf-token"), secret)
  )
    return jsonError(403, "CSRF_INVALID", "Missing or invalid CSRF token");

  const clearSession = (response: Response) => {
    response.headers.append(
      "Set-Cookie",
      cookie(names.session, "", options.secureCookies, 0),
    );
    response.headers.append(
      "Set-Cookie",
      cookie(names.csrf, "", options.secureCookies, 0),
    );
    return response;
  };
  if (!token && !PUBLIC_PATHS.has(route)) {
    if (route === "auth/logout" && request.method === "POST")
      return clearSession(
        Response.json(
          { success: true, data: { message: "Logged out successfully" } },
          { headers: { "Cache-Control": "private, no-store" } },
        ),
      );
    return jsonError(401, "UNAUTHORIZED", "Authentication required");
  }

  let backend: URL;
  try {
    backend = new URL(options.backendUrl);
    if (
      !/^https?:$/.test(backend.protocol) ||
      backend.username ||
      backend.password ||
      backend.search ||
      backend.hash
    )
      throw new Error("Invalid backend URL");
    backend.pathname = `${backend.pathname.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}`;
    backend.search = new URL(request.url).search;
  } catch {
    const failure = jsonError(
      503,
      "API_CONFIGURATION_ERROR",
      "Backend API configuration is unavailable",
    );
    return route === "auth/logout" ? clearSession(failure) : failure;
  }

  const headers = new Headers();
  if (options.vercel) {
    const signedHeaders = signedProxyClientIpHeaders(
      request,
      backend.pathname,
      options.proxySecret ?? "",
    );
    if (!signedHeaders)
      return jsonError(
        503,
        "PROXY_CONFIGURATION_ERROR",
        "Trusted client IP configuration is unavailable",
      );
    for (const [name, value] of Object.entries(signedHeaders))
      headers.set(name, value);
  }
  for (const name of ["content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token && !PUBLIC_PATHS.has(route))
    headers.set("Authorization", `Bearer ${token}`);
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "error",
    signal: request.signal,
  };
  if (!SAFE_METHODS.has(request.method) && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await (options.fetchUpstream ?? fetch)(backend, init);
  } catch {
    const failure = jsonError(
      502,
      "API_UNAVAILABLE",
      "Backend API is temporarily unavailable",
    );
    return route === "auth/logout" ? clearSession(failure) : failure;
  }
  const responseHeaders = new Headers({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  if (route === "auth/login" && request.method === "POST" && upstream.ok) {
    try {
      const result = await upstream.json();
      const accessToken = result?.data?.accessToken;
      const maxAge =
        typeof accessToken === "string"
          ? tokenLifetime(accessToken)
          : undefined;
      if (!result.success || !result.data?.user || !maxAge)
        return jsonError(
          502,
          "INVALID_AUTH_RESPONSE",
          "Backend authentication response is invalid",
        );
      // Only the profile crosses back into JS; token stays in the HttpOnly cookie.
      const response = Response.json(
        { success: true, data: { user: result.data.user } },
        { headers: responseHeaders },
      );
      response.headers.append(
        "Set-Cookie",
        cookie(names.session, accessToken, options.secureCookies, maxAge),
      );
      response.headers.append(
        "Set-Cookie",
        cookie(names.csrf, "", options.secureCookies, 0),
      );
      return response;
    } catch {
      return jsonError(
        502,
        "INVALID_AUTH_RESPONSE",
        "Backend authentication response is invalid",
      );
    }
  }
  const response = new Response(
    request.method === "HEAD" ? null : upstream.body,
    { status: upstream.status, headers: responseHeaders },
  );
  return route === "auth/logout" ? clearSession(response) : response;
}
