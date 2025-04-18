import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag, AlertTriangle } from "lucide-react";
import { notifyComment } from "./CommentNotification";

interface ReportCommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: string;
  reportId: string;
}

export default function ReportCommentDialog({
  isOpen,
  onClose,
  commentId,
  reportId,
}: ReportCommentDialogProps) {
  const [reason, setReason] = useState("inappropriate");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentId) return;

    setIsSubmitting(true);
    try {
      const finalReason = reason === "other" ? customReason : reason;

      if (reason === "other" && !customReason.trim()) {
        notifyComment({
          message: "Please provide a reason",
          type: "error",
          description: "A detailed explanation helps our moderation team",
        });
        return;
      }

      const response = await fetch(
        `/api/reports/${reportId}/comments/${commentId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: finalReason,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json();
          throw new Error(data.message || "Failed to report comment");
        }
        throw new Error("Failed to report comment");
      }

      notifyComment({
        message: "Comment reported",
        type: "success",
        description: "Thank you for helping keep our community safe",
      });
      onClose();
    } catch (err) {
      console.error("Error reporting comment:", err);
      notifyComment({
        message: "Failed to report comment",
        type: "error",
        description:
          err instanceof Error ? err.message : "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Comment
          </DialogTitle>
          <DialogDescription>
            Let us know why you think this comment is inappropriate
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup
            value={reason}
            onValueChange={setReason}
            className="space-y-2"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="inappropriate" id="inappropriate" />
              <Label
                htmlFor="inappropriate"
                className="font-normal cursor-pointer"
              >
                Inappropriate content (profanity, offensive language)
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="harassment" id="harassment" />
              <Label
                htmlFor="harassment"
                className="font-normal cursor-pointer"
              >
                Harassment or bullying
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam" className="font-normal cursor-pointer">
                Spam or promotional content
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="misinformation" id="misinformation" />
              <Label
                htmlFor="misinformation"
                className="font-normal cursor-pointer"
              >
                Misinformation
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="font-normal cursor-pointer">
                Other
              </Label>
            </div>
          </RadioGroup>

          {reason === "other" && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="custom-reason">Please explain your reason:</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide details about why you're reporting this comment..."
                className="resize-none h-24"
              />
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md flex gap-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <p>
              Our moderation team will review this report. Abusing the reporting
              system may result in restrictions to your account.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || (reason === "other" && !customReason.trim())
            }
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
