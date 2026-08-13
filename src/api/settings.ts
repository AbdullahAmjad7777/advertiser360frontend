import { apiClient } from "@/lib/api-client";
import type { ApiResponse, OfficeHours } from "@/types";

export async function fetchOfficeHours() {
  const res = await apiClient.get<ApiResponse<OfficeHours>>("/settings/office-hours");
  return res.data.data;
}

export async function updateOfficeHours(input: OfficeHours) {
  const res = await apiClient.patch<ApiResponse<OfficeHours>>("/settings/office-hours", input);
  return res.data.data;
}
