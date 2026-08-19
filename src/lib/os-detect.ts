export type DetectedOS = "windows" | "mac" | "other";

// navigator.userAgentData is Chromium-only and not always present, so this
// falls back to the userAgent string (still reliable enough for a
// "which installer should we default to" hint — the manual link below it
// covers anyone this misdetects).
export function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "other";

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ?? navigator.platform ?? "";
  const ua = navigator.userAgent ?? "";
  const signal = `${platform} ${ua}`.toLowerCase();

  if (signal.includes("mac") || signal.includes("iphone") || signal.includes("ipad")) {
    return "mac";
  }
  if (signal.includes("win")) {
    return "windows";
  }
  return "other";
}
