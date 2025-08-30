import { Skeleton } from "@/components/ui/skeleton";

export function StatsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <Skeleton className="h-12 w-32 mb-8 -ml-6 px-6" />

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* First chart */}
        <div className="p-6 border rounded-lg">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        {/* Second chart */}
        <div className="p-6 border rounded-lg">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Large chart */}
      <div className="p-6 border rounded-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
