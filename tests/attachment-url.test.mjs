import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAttachmentProxyUrl,
  isInternalAttachmentUrl,
} from "../src/lib/attachment-url.ts";

const api = "http://localhost:3000/api/v1";
const site = "http://localhost:3001";

test("accepts configured API uploads and the same-origin API proxy", () => {
  for (const url of [
    "http://localhost:3000/api/v1/uploads/file.png",
    "http://localhost:3001/api/v1/uploads/file.png",
    "/api/v1/uploads/file.png",
  ]) {
    assert.equal(isInternalAttachmentUrl(url, api, site), true);
  }
});

test("does not trust an uploads substring on another origin", () => {
  for (const url of [
    "https://attacker.example/api/v1/uploads/file.png",
    "//attacker.example/api/v1/uploads/file.png",
    "http://localhost:3000.attacker.example/api/v1/uploads/file.png",
    "https://attacker.example/?next=/api/v1/uploads/file.png",
  ]) {
    assert.equal(isInternalAttachmentUrl(url, api, site), false);
  }
});

test("rejects credentials, unsafe schemes, wrong ports, traversal, and unrelated paths", () => {
  for (const url of [
    "http://user:pass@localhost:3000/api/v1/uploads/file.png",
    "javascript:/api/v1/uploads/file.png",
    "http://localhost:3002/api/v1/uploads/file.png",
    "/other/api/v1/uploads/file.png",
    "/api/v1/uploads/../auth/me",
    "/api/v1/uploads/",
    "http://[",
  ]) {
    assert.equal(isInternalAttachmentUrl(url, api, site), false);
  }
});

test("handles a relative API configuration", () => {
  assert.equal(
    isInternalAttachmentUrl("/api/v1/uploads/file.png", "/api/v1", site),
    true,
  );
  assert.equal(
    isInternalAttachmentUrl("/api/v1/uploads/file.png", "", site),
    false,
  );
});

test("maps only trusted uploads to cookie-authenticated same-origin paths", () => {
  assert.equal(
    getAttachmentProxyUrl(`${api}/uploads/file.png`, api, site),
    "/api/v1/uploads/file.png",
  );
  assert.equal(
    getAttachmentProxyUrl("/api/v1/uploads/file.png?download=1", api, site),
    "/api/v1/uploads/file.png?download=1",
  );
  assert.equal(
    getAttachmentProxyUrl(
      "https://attacker.example/api/v1/uploads/file.png",
      api,
      site,
    ),
    null,
  );
});
