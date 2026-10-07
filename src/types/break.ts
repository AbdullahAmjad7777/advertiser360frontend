export interface BreakRecord {
  id: number;
  employee_id: number;
  attendance_id: number;
  shift_date: string;
  break_start: string;
  break_end: string | null;
  duration_seconds: number | null;
}

export interface BreakEntry {
  id: number;
  breakStart: string;
  breakEnd: string | null;
  durationSeconds: number;
  isActive: boolean;
}

// One person's breaks on one shift date, with the day's total.
export interface BreakDay {
  employeeId: number;
  employeeCode: string | null;
  fullName: string | null;
  role: string | null;
  shiftDate: string;
  totalSeconds: number;
  breaks: BreakEntry[];
}

export interface BreakHistory {
  from: string;
  to: string;
  days: BreakDay[];
}

export interface BreakHistoryParams {
  employeeId?: number;
  from?: string;
  to?: string;
}
