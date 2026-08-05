export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveType {
  id: number;
  type_name: string;
  default_annual_quota: number;
  is_paid: 0 | 1;
}

export interface Leave {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  leave_type_id: number;
  leave_type_name: string;
  is_paid: 0 | 1;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface LeaveBalance {
  leave_type_id: number;
  type_name: string;
  is_paid: 0 | 1;
  total_allotted: number;
  used: number;
  remaining: number;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employeeId?: number;
}

export interface ApplyLeaveInput {
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  reason?: string;
}
