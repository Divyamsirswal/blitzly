import { useNotificationContext } from "@/lib/contexts/NotificationContext";

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

export async function createNotification(data: NotificationData) {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create notification");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Helper functions for different notification types
export async function notifyCommentAdded({
  userId,
  reportId,
  reportTitle,
  commentText,
  commentId,
  triggeredById,
}: {
  userId: string;
  reportId: string;
  reportTitle: string;
  commentText: string;
  commentId: string;
  triggeredById: string;
}) {
  return createNotification({
    userId,
    title: "New Comment on Report",
    message: `New comment on "${reportTitle}": "${commentText.slice(0, 100)}${
      commentText.length > 100 ? "..." : ""
    }"`,
    type: "comment",
    entityId: commentId,
    entityType: "comment",
    actionUrl: `/reports/${reportId}/comments#${commentId}`,
    triggeredById,
    metadata: {
      reportId,
      reportTitle,
      commentId,
    },
  });
}

export async function notifyReportShared({
  userId,
  reportId,
  reportTitle,
  sharedByUserId,
  sharedWithEmails,
}: {
  userId: string;
  reportId: string;
  reportTitle: string;
  sharedByUserId: string;
  sharedWithEmails: string[];
}) {
  return createNotification({
    userId,
    title: "Report Shared",
    message: `The report "${reportTitle}" has been shared with ${
      sharedWithEmails.length
    } ${sharedWithEmails.length === 1 ? "person" : "people"}`,
    type: "share",
    entityId: reportId,
    entityType: "report",
    actionUrl: `/reports/${reportId}`,
    triggeredById: sharedByUserId,
    metadata: {
      reportId,
      reportTitle,
      sharedWithEmails,
    },
  });
}

export async function notifyReportGenerated({
  userId,
  reportId,
  reportTitle,
}: {
  userId: string;
  reportId: string;
  reportTitle: string;
}) {
  return createNotification({
    userId,
    title: "Report Generated",
    message: `Your report "${reportTitle}" has been generated successfully`,
    type: "report",
    entityId: reportId,
    entityType: "report",
    actionUrl: `/reports/${reportId}`,
    metadata: {
      reportId,
      reportTitle,
    },
  });
}

export async function notifyMention({
  userId,
  reportId,
  reportTitle,
  mentionedBy,
  commentId,
}: {
  userId: string;
  reportId: string;
  reportTitle: string;
  mentionedBy: string;
  commentId: string;
}) {
  return createNotification({
    userId,
    title: "Mentioned in Comment",
    message: `You were mentioned in a comment on "${reportTitle}"`,
    type: "mention",
    entityId: commentId,
    entityType: "comment",
    actionUrl: `/reports/${reportId}/comments#${commentId}`,
    triggeredById: mentionedBy,
    metadata: {
      reportId,
      reportTitle,
      commentId,
    },
  });
}

export async function notifyCommentOnSharedReport({
  reportId,
  reportTitle,
  commentText,
  commentId,
  commentAuthor,
  reportOwner,
  sharedWithUsers,
}: {
  reportId: string;
  reportTitle: string;
  commentText: string;
  commentId: string;
  commentAuthor: {
    id: string;
    name: string;
  };
  reportOwner: {
    id: string;
    name: string;
  };
  sharedWithUsers: Array<{
    id: string;
    name: string;
  }>;
}) {
  const notifications = [];

  // Create notification for report owner (if not the comment author)
  if (reportOwner.id !== commentAuthor.id) {
    notifications.push(
      createNotification({
        userId: reportOwner.id,
        title: "New Comment on Your Report",
        message: `${
          commentAuthor.name
        } commented on your report "${reportTitle}": "${commentText.slice(
          0,
          100
        )}${commentText.length > 100 ? "..." : ""}"`,
        type: "comment",
        entityId: commentId,
        entityType: "comment",
        actionUrl: `/reports/${reportId}/comments#${commentId}`,
        triggeredById: commentAuthor.id,
        metadata: {
          reportId,
          reportTitle,
          commentId,
          isOwner: true,
        },
      })
    );
  }

  // Create notifications for users the report was shared with (excluding comment author)
  for (const user of sharedWithUsers) {
    if (user.id !== commentAuthor.id) {
      notifications.push(
        createNotification({
          userId: user.id,
          title: "New Comment on Shared Report",
          message: `${
            commentAuthor.name
          } commented on "${reportTitle}" (shared by ${
            reportOwner.name
          }): "${commentText.slice(0, 100)}${
            commentText.length > 100 ? "..." : ""
          }"`,
          type: "comment",
          entityId: commentId,
          entityType: "comment",
          actionUrl: `/reports/${reportId}/comments#${commentId}`,
          triggeredById: commentAuthor.id,
          metadata: {
            reportId,
            reportTitle,
            commentId,
            sharedBy: reportOwner.id,
          },
        })
      );
    }
  }

  // Send all notifications in parallel
  await Promise.all(notifications);
}

// Hook for using notifications in components
export function useNotifications() {
  const context = useNotificationContext();

  const notify = {
    commentAdded: notifyCommentAdded,
    reportShared: notifyReportShared,
    reportGenerated: notifyReportGenerated,
    mention: notifyMention,
    commentOnSharedReport: notifyCommentOnSharedReport,
  };

  return {
    ...context,
    notify,
  };
}
