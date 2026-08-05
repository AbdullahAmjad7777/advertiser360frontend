export interface Notification {
  id: number;
  type: string;
  message: string;
  related_employee_id: number | null;
  is_read: 0 | 1;
  created_at: string;
  read_at: string | null;
}
