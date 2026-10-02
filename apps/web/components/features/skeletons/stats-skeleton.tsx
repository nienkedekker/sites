import { Skeleton } from "@/components/ui/skeleton";

function ChartCardSkeleton({ chartClassName }: { chartClassName: string }) {
  return (
    <div className="card p-6">
      <Skeleton className="mb-6 h-5 w-40" />
      <Skeleton className={`${chartClassName} w-full`} />
      <div className="mt-6 space-y-2 border-t border-line pt-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">
      <ChartCardSkeleton chartClassName="h-64" />
      <ChartCardSkeleton chartClassName="h-64" />
      <div className="lg:col-span-2">
        <ChartCardSkeleton chartClassName="h-80" />
      </div>
    </div>
  );
}
