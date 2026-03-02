import { Skeleton } from "@/components/ui/skeleton";

export function HabitCardSkeleton() {
  return (
    <div className="relative flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm animate-pulse overflow-hidden">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex-shrink-0">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
