"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { useNotificationContext } from "@/lib/contexts/NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Info,
  AlertCircle,
  Calendar,
  MessageCircle,
  AtSign,
  Share2,
  FileText,
  Loader2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDropdown({
  isOpen,
  onOpenChange,
}: NotificationDropdownProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
  } = useNotificationContext();

  // Add a local loading state to improve UI responsiveness
  const [localLoading, setLocalLoading] = useState(false);

  // Wrap refreshNotifications to manage local loading state
  const handleRefresh = useCallback(() => {
    setLocalLoading(true);
    refreshNotifications().finally(() => {
      // Set a small delay before removing loading state to prevent flickering
      setTimeout(() => setLocalLoading(false), 300);
    });
  }, [refreshNotifications]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Only refresh if not already loading
      if (!loading && !localLoading) {
        handleRefresh();
      }
    }
  }, [isOpen, loading, localLoading, handleRefresh]);

  // Add refreshNotifications to the useEffect dependencies
  useEffect(() => {
    // Initial fetch
    if (!loading && !localLoading) {
      handleRefresh();
    }

    // Set up interval to fetch new notifications with a more reasonable interval
    const interval = setInterval(() => {
      // Only fetch if not currently loading to prevent multiple simultaneous requests
      if (!loading && !localLoading && document.visibilityState === "visible") {
        handleRefresh();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refreshNotifications, loading, localLoading, handleRefresh]); // Add loading dependency here

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "reminder":
        return <Calendar className="h-4 w-4 text-emerald-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-indigo-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-pink-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-violet-500" />;
      case "report":
        return <FileText className="h-4 w-4 text-cyan-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex w-10 h-10 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 relative hover:text-slate-900 dark:hover:text-white transition-all duration-200 items-center justify-center"
          aria-label={`Notifications ${
            unreadCount > 0 ? `(${unreadCount} unread)` : ""
          }`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center text-[10px] font-medium text-white py-px px-[5px] animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-5}
        className="w-80 p-1.5 mt-1 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-800/50"
        forceMount
      >
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-medium text-sm text-slate-900 dark:text-white flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                Mark all read
              </Button>
            )}
            {notifications?.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                onClick={(e) => {
                  e.stopPropagation();
                  // Clear all notifications
                  notifications.forEach((notification) => {
                    removeNotification(notification.id);
                  });
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="my-1 opacity-20" />

        <div className="max-h-[300px] overflow-y-auto py-1 px-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {loading || localLoading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Loading notifications...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center px-4">
              <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-900 dark:text-white mb-1">
                Couldn&apos;t load notifications
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">
                There was a problem fetching your notifications
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleRefresh()}
                disabled={loading || localLoading}
              >
                {loading || localLoading ? "Loading..." : "Try again"}
              </Button>
            </div>
          ) : notifications?.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  Recent
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "rounded-lg cursor-pointer flex items-start p-3 gap-3 data-[highlighted]:bg-slate-50 dark:data-[highlighted]:bg-slate-800/30 relative group",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    markAsRead(notification.id);

                    if (notification.actionUrl) {
                      router.push(notification.actionUrl);
                      onOpenChange(false);
                    }
                  }}
                >
                  {notification.triggeredBy ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      {notification.triggeredBy.image ? (
                        <Image
                          src={notification.triggeredBy.image}
                          alt={notification.triggeredBy.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-[13px] line-clamp-1 text-slate-900 dark:text-white",
                          !notification.read && "font-medium"
                        )}
                      >
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                            router.push(notification.actionUrl || "");
                            onOpenChange(false);
                          }}
                        >
                          View{" "}
                          {notification.type === "comment"
                            ? "comment"
                            : notification.type === "report"
                            ? "report"
                            : notification.type === "share"
                            ? "shared report"
                            : "details"}
                        </Link>
                      )}
                      <button
                        className="text-[10px] text-slate-500 dark:text-slate-400 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.read) {
                            console.log(
                              "Mark as unread functionality not implemented"
                            );
                          } else {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        {notification.read ? "Mark as unread" : "Mark as read"}
                      </button>
                    </div>
                  </div>

                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    aria-label="Remove notification"
                  >
                    <X className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-900 dark:text-white mb-1">
                No notifications
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                We&apos;ll notify you when something new happens
              </p>
            </div>
          )}
        </div>

        {notifications?.length > 0 && !loading && !localLoading && (
          <>
            <DropdownMenuSeparator className="my-1 opacity-20" />
            <div className="flex items-center justify-between px-1 py-1">
              <DropdownMenuItem
                asChild
                className="rounded-lg flex-1 h-9 flex justify-center cursor-pointer transition-colors data-[highlighted]:bg-slate-50 dark:data-[highlighted]:bg-slate-800/30"
              >
                <Link
                  href="/notifications"
                  className="flex items-center w-full justify-center text-[13px] font-medium text-blue-600 dark:text-blue-400"
                  onClick={() => onOpenChange(false)}
                >
                  View all
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg flex-1 h-9 flex justify-center cursor-pointer transition-colors data-[highlighted]:bg-slate-50 dark:data-[highlighted]:bg-slate-800/30"
                onClick={() => {
                  router.push("/settings/notifications");
                  onOpenChange(false);
                }}
              >
                <span className="flex items-center justify-center text-[13px] font-medium text-slate-600 dark:text-slate-400">
                  Settings
                </span>
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
