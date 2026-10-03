# Product Requirements Document

## Project & Task Management System

### 1. Product Overview

**Product Name:** Project & Task Management System
**Product Type:** Internal Project Management & Client Visibility Platform
**Primary Users:** Product Manager, Internal Team, Client Guest
**Backend:** TypeScript + Bun + Hono + Prisma + PostgreSQL
**Frontend:** Next.js 16 + React 19 + TypeScript
**Deadline:** 72 hours

### 2. Product Objective

Build a project and task management system for medium-to-large project teams consisting of:

* Product Management
* UI/UX
* Frontend Engineering
* Backend Engineering
* External Client

The system must manage project deliverables while enforcing:

1. RBAC — Role-Based Access Control
2. ABAC — Attribute-Based Access Control
3. State-Based Permissions
4. Inter-Task Dependencies
5. Multi-Tenant Client Isolation
6. Optimistic Locking / Concurrency Protection
7. Immutable Audit Trail
8. Soft Deletes

The primary objective is **business-rule correctness and architectural resilience**, rather than simply implementing CRUD functionality.

---

# 3. User Roles

## 3.1 Product Manager

### Permissions

PM can:

* Create projects
* View projects
* Update projects
* Create tasks
* View tasks
* Update task information
* Assign tasks
* Define task dependencies
* Mark tasks as Client Visible
* View team members
* View audit logs
* Upload/manage task attachments

### Restrictions

PM cannot:

* Change an executor's task from `IN_PROGRESS` to `DONE`

Only the assigned executor can complete their own task.

---

# 4. Internal Team

Departments:

* UI/UX
* Frontend
* Backend

### Permissions

Internal users can:

* View projects assigned to them
* View relevant tasks
* View task details
* Change allowed task statuses
* Upload task attachments

### Restrictions

Internal users cannot:

* Modify task title
* Modify task description
* Modify task dependencies
* Change assignee
* Change project
* Change client visibility
* Modify audit logs
* Delete tasks
* Modify another user's task

### State-Based Rule

A task may only be moved to `IN_PROGRESS` when all of its dependencies are `DONE`.

Example:

```text
UI/UX Design
     ↓
     DONE
     ↓
Frontend Implementation
     ↓
IN_PROGRESS
```

If the dependency is not complete:

```text
Frontend Implementation
       ↓
    BLOCKED
       ↓
[Start Task] disabled
```

The restriction must exist on:

* Frontend UI
* Backend API

Frontend-only protection is not sufficient.

---

# 5. Client Guest

Client access must be isolated by project/tenant.

Client can:

* Login
* View their own project
* View aggregate project progress
* View tasks explicitly marked `clientVisible = true`

Client cannot:

* View internal employee names
* View avatars
* View departments
* View internal comments
* View internal audit logs
* View hidden tasks
* View other clients' projects
* Modify tasks

### API Data Masking

Sensitive fields must be removed at the backend/API serialization layer.

Incorrect:

```json
{
  "title": "Homepage Development",
  "assignee": {
    "name": "John",
    "department": "Frontend"
  }
}
```

Correct:

```json
{
  "title": "Homepage Development",
  "status": "DONE"
}
```

Do not rely on:

```css
display: none;
```

or frontend filtering.

---

# 6. Task Lifecycle

Recommended task states:

```text
TODO
  ↓
IN_PROGRESS
  ↓
DONE
```

Dependency state:

```text
BLOCKED
```

`BLOCKED` should preferably be treated as a derived/controlled state rather than something users freely set.

### State Rules

| Current     | Next        | Who                                     |
| ----------- | ----------- | --------------------------------------- |
| TODO        | IN_PROGRESS | Executor                                |
| TODO        | DONE        | Not allowed                             |
| IN_PROGRESS | DONE        | Executor                                |
| IN_PROGRESS | TODO        | Executor/PM according to business rule  |
| DONE        | IN_PROGRESS | PM/Executor according to defined policy |
| BLOCKED     | IN_PROGRESS | Executor only if dependencies completed |

For the assessment, the critical rule is:

```text
IN_PROGRESS → DONE
```

must only be allowed for the assigned executor.

---

# 7. Dependency System

A task can depend on multiple tasks.

Example:

```text
Task A: UI Design
          │
          ├──────────┐
          ▼          ▼
Task B: API      Task C: Frontend
                    │
                    ▼
                 Task D
```

Task D cannot start until every prerequisite is complete.

### Dependency Rule

```text
canStart(task) =
    every dependency.status === DONE
```

If:

```text
A = DONE
B = DONE
C = IN_PROGRESS
```

then:

```text
D = BLOCKED
```

If:

```text
A = DONE
B = DONE
C = DONE
```

then:

```text
D = TODO
```

### Circular Dependency Prevention

The API must prevent:

```text
A → B
B → C
C → A
```

When creating a dependency, the backend should detect whether the new edge creates a cycle.

Return:

```http
409 Conflict
```

with:

```json
{
  "code": "CIRCULAR_DEPENDENCY",
  "message": "Creating this dependency would create a circular dependency."
}
```

---

# 8. Concurrency / Optimistic Locking

Every task has a `version` field.

Example:

```text
Task ID: 123
Version: 5
```

User A and User B both retrieve version 5.

User A updates:

```text
version 5 → version 6
```

User B attempts to update using version 5.

The backend rejects the request:

```http
409 Conflict
```

Example:

```json
{
  "code": "VERSION_CONFLICT",
  "message": "Task has been modified by another user.",
  "currentVersion": 6
}
```

### Database Pattern

Conceptually:

```sql
UPDATE tasks
SET description = $1,
    version = version + 1
WHERE id = $2
AND version = $3
AND deleted_at IS NULL;
```

If affected rows = 0:

```text
409 Conflict
```

This must be implemented server-side.

---

# 9. Audit Trail

Every task mutation must generate an immutable audit record.

Tracked fields include:

* title
* description
* status
* assignee
* client visibility
* project
* dependency changes where applicable

Audit record:

```text
TaskAuditLog
--------------------
id
taskId
userId
changedColumn
oldValue
newValue
createdAt
```

Example:

```text
User:
Hadi

Changed Column:
status

Old Value:
IN_PROGRESS

New Value:
DONE

Timestamp:
2026-10-01 14:30
```

Audit records cannot be edited or deleted through the application.

---

# 10. Soft Delete

No business entity should be physically deleted.

Use:

```text
deletedAt
```

Example:

```text
Task
id: 123
deletedAt: 2026-10-01T15:00:00Z
```

Normal queries must automatically exclude:

```text
deletedAt IS NOT NULL
```

Audit history remains available.

---

# 11. Functional Requirements

## Authentication

* Register
* Login
* Logout
* JWT authentication
* Protected API routes
* Protected frontend routes
* Password hashing
* Role-based authorization

Recommended JWT payload:

```json
{
  "sub": "user-id",
  "role": "INTERNAL",
  "department": "FRONTEND"
}
```

Do not put sensitive data into JWT.

---

# 12. Project Management

PM can:

* Create project
* Update project
* View project
* Add project members
* View project progress

Project progress can be calculated from tasks.

Example:

```text
Total Tasks: 10
Done: 5

Progress:
50%
```

Recommended formula:

```text
progress = DONE tasks / total active tasks × 100
```

---

# 13. Task Management

Each task contains:

* Title
* Description
* Status
* Project
* Assignee
* Department
* Client visibility
* Version
* Created date
* Updated date
* Deleted date

Task board:

```text
TODO
----------------
Task A
Task B

IN PROGRESS
----------------
Task C
Task D

DONE
----------------
Task E
Task F

BLOCKED
----------------
Task G
```

---

# 14. Task Detail

Task detail should show:

```text
Title
Description
Status
Department
Assignee
Dependencies
Attachments
Activity
```

PM additionally sees:

```text
Edit
Assign
Add Dependency
Client Visible
```

Internal user sees:

```text
Description: Read Only

[Upload Attachment]

[Start Task]
```

Client sees only safe information.

---

# 15. Attachment Management

Internal users and PM can upload attachments.

Recommended metadata:

```text
TaskAttachment
----------------
id
taskId
uploadedBy
fileName
fileUrl
mimeType
fileSize
createdAt
```

For the 72-hour assessment, file storage can use a simple external/object storage provider or a deployment-compatible storage mechanism.

Avoid spending excessive time building a custom file storage system.

---

# 16. Client Dashboard

Example:

```text
Client Dashboard

Project:
E-Commerce ABC

Progress
████████████░░░░░░ 60%

Client Visible Tasks

✓ UI Design
✓ Backend API
○ Homepage Development
```

Client API must only return:

```text
project
progress
client-visible tasks
safe task fields
```

Never return internal identity information.

---

# 17. API Architecture

Base URL:

```text
/api/v1
```

Recommended response structure:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "TASK_BLOCKED",
    "message": "Task cannot be started because its dependencies are incomplete."
  }
}
```

---

# 18. Authentication API

### POST `/auth/register`

Register user.

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "role": "INTERNAL",
  "department": "FRONTEND"
}
```

### POST `/auth/login`

Request:

```json
{
  "email": "john@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "name": "John Doe",
      "role": "INTERNAL",
      "department": "FRONTEND"
    }
  }
}
```

### POST `/auth/logout`

Invalidate session/token according to the chosen JWT session strategy.

### GET `/auth/me`

Return current authenticated user.

---

# 19. User API

### GET `/users`

PM only.

Supports:

* search
* filter
* pagination

### GET `/users/:id`

PM or authorized internal user.

### PATCH `/users/:id`

PM only.

---

# 20. Project API

### GET `/projects`

Returns projects available to current user.

### POST `/projects`

PM only.

```json
{
  "name": "E-Commerce ABC",
  "description": "E-Commerce development project",
  "clientName": "ABC Corporation"
}
```

### GET `/projects/:id`

Access controlled by role/project membership.

### PATCH `/projects/:id`

PM only.

### DELETE `/projects/:id`

PM only.

Use soft delete.

### POST `/projects/:id/members`

PM only.

### DELETE `/projects/:id/members/:userId`

PM only.

---

# 21. Task API

### GET `/tasks`

Supports:

* project filtering
* status filtering
* department filtering
* assignee filtering
* search
* pagination
* sorting

### POST `/tasks`

PM only.

Example:

```json
{
  "projectId": "project-id",
  "title": "Homepage Development",
  "description": "Build responsive homepage",
  "department": "FRONTEND",
  "assigneeId": "user-id",
  "clientVisible": true
}
```

### GET `/tasks/:id`

Permission based on role + project assignment.

### PATCH `/tasks/:id`

PM can update task fields.

Internal users must not be allowed to update core task fields.

### DELETE `/tasks/:id`

PM only.

Soft delete.

---

# 22. Status API

Recommended dedicated endpoint:

### PATCH `/tasks/:id/status`

Request:

```json
{
  "status": "IN_PROGRESS",
  "version": 5
}
```

Backend performs:

```text
Authentication
↓
Authorization
↓
Task ownership
↓
Dependency validation
↓
State transition validation
↓
Optimistic locking
↓
Database transaction
↓
Audit log
```

Example failure:

```json
{
  "success": false,
  "error": {
    "code": "TASK_BLOCKED",
    "message": "Task cannot be started because 2 dependencies are incomplete."
  }
}
```

---

# 23. Dependency API

### GET `/tasks/:id/dependencies`

Returns dependencies.

### POST `/tasks/:id/dependencies`

PM only.

```json
{
  "dependsOnTaskId": "task-a"
}
```

### DELETE `/tasks/:id/dependencies/:dependencyId`

PM only.

Before inserting:

```text
Check:
- Same project
- Task exists
- Dependency exists
- Task != dependency
- No circular dependency
```

---

# 24. Attachment API

### GET `/tasks/:id/attachments`

Authorized users only.

### POST `/tasks/:id/attachments`

PM/internal authorized users.

### DELETE `/tasks/:id/attachments/:attachmentId`

Use soft delete.

---

# 25. Audit API

### GET `/tasks/:id/audit-logs`

PM only.

### GET `/projects/:id/audit-logs`

PM only.

Client must never receive these endpoints.

---

# 26. Client API

Prefer dedicated endpoints rather than trying to reuse internal task responses.

### GET `/client/projects`

Returns only client's projects.

### GET `/client/projects/:id`

Returns:

```json
{
  "id": "project-id",
  "name": "E-Commerce ABC",
  "progress": 60
}
```

### GET `/client/projects/:id/tasks`

Returns only:

```text
clientVisible = true
```

with safe fields.

Example:

```json
{
  "id": "task-id",
  "title": "Homepage Development",
  "status": "DONE"
}
```

No:

```text
assignee
department
internal comments
audit log
```

---

# 27. Standard List Contract

All list endpoints should use one consistent query format.

Recommended conceptual contract:

```text
?page=1
&pageSize=20
&search=homepage
&sort=createdAt
&order=desc
&filter[status]=DONE
&filter[department]=FRONTEND
```

Because the assessment specifically references NodeWave's `prisma-ezfilter` documentation, the implementation should adapt this section to the exact query syntax required by that documentation rather than inventing a competing format.

---

# 28. Database ERD

```text
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ id PK                │
│ name                 │
│ email UNIQUE         │
│ passwordHash         │
│ role                 │
│ department           │
│ createdAt            │
│ updatedAt            │
│ deletedAt            │
└──────────┬───────────┘
           │
           │
           ▼
┌──────────────────────┐
│   ProjectMember      │
├──────────────────────┤
│ projectId PK/FK      │
│ userId PK/FK         │
│ createdAt            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Project        │
├──────────────────────┤
│ id PK                │
│ name                 │
│ description          │
│ clientName           │
│ createdAt            │
│ updatedAt            │
│ deletedAt            │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────────┐
│          Task            │
├──────────────────────────┤
│ id PK                    │
│ projectId FK             │
│ title                    │
│ description              │
│ status                   │
│ department               │
│ assigneeId FK            │
│ clientVisible            │
│ version                  │
│ createdAt                │
│ updatedAt                │
│ deletedAt                │
└───────┬───────────┬──────┘
        │           │
        │           │
        ▼           ▼
┌───────────────┐  ┌─────────────────────┐
│ TaskDependency│  │   TaskAttachment   │
├───────────────┤  ├─────────────────────┤
│ taskId FK     │  │ id PK               │
│ dependsOnId FK│  │ taskId FK           │
└───────────────┘  │ uploadedBy FK      │
                   │ fileName            │
                   │ fileUrl             │
                   │ mimeType            │
                   │ fileSize             │
                   │ createdAt           │
                   │ deletedAt           │
                   └─────────────────────┘
        │
        ▼
┌─────────────────────┐
│    TaskAuditLog     │
├─────────────────────┤
│ id PK               │
│ taskId FK           │
│ userId FK           │
│ changedColumn       │
│ oldValue            │
│ newValue            │
│ createdAt           │
└─────────────────────┘
```

---

# 29. Prisma Model Concept

```prisma
enum Role {
  PM
  INTERNAL
  CLIENT
}

enum Department {
  UI_UX
  FRONTEND
  BACKEND
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

model User {
  id           String       @id @default(cuid())
  name         String
  email        String       @unique
  passwordHash String
  role         Role
  department   Department?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?

  projectMemberships ProjectMember[]
  assignedTasks      Task[] @relation("TaskAssignee")
  auditLogs          TaskAuditLog[]
  attachments        TaskAttachment[]
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  clientName  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  members ProjectMember[]
  tasks   Task[]
}

model ProjectMember {
  projectId String
  userId    String
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@id([projectId, userId])
}

model Task {
  id            String       @id @default(cuid())
  projectId     String
  title         String
  description   String?
  status        TaskStatus   @default(TODO)
  department    Department
  assigneeId    String?
  clientVisible Boolean      @default(false)

  version Int @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  project     Project @relation(fields: [projectId], references: [id])
  assignee    User?   @relation("TaskAssignee", fields: [assigneeId], references: [id])

  dependencies TaskDependency[] @relation("TaskDependencies")
  dependents   TaskDependency[] @relation("TaskDependents")

  attachments TaskAttachment[]
  auditLogs   TaskAuditLog[]

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
}

model TaskDependency {
  taskId        String
  dependsOnId   String

  task      Task @relation("TaskDependencies", fields: [taskId], references: [id])
  dependsOn Task @relation("TaskDependents", fields: [dependsOnId], references: [id])

  @@id([taskId, dependsOnId])
}

model TaskAttachment {
  id         String @id @default(cuid())
  taskId     String
  uploadedBy String
  fileName   String
  fileUrl    String
  mimeType   String?
  fileSize   Int?

  createdAt DateTime @default(now())
  deletedAt DateTime?

  task   Task @relation(fields: [taskId], references: [id])
  user   User @relation(fields: [uploadedBy], references: [id])
}

model TaskAuditLog {
  id            String   @id @default(cuid())
  taskId        String
  userId        String
  changedColumn String
  oldValue      String?
  newValue      String?
  createdAt     DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
}
```

---

# 30. Backend Repository Structure

```text
backend/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── tenant.middleware.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.route.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.schema.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project.route.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.repository.ts
│   │   │   └── project.schema.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── task.route.ts
│   │   │   ├── task.controller.ts
│   │   │   ├── task.service.ts
│   │   │   ├── task.repository.ts
│   │   │   ├── task.schema.ts
│   │   │   ├── task.permission.ts
│   │   │   ├── task.dependency.ts
│   │   │   └── task.audit.ts
│   │   │
│   │   ├── attachments/
│   │   │   ├── attachment.route.ts
│   │   │   ├── attachment.service.ts
│   │   │   └── attachment.schema.ts
│   │   │
│   │   └── client/
│   │       ├── client.route.ts
│   │       ├── client.controller.ts
│   │       ├── client.service.ts
│   │       └── client.mapper.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── types/
│   │   ├── utils/
│   │   └── response.ts
│   │
│   └── routes/
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── tests/
│   ├── auth.test.ts
│   ├── task-permission.test.ts
│   ├── dependency.test.ts
│   └── concurrency.test.ts
│
├── .env.example
├── biome.json
├── bun.lock
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

---

# 31. Frontend Repository Structure

```text
frontend/
│
├── src/
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── tasks/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   └── [taskId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── audit-logs/
│   │   │       └── page.tsx
│   │   │
│   │   ├── client/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── projects/
│   │   │       └── [projectId]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── project/
│   │   ├── task/
│   │   ├── dashboard/
│   │   └── client/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── dependencies/
│   │   └── client/
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-projects.ts
│   │   ├── use-tasks.ts
│   │   └── use-task.ts
│   │
│   ├── lib/
│   │   ├── axios.ts
│   │   ├── query-client.ts
│   │   └── utils.ts
│   │
│   ├── stores/
│   │   └── auth.store.ts
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── project.schema.ts
│   │   └── task.schema.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── task.ts
│   │
│   └── providers/
│       ├── query-provider.tsx
│       └── auth-provider.tsx
│
├── public/
│
├── .env.example
├── biome.json
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

# 32. Permission Architecture

Do not scatter permission logic randomly throughout controllers.

Recommended:

```text
Request
   ↓
JWT Middleware
   ↓
Authenticated User
   ↓
Authorization Policy
   ↓
Business Rule
   ↓
Service
   ↓
Repository
```

Example:

```ts
canStartTask(user, task)
```

checks:

```text
user authenticated?
        ↓
user internal?
        ↓
user is task assignee?
        ↓
all dependencies DONE?
        ↓
task status allows transition?
        ↓
YES
```

---

# 33. Recommended Backend Service Flow

For:

```http
PATCH /tasks/:id/status
```

Use:

```text
TaskController
      ↓
TaskService.updateStatus()
      ↓
TaskPermission.canUpdateStatus()
      ↓
DependencyService.validateDependencies()
      ↓
Transaction
      ↓
Optimistic Lock
      ↓
Update Task
      ↓
Create AuditLog
      ↓
Return DTO
```

Task update + audit log should happen inside one database transaction where appropriate.

---

# 34. Client Data Mapper

Do not directly return Prisma objects.

Bad:

```ts
return prisma.task.findMany(...)
```

Better:

```ts
return tasks.map(task => ({
  id: task.id,
  title: task.title,
  status: task.status
}));
```

For client:

```text
Prisma Entity
     ↓
Client Mapper
     ↓
Safe DTO
     ↓
HTTP Response
```

This prevents accidental data leakage.

---

# 35. Seed Data

Seed at least:

### PM

```text
Email:
pm@assessment.test

Password:
Password123!

Role:
PM
```

### UI/UX

```text
Email:
uiux@assessment.test

Password:
Password123!

Role:
INTERNAL
Department:
UI_UX
```

### Frontend

```text
Email:
frontend@assessment.test

Password:
Password123!

Role:
INTERNAL
Department:
FRONTEND
```

### Backend

```text
Email:
backend@assessment.test

Password:
Password123!

Role:
INTERNAL
Department:
BACKEND
```

### Client

```text
Email:
client@assessment.test

Password:
Password123!

Role:
CLIENT
```

Use different passwords in the actual submission if desired.

---

# 36. Seed Demo Project

The seed should create a project specifically designed to demonstrate the assessment.

```text
Project:
E-Commerce Website

Tasks:

1. UI Design
   Department: UI_UX
   Status: DONE

2. Product API
   Department: BACKEND
   Status: DONE

3. Homepage Development
   Department: FRONTEND
   Status: TODO

4. Product Page Development
   Department: FRONTEND
   Status: BLOCKED
```

Dependencies:

```text
UI Design
    ↓
Homepage Development

Product API
    ↓
Homepage Development

UI Design
    ↓
Product Page Development
```

Make some tasks `clientVisible = true`.

This makes the live demo much easier.

---

# 37. Frontend UX Requirements

Every page should handle:

### Loading

```text
Loading...
Skeleton...
```

### Empty

```text
No tasks found.
```

### Error

```text
Something went wrong.

[Try Again]
```

### Permission

```text
You don't have permission to perform this action.
```

### Conflict

```text
This task was updated by another user.

[Refresh Task]
```

### Blocked

```text
🔒 Task Blocked

Waiting for:
UI Design
Product API

[Start Task] disabled
```

---

# 38. Important UI Components

Build reusable components:

```text
<AppShell />
<Sidebar />
<Topbar />

<StatCard />
<ProjectCard />

<TaskBoard />
<TaskColumn />
<TaskCard />

<TaskDetail />
<TaskStatusBadge />
<DependencyList />
<DependencyBadge />

<AttachmentList />
<AuditTimeline />

<PermissionGuard />
<ConfirmDialog />

<LoadingState />
<EmptyState />
<ErrorState />
```

---

# 39. 72-Hour Implementation Plan

## Phase 1 — 0 to 4 Hours

### Requirement Analysis

Create:

```text
ERD
Permission Matrix
API List
State Transition Rules
Dependency Rules
```

Do not start polishing UI yet.

---

# Phase 2 — 4 to 12 Hours

## Backend Foundation

Implement:

```text
Bun
Hono
Prisma
PostgreSQL
Environment config
Error handler
JWT
Zod
Biome
```

Then:

```text
Prisma schema
Migration
Seed
```

Target:

```text
Database working
API server running
Seed working
```

---

# Phase 3 — 12 to 20 Hours

## Authentication + RBAC

Implement:

```text
Register
Login
Logout
/me
JWT middleware
Role middleware
```

Then test:

```text
PM
Internal
Client
```

Do not proceed until authorization works.

---

# Phase 4 — 20 to 30 Hours

## Projects + Tasks CRUD

Implement:

```text
Projects
Project members
Tasks
Task assignment
Task filtering
Task pagination
Task search
```

At this point you have the basic application.

---

# Phase 5 — 30 to 40 Hours

## Business Logic

This is the most important phase.

Implement:

### Dependency

```text
Create dependency
Delete dependency
Check dependency
Circular dependency detection
Blocked state
```

### State Rules

```text
TODO → IN_PROGRESS
IN_PROGRESS → DONE
```

with executor validation.

### Client visibility

```text
clientVisible
```

---

# Phase 6 — 40 to 47 Hours

## Concurrency + Audit

Implement:

```text
version
optimistic locking
409 Conflict
audit logs
soft delete
```

Test manually with two browser sessions.

Example:

```text
Browser A
Task version = 5

Browser B
Task version = 5

A updates → version 6

B updates → 409
```

---

# Phase 7 — 47 to 57 Hours

## Frontend

Implement:

```text
Login
Dashboard
Project list
Project detail
Kanban board
Task detail
Dependency UI
Attachment UI
Audit UI
```

Do not spend excessive time on animations.

---

# Phase 8 — 57 to 62 Hours

## Role-Specific UI

PM:

```text
Full project management
```

Internal:

```text
Restricted task editing
```

Client:

```text
Client dashboard
Safe task list
Progress
```

Verify API and UI permissions independently.

---

# Phase 9 — 62 to 66 Hours

## Testing

Test these scenarios manually:

### Scenario 1

```text
Frontend tries to start blocked task
→ rejected
```

### Scenario 2

```text
Frontend starts task after dependencies complete
→ success
```

### Scenario 3

```text
PM tries IN_PROGRESS → DONE
→ rejected
```

### Scenario 4

```text
Executor completes task
→ success
```

### Scenario 5

```text
Client requests internal task
→ cannot access
```

### Scenario 6

```text
Client requests another project
→ cannot access
```

### Scenario 7

```text
Two users edit same task
→ one receives 409
```

### Scenario 8

```text
Task changes
→ AuditLog created
```

### Scenario 9

```text
Task deleted
→ soft deleted
```

### Scenario 10

```text
Circular dependency
→ rejected
```

---

# Phase 10 — 66 to 69 Hours

## Deployment

Backend:

```text
Railway / Render
        ↓
PostgreSQL
        ↓
Prisma migration
        ↓
Seed
```

Frontend:

```text
Vercel
   ↓
NEXT_PUBLIC_BE_URL
```

Verify:

```text
Production login
Production API
Production database
Production seed
```

---

# Phase 11 — 69 to 71 Hours

## Documentation + Screenshots

Required screenshots:

### 1. Authentication

```text
Login page
```

### 2. Task Board

```text
Kanban
TODO
IN PROGRESS
DONE
```

### 3. Blocked Task

```text
Dependency
🔒 BLOCKED
Disabled Start button
```

### 4. Client View

```text
Progress
Client-visible tasks
No internal identities
```

### 5. Audit / Task Detail

```text
Task detail
Audit trail
```

---

# Phase 12 — 71 to 72 Hours

## Screen Recording

Maximum:

```text
< 3 minutes
```

Recommended sequence:

```text
0:00
Login as PM

0:15
Open project

0:30
Show dependency

0:50
Login as Frontend

1:05
Show BLOCKED task

1:20
Login/change UI task to DONE

1:35
Frontend refreshes

1:45
Start task

2:00
Complete task

2:15
Show audit log

2:30
Login as Client

2:40
Show masked/client-only view

2:55
Finish
```

---

# 40. Assessment Priority

If time becomes limited, prioritize in this order:

## P0 — MUST WORK

```text
Authentication
RBAC
Project access
Task CRUD
Task status
Dependency validation
Blocked state
Executor-only completion
Client isolation
API data masking
Optimistic locking
409 Conflict
Audit trail
Soft delete
Deployment
Seed accounts
```

## P1 — SHOULD WORK

```text
Search
Filtering
Pagination
Attachments
Better dashboard
Better task board
Responsive UI
```

## P2 — NICE TO HAVE

```text
Unit tests
CI/CD
Animations
Advanced analytics
Daily standup summary
```

Do **not** sacrifice P0 functionality to implement the optional standup summary.

---

# 41. Optional Daily Standup Summary

If all core requirements are finished, implement:

```text
GET /projects/:id/standup-summary
```

Response:

```json
{
  "date": "2026-10-01",
  "departments": {
    "UI_UX": {
      "completedYesterday": [
        "Homepage Design"
      ],
      "blockedToday": []
    },
    "FRONTEND": {
      "completedYesterday": [],
      "blockedToday": [
        "Product Page"
      ]
    },
    "BACKEND": {
      "completedYesterday": [
        "Product API"
      ],
      "blockedToday": []
    }
  }
}
```

This should only be implemented after the core assessment requirements are stable.

---

# 42. Definition of Done

The project is considered complete when:

### Authentication

* [ ] PM can login
* [ ] Internal user can login
* [ ] Client can login
* [ ] Protected routes work

### Authorization

* [ ] PM permissions work
* [ ] Internal restrictions work
* [ ] Client isolation works
* [ ] API cannot be bypassed through frontend manipulation

### Tasks

* [ ] Task CRUD works
* [ ] Assignment works
* [ ] Status transitions work
* [ ] Dependencies work
* [ ] Blocked state works

### Security / Data Integrity

* [ ] Client data masking works
* [ ] Optimistic locking works
* [ ] 409 Conflict works
* [ ] Audit logs are created
* [ ] Audit logs cannot be modified
* [ ] Soft delete works

### Deployment

* [ ] Backend publicly accessible
* [ ] Frontend publicly accessible
* [ ] PostgreSQL production database works
* [ ] Prisma migration applied
* [ ] Seed accounts work

### Submission

* [ ] Frontend URL
* [ ] Backend URL
* [ ] PM credentials
* [ ] Internal credentials
* [ ] Client credentials
* [ ] Backend repository
* [ ] Frontend repository
* [ ] Architecture explanation
* [ ] Screenshots
* [ ] <3 minute screen recording
* [ ] Tally submission completed

---

# 43. Recommended Architecture

```text
                    ┌─────────────────┐
                    │    Next.js      │
                    │   React 19      │
                    └────────┬────────┘
                             │
                       Axios / HTTP
                             │
                             ▼
                    ┌─────────────────┐
                    │   Hono API      │
                    │   TypeScript    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          Auth Layer    Permission Layer  Validation
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │ Business Layer  │
                    │                 │
                    │ Task Service    │
                    │ Dependency      │
                    │ Audit Service   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Prisma      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

The most important architectural principle is:

```text
Frontend Permission
        ≠
Backend Permission
```

The frontend improves UX, but **the backend is the final authority**.

For example:

```text
Frontend:
[Start Task] disabled

        +

Backend:
POST /tasks/:id/status
        ↓
dependency check
        ↓
permission check
        ↓
409/403 if invalid
```

That is the behavior the assessment is looking for.

# 44. Final MVP Scope

For a 72-hour assessment, the ideal finished product is:

```text
┌──────────────────────────────────────────────┐
│               PROJECT SYSTEM                 │
├──────────────────────────────────────────────┤
│                                              │
│  Login                                       │
│    ↓                                         │
│  Role Detection                              │
│    ↓                                         │
│  Dashboard                                   │
│    ↓                                         │
│  Project                                     │
│    ↓                                         │
│  Task Board                                  │
│    │                                         │
│    ├── TODO                                  │
│    ├── IN PROGRESS                           │
│    ├── BLOCKED                               │
│    └── DONE                                  │
│                                              │
│  Task                                        │
│    ├── Dependency                            │
│    ├── Attachment                            │
│    └── Audit Trail                            │
│                                              │
│  Backend                                     │
│    ├── RBAC                                  │
│    ├── ABAC                                  │
│    ├── Dependency validation                  │
│    ├── Optimistic locking                    │
│    ├── 409 Conflict                          │
│    ├── Audit Trail                           │
│    └── Soft Delete                           │
│                                              │
│  Client                                      │
│    ├── Own project only                      │
│    ├── Progress                              │
│    └── Client-visible tasks                  │
│                                              │
└──────────────────────────────────────────────┘
```

**Strategi utamanya:** jangan mencoba membuat Jira versi lengkap. Buat aplikasi yang secara visual cukup sederhana tetapi **business logic-nya benar-benar kuat**, karena itulah bagian yang paling jelas ditekankan dalam assessment brief.
