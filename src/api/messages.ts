import { API_BASE_URL, apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/token-store";
import type { ApiResponse } from "@/types";

export async function markMessageRead(id: number) {
  await apiClient.patch<ApiResponse<null>>(`/messages/${id}/read`);
}

export function getAttachmentUrl(messageId: number): string {
  const token = getAccessToken();
  return `${API_BASE_URL}/messages/${messageId}/attachment?token=${encodeURIComponent(token ?? "")}`;
}
