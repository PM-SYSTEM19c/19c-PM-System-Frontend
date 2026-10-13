# PM System — Frontend Architecture & Developer Handoff Guide

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **UI Library:** React 19
- **Language:** TypeScript 5.9+ (strict mode)
- **Styling:** Tailwind CSS with CSS variable tokens (`globals.css`)
- **Icons:** Lucide React
- **Data Fetching & Cache:** TanStack Query v5 (`@tanstack/react-query`)
- **Client State:** Zustand for in-memory UI identity; browser session credentials are not persisted in localStorage
- **Form Management:** React Hook Form with Zod schema validation

---

## 2. Directory Structure & Organization

```
src/
├── app/
│   ├── (dashboard)/         # Authenticated internal & PM application routes
│   │   ├── activity/        # Global audit & activity trail
│   │   ├── dashboard/       # Project stats, deliverables overview & charts
│   │   ├── departments/     # Department management
│   │   ├── positions/       # Organizational role designations
│   │   ├── projects/        # Project index & detail task boards
│   │   ├── tasks/           # Task list & status transition views
│   │   ├── trash/           # Soft-deleted entity restoration (PM only)
│   │   └── users/           # User administration & role management
│   ├── client/              # Masked client portal (/client/dashboard)
│   ├── login/               # Sign-in authentication flow
│   ├── register/            # Registration flow
│   ├── globals.css          # Semantic design tokens and theme variables
│   ├── layout.tsx           # Root layout with providers & metadata
│   ├── robots.ts            # Robots configuration
│   └── sitemap.ts           # Sitemap generator
├── components/
│   ├── blocked-by.tsx       # Component displaying prerequisite blocking dependencies
│   ├── department-picker.tsx# Department multi-select / assigner
│   ├── page-header.tsx      # Core layout primitives (PageHeader, StatCard, EmptyState, SectionHeader)
│   ├── sidebar.tsx          # Dynamic role-filtered navigation sidebar
│   ├── theme-toggle.tsx     # Dark/light theme mode selector
│   └── ui/                  # Base UI components (button, badge, dialog, card, select, switch, input)
├── lib/
│   ├── api.ts               # Strongly-typed Axios API client methods
│   ├── axios.ts             # Axios instance with auth interceptor & base URL
│   ├── queries.ts           # React Query hooks with automatic cache invalidation
│   └── utils.ts             # Styling utility (cn / clsx / tailwind-merge)
├── providers/
│   ├── auth-provider.tsx    # Context protecting authenticated routes & hydration sync
│   ├── query-provider.tsx   # React Query client provider
│   └── theme-provider.tsx   # Theme class injection & local storage persistence
├── store/
│   ├── auth.store.ts        # In-memory profile; credentials stay in HttpOnly cookies
│   └── toast.store.ts       # Global toast notification queue
└── types/
    └── index.ts             # Domain entity interfaces & API response shapes
```

---

## 3. Component Conventions

- **Layout Primitives:** Import standard page layout components (`PageHeader`, `StatCard`, `EmptyState`, `SectionHeader`) from `@/components/page-header`.
- **UI Components:** Use Radix-based primitives located under `@/components/ui/*`.
- **Forms:** Always pair `react-hook-form` with `zodResolver` and explicit Zod schemas for input validation.

---

## 4. Data Fetching & Query Conventions

1. **API Client (`src/lib/api.ts`):**  
   Most API operations use `ApiClient` with typed inputs. Some legacy calls still use the shared Axios instance directly; response typing is incremental.
   Browser API calls use same-origin `/api/v1`. The Next Route Handler reads an HttpOnly cookie and adds Bearer authorization only to its fixed backend upstream. Authenticated attachment blobs use same-origin fetch after `attachment-url.ts` validates and maps stored backend URLs; external links never receive session credentials.
2. **React Query (`src/lib/queries.ts`):**  
   - Use `queryKeys` for consistent query caching.
   - On mutation success, invalidate affected query keys to ensure real-time UI synchronisation.

---

## 5. Developer Verification Commands

```bash
# Type check TypeScript codebase
npx tsc --noEmit

# Run production build & verify all routes
npm run build

# Run Biome lint & style check
npx @biomejs/biome check src/
```

## 6. Maintenance and security boundaries

- `app/page.tsx` composes the public landing sections. Static copy lives in `components/landing/content.ts`, and brand, dashboard preview, and section headings are separate Server Components. Motion stays in the two existing client components.
- `bindAuthCache` subscribes to auth identity/role/department changes and clears React Query data synchronously. Clearing cancels old requests so a previous user's result cannot populate the next session.
- Attachment trust decisions belong in `lib/attachment-url.ts`, not substring checks inside UI components.
- The old `components/page.tsx` re-export was removed after confirming that every current consumer imports `components/page-header` directly.
- Authenticated blob image previews deliberately use `<img>`: Next's server image optimizer cannot retrieve a browser-local blob URL. The localized lint comment documents that exception.
- Frontend CI uses Node 24 and runs `npm run test:security` alongside lint, TypeScript, and production build. These tests use Node's native TypeScript stripping and do not add a runtime dependency.
- Client route guards are navigation helpers; authorization and client DTO masking must stay enforced by the backend.

Run `npm run test:security` with Node 24 to exercise attachment-origin checks, cross-session cache isolation, and the session proxy. No new runtime dependencies were added.

### Local session migration (not yet cleared for production)

- `lib/server/session-proxy.ts` is the fixed-upstream server boundary. Login JSON returns the profile, never the access token. Production cookies use `__Host-`, Secure, HttpOnly, SameSite=Lax, Path=/, and the backend JWT's remaining lifetime. Development supports localhost HTTP with separate unprefixed cookie names.
- `app/api/v1/[...path]/route.ts` runs on Node.js. Set server-only `BACKEND_API_URL` to the Railway API base (including `/api/v1`) and `SESSION_SITE_ORIGIN` to the exact frontend origin. Existing `NEXT_PUBLIC_BE_URL`/`NEXT_PUBLIC_API_URL` remain upstream fallbacks and attachment-origin configuration. Do not use a relative upstream URL or the frontend's own domain, which would create a proxy loop.
- Writes, including login/register/logout, require an exact Origin and an HMAC CSRF token bound to the current session (or a random HttpOnly seed before login). Cross-site Fetch Metadata is rejected. Browser Axios obtains CSRF protection immediately before writes and coalesces concurrent initialization; no CSRF token is persisted.
- The Function proxy streams bodies except login JSON, discards browser Authorization/unrelated cookies/untrusted forwarded headers, and never follows upstream redirects. Authenticated responses are private/no-store. On Vercel, it signs the platform-provided visitor IP with a server-only shared secret, binding it to the method/path and a short timestamp window; browser-supplied signature headers are never reused.
- `AuthProvider` restores the profile using `/auth/me`. Legacy `token`, `user`, and `auth-storage` entries are removed; theme storage is untouched. UI identity stays in memory, and a revision guard prevents a late initial session response from restoring a logged-out identity. Existing browser sessions require login again during migration. An offline page refresh cannot restore an in-memory profile, although API failures do not delete the session cookie.
- Logout clears the browser cookie even if the backend is unreachable, while returning the revocation failure. This is not proof that a copied JWT is globally revoked. If the frontend itself is unreachable, it cannot send cookie deletion headers.
- Backend JWTs now have a unique `jti` per login to prevent same-second login/logout collisions. Backend Bearer endpoints, role policies, schema, seeds, and existing tests are retained; revocation/rate-limit state is still process-local.
- Optional browser verification: run `npm run test:session-browser` on Windows with installed Chrome (or set `SESSION_TEST_BROWSER` to Edge). The test builds against an isolated in-memory fixture API, then starts the production build on 3011. It verifies all three role redirects/session refresh/logout and full 10 MiB multipart upload/download through native rewrites. No database or production requests are made. Run `npm run build` afterward to restore a build with your normal upstream configuration. This does not replace real-backend integration or deployed Vercel/Railway testing.

### Attachment transport and deployment configuration

`next.config.ts` has **beforeFiles external rewrites** for `/api/v1/uploads/:path*` and `/api/v1/tasks/:id/attachments/:path*`. They run ahead of the catch-all Function and preserve browser cookies/Origin/CSRF headers for backend validation. File bodies do not pass through a Vercel Function. Next's local proxy buffering allowance is 11 MiB, covering a 10 MiB file plus multipart overhead. The backend still applies the original 10 MiB file/MIME rules, plus an 11 MiB actual request-body cap before multipart parsing. Attachment responses explicitly disable caching. Other application requests continue through the Function session boundary.

Before any approved deployment:

1. Deploy the backend cookie-attachment support first; Bearer clients remain compatible.
2. Configure the same randomly generated **server-only `API_PROXY_SECRET`** (minimum 32 characters) in Vercel and Railway. Do not use a `NEXT_PUBLIC_` variable, share the value in chat, or reuse `JWT_SECRET`. The Vercel Function fails closed with 503 if visitor-IP metadata/secret is unavailable. Backend verifies the HMAC and 30-second timestamp window; forged metadata falls back to its existing edge-IP resolution. Authenticated upload/download quotas still key by user ID.
3. Set Vercel `BACKEND_API_URL` to the Railway API base including `/api/v1`, keep `NEXT_PUBLIC_BE_URL` aligned for stored attachment URLs, and set `SESSION_SITE_ORIGIN=https://nodewave-frontend-plum.vercel.app`. Rewrite destinations are build-time configuration: changing the backend URL requires rebuilding, not just restarting.
4. Set Railway `CORS_ORIGIN` to the exact frontend origin and `NODE_ENV=production`, so attachment cookie names and CSRF checks agree with the frontend. Set `PUBLIC_URL` to the trusted Railway backend origin without `/api/v1`, avoiding forwarded-host-based attachment URLs.
5. Verify upload/download of a 10 MiB file and per-visitor login limits on an approved staging deployment before publishing. Local Next rewrite testing is not proof of Vercel edge limits/header handling. Re-check persistent upload storage; this work does not add a backend volume.

Revocation/rate-limit state remains process-local and is not made persistent by signed IP metadata. Restart/multi-instance guarantees require a separately approved shared store and tests. No Redis, paid service, production variable, commit, or deployment was created by this work. CSP enforcement, content-signature/malware scanning, existing task-status authorization inconsistencies, and demo-account risks are outside this transport change.

References: [Vercel Function limits](https://vercel.com/docs/functions/limitations), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [Vercel request headers](https://vercel.com/docs/headers/request-headers), [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
