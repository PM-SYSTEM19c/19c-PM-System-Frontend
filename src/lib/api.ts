import type { ApiResponse, AuthData } from "@/types";
import { axiosInstance } from "./axios";

class ApiClient {
  // Auth
  async login(email: string, password: string) {
    const res = await axiosInstance.post<ApiResponse<AuthData>>("/auth/login", {
      email,
      password,
    });
    if (res.data?.data?.accessToken) {
      localStorage.setItem("token", res.data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.data.user));
    }
    return res.data;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    departmentId?: string | null;
  }) {
    const res = await axiosInstance.post<ApiResponse<AuthData>>(
      "/auth/register",
      data,
    );
    return res.data;
  }

  async getMe() {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  }

  async logout() {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.warn("Backend logout revocation failed or unreachable:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  // Departments
  async getDepartments() {
    const res = await axiosInstance.get("/departments");
    return res.data;
  }

  async createDepartment(data: {
    name: string;
    code: string;
    description?: string | null;
  }) {
    const res = await axiosInstance.post("/departments", data);
    return res.data;
  }

  async deleteDepartment(id: string) {
    const res = await axiosInstance.delete(`/departments/${id}`);
    return res.data;
  }

  // Positions
  async getPositions() {
    const res = await axiosInstance.get("/positions");
    return res.data;
  }

  async createPosition(data: { name: string; description?: string | null }) {
    const res = await axiosInstance.post("/positions", data);
    return res.data;
  }

  async updatePosition(id: string, data: any) {
    const res = await axiosInstance.patch(`/positions/${id}`, data);
    return res.data;
  }

  async deletePosition(id: string) {
    const res = await axiosInstance.delete(`/positions/${id}`);
    return res.data;
  }

  // Projects
  async getProjects(params?: string) {
    const res = await axiosInstance.get(
      `/projects${params ? `?${params}` : ""}`,
    );
    return res.data;
  }

  async getProject(id: string) {
    const res = await axiosInstance.get(`/projects/${id}`);
    return res.data;
  }

  async createProject(data: {
    name: string;
    description?: string;
    clientId?: string;
  }) {
    const res = await axiosInstance.post("/projects", data);
    return res.data;
  }

  async updateProject(id: string, data: any) {
    const res = await axiosInstance.patch(`/projects/${id}`, data);
    return res.data;
  }

  async deleteProject(id: string) {
    const res = await axiosInstance.delete(`/projects/${id}`);
    return res.data;
  }

  async addProjectDepartment(projectId: string, departmentId: string) {
    const res = await axiosInstance.post(`/projects/${projectId}/departments`, {
      departmentId,
    });
    return res.data;
  }

  async removeProjectDepartment(projectId: string, departmentId: string) {
    const res = await axiosInstance.delete(
      `/projects/${projectId}/departments/${departmentId}`,
    );
    return res.data;
  }

  // Tasks
  async getTasks(params?: string) {
    const res = await axiosInstance.get(`/tasks${params ? `?${params}` : ""}`);
    return res.data;
  }

  async getTask(id: string) {
    const res = await axiosInstance.get(`/tasks/${id}`);
    return res.data;
  }

  async createTask(data: any) {
    const res = await axiosInstance.post("/tasks", data);
    return res.data;
  }

  async updateTask(id: string, data: any) {
    const res = await axiosInstance.patch(`/tasks/${id}`, data);
    return res.data;
  }

  async deleteTask(id: string) {
    const res = await axiosInstance.delete(`/tasks/${id}`);
    return res.data;
  }

  async updateTaskStatus(
    id: string,
    status: string,
    version: number,
    expectedStatus?: string,
  ) {
    const res = await axiosInstance.patch(`/tasks/${id}/status`, {
      status,
      version,
      ...(expectedStatus ? { expectedStatus } : {}),
    });
    return res.data;
  }

  // Dependencies
  async getTaskDependencies(taskId: string) {
    const res = await axiosInstance.get(`/tasks/${taskId}/dependencies`);
    return res.data;
  }

  async addTaskDependency(taskId: string, dependsOnTaskId: string) {
    const res = await axiosInstance.post(`/tasks/${taskId}/dependencies`, {
      dependsOnTaskId,
    });
    return res.data;
  }

  async removeTaskDependency(taskId: string, dependsOnTaskId: string) {
    const res = await axiosInstance.delete(
      `/tasks/${taskId}/dependencies/${dependsOnTaskId}`,
    );
    return res.data;
  }

  // Attachments
  async getTaskAttachments(taskId: string) {
    const res = await axiosInstance.get(`/tasks/${taskId}/attachments`);
    return res.data;
  }

  async addTaskAttachment(taskId: string, data: any) {
    const isFormData = data instanceof FormData;
    const res = await axiosInstance.post(`/tasks/${taskId}/attachments`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  }

  // Audit logs
  async getTaskAuditLogs(taskId: string) {
    const res = await axiosInstance.get(`/tasks/${taskId}/audit-logs`);
    return res.data;
  }

  async getProjectAuditLogs(projectId: string) {
    const res = await axiosInstance.get(`/projects/${projectId}/audit-logs`);
    return res.data;
  }

  async getGlobalAuditLogs() {
    const res = await axiosInstance.get("/audit-logs");
    return res.data;
  }

  // Users
  async getUsers(params?: string) {
    const res = await axiosInstance.get(`/users${params ? `?${params}` : ""}`);
    return res.data;
  }

  async updateUser(userId: string, data: any) {
    const res = await axiosInstance.patch(`/users/${userId}`, data);
    return res.data;
  }

  // Client API
  async getClientProjects() {
    const res = await axiosInstance.get("/client/projects");
    return res.data;
  }

  async getClientProject(id: string) {
    const res = await axiosInstance.get(`/client/projects/${id}`);
    return res.data;
  }

  async getClientProjectTasks(projectId: string) {
    const res = await axiosInstance.get(`/client/projects/${projectId}/tasks`);
    return res.data;
  }
  // Trash
  async getTrash(params?: string) {
    const res = await axiosInstance.get(`/trash${params ? `?${params}` : ""}`);
    return res.data;
  }

  async restoreTrash(type: string, id: string) {
    const res = await axiosInstance.post(`/trash/${type}/${id}/restore`);
    return res.data;
  }
}

export const api = new ApiClient();
