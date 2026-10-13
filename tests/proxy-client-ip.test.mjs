import assert from "node:assert/strict";
import { test } from "node:test";
import { signedProxyClientIpHeaders } from "../src/lib/server/proxy-client-ip.ts";
import { proxySessionRequest } from "../src/lib/server/session-proxy.ts";

const secret = "proxy-ip-cross-repo-test-only-secret-never-deploy";
test("signs platform visitor IP without trusting arbitrary forwarded headers", () => {
  for (const ip of ["203.0.113.1", "2001:db8::1"]) {
    const request = new Request("https://frontend.example/api/v1/auth/login", {
      method: "POST",
      headers: {
        "x-vercel-forwarded-for": ip,
        "x-forwarded-for": "attacker",
        "x-pms-client-ip": "attacker",
      },
    });
    const headers = signedProxyClientIpHeaders(
      request,
      "/api/v1/auth/login",
      secret,
    );
    assert.equal(headers["x-pms-client-ip"], ip);
    assert.match(headers["x-pms-proxy-signature"], /^[a-f0-9]{64}$/);
  }
});
test("does not fall back to arbitrary client-IP headers or short signing keys", () => {
  for (const headers of [
    { "x-forwarded-for": "203.0.113.1" },
    { "x-real-ip": "203.0.113.1" },
    { "x-vercel-forwarded-for": "203.0.113.1, 198.51.100.1" },
  ])
    assert.equal(
      signedProxyClientIpHeaders(
        new Request("https://frontend.example", { headers }),
        "/api/v1/auth/login",
        secret,
      ),
      undefined,
    );
  assert.equal(
    signedProxyClientIpHeaders(
      new Request("https://frontend.example", {
        headers: { "x-vercel-forwarded-for": "203.0.113.1" },
      }),
      "/api/v1/auth/login",
      "short",
    ),
    undefined,
  );
});
test("Vercel proxy fails closed when visitor IP/secret is unavailable", async () => {
  const response = await proxySessionRequest(
    new Request("https://frontend.example/api/v1/health"),
    ["health"],
    {
      backendUrl: "https://backend.example/api/v1",
      secureCookies: true,
      vercel: true,
      fetchUpstream: async () => {
        throw new Error("must not call upstream");
      },
    },
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "PROXY_CONFIGURATION_ERROR");
});
test("Vercel proxy replaces spoofed signed headers with server-generated metadata", async () => {
  let accepted;
  const response = await proxySessionRequest(
    new Request("https://frontend.example/api/v1/health", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.1",
        "x-pms-client-ip": "attacker",
        "x-pms-proxy-signature": "attacker",
      },
    }),
    ["health"],
    {
      backendUrl: "https://backend.example/api/v1",
      secureCookies: true,
      vercel: true,
      proxySecret: secret,
      fetchUpstream: async (_url, init) => {
        accepted = init.headers.get("x-pms-client-ip");
        assert.notEqual(init.headers.get("x-pms-proxy-signature"), "attacker");
        return Response.json({ status: "ok" });
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(accepted, "203.0.113.1");
});
