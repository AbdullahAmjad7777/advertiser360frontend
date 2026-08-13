import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken } from "./token-store";

// VITE_API_BASE_URL (just the origin, e.g. https://advertiser360-backend.vercel.app)
// takes priority when set — required once frontend and backend are deployed
// as separate origins, since there's no single "host:port" relationship
// between them anymore. When unset, falls back to deriving the API host
// from wherever the page was actually loaded from (localhost, a LAN IP,
// etc.), so local/LAN dev keeps working the same as before with only the
// port configurable via VITE_API_PORT.
const API_BASE_ORIGIN = import.meta.env.VITE_API_BASE_URL as string | undefined;
const API_PORT = (import.meta.env.VITE_API_PORT as string | undefined) ?? "5000";
export const API_BASE_URL = API_BASE_ORIGIN
  ? `${API_BASE_ORIGIN}/api`
  : `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ success: boolean; data: { accessToken: string } }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => res.data.data.accessToken)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.response?.config as RetriableConfig | undefined;
    const isAuthEndpoint =
      config?.url?.includes("/auth/login") || config?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        setAccessToken(newToken);
        config.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(config);
      }
      setAccessToken(null);
      sessionExpiredHandler?.();
    }

    // Account was deactivated mid-session (still-valid token, but the
    // backend now rejects it) — no amount of retrying/refreshing fixes
    // this, so drop straight to logout instead of surfacing a raw 403.
    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (error.response?.status === 403 && code === "ACCOUNT_DEACTIVATED") {
      setAccessToken(null);
      sessionExpiredHandler?.();
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    // No response at all (blocked by CORS, connection refused, DNS/timeout,
    // firewall) is a distinct failure from a real backend rejection — don't
    // let callers' fallback text (often credential-specific, e.g. "Invalid
    // email or password") misrepresent a network problem as something else.
    if (!error.response) {
      return "Could not reach the server. Check your network connection and try again.";
    }
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: string } | undefined;
    return data?.code;
  }
  return undefined;
}

// TEMPORARY DEBUG (2026-08-04): surfaces the location-check debug payload
// (detected coords/distance/accuracy) the backend now attaches to
// LOCATION_OUT_OF_RANGE / LOCATION_PERMISSION_REQUIRED errors, so users can
// see why a login was rejected without opening devtools. Safe to remove
// once radius/accuracy tuning is confirmed.
export interface LocationErrorDetails {
  detectedLatitude: number | null;
  detectedLongitude: number | null;
  accuracyMeters: number | null;
  distanceMeters?: number;
  officeLatitude?: number;
  officeLongitude?: number;
  radiusMeters?: number;
}

export function getErrorDetails(error: unknown): LocationErrorDetails | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { details?: LocationErrorDetails } | undefined;
    return data?.details;
  }
  return undefined;
}
