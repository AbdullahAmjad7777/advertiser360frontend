import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  AttendanceHistoryParams,
  AttendanceHistoryRow,
  AttendanceRecord,
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
