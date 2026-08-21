import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api-client";
import { getAccessToken } from "./token-store";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

// A manager/CEO's "force session refresh" action needs to reach an already-
// open tab immediately rather than waiting for that tab's next poll/API
// call — the backend pushes a `force-logout` event to this socket's
// `user:${id}` room (see employee.service.js's revokeEmployeeSession).
// Registered once by useAuth regardless of connect/reconnect timing, since
// connectSocket() re-attaches the socket-level listener on every (re)connect.
let forceLogoutHandler: ((payload: { message?: string }) => void) | null = null;
export function onForceLogout(handler: (payload: { message?: string }) => void) {
  forceLogoutHandler = handler;
}

export function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: (cb) => cb({ token: getAccessToken() }),
  });

  socket.on("force-logout", (payload: { message?: string }) => {
    forceLogoutHandler?.(payload);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
