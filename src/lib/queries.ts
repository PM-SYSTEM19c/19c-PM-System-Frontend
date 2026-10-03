import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AuditLog,
  ClientProject,
  ClientTask,
  Department,
  Position,
  Project,
  Task,
  TaskAttachment,
  User,
} from "@/types";

// ============================================================
// QUERY KEYS
// ============================================================
export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  projectAuditLogs: (id: string) => ["projects", id, "audit-logs"] as const,

  tasks: (params?: string) => ["tasks", params] as const,
  task: (id: string) => ["tasks", id] as const,
  taskAuditLogs: (id: string) => ["tasks", id, "audit-logs"] as const,
  taskDependencies: (id: string) => ["tasks", id, "dependencies"] as const,
  taskAttachments: (id: string) => ["tasks", id, "attachments"] as const,

  departments: ["departments"] as const,
  positions: ["positions"] as const,

  users: (params?: string) => ["users", params] as const,
  globalAuditLogs: ["audit-logs"] as const,

  clientProjects: ["client", "projects"] as const,
  clientProject: (id: string) => ["client", "projects", id] as const,
  clientProjectTasks: (id: string) =>
    ["client", "projects", id, "tasks"] as const,

  trash: (params?: string) => ["trash", params] as const,
};

// ============================================================
// PROJECTS
// ============================================================
export function useProjects(params?: string) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.getProjects(params),
    select: (res): Project[] => res.data ?? [],
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    select: (res): Project => res.data,
    enabled: !!id,
  });
}

export function useProjectAuditLogs(id: string) {
  return useQuery({
    queryKey: queryKeys.projectAuditLogs(id),
    queryFn: () => api.getProjectAuditLogs(id),
    select: (res): AuditLog[] => res.data ?? [],
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      clientId?: string;
    }) => api.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.updateProject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.project(id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

/** Soft delete — the backend only sets `deletedAt` */
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ============================================================
// TASKS
// ============================================================
export function useTasks(params?: string) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.getTasks(params),
    select: (res): Task[] => res.data ?? [],
    enabled: params !== "",
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api.getTask(id),
    select: (res): Task => res.data,
    enabled: !!id,
  });
}

export function useTaskAuditLogs(id: string) {
  return useQuery({
    queryKey: queryKeys.taskAuditLogs(id),
    queryFn: () => api.getTaskAuditLogs(id),
    select: (res): AuditLog[] => res.data ?? [],
    enabled: !!id,
  });
}

export function useTaskDependencies(id: string) {
  return useQuery({
    queryKey: queryKeys.taskDependencies(id),
    queryFn: () => api.getTaskDependencies(id),
    select: (res) => (res.data as any) ?? [],
    enabled: !!id,
  });
}

export function useTaskAttachments(id: string) {
  return useQuery({
    queryKey: queryKeys.taskAttachments(id),
    queryFn: () => api.getTaskAttachments(id),
    select: (res): TaskAttachment[] => res.data ?? [],
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Soft delete — the backend sets `deletedAt` and writes an audit log entry */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const refresh = (id: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.task(id) });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };
  return useMutation({
    mutationFn: ({
      id,
      status,
      version,
      expectedStatus,
    }: {
      id: string;
      status: string;
      version: number;
      /** Status the user saw — lets the server accept a stale version safely */
      expectedStatus?: string;
    }) => api.updateTaskStatus(id, status, version, expectedStatus),
    onSuccess: (_data, { id }) => refresh(id),
    // 409 (conflict / blocked) → pull the latest state so the UI stops lying
    onError: (_err, { id }) => refresh(id),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: queryKeys.task(id) });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };
  return useMutation({
    mutationFn: (data: any) => api.updateTask(id, data),
    onSuccess: refresh,
    onError: refresh,
  });
}

export function useAddTaskDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnTaskId: string) =>
      api.addTaskDependency(taskId, dependsOnTaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useRemoveTaskDependency(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnTaskId: string) =>
      api.removeTaskDependency(taskId, dependsOnTaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ============================================================
// DEPARTMENTS
// ============================================================
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => api.getDepartments(),
    select: (res): Department[] => res.data ?? [],
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      code: string;
      description?: string | null;
    }) => api.createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

/** Soft delete — rejected by the backend while the department still has members or open tasks */
export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ============================================================
// POSITIONS
// ============================================================
export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions,
    queryFn: () => api.getPositions(),
    select: (res): Position[] => res.data ?? [],
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      api.createPosition(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.positions }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updatePosition(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.positions }),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePosition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.positions }),
  });
}

// ============================================================
// USERS
// ============================================================
export function useUsers(params?: string) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => api.getUsers(params),
    select: (res): User[] => res.data ?? [],
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ============================================================
// GLOBAL AUDIT LOGS
// ============================================================
export function useGlobalAuditLogs() {
  return useQuery({
    queryKey: queryKeys.globalAuditLogs,
    queryFn: () => api.getGlobalAuditLogs(),
    select: (res): AuditLog[] => res.data ?? [],
  });
}

// ============================================================
// CLIENT
// ============================================================
export function useClientProjects() {
  return useQuery({
    queryKey: queryKeys.clientProjects,
    queryFn: () => api.getClientProjects(),
    select: (res): ClientProject[] => res.data ?? [],
  });
}

export function useClientProject(id: string) {
  return useQuery({
    queryKey: queryKeys.clientProject(id),
    queryFn: () => api.getClientProject(id),
    select: (res): ClientProject => res.data,
    enabled: !!id,
  });
}

export function useClientProjectTasks(id: string) {
  return useQuery({
    queryKey: queryKeys.clientProjectTasks(id),
    queryFn: () => api.getClientProjectTasks(id),
    select: (res): ClientTask[] => res.data ?? [],
    enabled: !!id,
  });
}

// ============================================================
// TRASH
// ============================================================
export function useTrash(params?: string) {
  return useQuery({
    queryKey: queryKeys.trash(params),
    queryFn: () => api.getTrash(params),
    select: (res) => res.data ?? [],
  });
}

export function useRestoreTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      api.restoreTrash(type, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}
