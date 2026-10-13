/** Remove all legacy auth copies, including the old Zustand persistence envelope. */
export function clearLegacyAuth(storage: Pick<Storage, "removeItem">) {
  for (const key of ["token", "user", "auth-storage"]) storage.removeItem(key);
}

let pendingCsrf: Promise<string> | undefined;

async function fetchCsrfToken(): Promise<string> {
  // Get protection for the cookie currently in the browser, including account switches.
  const response = await fetch("/api/v1/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  const result = await response.json();
  if (!response.ok || typeof result.data?.csrfToken !== "string")
    throw new Error("Unable to initialize request protection");
  return result.data.csrfToken;
}

/** Coalesce concurrent writes without persisting a token across session changes. */
export function getCsrfToken(): Promise<string> {
  pendingCsrf ??= fetchCsrfToken().finally(() => {
    pendingCsrf = undefined;
  });
  return pendingCsrf;
}
