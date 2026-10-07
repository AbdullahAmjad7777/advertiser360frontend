import { apiClient } from "@/lib/api-client";
import type { ApiResponse, LatePolicy, LocationRestrictionSetting, OfficeHours } from "@/types";

export async function fetchOfficeHours() {
  const res = await apiClient.get<ApiResponse<OfficeHours>>("/settings/office-hours");
  return res.data.data;
}

export async function updateOfficeHours(input: OfficeHours) {
  const res = await apiClient.patch<ApiResponse<OfficeHours>>("/settings/office-hours", input);
  return res.data.data;
}

export async function fetchLocationRestriction() {
  const res = await apiClient.get<ApiResponse<LocationRestrictionSetting>>(
    "/settings/location-restriction",
  );
  return res.data.data;
}

export async function updateLocationRestriction(enabled: boolean) {
  const res = await apiClient.patch<ApiResponse<LocationRestrictionSetting>>(
    "/settings/location-restriction",
    { enabled },
  );
  return res.data.data;
}

export async function fetchLatePolicy() {
  const res = await apiClient.get<ApiResponse<LatePolicy>>("/settings/late-policy");
  return res.data.data;
}

export async function updateLatePolicy(graceMinutes: number) {
  const res = await apiClient.patch<ApiResponse<LatePolicy>>("/settings/late-policy", {
    graceMinutes,
  });
  return res.data.data;
}
