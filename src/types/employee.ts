import type { Role } from "./auth";

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  cnic_number: string | null;
  address: string | null;
  profile_picture_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  bank_name: string | null;
  account_title: string | null;
  account_number: string | null;
  iban: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  department_id: number | null;
  department_name: string | null;
  designation_id: number | null;
  designation_name: string | null;
  role_id: number;
  role_name: Role;
  manager_id: number | null;
  manager_name: string | null;
  join_date: string;
  resign_date: string | null;
  base_salary: string;
  shift_start_time: string | null;
  shift_end_time: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "all";
  search?: string;
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  cnicNumber?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  departmentId?: number;
  designationId?: number;
  roleId: number;
  managerId?: number;
  joinDate: string;
  baseSalary?: number;
}

export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, "password">> & {
  // Per-employee shift override — null clears it back to the company
  // default. Update-only: there's no UI for setting this at creation time.
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
};

export interface Department {
  id: number;
  department_name: string;
  description: string | null;
  is_active: 0 | 1;
}

export interface Designation {
  id: number;
  designation_name: string;
  department_id: number;
  is_active: 0 | 1;
}

export interface RoleOption {
  id: number;
  role_name: Role;
  description: string | null;
}
