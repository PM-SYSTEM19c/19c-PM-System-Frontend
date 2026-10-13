import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { createStore } from "zustand/vanilla";
import { bindAuthCache } from "../src/lib/auth-cache.ts";

const user = { id: "pm-user", role: "PM", departmentId: null, name: "Manager" };

for (const [scenario, next] of [
  ["logout", null],
  ["account switch", { ...user, id: "another-user" }],
  ["role change", { ...user, role: "INTERNAL" }],
  ["department change", { ...user, departmentId: "another-department" }],
]) {
  test(`clears private query data on ${scenario}`, () => {
    const store = createStore(() => ({ user }));
    const client = new QueryClient();
    const unsubscribe = bindAuthCache(store, client);
    client.setQueryData(["projects"], [{ name: "Private project" }]);
    store.setState({ user: next });
    assert.equal(client.getQueryData(["projects"]), undefined);
    unsubscribe();
    client.clear();
  });
}

test("keeps cached data when only the display name changes", () => {
  const store = createStore(() => ({ user }));
  const client = new QueryClient();
  const unsubscribe = bindAuthCache(store, client);
  client.setQueryData(["projects"], ["unchanged"]);
  store.setState({ user: { ...user, name: "Updated name" } });
  assert.deepEqual(client.getQueryData(["projects"]), ["unchanged"]);
  unsubscribe();
  client.clear();
});

test("an old in-flight request cannot repopulate another user's cache", async () => {
  const store = createStore(() => ({ user }));
  const client = new QueryClient();
  const unsubscribe = bindAuthCache(store, client);
  let complete;
  const pending = client
    .fetchQuery({
      queryKey: ["projects"],
      queryFn: () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    })
    .catch(() => undefined);
  store.setState({ user: { ...user, id: "new-user" } });
  complete(["old-user-private-project"]);
  await pending;
  assert.equal(client.getQueryData(["projects"]), undefined);
  unsubscribe();
  client.clear();
});
