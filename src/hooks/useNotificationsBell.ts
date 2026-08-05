import { useCallback, useEffect, useState } from "react";
import * as notificationsApi from "@/api/notifications";
import type { Notification } from "@/types";

const POLL_INTERVAL_MS = 30_000;
const BELL_FETCH_LIMIT = 50;

export function useNotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await notificationsApi.fetchNotifications({ limit: BELL_FETCH_LIMIT });
      setNotifications(result.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n)),
    );
    try {
      await notificationsApi.markNotificationRead(id);
    } catch {
      load();
    }
  }, [load]);

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return { notifications, unreadCount, loading, markRead, refetch: load };
}
