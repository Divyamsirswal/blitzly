import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Trash2,
  User,
  Flag,
  MoreHorizontal,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { notifyComment } from "./CommentNotification";
import { CommentSkeletonList } from "./CommentSkeleton";
import EmptyComments from "./EmptyComments";
import CommentEditor from "./CommentEditor";
import MarkdownRenderer from "./MarkdownRenderer";
import ReportCommentDialog from "./ReportCommentDialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Author {
  name: string | null;
  email: string;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: Author;
  isHidden?: boolean;
}

interface CommentSectionProps {
  reportId: string;
  isOwner: boolean;
  isPublic: boolean;
  commentsEnabled?: boolean;
  commentCount?: number;
  setCommentCount?: React.Dispatch<React.SetStateAction<number>>;
  isSharedReport?: boolean;
}

export default function CommentSection({
  reportId,
  isOwner,
  isPublic,
  commentsEnabled = true,
  commentCount,
  setCommentCount,
  isSharedReport = false,
}: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(
    null
  );
  const [newCommentAdded, setNewCommentAdded] = useState<string | null>(null);
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const sectionRef = useRef<HTMLDivElement>(null);
  const [optimisticCommentId, setOptimisticCommentId] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Function to fetch comments
  const fetchComments = useCallback(
    async (isRefresh = false) => {
      if (!reportId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // Use different endpoint for shared reports
        const endpoint = isSharedReport
          ? `/api/reports/share/${reportId}/comments`
          : `/api/reports/${reportId}/comments`;

        console.log(`Fetching comments from: ${endpoint}`, {
          reportId,
          isSharedReport,
        });

        const response = await fetch(endpoint);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          if (response.status === 403) {
            console.log("Comments are disabled for this report");
            // Comments are disabled for this report
            setComments([]);
            if (setCommentCount) {
              setCommentCount(0);
            }
            return;
          }

          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch comments" }));
          console.error("Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch comments");
        }

        const data = await response.json();
        console.log(`Fetched ${data.length} comments`);

        // Filter out hidden comments for non-owners
        const visibleComments = isOwner
          ? data
          : data.filter((comment: Comment) => !comment.isHidden);

        setComments(visibleComments);
        // Update comment count in parent component
        if (setCommentCount) {
          setCommentCount(visibleComments.length);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments. Please try again.");
        notifyComment({
          message: "Failed to load comments",
          type: "error",
          description: "Please try refreshing the page",
        });
      } finally {
        if (isRefresh) {
          setIsRefreshing(false);
          toast.success("Comments refreshed");
        } else {
          setIsLoading(false);
        }
      }
    },
    [reportId, isOwner, setCommentCount, isSharedReport]
  );

  // Load comments on mount
  useEffect(() => {
    if (reportId && (isOwner || (isPublic && commentsEnabled))) {
      fetchComments();
    } else {
      setIsLoading(false);
    }
  }, [reportId, isOwner, isPublic, commentsEnabled, fetchComments]);

  // Generate a temporary ID for optimistic UI updates
  const generateTempId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Handle submitting new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!session?.user) {
      notifyComment({
        message: "Authentication required",
        type: "error",
        description: "You must be logged in to comment",
      });
      return;
    }

    setIsSubmitting(true);

    // Create an optimistic comment for immediate UI feedback
    const tempId = generateTempId();
    setOptimisticCommentId(tempId);

    const optimisticComment = {
      id: tempId,
      content: newComment,
      createdAt: new Date().toISOString(),
      authorId: "optimistic",
      author: {
        name: session.user.name || null,
        email: session.user.email || "user@example.com",
        image: session.user.image || null,
      },
      isOptimistic: true,
    } as Comment;

    // Add optimistic comment to the list
    setComments((prev) => [optimisticComment, ...prev]);
    if (setCommentCount && commentCount !== undefined) {
      setCommentCount(commentCount + 1);
    }

    // Clear input immediately for better UX
    setNewComment("");

    try {
      // Use different endpoint for shared reports
      const endpoint = isSharedReport
        ? `/api/reports/share/${reportId}/comments`
        : `/api/reports/${reportId}/comments`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      // Replace the optimistic comment with the real one
      setComments((prev) => {
        const newComments = prev.filter((comment) => comment.id !== tempId);
        newComments.unshift(data);
        return newComments;
      });

      // Set the newly added comment ID to highlight it
      setNewCommentAdded(data.id);
      // Clear the highlight after animation completes
      setTimeout(() => setNewCommentAdded(null), 1500);

      notifyComment({
        message: "Comment added",
        type: "success",
        description: "Your comment has been posted",
      });

      // Wait for DOM to update
      setTimeout(() => {
        // Scroll to new comment
        const commentElement = commentRefs.current[data.id];
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);

      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
    } catch (err) {
      console.error("Error adding comment:", err);

      // Remove the optimistic comment on error
      setComments((prev) => prev.filter((comment) => comment.id !== tempId));
      if (setCommentCount && commentCount !== undefined) {
        setCommentCount(commentCount - 1);
      }

      notifyComment({
        message: "Failed to add comment",
        type: "error",
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
      setOptimisticCommentId(null);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Optimistic UI update - remove comment immediately
      const commentToDelete = comments.find((c) => c.id === commentId);
      if (!commentToDelete) return;

      // Remove from UI immediately
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      if (setCommentCount && commentCount !== undefined) {
        setCommentCount(commentCount - 1);
      }

      const response = await fetch(
        `/api/reports/${reportId}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      notifyComment({
        message: "Comment deleted",
        type: "success",
        description: "The comment has been removed",
      });
    } catch (err) {
      console.error("Error deleting comment:", err);

      // Restore comments on error
      await fetchComments();

      notifyComment({
        message: "Failed to delete comment",
        type: "error",
        description: "Please try again later",
      });
    }
  };

  // Handle refreshing comments
  const handleRefresh = () => {
    fetchComments(true);
  };

  // Determine if comments should be shown
  const showComments = isOwner || (isPublic && commentsEnabled);

  // Determine if current user can comment
  const canComment = status === "authenticated" && showComments;

  // If comments are not enabled and user is not the owner, don't show anything
  if (!showComments) {
    return null;
  }

  return (
    <Card
      className="bg-white dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden"
      ref={sectionRef}
    >
      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg shadow-lg border border-green-200 dark:border-green-800/30">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-medium">Comment added successfully</p>
          </div>
        </div>
      )}

      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800/70">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Comments{" "}
            {comments.length > 0 && (
              <span className="inline-flex h-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition-all duration-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40">
                {comments.length}
              </span>
            )}
          </CardTitle>

          {!isLoading && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <RefreshCcw
                      className={cn(
                        "h-4 w-4 text-gray-500",
                        isRefreshing && "animate-spin"
                      )}
                    />
                    <span className="sr-only">Refresh comments</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh comments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {canComment && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitComment(e);
            }}
            className="space-y-4"
          >
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700 shadow-sm hidden sm:flex">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || "User avatar"}
                />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="relative">
                  <CommentEditor
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={() =>
                      handleSubmitComment({
                        preventDefault: () => {},
                      } as React.FormEvent)
                    }
                    isSubmitting={isSubmitting}
                    placeholder="Add your thoughts about this report..."
                    ref={textareaRef}
                  />
                  <div className="absolute -top-2 left-4 px-2 bg-white dark:bg-gray-900 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Your comment
                  </div>
                </div>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                  Use <span className="font-medium">**bold**</span> for
                  emphasis, <span className="font-medium">_italic_</span> for
                  quotes, and <span className="font-medium">- item</span> for
                  lists.
                </p>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="py-4">
            <CommentSkeletonList />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Failed to load comments
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <EmptyComments
            isAuthenticated={status === "authenticated"}
            onStartCommenting={() => {
              // Focus the comment editor if available
              if (textareaRef.current) {
                textareaRef.current.focus();
              } else if (sectionRef.current) {
                const textarea = sectionRef.current.querySelector("textarea");
                if (textarea) {
                  textarea.focus();
                }
              }
            }}
          />
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                ref={(el) => {
                  if (el) {
                    commentRefs.current[comment.id] = el;
                  }
                }}
                className={cn(
                  "relative group transition-all duration-500 ease-in-out",
                  newCommentAdded === comment.id
                    ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 -m-3 animate-pulse-once"
                    : "",
                  optimisticCommentId === comment.id && "opacity-80"
                )}
              >
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                    <AvatarImage
                      src={comment.author?.image || ""}
                      alt={comment.author?.name || "User avatar"}
                    />
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {comment.author?.name ||
                          (comment.author?.email
                            ? comment.author.email.split("@")[0]
                            : "User")}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {optimisticCommentId === comment.id && (
                        <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse ml-1">
                          Posting...
                        </span>
                      )}
                    </div>

                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      <MarkdownRenderer content={comment.content} />
                    </div>
                  </div>
                </div>

                {/* Delete button - only visible for comment owner or report owner */}
                {(session?.user?.email === comment.author.email || isOwner) &&
                !optimisticCommentId ? (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="absolute top-0 right-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : !optimisticCommentId ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="absolute top-0 right-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Comment options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setReportingCommentId(comment.id)}
                        className="text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report comment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {!canComment && status !== "loading" && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800/30 py-4 border-t border-gray-100 dark:border-gray-800/70 text-sm text-gray-500 dark:text-gray-400 text-center">
          {status === "unauthenticated"
            ? "Sign in to leave a comment"
            : "Comments are disabled for this report"}
        </CardFooter>
      )}

      {/* Report Comment Dialog */}
      {reportingCommentId && (
        <ReportCommentDialog
          isOpen={!!reportingCommentId}
          onClose={() => setReportingCommentId(null)}
          commentId={reportingCommentId}
          reportId={reportId}
        />
      )}
    </Card>
  );
}
