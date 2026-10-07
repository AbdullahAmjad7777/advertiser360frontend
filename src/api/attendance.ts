import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  AttendanceCorrectionInput,
  AttendanceEditLogEntry,
  AttendanceHistoryParams,
  AttendanceHistoryRow,
  AttendanceRecord,
  AttendanceTrendParams,
  AttendanceTrendPoint,
  CheckInBlock,
  LateSummaryRow,
  MissedCheckout,
  PersonAttendanceStats,
  Paginated,
  PageParams,
  TodayAttendanceRow,
} from "@/types";

export async function checkIn() {
  const res = await apiClient.post<ApiResponse<AttendanceRecord>>("/attendance/check-in");
  return res.data.data;
}

export async function checkOut() {
  const res = await apiClient.post<ApiResponse<AttendanceRecord>>("/attendance/check-out");
  return res.data.data;
}

// The record for whichever shift is currently open/most recent, resolved by
// shift date rather than the browser's plain calendar date — this is what
// keeps the check-in/check-out button correct across midnight for an
// overnight shift, unlike querying history for "today".
export async function fetchCurrentStatus() {
  const res = await apiClient.get<ApiResponse<AttendanceRecord | null>>("/attendance/me/current");
  return res.data.data;
}

export async function correctAttendance(attendanceId: number, input: AttendanceCorrectionInput) {
  const res = await apiClient.patch<ApiResponse<AttendanceRecord>>(
    `/attendance/${attendanceId}/correct`,
    input,
  );
  return res.data.data;
}

export async function fetchAttendanceEditLog(attendanceId: number) {
  const res = await apiClient.get<ApiResponse<AttendanceEditLogEntry[]>>(
    `/attendance/${attendanceId}/edit-log`,
  );
  return res.data.data;
}

export async function fetchTodayAttendance(params: PageParams) {
  const res = await apiClient.get<ApiResponse<Paginated<TodayAttendanceRow>>>(
    "/attendance/today",
    { params },
  );
  return res.data.data;
}

export async function fetchAttendanceHistory(employeeId: number, params: AttendanceHistoryParams) {
  const res = await apiClient.get<ApiResponse<Paginated<AttendanceHistoryRow>>>(
    `/attendance/employee/${employeeId}`,
    { params },
  );
  return res.data.data;
}

export async function fetchAttendanceTrend(params: AttendanceTrendParams) {
  const res = await apiClient.get<ApiResponse<AttendanceTrendPoint[]>>("/attendance/trend", {
    params,
  });
  return res.data.data;
}

export async function fetchCheckInBlock() {
  const res = await apiClient.get<ApiResponse<CheckInBlock>>("/attendance/me/check-in-block");
  return res.data.data;
}

export async function fetchMissedCheckouts() {
  const res = await apiClient.get<ApiResponse<MissedCheckout[]>>("/attendance/missed-checkouts");
  return res.data.data;
}

export async function closeMissedCheckout(
  attendanceId: number,
  input: { checkOutTime: string; reason: string },
) {
  const res = await apiClient.post<ApiResponse<AttendanceRecord>>(
    `/attendance/${attendanceId}/close-missed-checkout`,
    input,
  );
  return res.data.data;
}


export async function fetchAttendanceStats(params: { year?: number; month?: number } = {}) {
  const res = await apiClient.get<ApiResponse<PersonAttendanceStats[]>>("/attendance/stats", {
    params,
  });
  return res.data.data;
}

export async function fetchLateSummary(params: { month?: number; year?: number } = {}) {
  const res = await apiClient.get<ApiResponse<LateSummaryRow[]>>("/attendance/late-summary", {
    params,
  });
  return res.data.data;
}
