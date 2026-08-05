export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

// A reading this imprecise (kilometers, not meters) is almost always the
// browser falling back to a coarse IP-based guess rather than a real
// GPS/WiFi fix — seen in practice as a wrong-country result with ~1768m
// accuracy. A second attempt often lands a proper fix once the OS location
// service finishes initializing, so it's worth one automatic retry.
const POOR_ACCURACY_THRESHOLD_METERS = 1500;

function requestPosition(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // TEMPORARY DEBUG (2026-08-04): logging accuracy to diagnose reports
        // of false "not at office" rejections while physically on-site —
        // helps tell a genuinely-far location apart from a low-accuracy fix.
        console.log(
          `[geolocation] lat=${position.coords.latitude} lng=${position.coords.longitude} ` +
            `accuracy=${Math.round(position.coords.accuracy)}m (enableHighAccuracy: true)`,
        );
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      GEOLOCATION_OPTIONS,
    );
  });
}

function pickBetterReading(a: Coordinates | null, b: Coordinates | null): Coordinates | null {
  if (!a) return b;
  if (!b) return a;
  const aAccuracy = a.accuracy ?? Infinity;
  const bAccuracy = b.accuracy ?? Infinity;
  return bAccuracy <= aAccuracy ? b : a;
}

// Resolves to null on any failure (permission denied, timeout, unsupported
// browser, etc.) rather than rejecting — callers treat "couldn't get a
// location" and "got a bad location" the same way.
//
// If the first reading is missing or has poor accuracy (likely an IP-based
// fallback fix), automatically requests a second reading and keeps
// whichever is more precise.
export async function getCurrentPosition(): Promise<Coordinates | null> {
  const first = await requestPosition();
  if (first && first.accuracy != null && first.accuracy <= POOR_ACCURACY_THRESHOLD_METERS) {
    return first;
  }

  console.log(
    `[geolocation] first reading ${first ? `accuracy=${Math.round(first.accuracy ?? NaN)}m` : "failed"} — retrying once`,
  );
  const second = await requestPosition();
  return pickBetterReading(first, second);
}
