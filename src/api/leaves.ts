import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  ApplyLeaveInput,
  Leave,
  LeaveBalance,
  LeaveListParams,
  LeaveType,
  Paginated,
} from "@/types";

export async function fetchLeaveTypes() {
  const res = await apiClient.get<ApiResponse<LeaveType[]>>("/leaves/types");
  return res.data.data;
}

export async function applyForLeave(input: ApplyLeaveInput) {
  const res = await apiClient.post<ApiResponse<Leave>>("/leaves", input);
  return res.data.data;
}

export async function fetchLeaves(params: LeaveListParams) {
  const res = await apiClient.get<ApiResponse<Paginated<Leave>>>("/leaves", { params });
  return res.data.data;
}

export async function fetchLeaveBalance(employeeId: number, year?: number) {
  const res = await apiClient.get<ApiResponse<LeaveBalance[]>>(`/leaves/balance/${employeeId}`, {
    params: year ? { year } : undefined,
  });
  return res.data.data;
}

export async function approveLeave(id: number) {
  const res = await apiClient.patch<ApiResponse<Leave>>(`/leaves/${id}/approve`);
  return res.data.data;
}

export async function rejectLeave(id: number) {
  const res = await apiClient.patch<ApiResponse<Leave>>(`/leaves/${id}/reject`);
  return res.data.data;
}

export async function cancelLeave(id: number) {
  const res = await apiClient.patch<ApiResponse<Leave>>(`/leaves/${id}/cancel`);
  return res.data.data;
}
