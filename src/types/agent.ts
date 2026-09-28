export interface AgentResyncRequestResult {
  requestId: number;
  requestedAt: string;
  estimatedReachable: number;
}

export interface AgentResyncProgress {
  requestId: number;
  requestedAt: string;
  ackCount: number;
  estimatedReachable: number;
}

export interface OfflineAgent {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  agent_last_seen_at: string | null;
}

export interface AgentFixAllResult {
  resyncRequestId: number;
  updateRequestId: number;
  requestedAt: string;
  estimatedReachable: number;
  offlineAgents: OfflineAgent[];
}

export interface AgentFixAllProgress {
  resyncRequestId: number;
  updateRequestId: number;
  respondedCount: number;
  estimatedReachable: number;
  updated: number;
  alreadyCurrent: number;
  offlineAgents: OfflineAgent[];
}

// A deleted employee whose desktop agent hasn't confirmed its own uninstall
// yet — still shows up here (by snapshot, not a live employees join) even
// though the employees row itself is already gone; see backend's
// 022_agent_uninstall.sql for why.
export interface PendingAgentUninstall {
  employee_id: number;
  employee_code: string;
  full_name: string;
  requested_at: string;
}
