/** Optional Windows browser smoke test. Uses only isolated fixture API data, never a database. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const browserPath =
  process.env.SESSION_TEST_BROWSER ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
assert.ok(
  existsSync(browserPath),
  "Set SESSION_TEST_BROWSER to an installed Chrome/Edge executable",
);
const profile = mkdtempSync(join(tmpdir(), "pms-session-browser-"));
const sessions = new Map();
const origin = "http://127.0.0.1:3011";
let attachmentUploads = 0;
let revoked = 0;
let nextProcess;
let browser;
let socket;
let nextOutput = "";
async function fixtureRequest(req, res) {
  res.setHeader("Content-Type", "application/json");
  const path = new URL(req.url, "http://fixture").pathname;
  if (path === "/api/v1/auth/login") {
    const parts = [];
    for await (const part of req) parts.push(part);
    const { email } = JSON.parse(Buffer.concat(parts).toString());
    const role = email.startsWith("client")
      ? "CLIENT"
      : email.startsWith("internal")
        ? "INTERNAL"
        : "PM";
    const user = {
      id: role,
      name: `Fixture ${role}`,
      email,
      role,
      departmentId: role === "INTERNAL" ? "frontend" : null,
      department:
        role === "INTERNAL"
          ? { id: "frontend", name: "Frontend", code: "FRONTEND" }
          : null,
    };
    const token = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: role })).toString("base64url")}.${crypto.randomUUID().replaceAll("-", "")}`;
    sessions.set(token, user);
    res.end(
      JSON.stringify({ success: true, data: { user, accessToken: token } }),
    );
    return;
  }
  const attachmentPath =
    /^\/api\/v1\/(?:uploads\/[^/]+|tasks\/[^/]+\/attachments)$/.test(path);
  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("__Host-pms-session="))
    ?.split("=")[1];
  const token =
    req.headers.authorization?.slice(7) ||
    (attachmentPath ? cookieToken : undefined);
  const user = sessions.get(token);
  if (!user) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Fixture session missing" },
      }),
    );
    return;
  }
  if (attachmentPath) {
    assert.equal(
      req.headers.authorization,
      undefined,
      "native attachment rewrite must use cookie, not Function bearer proxy",
    );
    res.setHeader("Cache-Control", "private, no-store");
    if (req.method === "POST") {
      const expected = createHmac("sha256", token)
        .update("pms-csrf-v1")
        .digest("hex");
      if (
        req.headers.origin !== origin ||
        req.headers["x-csrf-token"] !== expected
      ) {
        res.statusCode = 403;
        res.end(
          JSON.stringify({ success: false, error: { code: "CSRF_INVALID" } }),
        );
        return;
      }
      const parts = [];
      for await (const part of req) parts.push(part);
      const raw = Buffer.concat(parts);
      const form = await new Request("http://fixture/upload", {
        method: "POST",
        headers: { "content-type": req.headers["content-type"] },
        body: raw,
      }).formData();
      const file = form.get("file");
      assert.equal(file.size, 10 * 1024 * 1024);
      assert.equal(file.type, "image/png");
      assert.ok(raw.byteLength > file.size);
      attachmentUploads++;
      res.end(
        JSON.stringify({
          success: true,
          data: { bytes: file.size, bodyBytes: raw.byteLength },
        }),
      );
      return;
    }
    if (path.startsWith("/api/v1/uploads/")) {
      res.setHeader("Content-Type", "image/png");
      res.end(Buffer.alloc(10 * 1024 * 1024));
      return;
    }
  }
  if (path === "/api/v1/auth/logout") {
    sessions.delete(token);
    revoked++;
  }
  res.end(
    JSON.stringify({
      success: true,
      data: path === "/api/v1/auth/me" ? user : [],
    }),
  );
}
const api = createServer((req, res) => {
  fixtureRequest(req, res).catch((error) => {
    console.error(
      `Fixture request failed: ${req.method} ${req.url}: ${error.message}`,
    );
    res.statusCode = 500;
    res.end(
      JSON.stringify({ success: false, error: { code: "FIXTURE_ERROR" } }),
    );
  });
});

const delay = (ms) => new Promise((done) => setTimeout(done, ms));
async function waitUntil(check, label, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      /* Initial compilation/navigation is asynchronous. */
    }
    await delay(250);
  }
  throw new Error(`Timed out: ${label}`);
}

try {
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  const backend = `http://127.0.0.1:${api.address().port}/api/v1`;
  const fixtureEnvironment = {
    ...process.env,
    BACKEND_API_URL: backend,
    NEXT_PUBLIC_BE_URL: backend,
    SESSION_SITE_ORIGIN: origin,
    NEXT_TELEMETRY_DISABLED: "1",
    VERCEL: "0",
  };
  // Rewrites are compiled into the build; never let attachment tests target a real API.
  const build = spawn(
    process.execPath,
    [join(project, "node_modules/next/dist/bin/next"), "build"],
    {
      cwd: project,
      windowsHide: true,
      env: fixtureEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let buildOutput = "";
  for (const stream of [build.stdout, build.stderr])
    stream.on("data", (data) => {
      buildOutput = (buildOutput + data).slice(-4000);
    });
  const [buildCode] = await once(build, "exit");
  assert.equal(buildCode, 0, `Fixture build failed: ${buildOutput}`);
  nextProcess = spawn(
    process.execPath,
    [
      join(project, "node_modules/next/dist/bin/next"),
      "start",
      "--port",
      "3011",
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: project,
      windowsHide: true,
      env: fixtureEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [nextProcess.stdout, nextProcess.stderr])
    stream.on("data", (data) => {
      nextOutput = (nextOutput + data).slice(-4000);
    });
  await waitUntil(
    async () => (await fetch(`${origin}/api/v1/auth/csrf`)).ok,
    `isolated frontend startup (${nextOutput})`,
  );

  let debugUrl;
  browser = spawn(
    browserPath,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      "--remote-debugging-address=127.0.0.1",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "about:blank",
    ],
    { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
  );
  browser.stderr.on("data", (data) => {
    debugUrl ||= data
      .toString()
      .match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
  });
  await waitUntil(() => debugUrl, "headless browser startup", 15000);
  const debugHttp = new URL(debugUrl);
  const pages = await (
    await fetch(`http://${debugHttp.host}/json/list`)
  ).json();
  const page = pages.find((item) => item.type === "page");
  assert.ok(page);
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await once(socket, "open");
  let sequence = 0;
  const pending = new Map();
  const browserErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown")
      browserErrors.push(message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      const { done, fail, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) fail(new Error(message.error.message));
      else done(message.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((done, fail) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        fail(new Error(`CDP timeout: ${method}`));
      }, 20000);
      pending.set(id, { done, fail, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const value = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (value.exceptionDetails)
      throw new Error(
        value.exceptionDetails.exception?.description ||
          value.exceptionDetails.text,
      );
    return value.result.value;
  }
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  for (const role of ["PM", "INTERNAL", "CLIENT"]) {
    await send("Page.navigate", { url: `${origin}/login` });
    await waitUntil(
      () => evaluate("Boolean(document.querySelector('input[name=email]'))"),
      "login page",
    );
    await delay(1000);
    const email = `${role.toLowerCase()}@fixture.test`;
    await evaluate(`(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const [name, value] of [['email', ${JSON.stringify(email)}], ['password', 'FixturePasswordOnly!']]) {
        const input = document.querySelector('input[name=' + name + ']');
        set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      document.querySelector('form').requestSubmit();
    })()`);
    const dashboard = role === "CLIENT" ? "/client/dashboard" : "/dashboard";
    await waitUntil(
      () =>
        evaluate(
          `location.pathname === ${JSON.stringify(dashboard)} && document.body.innerText.includes('Fixture')`,
        ),
      `${role} login redirect`,
    );
    const state = await evaluate(`(async () => ({
      cookie: document.cookie,
      keys: ['token','user','auth-storage'].map(key => localStorage.getItem(key)),
      me: await (await fetch('/api/v1/auth/me')).json(),
      csrfRejected: (await fetch('/api/v1/tasks/fixture/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status
    }))()`);
    assert.ok(
      !state.cookie.includes("pms-session"),
      "HttpOnly cookie is invisible to document.cookie",
    );
    assert.deepEqual(state.keys, [null, null, null]);
    assert.equal(state.me.data.role, role);
    assert.equal(state.csrfRejected, 403);
    if (role === "PM") {
      const transfer = await evaluate(`(async () => {
        const csrf = (await (await fetch('/api/v1/auth/csrf')).json()).data.csrfToken;
        const form = new FormData();
        form.set('file', new Blob([new Uint8Array(10 * 1024 * 1024)], { type: 'image/png' }), 'fixture.png');
        const response = await fetch('/api/v1/tasks/fixture/attachments', { method: 'POST', headers: { 'X-CSRF-Token': csrf }, body: form });
        const download = await fetch('/api/v1/uploads/fixture.png');
        const rejected = await fetch('/api/v1/tasks/fixture/attachments', { method: 'POST', body: new FormData() });
        return { status: response.status, upload: await response.json(), downloaded: (await download.arrayBuffer()).byteLength, cache: download.headers.get('cache-control'), rejected: rejected.status };
      })()`);
      assert.equal(transfer.status, 200);
      assert.equal(transfer.upload.data.bytes, 10 * 1024 * 1024);
      assert.ok(transfer.upload.data.bodyBytes > transfer.upload.data.bytes);
      assert.equal(transfer.downloaded, 10 * 1024 * 1024);
      assert.equal(transfer.cache, "private, no-store");
      assert.equal(transfer.rejected, 403);
      console.log(
        "PASS native rewrite: full 10 MiB multipart upload/download, cookie auth, CSRF rejection, no cache",
      );
    }
    const cookies = (await send("Network.getCookies", { urls: [origin] }))
      .cookies;
    assert.ok(
      cookies.some(
        (value) =>
          value.name.endsWith("pms-session") &&
          value.httpOnly &&
          value.sameSite === "Lax",
      ),
    );
    await send("Page.reload");
    await waitUntil(
      () =>
        evaluate(
          `location.pathname === ${JSON.stringify(dashboard)} && document.body.innerText.includes('Fixture')`,
        ),
      `${role} session after refresh`,
    );
    await waitUntil(
      () =>
        evaluate(
          "[...document.querySelectorAll('button')].some(item => /logout/i.test(item.getAttribute('aria-label') || item.textContent || item.title))",
        ),
      `${role} logout button after hydration`,
    );
    await evaluate(
      "(() => { const button = [...document.querySelectorAll('button')].find(item => /logout/i.test(item.getAttribute('aria-label') || item.textContent || item.title)); if (!button) throw new Error('Logout button missing'); button.click(); })()",
    );
    await waitUntil(
      () =>
        evaluate(
          "location.pathname === '/login' && Boolean(document.querySelector('input[name=email]'))",
        ),
      `${role} logout redirect`,
    );
    assert.equal(
      await evaluate(
        "fetch('/api/v1/auth/me').then(response => response.status)",
      ),
      401,
    );
    console.log(
      `PASS ${role}: UI login, HttpOnly, no localStorage token, CSRF rejection, refresh, UI logout`,
    );
  }
  assert.equal(revoked, 3);
  assert.equal(attachmentUploads, 1);
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS browser smoke: isolated fixture API; no database or production requests",
  );
} catch (error) {
  console.error(nextOutput);
  throw error;
} finally {
  socket?.close();
  browser?.kill();
  nextProcess?.kill();
  api.closeAllConnections();
  await new Promise((done) => api.close(done));
  // Only the fresh browser profile created above is removed; never a real user profile.
  if (
    resolve(profile).startsWith(`${resolve(tmpdir())}/`) ||
    dirname(profile) === resolve(tmpdir())
  ) {
    await delay(500);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* Windows may release browser files after process exit. */
    }
  }
}
