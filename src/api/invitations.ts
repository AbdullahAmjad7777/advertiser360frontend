import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Invitation, InvitationListParams, Paginated } from "@/types";

export async function inviteEmployee(email: string) {
  const res = await apiClient.post<ApiResponse<Invitation>>("/employees/invitations", { email });
  return res.data.data;
}

export async function fetchInvitations(params: InvitationListParams) {
  const res = await apiClient.get<ApiResponse<Paginated<Invitation>>>("/employees/invitations", {
    params,
  });
  return res.data.data;
}

export async function resendInvitation(id: number) {
  const res = await apiClient.post<ApiResponse<Invitation>>(`/employees/invitations/${id}/resend`);
  return res.data.data;
}

export async function revokeInvitation(id: number) {
  await apiClient.delete(`/employees/invitations/${id}`);
}
