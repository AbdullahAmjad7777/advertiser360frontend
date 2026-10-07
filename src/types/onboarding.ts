export interface Invitation {
  id: number;
  email: string;
  status: "pending" | "completed" | "revoked";
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  invited_by_name: string | null;
}

export interface InvitationListParams {
  page?: number;
  limit?: number;
  status?: Invitation["status"];
}

export interface ManagerOption {
  id: number;
  full_name: string;
}

export interface InvitationPrefill {
  email: string;
  departments: { id: number; department_name: string }[];
  designations: { id: number; designation_name: string; department_id: number }[];
  managers: ManagerOption[];
}

export interface AgentSignInStatus {
  signedIn: boolean;
}

export interface CompleteOnboardingInput {
  fullName: string;
  password: string;
  phone?: string;
  cnicNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  departmentId?: number;
  designationId?: number;
  managerId?: number;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  baseSalary?: number;
}
