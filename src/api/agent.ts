import { apiClient } from "@/lib/api-client";
import type {
  AgentCaptureStatus,
  AgentFixAllProgress,
  AgentFixAllResult,
  AgentResyncProgress,
  AgentResyncRequestResult,
  ApiResponse,
} from "@/types";

export async function refreshAllAgents() {
  const res = await apiClient.post<ApiResponse<AgentResyncRequestResult>>("/agent/refresh-all");
  return res.data.data;
}

export async function pushUpdateAllAgents() {
  const res = await apiClient.post<ApiResponse<AgentResyncRequestResult>>("/agent/push-update");
  return res.data.data;
}

export async function fetchResyncProgress(requestId: number) {
  const res = await apiClient.get<ApiResponse<AgentResyncProgress>>(
    `/agent/refresh-all/${requestId}`,
  );
  return res.data.data;
}

export async function fixAllAgents() {
  const res = await apiClient.post<ApiResponse<AgentFixAllResult>>("/agent/fix-all");
  return res.data.data;
}

export async function fetchFixAllProgress(resyncRequestId: number, updateRequestId: number) {
  const res = await apiClient.get<ApiResponse<AgentFixAllProgress>>("/agent/fix-all/progress", {
    params: { resyncRequestId, updateRequestId },
  });
  return res.data.data;
}

export async function fetchCaptureStatuses() {
  const res = await apiClient.get<ApiResponse<AgentCaptureStatus[]>>("/agent/capture-status");
  return res.data.data;
}
