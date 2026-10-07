import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CompleteOnboardingInput,
  Employee,
  InvitationPrefill,
} from "@/types";

export async function fetchInvitationByToken(token: string) {
  const res = await apiClient.get<ApiResponse<InvitationPrefill>>(`/onboarding/${token}`);
  return res.data.data;
}

export async function completeOnboarding(token: string, input: CompleteOnboardingInput) {
  const formData = new FormData();
  formData.append("fullName", input.fullName);
  formData.append("password", input.password);
  if (input.phone) formData.append("phone", input.phone);
  if (input.cnicNumber) formData.append("cnicNumber", input.cnicNumber);
  if (input.address) formData.append("address", input.address);
  if (input.emergencyContactName) formData.append("emergencyContactName", input.emergencyContactName);
  if (input.emergencyContactPhone) formData.append("emergencyContactPhone", input.emergencyContactPhone);
  if (input.emergencyContactRelation)
    formData.append("emergencyContactRelation", input.emergencyContactRelation);
  if (input.gender) formData.append("gender", input.gender);
  if (input.dateOfBirth) formData.append("dateOfBirth", input.dateOfBirth);
  if (input.departmentId) formData.append("departmentId", String(input.departmentId));
  if (input.designationId) formData.append("designationId", String(input.designationId));
  if (input.managerId) formData.append("managerId", String(input.managerId));
  if (input.bankName) formData.append("bankName", input.bankName);
  if (input.accountTitle) formData.append("accountTitle", input.accountTitle);
  if (input.accountNumber) formData.append("accountNumber", input.accountNumber);
  if (input.iban) formData.append("iban", input.iban);
  if (input.baseSalary) formData.append("baseSalary", String(input.baseSalary));

  const res = await apiClient.post<ApiResponse<Employee>>(
    `/onboarding/${token}/complete`,
    formData,
  );
  return res.data.data;
}
