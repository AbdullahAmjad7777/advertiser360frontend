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
  attendance_id: number | null;
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

export interface CheckInBlock {
  blocked: boolean;
  message?: string;
  attendanceId?: number;
  attendanceDate?: string;
  checkInTime?: string;
}

export interface MissedCheckout {
  attendance_id: number;
  employee_id: number;
  employee_code: string;
  full_name: string;
  role_name: string;
  attendance_date: string;
  check_in_time: string;
}

// "pending" = today's shift with no check-in yet; "upcoming" = future.
export type CalendarDayStatus =
  | "present"
  | "late"
  | "half_day"
  | "absent"
  | "on_leave"
  | "holiday"
  | "off"
  | "not_joined"
  | "upcoming"
  | "pending";

export interface CalendarDay {
  date: string;
  status: CalendarDayStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: string | null;
}

export interface CalendarMonth {
  month: number;
  daysInMonth: number;
  days: CalendarDay[];
}

export interface AttendanceSummary {
  workingDays: number;
  attendedDays: number;
  onTimeDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  missedCheckouts: number;
  attendancePercentage: number | null;
  onTimePercentage: number | null;
}

export interface YearCalendar {
  employee: { id: number; fullName: string; employeeCode: string };
  year: number;
  isLeapYear: boolean;
  months: CalendarMonth[];
  summary: AttendanceSummary;
}

export interface PersonAttendanceStats extends AttendanceSummary {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  role: string;
}

export interface LateSummaryRow {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  role: string;
  lateCount: number;
  lateDates: { date: string; checkInTime: string | null }[];
  deductionDays: number;
  deductionAmount: number | null;
}
