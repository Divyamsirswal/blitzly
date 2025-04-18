import { MessageSquare, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyCommentsProps {
  isAuthenticated: boolean;
  onStartCommenting?: () => void;
}

export default function EmptyComments({
  isAuthenticated,
  onStartCommenting,
}: EmptyCommentsProps) {
  return (
    <div className="py-16 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center shadow-inner group transition-all duration-300 hover:scale-110">
          <MessageCircle className="h-10 w-10 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
          <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400 relative animate-pulse" />
        </span>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-lg">
          No comments yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {isAuthenticated
            ? "Be the first to share your thoughts on this report!"
            : "Sign in to be the first to comment on this report."}
        </p>
      </div>

      {isAuthenticated && onStartCommenting && (
        <Button
          onClick={onStartCommenting}
          className={cn(
            "group mt-2 bg-blue-600 hover:bg-blue-700 text-white transition-all",
            "dark:bg-blue-700 dark:hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          )}
        >
          <MessageSquare className="h-4 w-4 mr-2 group-hover:animate-wiggle" />
          Start the conversation
        </Button>
      )}

      <div className="w-full max-w-md mt-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          OR EXPLORE OTHER REPORTS
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      </div>
    </div>
  );
}
