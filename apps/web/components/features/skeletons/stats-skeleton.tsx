import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ height }: { height: string }) {
  return (
    <div className="card p-6 sm:p-7">
      <Skeleton className="mb-6 h-5 w-32" />
      <Skeleton className={`${height} w-full`} />
    </div>
  );
}

/** The stats page's bento: squares and tiles, the side cards, the line chart */
export function StatsPageSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">
      <div className="contents lg:flex lg:flex-col lg:gap-3">
        <CardSkeleton height="h-[30rem]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <CardSkeleton height="h-24" />
          <CardSkeleton height="h-24" />
        </div>
      </div>
      <div className="contents lg:flex lg:flex-col lg:gap-3">
        <CardSkeleton height="h-80" />
        <CardSkeleton height="h-56" />
      </div>
      <div className="lg:col-span-2">
        <CardSkeleton height="h-80" />
      </div>
    </div>
  );
}
