import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Notification, Paginated, PageParams } from "@/types";

export async function fetchNotifications(params: PageParams = {}) {
  const res = await apiClient.get<ApiResponse<Paginated<Notification>>>("/notifications", {
    params,
  });
  return res.data.data;
}

export async function markNotificationRead(id: number) {
  await apiClient.patch<ApiResponse<null>>(`/notifications/${id}/read`);
}
