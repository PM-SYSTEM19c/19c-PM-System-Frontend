interface AuthScope {
  user: { id: string; role: string; departmentId: string | null } | null;
}

/** Clear private cached data synchronously when the authenticated scope changes. */
export function bindAuthCache(
  store: {
    subscribe: (
      listener: (state: AuthScope, previous: AuthScope) => void,
    ) => () => void;
  },
  cache: { clear: () => void },
) {
  return store.subscribe((state, previous) => {
    if (
      state.user?.id !== previous.user?.id ||
      state.user?.role !== previous.user?.role ||
      state.user?.departmentId !== previous.user?.departmentId
    )
      cache.clear();
  });
}
