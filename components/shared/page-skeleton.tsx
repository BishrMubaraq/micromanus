import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  className?: string;
};

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6 md:p-8", className)} aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div
      className="flex h-full flex-col gap-4 p-6 md:p-8"
      aria-busy="true"
      aria-label="Loading research workspace"
    >
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-20 w-3/4 rounded-xl" />
        <Skeleton className="ml-auto h-20 w-2/3 rounded-xl" />
        <Skeleton className="h-28 w-4/5 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
