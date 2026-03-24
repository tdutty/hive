"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: string;
  title: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown> | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllRead: async () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

const POLL_INTERVAL = 15_000; // 15 seconds

function getNotificationLabel(type: string): string {
  switch (type) {
    case "NEW_CITY_NEEDS_LISTINGS":
      return "New City Alert";
    case "group_formed":
      return "Group Formed";
    case "offer_received":
      return "Offer Received";
    case "suspicious_access":
      return "Security Alert";
    case "health_check":
      return "Health Check";
    case "error_rate":
      return "Error Alert";
    default:
      return "Notification";
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const lastFetchedAt = useRef<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      const res = await fetch(`/api/admin/notifications?${params}`, {
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      const fetched: Notification[] = data.notifications || [];
      const newUnread: number = data.unreadCount ?? 0;

      // Detect truly new notifications (not seen in any previous poll)
      if (knownIds.current.size > 0) {
        for (const n of fetched) {
          if (!knownIds.current.has(n.id) && !n.read) {
            toast(getNotificationLabel(n.type), {
              description: n.title || n.message,
              duration: 6000,
            });
          }
        }
      }

      // Update known IDs
      knownIds.current = new Set(fetched.map((n) => n.id));

      setNotifications(fetched);
      setUnreadCount(newUnread);

      if (fetched.length > 0) {
        lastFetchedAt.current = fetched[0].createdAt;
      }
    } catch {
      // Silent fail — don't disrupt the UI
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
