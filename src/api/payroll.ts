import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  GeneratePayrollInput,
  Paginated,
  Payroll,
  PayrollListParams,
  SalaryStructure,
} from "@/types";

export async function fetchPayrollList(params: PayrollListParams) {
  const res = await apiClient.get<ApiResponse<Paginated<Payroll>>>("/payroll", { params });
  return res.data.data;
}

export async function fetchPayrollById(id: number) {
  const res = await apiClient.get<ApiResponse<Payroll>>(`/payroll/${id}`);
  return res.data.data;
}

export async function generatePayroll(input: GeneratePayrollInput) {
  const res = await apiClient.post<ApiResponse<Payroll>>("/payroll/generate", input);
  return res.data.data;
}

export async function fetchSalaryStructure(employeeId: number) {
  const res = await apiClient.get<ApiResponse<SalaryStructure>>(
    `/payroll/salary-structure/${employeeId}`,
  );
  return res.data.data;
}

export async function finalizePayroll(id: number) {
  const res = await apiClient.patch<ApiResponse<Payroll>>(`/payroll/${id}/finalize`);
  return res.data.data;
}

export async function markPayrollPaid(id: number) {
  const res = await apiClient.patch<ApiResponse<Payroll>>(`/payroll/${id}/mark-paid`);
  return res.data.data;
}
