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
