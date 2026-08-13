export interface Screenshot {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  file_path: string;
  captured_at: string;
  created_at: string;
}

export interface ScreenshotListParams {
  page?: number;
  limit?: number;
  employeeId?: number;
  from?: string;
  to?: string;
}

export interface ScreenshotActivityPoint {
  date: string;
  count: number;
}
