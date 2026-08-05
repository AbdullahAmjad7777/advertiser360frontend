let accessToken: string | null = null;
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function onAccessTokenChange(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
