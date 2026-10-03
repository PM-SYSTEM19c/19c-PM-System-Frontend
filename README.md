# 📋 Project Management System

Sistem Manajemen Proyek & Tugas dengan model akses kontrol 3 dimensi (Role + Department + Task Status).

## 🏗 Arsitektur

```
Project Management System/
├── backend/             # Bun + Hono + Prisma + PostgreSQL
│   ├── prisma/          # Schema + Seed
│   └── src/
│       ├── config/      # Environment, Constants
│       ├── lib/         # Prisma Client, JWT
│       ├── middlewares/  # Auth, Role, Error
│       ├── modules/
│       │   ├── auth/          # Login, Register, Me
│       │   ├── departments/   # CRUD Department
│       │   ├── projects/      # CRUD + Members
│       │   ├── tasks/         # CRUD + Status + Dependencies + Audit
│       │   ├── users/         # User Management
│       │   ├── attachments/   # File Attachments
│       │   └── client/        # Client-safe endpoints
│       ├── shared/      # Response, Errors, Types, Utils
│       └── routes/      # Route aggregator
├── frontend/            # Next.js 16 + TypeScript + Tailwind
│   └── src/
│       ├── app/
│       │   ├── login/           # Login page
│       │   ├── (dashboard)/     # Internal pages (PM + INTERNAL)
│       │   │   ├── dashboard/   # Dashboard overview
│       │   │   ├── projects/    # Project list & detail
│       │   │   ├── tasks/       # Kanban board & detail
│       │   │   ├── users/       # User management
│       │   │   └── departments/ # Department management
│       │   └── client/          # Client portal
│       ├── components/  # Sidebar, etc.
│       ├── lib/         # API Client
│       ├── providers/   # Auth Context
│       └── types/       # TypeScript types
└── docker-compose.yml   # PostgreSQL
```

## 🔐 Model Access Control 3 Dimensi

| Dimensi | Pertanyaan | Contoh |
|---------|-----------|--------|
| **Role** | Siapa mereka? | PM, INTERNAL, CLIENT |
| **Department** | Dari tim mana? | UI/UX, Frontend, Backend |
| **Task Status** | Apa status tugas? | TODO, IN_PROGRESS, DONE, BLOCKED |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Docker atau langsung)

### 1. Database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
bun install
bun run db:push
bun run db:seed
bun run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev -- --port 3001
```

### 4. Buka Aplikasi
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1

## 👤 Login Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| PM | pm@assessment.test | Password123! |
| UI/UX (Internal) | uiux@assessment.test | Password123! |
| Frontend (Internal) | frontend@assessment.test | Password123! |
| Backend (Internal) | backend@assessment.test | Password123! |
| Client | client@assessment.test | Password123! |

## 📡 API Endpoints

### Auth
- `POST /auth/login` — Login
- `POST /auth/register` — Register
- `GET /auth/me` — Current user profile

### Departments
- `GET /departments` — List all
- `POST /departments` — Create (PM only)

### Projects
- `GET /projects` — List (role-scoped)
- `POST /projects` — Create (PM only)
- `POST /projects/:id/members` — Add member (PM only)

### Tasks
- `GET /tasks` — List with filters
- `POST /tasks` — Create (PM only)
- `PATCH /tasks/:id/status` — Update status (3-dim check)
- `POST /tasks/:id/dependencies` — Add dependency (PM only)
- `GET /tasks/:id/audit-logs` — Audit trail (PM only)

### Client
- `GET /client/projects` — Client projects (masked data)
- `GET /client/projects/:id/tasks` — Visible tasks only
