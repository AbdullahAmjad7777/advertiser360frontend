export type PayrollStatus = "draft" | "finalized" | "paid";
export type DeductionRuleType =
  | "tax"
  | "provident_fund"
  | "late_penalty"
  | "absent_penalty"
  | "other";
export type PercentageOrFixed = "percentage" | "fixed";

export interface SalaryStructure {
  id: number;
  employee_id: number;
  basic_salary: string;
  house_rent_allowance: string;
  medical_allowance: string;
  transport_allowance: string;
  other_allowance: string;
  effective_from: string;
  updated_at: string;
}

export interface SetSalaryStructureInput {
  basicSalary: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  effectiveFrom: string;
}

export interface DeductionRule {
  id: number;
  rule_name: string;
  rule_type: DeductionRuleType;
  percentage_or_fixed: PercentageOrFixed;
  value: string;
  is_active: 0 | 1;
  created_at: string;
}

export interface LateDeductionDay {
  date: string;
  checkInTime: string | null;
}

export interface LateDeductionGroup {
  groupNumber: number;
  officeStartTime: string;
  lateDays: LateDeductionDay[];
  deductionDate: string;
  deductionAmount: number;
}

export interface Payroll {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  month: number;
  year: number;
  total_present_days: number;
  total_absent_days: number;
  total_leave_days: number;
  late_deduction_days: number;
  gross_salary: string;
  total_deductions: string;
  late_deduction_amount: string;
  late_deduction_breakdown: LateDeductionGroup[];
  net_salary: string;
  status: PayrollStatus;
  generated_at: string;
}

export interface PayrollListParams {
  page?: number;
  limit?: number;
  employeeId?: number;
  month?: number;
  year?: number;
  status?: PayrollStatus;
}

export interface GeneratePayrollInput {
  employeeId: number;
  month: number;
  year: number;
}
