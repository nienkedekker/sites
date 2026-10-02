import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-12" aria-hidden="true">
      <Skeleton className="h-44 w-full" />
      <div>
        <div className="border-b border-rule pb-3">
          <Skeleton className="h-8 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 border-b border-line py-4"
          >
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
