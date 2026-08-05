import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Department, Designation, RoleOption } from "@/types";

export async function fetchDepartments() {
  const res = await apiClient.get<ApiResponse<Department[]>>("/lookups/departments");
  return res.data.data;
}

export async function fetchDesignations() {
  const res = await apiClient.get<ApiResponse<Designation[]>>("/lookups/designations");
  return res.data.data;
}

export async function fetchRoles() {
  const res = await apiClient.get<ApiResponse<RoleOption[]>>("/lookups/roles");
  return res.data.data;
}
