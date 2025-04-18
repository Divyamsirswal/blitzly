"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface CommentFormProps {
  reportId: string;
  reportTitle: string;
  reportOwner: {
    id: string;
    name: string;
  };
  sharedWithUsers: Array<{
    id: string;
    name: string;
  }>;
  onCommentAdded?: () => void;
}

export function CommentForm({
  reportId,
  reportTitle,
  reportOwner,
  sharedWithUsers,
  onCommentAdded,
}: CommentFormProps) {
  const { data: session } = useSession();
  const { notify } = useNotifications();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id || !comment.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First, save the comment to your database
      const response = await fetch("/api/reports/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          content: comment.trim(),
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save comment");
      }

      const savedComment = await response.json();

      // Then, create notifications for the report owner and shared users
      await notify.commentOnSharedReport({
        reportId,
        reportTitle,
        commentText: comment.trim(),
        commentId: savedComment.id,
        commentAuthor: {
          id: session.user.id,
          name: session.user.name || "Unknown User",
        },
        reportOwner,
        sharedWithUsers,
      });

      // Clear the form and notify parent
      setComment("");
      onCommentAdded?.();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[100px] pr-12 resize-y"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          size="sm"
          className="absolute bottom-2 right-2"
          disabled={!comment.trim() || isSubmitting}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send comment</span>
        </Button>
      </div>
    </form>
  );
} 