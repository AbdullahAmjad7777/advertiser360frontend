import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import * as authApi from "@/api/auth";
import { wakeDesktopAgent } from "@/lib/agent-wake";
import {
  apiClient,
  getErrorCode,
  getErrorDetails,
  getErrorMessage,
  onSessionExpired,
} from "@/lib/api-client";
import { getCurrentPosition } from "@/lib/geolocation";
import { connectSocket, disconnectSocket, onForceLogout } from "@/lib/socket";
import { setAccessToken } from "@/lib/token-store";
import type { AuthUser } from "@/types";

const LOCATION_POLL_INTERVAL_MS = 5 * 60 * 1000; // re-check every 5 minutes
const DEFAULT_RESTRICTED_MESSAGE = "You must be at the office to access this portal.";
const LOCATION_ERROR_CODES = new Set(["LOCATION_PERMISSION_REQUIRED", "LOCATION_OUT_OF_RANGE"]);

// TEMPORARY DEBUG (2026-08-04): appends the detected coordinates/distance/
// accuracy to the restriction message so it's visible without devtools.
// Remove this once the radius/accuracy false-rejection issue is resolved.
function formatDebugSuffix(details: {
  detectedLatitude?: number | null;
  detectedLongitude?: number | null;
  accuracyMeters?: number | null;
  distanceMeters?: number | null;
}): string {
  if (details.detectedLatitude == null || details.detectedLongitude == null) {
    return " [debug: browser did not return any coordinates]";
  }
  const lat = details.detectedLatitude.toFixed(6);
  const lng = details.detectedLongitude.toFixed(6);
  const accuracy = details.accuracyMeters != null ? `${Math.round(details.accuracyMeters)}m` : "unknown";
  const distance = details.distanceMeters != null ? `${details.distanceMeters}m` : "unknown";
  return ` [debug: detected (${lat}, ${lng}), accuracy ±${accuracy}, ${distance} from office]`;
}

interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  locationRestricted: boolean;
  locationRestrictedMessage: string;
  isRetryingLocation: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissLocationRestriction: () => void;
  retryLocationCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [locationRestricted, setLocationRestricted] = useState(false);
  const [locationRestrictedMessage, setLocationRestrictedMessage] = useState(
    DEFAULT_RESTRICTED_MESSAGE,
  );
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Remembered only long enough to support the "Retry location" button when
  // a login attempt itself was rejected for location reasons (no session
  // exists yet at that point, so there's nothing to refresh) — cleared on
  // success, dismiss, and logout. In-memory only, never persisted or logged.
  const pendingCredentialsRef = useRef<{ email: string; password: string } | null>(null);

  const stopLocationPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    disconnectSocket();
    stopLocationPolling();
  }, [stopLocationPolling]);

  // Re-checks the current geolocation against the office radius for the
  // active session. Returns whether the session is still allowed to
  // continue; if not, logs the user out and switches on the full-screen
  // restriction takeover (does not just block a single action/page).
  const checkLocationNow = useCallback(async (): Promise<boolean> => {
    const coords = await getCurrentPosition();
    try {
      const result = await authApi.verifyLocation(coords);
      if (result.inRange) return true;

      const baseMessage = coords
        ? "You have left the office location. You must be at the office to access this portal."
        : "Location access is required to use this portal. Please allow location permissions.";
      setLocationRestrictedMessage(
        baseMessage +
          formatDebugSuffix({
            detectedLatitude: result.detectedLatitude,
            detectedLongitude: result.detectedLongitude,
            accuracyMeters: result.accuracyMeters,
            distanceMeters: result.distanceMeters,
          }),
      );
      setLocationRestricted(true);
      clearSession();
      return false;
    } catch {
      // Network/auth hiccup on the check itself — don't force a false
      // restriction; the normal 401/session-expiry handling covers a truly
      // dead session.
      return true;
    }
  }, [clearSession]);

  const startLocationPolling = useCallback(() => {
    stopLocationPolling();
    pollTimerRef.current = setInterval(() => {
      checkLocationNow();
    }, LOCATION_POLL_INTERVAL_MS);
  }, [stopLocationPolling, checkLocationNow]);

  useEffect(() => {
    return onSessionExpired(() => clearSession());
  }, [clearSession]);

  // Instant path for a manager/CEO's "force session refresh" action: an
  // already-open, already-connected tab gets logged out the moment the
  // backend pushes this over the socket, instead of waiting for the next
  // API call to hit the session_epoch check in the response interceptor.
  useEffect(() => {
    onForceLogout((payload) => {
      toast.info(payload?.message ?? "Your session was reset. Please log in again.");
      clearSession();
    });
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const profile = await authApi.fetchMe();
        if (cancelled) return;
        setUser(profile);
        connectSocket();

        if (profile.role !== "ceo") {
          const stillInRange = await checkLocationNow();
          if (!cancelled && stillInRange) startLocationPolling();
        }
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    // On first load there's no in-memory access token yet; try a silent
    // refresh using the httpOnly cookie before giving up on the session.
    async function bootstrap() {
      try {
        const res = await apiClient.post<{ data: { accessToken: string } }>("/auth/refresh");
        setAccessToken(res.data.data.accessToken);
        await restoreSession();
      } catch {
        if (!cancelled) {
          clearSession();
          setIsInitializing(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const coords = await getCurrentPosition();
      try {
        const { accessToken, user: loggedInUser } = await authApi.login(email, password, coords);
        pendingCredentialsRef.current = null;
        setAccessToken(accessToken);
        setUser(loggedInUser);
        setLocationRestricted(false);
        connectSocket();
        wakeDesktopAgent();
        if (loggedInUser.role !== "ceo") {
          startLocationPolling();
        }
      } catch (err) {
        const code = getErrorCode(err);
        if (code && LOCATION_ERROR_CODES.has(code)) {
          pendingCredentialsRef.current = { email, password };
          const details = getErrorDetails(err);
          const baseMessage = getErrorMessage(err, DEFAULT_RESTRICTED_MESSAGE);
          setLocationRestrictedMessage(details ? baseMessage + formatDebugSuffix(details) : baseMessage);
          setLocationRestricted(true);
          return; // full-screen takeover handles this, not the login form
        }
        throw err;
      }
    },
    [startLocationPolling],
  );

  const logout = useCallback(async () => {
    pendingCredentialsRef.current = null;
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const dismissLocationRestriction = useCallback(() => {
    pendingCredentialsRef.current = null;
    setLocationRestricted(false);
  }, []);

  // Manual "Retry location" action for the restricted screen. Two cases:
  //  - The block came from a failed login (no session yet) — resubmit the
  //    remembered credentials, which re-acquires a fresh reading and
  //    re-validates against the backend.
  //  - The block came from mid-session drift (checkLocationNow logged the
  //    user out, but the httpOnly refresh cookie is still valid since that
  //    path never calls the logout endpoint) — silently restore the session
  //    and re-check location before dropping the takeover screen.
  const retryLocationCheck = useCallback(async () => {
    setIsRetryingLocation(true);
    try {
      if (pendingCredentialsRef.current) {
        const { email, password } = pendingCredentialsRef.current;
        await login(email, password);
        return;
      }

      const res = await apiClient.post<{ data: { accessToken: string } }>("/auth/refresh");
      setAccessToken(res.data.data.accessToken);
      const profile = await authApi.fetchMe();
      setUser(profile);
      connectSocket();

      if (profile.role === "ceo") {
        setLocationRestricted(false);
        return;
      }

      const stillInRange = await checkLocationNow();
      if (stillInRange) {
        setLocationRestricted(false);
        startLocationPolling();
      }
    } catch {
      setLocationRestrictedMessage("Your session has expired. Please log in again.");
    } finally {
      setIsRetryingLocation(false);
    }
  }, [login, checkLocationNow, startLocationPolling]);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      locationRestricted,
      locationRestrictedMessage,
      isRetryingLocation,
      login,
      logout,
      dismissLocationRestriction,
      retryLocationCheck,
    }),
    [
      user,
      isInitializing,
      locationRestricted,
      locationRestrictedMessage,
      isRetryingLocation,
      login,
      logout,
      dismissLocationRestriction,
      retryLocationCheck,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
