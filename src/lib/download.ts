import { toast } from "sonner";

// Desktop agent installers are plain <a href download> links, but the
// backend origin is cross-origin from the frontend in production. When the
// requested file doesn't exist yet (e.g. the macOS .dmg before the GitHub
// Actions build has run), the backend's JSON 404 has no Content-Disposition
// header, so a plain anchor click navigates the whole tab away from the SPA
// to a page that just shows the raw `{"success":false,...}` body instead of
// downloading anything. A HEAD preflight lets us keep the user on the page
// and show a real error instead.
export async function triggerGuardedDownload(url: string, label: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      toast.error(`${label} isn't available yet. Please check back later.`);
      return;
    }
  } catch {
    toast.error("Could not reach the server. Check your connection and try again.");
    return;
  }
  window.location.href = url;
}
