import { apiClient } from "@/lib/api-client";
import type { ApiResponse, BreakHistory, BreakHistoryParams, BreakRecord } from "@/types";

export async function startBreak() {
  const res = await apiClient.post<ApiResponse<BreakRecord>>("/breaks/start");
  return res.data.data;
}

export async function endBreak() {
  const res = await apiClient.post<ApiResponse<BreakRecord>>("/breaks/end");
  return res.data.data;
}

export async function fetchActiveBreak() {
  const res = await apiClient.get<ApiResponse<BreakRecord | null>>("/breaks/me/current");
  return res.data.data;
}

export async function fetchBreakHistory(params: BreakHistoryParams = {}) {
  const res = await apiClient.get<ApiResponse<BreakHistory>>("/breaks", { params });
  return res.data.data;
}
