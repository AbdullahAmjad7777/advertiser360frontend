import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api-client";
import { getAccessToken } from "./token-store";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: (cb) => cb({ token: getAccessToken() }),
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
