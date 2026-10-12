# PM System — Frontend Architecture & Developer Handoff Guide

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **UI Library:** React 19
- **Language:** TypeScript 5.9+ (strict mode)
- **Styling:** Tailwind CSS with CSS variable tokens (`globals.css`)
- **Icons:** Lucide React
- **Data Fetching & Cache:** TanStack Query v5 (`@tanstack/react-query`)
- **Client State:** Zustand with `persist` middleware
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
│   ├── page.tsx             # Backward-compatibility facade re-exporting page-header
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
│   ├── auth.store.ts        # Zustand auth state persisted in localStorage
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
   All HTTP requests pass through `ApiClient`. Parameter types are strongly typed.
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
