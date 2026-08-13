import { API_BASE_URL, apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/token-store";
import type {
  ApiResponse,
  Paginated,
  Screenshot,
  ScreenshotActivityPoint,
  ScreenshotListParams,
} from "@/types";

export async function fetchScreenshots(params: ScreenshotListParams) {
  const res = await apiClient.get<ApiResponse<Paginated<Screenshot>>>("/screenshots", { params });
  return res.data.data;
}

export async function fetchScreenshotActivity(days?: number) {
  const res = await apiClient.get<ApiResponse<ScreenshotActivityPoint[]>>("/screenshots/activity", {
    params: { days },
  });
  return res.data.data;
}

export function getScreenshotFileUrl(id: number): string {
  const token = getAccessToken();
  return `${API_BASE_URL}/screenshots/${id}/file?token=${encodeURIComponent(token ?? "")}`;
}
