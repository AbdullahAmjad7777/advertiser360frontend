// Fired on every successful web CRM login so the desktop agent (if
// installed) launches/resumes in the background without the employee ever
// having to find and open it themselves — see desktop-agent/src/main.js's
// WAKE_PROTOCOL handling for the other half of this.
//
// This is inherently best-effort and silent by design: there is no way for
// a web page to know whether a custom protocol handler is registered, or
// whether the OS actually launched anything as a result. If the agent isn't
// installed, or the browser has no handler registered for this scheme, nothing
// visible happens — the employee's web login is completely unaffected either
// way. The one unavoidable exception is the browser's own native "Open
// Advertisers360 Agent?" permission prompt, which most browsers show once
// per browser profile the first time this scheme is used; after it's
// allowed once, later logins launch the agent without asking again.
const AGENT_WAKE_URL = "advertiser360agent://wake";

export function wakeDesktopAgent() {
  try {
    window.location.href = AGENT_WAKE_URL;
  } catch {
    // Never let this affect the login flow.
  }
}
