import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

interface NotificationTrigger {
  userId: string;
  title: string;
  message: string;
  type:
    | "info"
    | "alert"
    | "reminder"
    | "comment"
    | "mention"
    | "share"
    | "report";
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  triggeredById?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "info"
    | "alert"
    | "reminder"
    | "comment"
    | "mention"
    | "share"
    | "report";
  read: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  triggeredById?: string;
  triggeredBy?: {
    id: string;
    name: string;
    image: string;
  };
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const POLLING_INTERVAL = 30000; // 30 seconds

async function retryWithBackoff(
  fn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<Response> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedRef = useRef<number>(0);

  // Fetch notifications from the API with debouncing and caching
  const fetchNotifications = useCallback(
    async (force = false) => {
      if (!session?.user) return;

      // Don't fetch if already loading, unless forced
      if (loading && !force) return;

      // Debounce frequent calls
      const now = Date.now();
      if (!force && now - lastFetchedRef.current < 5000) {
        return;
      }

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Set a timeout to abort the request if it takes too long
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setLoading(false);
          setError("Request timed out. Please try again.");
        }
      }, 10000); // 10 second timeout

      try {
        setLoading(true);
        const response = await retryWithBackoff(() =>
          fetch("/api/notifications", {
            signal: abortControllerRef.current!.signal,
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          })
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        lastFetchedRef.current = now;

        // Optimistically merge with existing notifications to prevent UI flicker
        setNotifications((prev) => {
          const merged = [...data];
          const existingIds = new Set(data.map((n: Notification) => n.id));

          // Keep unread notifications that haven't been fetched yet
          prev.forEach((notification) => {
            if (!existingIds.has(notification.id) && !notification.read) {
              merged.push(notification);
            }
          });

          return merged;
        });

        setUnreadCount(
          data.filter((notification: Notification) => !notification.read).length
        );
        setError(null);
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          // If it's just an abort triggered by us, don't show an error
          if (force) {
            setError("Request was cancelled. Please try again.");
          }
          return;
        }

        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");

        // Keep existing notifications on error
        if (notifications.length === 0) {
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [session?.user, notifications, loading]
  );

  // Fetch unread count with retry logic
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user || !isPolling) return;

    try {
      const response = await retryWithBackoff(() =>
        fetch("/api/notifications/count")
      );

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      // Don't update the count on error to prevent UI flicker
    }
  }, [session?.user, isPolling]);

  // Mark a single notification as read with optimistic update
  const markAsRead = useCallback(
    async (id: string) => {
      if (!session?.user) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const response = await retryWithBackoff(() =>
          fetch(`/api/notifications/${id}/read`, {
            method: "PUT",
          })
        );

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? { ...notification, read: false }
              : notification
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    [session?.user]
  );

  // Mark all notifications as read with optimistic update
  const markAllAsRead = useCallback(async () => {
    if (!session?.user) return;

    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    setUnreadCount(0);

    try {
      const response = await retryWithBackoff(() =>
        fetch("/api/notifications/read-all", {
          method: "PUT",
        })
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [session?.user, notifications, unreadCount]);

  // Delete a notification with optimistic update
  const removeNotification = useCallback(
    async (id: string) => {
      if (!session?.user) return;

      const notificationToRemove = notifications.find((n) => n.id === id);
      const previousNotifications = [...notifications];
      const previousUnreadCount = unreadCount;

      // Optimistic update
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
      if (notificationToRemove && !notificationToRemove.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const response = await retryWithBackoff(() =>
          fetch(`/api/notifications/${id}`, {
            method: "DELETE",
          })
        );

        if (!response.ok) {
          throw new Error("Failed to delete notification");
        }
      } catch (err) {
        console.error("Error removing notification:", err);
        // Revert optimistic update on error
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
      }
    },
    [session?.user, notifications, unreadCount]
  );

  // Create a new notification with proper error handling
  const createNotification = useCallback(
    async (data: NotificationTrigger) => {
      if (!session?.user) return;

      try {
        const response = await retryWithBackoff(() =>
          fetch("/api/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
        );

        if (!response.ok) {
          throw new Error("Failed to create notification");
        }

        const newNotification = await response.json();

        // Optimistically add the new notification
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if permissions granted
        if (Notification && Notification.permission === "granted") {
          try {
            new Notification("Blitzly", {
              body: data.message,
              icon: "/logo.png",
              tag: newNotification.id, // Prevent duplicate notifications
            });
          } catch (error) {
            console.error("Error showing browser notification:", error);
          }
        }

        return newNotification;
      } catch (err) {
        console.error("Error creating notification:", err);
        throw err; // Propagate error to caller
      }
    },
    [session?.user]
  );

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "denied" as NotificationPermission;
    }

    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return "denied" as NotificationPermission;
      }
    }
    return Notification.permission;
  }, []);

  // Set up polling and cleanup
  useEffect(() => {
    if (session?.user) {
      fetchNotifications(true);

      const pollingId = setInterval(() => {
        if (document.visibilityState === "visible" && isPolling) {
          fetchUnreadCount();
        }
      }, POLLING_INTERVAL);

      const visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          fetchNotifications(true);
        }
      };

      // Update notifications when tab becomes visible
      document.addEventListener("visibilitychange", visibilityHandler);

      // Cleanup
      return () => {
        clearInterval(pollingId);
        document.removeEventListener("visibilitychange", visibilityHandler);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [session, isPolling, fetchNotifications, fetchUnreadCount]);

  // Pause polling when window loses focus
  useEffect(() => {
    const handleFocus = () => setIsPolling(true);
    const handleBlur = () => setIsPolling(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    createNotification,
    refreshNotifications: () => fetchNotifications(true),
    requestNotificationPermission,
  };
}
