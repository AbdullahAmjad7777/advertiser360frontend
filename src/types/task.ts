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
}

export interface TaskListParams {
  assignedTo?: number;
  status?: "pending" | "completed" | "all";
  from?: string;
  to?: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  assignedTo: number;
  dueDate?: string;
}

export interface PendingTaskSummary {
  id: number;
  title: string;
  due_date: string;
}
