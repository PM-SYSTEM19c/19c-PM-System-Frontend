import assert from "node:assert/strict";
import { test } from "node:test";
import {
  proxySessionRequest,
  sessionCookieNames,
} from "../src/lib/server/session-proxy.ts";

const origin = "https://frontend.example";
const user = { id: "pm", role: "PM", departmentId: null };
const options = {
  backendUrl: "https://backend.example/api/v1",
  secureCookies: true,
};
const names = sessionCookieNames(true);
const token = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;
const session = `${names.session}=${token}`;

function request(
  path,
  { method = "GET", cookie, csrf, ...headers } = {},
  body,
) {
  return new Request(`${origin}/api/v1/${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...headers,
    },
    ...(body ? { body } : {}),
  });
}
async function csrf(cookie) {
  const response = await proxySessionRequest(
    request("auth/csrf", { cookie }),
    ["auth", "csrf"],
    options,
  );
  return {
    value: (await response.json()).data.csrfToken,
    cookie: response.headers.getSetCookie()[0]?.split(";")[0] || cookie,
  };
}

test("anonymous CSRF initialization uses a host-only secure HttpOnly seed and no cache", async () => {
  const response = await proxySessionRequest(
    request("auth/csrf"),
    ["auth", "csrf"],
    options,
  );
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("set-cookie"),
    /__Host-pms-csrf-seed=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=3600; Secure/,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).data.csrfToken.length, 64);
});

test("CSRF token is bound to the current session, not the anonymous seed or another account", async () => {
  const anonymous = await csrf();
  const signedIn = await csrf(session);
  const other = await csrf(`${names.session}=header.other.signature`);
  assert.notEqual(anonymous.value, signedIn.value);
  assert.notEqual(signedIn.value, other.value);
  assert.equal((await csrf(session)).value, signedIn.value);
});

for (const headers of [
  {},
  { Origin: "null" },
  { Origin: "https://attacker.example" },
  { Origin: "https://frontend.example.attacker.example" },
  { Origin: origin, "Sec-Fetch-Site": "cross-site" },
  { Origin: origin, csrf: "wrong" },
]) {
  test(`rejects unsafe request before upstream call: ${JSON.stringify(headers)}`, async () => {
    let calls = 0;
    const response = await proxySessionRequest(
      request(
        "auth/login",
        { method: "POST", cookie: session, ...headers },
        "{}",
      ),
      ["auth", "login"],
      {
        ...options,
        fetchUpstream: async () => {
          calls++;
          return Response.json({});
        },
      },
    );
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "CSRF_INVALID");
    assert.equal(calls, 0);
  });
}

test("valid login sets cookie with JWT lifetime, strips token from JSON, and rotates CSRF context", async () => {
  const anonymous = await csrf();
  const response = await proxySessionRequest(
    request(
      "auth/login",
      {
        method: "POST",
        cookie: anonymous.cookie,
        csrf: anonymous.value,
        Origin: origin,
        "Content-Type": "application/json",
      },
      "{}",
    ),
    ["auth", "login"],
    {
      ...options,
      fetchUpstream: async (_url, init) => {
        assert.equal(init.headers.get("authorization"), null);
        return Response.json(
          { success: true, data: { accessToken: token, user } },
          { headers: { "set-cookie": "upstream-secret=ignored" } },
        );
      },
    },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { user } });
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.match(
    cookies[0],
    /__Host-pms-session=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=\d+; Secure/,
  );
  assert.ok(Number(cookies[0].match(/Max-Age=(\d+)/)[1]) <= 3600);
  assert.match(cookies[1], /Max-Age=0/);
  assert.equal(
    cookies.some((value) => value.includes("upstream-secret")),
    false,
  );
});

test("protected routes accept only the cookie, not browser Authorization", async () => {
  let calls = 0;
  const response = await proxySessionRequest(
    request("projects", { Authorization: "Bearer attacker" }),
    ["projects"],
    {
      ...options,
      fetchUpstream: async () => {
        calls++;
        return Response.json({});
      },
    },
  );
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test("preserves query/body/status but forwards only cookie-derived bearer to the fixed backend", async () => {
  const protection = await csrf(session);
  const response = await proxySessionRequest(
    request(
      "tasks/one?filter=active",
      {
        method: "PATCH",
        cookie: `${session}; unrelated=private`,
        csrf: protection.value,
        Origin: origin,
        Authorization: "Bearer attacker",
        "Content-Type": "application/json",
        "X-Forwarded-Host": "attacker.example",
      },
      '{"status":"IN_PROGRESS"}',
    ),
    ["tasks", "one"],
    {
      ...options,
      fetchUpstream: async (url, init) => {
        assert.equal(
          url.href,
          "https://backend.example/api/v1/tasks/one?filter=active",
        );
        assert.equal(init.headers.get("authorization"), `Bearer ${token}`);
        assert.equal(init.headers.get("cookie"), null);
        assert.equal(init.headers.get("x-forwarded-host"), null);
        assert.equal(init.headers.get("x-csrf-token"), null);
        assert.equal(init.redirect, "error");
        assert.equal(init.cache, "no-store");
        assert.equal(
          await new Response(init.body).text(),
          '{"status":"IN_PROGRESS"}',
        );
        return Response.json(
          { success: false, error: { code: "VERSION_CONFLICT" } },
          { status: 409, headers: { "set-cookie": "ignored=secret" } },
        );
      },
    },
  );
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("logout revokes through backend and deletes both browser cookies", async () => {
  const protection = await csrf(session);
  let revoked;
  const response = await proxySessionRequest(
    request("auth/logout", {
      method: "POST",
      cookie: session,
      csrf: protection.value,
      Origin: origin,
    }),
    ["auth", "logout"],
    {
      ...options,
      fetchUpstream: async (_url, init) => {
        revoked = init.headers.get("authorization");
        return Response.json({ success: true });
      },
    },
  );
  assert.equal(revoked, `Bearer ${token}`);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.ok(
    response.headers
      .getSetCookie()
      .every((value) => value.includes("Max-Age=0")),
  );
});

test("logout clears cookies even when backend revocation is unreachable, without claiming success", async () => {
  const protection = await csrf(session);
  const response = await proxySessionRequest(
    request("auth/logout", {
      method: "POST",
      cookie: session,
      csrf: protection.value,
      Origin: origin,
    }),
    ["auth", "logout"],
    {
      ...options,
      fetchUpstream: async () => {
        throw new Error("offline");
      },
    },
  );
  assert.equal(response.status, 502);
  assert.ok(
    response.headers
      .getSetCookie()
      .every((value) => value.includes("Max-Age=0")),
  );
});

test("backend outage on a normal request does not clear the session", async () => {
  const response = await proxySessionRequest(
    request("auth/me", { cookie: session }),
    ["auth", "me"],
    {
      ...options,
      fetchUpstream: async () => {
        throw new Error("offline");
      },
    },
  );
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("late unauthenticated response does not clear cookies from a newer login", async () => {
  const response = await proxySessionRequest(
    request("auth/me"),
    ["auth", "me"],
    options,
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("streams attachment bytes and download headers without caching or leaking upstream cookies", async () => {
  const response = await proxySessionRequest(
    request("uploads/file.png", { cookie: session }),
    ["uploads", "file.png"],
    {
      ...options,
      fetchUpstream: async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": 'inline; filename="file.png"',
            "Set-Cookie": "ignored=secret",
            "Cache-Control": "public",
          },
        }),
    },
  );
  assert.deepEqual(
    new Uint8Array(await response.arrayBuffer()),
    new Uint8Array([1, 2, 3]),
  );
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(
    response.headers.get("content-disposition"),
    'inline; filename="file.png"',
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("rejects traversal, encoded separators, and ambiguous or malformed cookie values", async () => {
  for (const path of [
    [],
    [".."],
    ["%2e%2e"],
    ["//attacker.example"],
    ["uploads", "a/b"],
    ["a\\b"],
    ["a\nb"],
  ]) {
    const response = await proxySessionRequest(
      request("anything", { cookie: session }),
      path,
      options,
    );
    assert.equal(response.status, 400);
  }
  for (const cookie of [
    `${session}; ${session}`,
    `${names.session}=%invalid`,
  ]) {
    assert.equal(
      (
        await proxySessionRequest(
          request("projects", { cookie }),
          ["projects"],
          options,
        )
      ).status,
      401,
    );
  }
});

test("invalid/expired upstream tokens never become cookies or browser JSON", async () => {
  const protection = await csrf();
  for (const badToken of [
    "not-a-jwt-private-value",
    `header.${Buffer.from('{"exp":1}').toString("base64url")}.signature`,
  ]) {
    const response = await proxySessionRequest(
      request(
        "auth/login",
        {
          method: "POST",
          cookie: protection.cookie,
          csrf: protection.value,
          Origin: origin,
        },
        "{}",
      ),
      ["auth", "login"],
      {
        ...options,
        fetchUpstream: async () =>
          Response.json({
            success: true,
            data: { accessToken: badToken, user },
          }),
      },
    );
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal((await response.text()).includes(badToken), false);
  }
});

test("development cookies support localhost HTTP without weakening production cookies", async () => {
  const response = await proxySessionRequest(
    request("auth/csrf"),
    ["auth", "csrf"],
    { ...options, secureCookies: false },
  );
  assert.match(
    response.headers.get("set-cookie"),
    /^pms-csrf-seed=.*HttpOnly; SameSite=Lax/,
  );
  assert.equal(response.headers.get("set-cookie").includes("; Secure"), false);
});

test("configured origin overrides untrusted forwarded headers and deployment URL", async () => {
  const protection = await csrf();
  const response = await proxySessionRequest(
    request("auth/login", {
      method: "POST",
      cookie: protection.cookie,
      csrf: protection.value,
      Origin: origin,
      "X-Forwarded-Host": "trusted.example",
    }),
    ["auth", "login"],
    { ...options, siteOrigin: "https://trusted.example" },
  );
  assert.equal(response.status, 403);
});

test("missing or credential-bearing upstream configuration fails closed", async () => {
  for (const backendUrl of [
    "",
    "/api/v1",
    "https://user:secret@backend.example/api/v1",
    "file:///tmp",
    "https://backend.example/api/v1?override=true",
  ]) {
    const response = await proxySessionRequest(
      request("projects", { cookie: session }),
      ["projects"],
      { ...options, backendUrl },
    );
    assert.equal(response.status, 503);
  }
});
