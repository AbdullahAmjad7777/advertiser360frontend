import { apiClient } from "@/lib/api-client";
import type {
  AgentFixAllProgress,
  AgentFixAllResult,
  AgentResyncProgress,
  AgentResyncRequestResult,
  ApiResponse,
  PendingAgentUninstall,
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

// Deleted employees whose agent hasn't confirmed its own uninstall yet —
// i.e. is still installed and running somewhere, waiting to come online.
export async function fetchPendingUninstalls() {
  const res = await apiClient.get<ApiResponse<PendingAgentUninstall[]>>("/agent/pending-uninstalls");
  return res.data.data;
}

// Manual override for a stuck entry — the CEO/manager personally confirmed
// the machine is handled (wiped, agent removed by hand, etc.) instead of
// waiting on an ack that may never come.
export async function resolvePendingUninstall(employeeId: number) {
  await apiClient.post<ApiResponse<null>>(`/agent/pending-uninstalls/${employeeId}/resolve`);
}
