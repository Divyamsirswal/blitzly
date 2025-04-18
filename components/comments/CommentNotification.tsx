import React from "react";
import { MessageSquare, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface CommentNotificationProps {
  message: string;
  type: "success" | "error" | "info";
  description?: string;
}

export const notifyComment = ({
  message,
  type = "info",
  description,
}: CommentNotificationProps) => {
  const CustomToast = () => (
    <div className="flex items-start gap-3">
      <div
        className={`shrink-0 p-2 rounded-full ${
          type === "success"
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : type === "error"
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-4 w-4" />
        ) : type === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
          {message}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  return toast(CustomToast, {
    duration: 3000,
    className:
      "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg",
  });
};

export default function CommentNotification({
  message,
  type = "info",
  description,
}: CommentNotificationProps) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${
        type === "success"
          ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30"
          : type === "error"
          ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30"
          : "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30"
      }`}
    >
      <div
        className={`shrink-0 p-2 rounded-full ${
          type === "success"
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : type === "error"
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-4 w-4" />
        ) : type === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {message}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
