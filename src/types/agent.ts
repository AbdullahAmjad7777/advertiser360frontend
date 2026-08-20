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

export interface AgentCaptureStatus {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  agent_version: string | null;
  agent_last_seen_at: string | null;
  agent_capturing: number | null;
  agent_last_capture_attempt_at: string | null;
  agent_last_capture_success_at: string | null;
  agent_last_capture_error: string | null;
}
