export interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number;
  assigned_to_name: string;
  assigned_to_code: string;
  assigned_by: number | null;
  assigned_by_name: string | null;
  due_date: string;
  is_completed: 0 | 1;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // 1 when the person added it for themselves (not assigned by the CEO).
  self_added: 0 | 1 | null;
}

export interface TaskListParams {
  assignedTo?: number;
  status?: "pending" | "completed" | "all";
  // Manager only: "team" returns every employee's tasks instead of their own.
  scope?: "mine" | "team";
  from?: string;
  to?: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  // Ignored for non-CEO callers: their task is always for themselves.
  assignedTo?: number;
  dueDate?: string;
}

export interface PendingTaskSummary {
  id: number;
  title: string;
  due_date: string;
}
