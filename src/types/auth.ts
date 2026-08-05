export type Role = "ceo" | "manager" | "employee" | "admin" | "hr";

export interface AuthUser {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  department_id: number | null;
  designation_id: number | null;
  manager_id: number | null;
  join_date: string;
  is_active: 0 | 1;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
