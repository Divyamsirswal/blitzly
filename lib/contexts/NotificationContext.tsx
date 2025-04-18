"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification } from "@/lib/hooks/useNotifications";

// Define NotificationData type here since it's not exported from useNotifications
interface NotificationData {
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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  createNotification: (data: NotificationData) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<
    NotificationPermission | undefined
  >;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    createNotification,
    refreshNotifications,
    requestNotificationPermission,
  } = useNotifications();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        removeNotification,
        createNotification,
        refreshNotifications,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}
