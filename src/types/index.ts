// API Types matching backend responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type Role = "PM" | "INTERNAL" | "CLIENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type EffectiveStatus = TaskStatus | "BLOCKED";

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  department: Department | null;
  createdAt?: string;
}

export interface AuthData {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  progress: number;
  taskStats: { total: number; done: number };
  _count?: { tasks: number; members: number };
  members?: Array<{ user: User; createdAt: string }>;
}

export interface TaskDependency {
  taskId: string;
  dependsOnId: string;
  dependsOn: {
    id: string;
    title: string;
    status: TaskStatus;
  };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  effectiveStatus: EffectiveStatus;
  departmentId: string;
  assigneeId: string | null;
  clientVisible: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
  department: Department;
  assignee: { id: string; name: string; email: string } | null;
  dependencies: TaskDependency[];
  dependents?: Array<{ task: { id: string; title: string; status: string } }>;
  dependencyStatus?: {
    allDone: boolean;
    pendingCount: number;
    pendingDependencies: Array<{ id: string; title: string; status: string }>;
  };
  _count?: { attachments: number; auditLogs: number };
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface AuditLog {
  id: string;
  taskId: string;
  userId: string;
  changedColumn: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
  task?: { id: string; title: string };
}

// Client-specific types (safe/masked)
export interface ClientProject {
  id: string;
  name: string;
  description: string | null;
  progress: number;
}

export interface ClientTask {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
