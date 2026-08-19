export type AttendanceStatus =
  | "present"
  | "late"
  | "half_day"
  | "absent"
  | "on_leave"
  | "holiday";

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: string | null;
  status: AttendanceStatus;
  ip_address: string | null;
  created_at?: string;
}

export interface TodayAttendanceRow {
  employee_id: number;
  employee_code: string;
  full_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: string | null;
  ip_address: string | null;
  status: AttendanceStatus;
}

export interface AttendanceHistoryRow {
  id: number;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: string | null;
  status: AttendanceStatus;
  ip_address: string | null;
}

export interface AttendanceHistoryParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  halfDay: number;
  holiday: number;
}

export interface AttendanceTrendParams {
  days?: number;
  employeeId?: number;
}

export interface AttendanceCorrectionInput {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: AttendanceStatus;
  reason?: string;
}

export interface AttendanceEditLogEntry {
  id: number;
  old_check_in_time: string | null;
  old_check_out_time: string | null;
  old_status: AttendanceStatus | null;
  new_check_in_time: string | null;
  new_check_out_time: string | null;
  new_status: AttendanceStatus | null;
  reason: string | null;
  edited_at: string;
  edited_by_name: string | null;
}
