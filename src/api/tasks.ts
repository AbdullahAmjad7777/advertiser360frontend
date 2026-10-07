import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Task, TaskInput, TaskListParams } from "@/types";

export async function fetchTasks(params: TaskListParams = {}) {
  const res = await apiClient.get<ApiResponse<Task[]>>("/tasks", { params });
  return res.data.data;
}

export async function createTask(input: TaskInput) {
  const res = await apiClient.post<ApiResponse<Task>>("/tasks", input);
  return res.data.data;
}

export async function setTaskCompleted(id: number, completed: boolean) {
  const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/complete`, { completed });
  return res.data.data;
}

export async function deleteTask(id: number) {
  const res = await apiClient.delete<ApiResponse<Task>>(`/tasks/${id}`);
  return res.data.data;
}
