"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  MessageSquare,
  Trash2,
  User,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { notifyComment } from "@/components/comments/CommentNotification";
import MarkdownRenderer from "@/components/comments/MarkdownRenderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define types for our reported comments
interface Author {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: Author;
  reportId: string;
  isReported: boolean;
}

interface Reporter {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Report {
  id: string;
  title: string;
}

interface CommentReport {
  id: string;
  reason: string;
  createdAt: string;
  status: string;
  comment: Comment;
  reporter: Reporter;
  report: Report;
}

export default function ModerationPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [filter, setFilter] = useState("pending");
  const [currentAction, setCurrentAction] = useState<{
    type: "approve" | "reject" | "delete";
    reportId: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if the user is an admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/admin/moderation");
    } else if (status === "authenticated") {
      // Fetch reported comments
      const fetchReportedComments = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/admin/moderation?status=${filter}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch reported comments");
          }
          const data = await response.json();
          setReports(data);
        } catch (error) {
          console.error("Error fetching reported comments:", error);
          notifyComment({
            message: "Failed to load reported comments",
            type: "error",
            description: "Please try again later",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchReportedComments();
    }
  }, [status, router, filter]);

  // Handle approving a comment (dismissing the report)
  const approveComment = async (reportId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/moderation/${reportId}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve comment");
      }

      // Update local state
      setReports(reports.filter((report) => report.id !== reportId));

      notifyComment({
        message: "Report dismissed",
        type: "success",
        description: "The comment has been approved",
      });
    } catch (error) {
      console.error("Error approving comment:", error);
      notifyComment({
        message: "Failed to approve comment",
        type: "error",
        description: "Please try again later",
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // Handle rejecting a comment (hide it but keep it in the database)
  const rejectComment = async (reportId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/moderation/${reportId}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject comment");
      }

      // Update local state
      setReports(reports.filter((report) => report.id !== reportId));

      notifyComment({
        message: "Comment hidden",
        type: "success",
        description: "The comment has been hidden from users",
      });
    } catch (error) {
      console.error("Error rejecting comment:", error);
      notifyComment({
        message: "Failed to hide comment",
        type: "error",
        description: "Please try again later",
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // Handle deleting a comment permanently
  const deleteComment = async (reportId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/moderation/${reportId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      // Update local state
      setReports(reports.filter((report) => report.id !== reportId));

      notifyComment({
        message: "Comment deleted",
        type: "success",
        description: "The comment has been permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      notifyComment({
        message: "Failed to delete comment",
        type: "error",
        description: "Please try again later",
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="border border-gray-200 dark:border-gray-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end gap-2 w-full">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Comment Moderation
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage reported comments across all reports
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <Tabs
            defaultValue="pending"
            value={filter}
            onValueChange={setFilter}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Pending</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Approved</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                <span>Rejected</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value="newest" onValueChange={() => {}}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {reports.length === 0 ? (
            <Card className="border border-gray-200 dark:border-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No {filter} reports
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  {filter === "pending"
                    ? "There are no pending reports to review at this time."
                    : filter === "approved"
                    ? "No comments have been approved yet."
                    : "No comments have been rejected yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className="border border-gray-200 dark:border-gray-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-normal bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30"
                        >
                          Reported{" "}
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                          })}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          by{" "}
                          {report.reporter.name ||
                            report.reporter.email.split("@")[0]}
                        </span>
                      </div>
                      <h3 className="font-medium text-base">
                        <span className="text-gray-800 dark:text-gray-200">
                          Reason:{" "}
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          {report.reason}
                        </span>
                      </h3>
                    </div>
                    <div>
                      <Badge className="font-normal">
                        From report: {report.report.title}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex gap-4 pb-2">
                    <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                      <AvatarImage
                        src={report.comment.author.image || undefined}
                      />
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {report.comment.author.name ||
                            report.comment.author.email.split("@")[0]}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(
                            new Date(report.comment.createdAt),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <MarkdownRenderer content={report.comment.content} />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end gap-2 w-full">
                    <Button
                      variant="outline"
                      className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() =>
                        setCurrentAction({
                          type: "approve",
                          reportId: report.id,
                        })
                      }
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Dismiss Report
                    </Button>
                    <Button
                      variant="outline"
                      className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      onClick={() =>
                        setCurrentAction({
                          type: "reject",
                          reportId: report.id,
                        })
                      }
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Hide Comment
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() =>
                        setCurrentAction({
                          type: "delete",
                          reportId: report.id,
                        })
                      }
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Comment
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Approval Dialog */}
      <AlertDialog
        open={currentAction?.type === "approve"}
        onOpenChange={() => !isProcessing && setCurrentAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss this report? The comment will
              remain visible to all users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() =>
                currentAction?.reportId &&
                approveComment(currentAction.reportId)
              }
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Dismiss Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog
        open={currentAction?.type === "reject"}
        onOpenChange={() => !isProcessing && setCurrentAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to hide this comment? It will no longer be
              visible to users, but will be preserved in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() =>
                currentAction?.reportId && rejectComment(currentAction.reportId)
              }
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Hide Comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={currentAction?.type === "delete"}
        onOpenChange={() => !isProcessing && setCurrentAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this comment? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                currentAction?.reportId && deleteComment(currentAction.reportId)
              }
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Delete Comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
