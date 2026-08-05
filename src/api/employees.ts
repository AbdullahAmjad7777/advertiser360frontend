import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateEmployeeInput,
  DirectoryEntry,
  Employee,
  EmployeeListParams,
  Paginated,
  UpdateEmployeeInput,
} from "@/types";

export async function fetchEmployees(params: EmployeeListParams) {
  const res = await apiClient.get<ApiResponse<Paginated<Employee>>>("/employees", { params });
  return res.data.data;
}

export async function fetchDirectory(search?: string) {
  const res = await apiClient.get<ApiResponse<DirectoryEntry[]>>("/employees/directory", {
    params: search ? { search } : undefined,
  });
  return res.data.data;
}

export async function fetchEmployeeById(id: number) {
  const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
  return res.data.data;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const res = await apiClient.post<ApiResponse<Employee>>("/employees", input);
  return res.data.data;
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput) {
  const res = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, input);
  return res.data.data;
}

export async function deactivateEmployee(id: number) {
  const res = await apiClient.delete<ApiResponse<Employee>>(`/employees/${id}`);
  return res.data.data;
}
