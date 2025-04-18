import { Skeleton } from "@/components/ui/skeleton";

export default function CommentSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse group">
      <div className="relative h-10 w-10 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-effect"></div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded" />
          <Skeleton className="h-3 w-16 bg-gradient-to-r from-gray-200/80 to-gray-300/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded opacity-70" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-y-0">
            <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded" />
          </div>
          <div className="flex items-center space-y-0">
            <Skeleton className="h-4 w-4/5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded" />
          </div>
          <div className="flex items-center space-y-0">
            <Skeleton className="h-4 w-2/3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentSkeletonList() {
  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="space-y-6">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
}
