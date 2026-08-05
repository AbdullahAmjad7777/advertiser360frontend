import { apiClient } from "@/lib/api-client";
import type { Coordinates } from "@/lib/geolocation";
import type { ApiResponse, AuthUser, LoginResponse } from "@/types";

export interface LocationCheckResult {
  inRange: boolean;
  exempt: boolean;
  distanceMeters: number | null;
  detectedLatitude?: number | null;
  detectedLongitude?: number | null;
  accuracyMeters?: number | null;
}

export async function login(email: string, password: string, coords: Coordinates | null) {
  const res = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", {
    email,
    password,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    accuracy: coords?.accuracy,
  });
  return res.data.data;
}

export async function logout() {
  await apiClient.post<ApiResponse<null>>("/auth/logout");
}

export async function fetchMe() {
  const res = await apiClient.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data.data;
}

export async function verifyLocation(coords: Coordinates | null) {
  const res = await apiClient.post<ApiResponse<LocationCheckResult>>("/auth/verify-location", {
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    accuracy: coords?.accuracy,
  });
  return res.data.data;
}
