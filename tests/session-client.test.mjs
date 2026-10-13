import assert from "node:assert/strict";
import { test } from "node:test";
import { clearLegacyAuth } from "../src/lib/session-client.ts";

test("migration removes every old token/profile copy without touching theme", () => {
  const values = new Map([
    ["token", "secret"],
    ["user", "profile"],
    ["auth-storage", '{"state":{"token":"secret"}}'],
    ["pms-theme", "dark"],
  ]);
  clearLegacyAuth({ removeItem: (key) => values.delete(key) });
  assert.deepEqual([...values], [["pms-theme", "dark"]]);
});
