import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-32 px-6">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          <Skeleton className="h-6 w-24 -ml-4" />
          <div className="space-y-3">
            {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map(
              (_, itemIndex) => (
                <div key={itemIndex} className="pl-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
