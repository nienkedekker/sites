import { Skeleton } from "@/components/ui/skeleton";

export function ItemsListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-32 px-6">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          <Skeleton className="h-6 w-20 -ml-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map(
              (_, itemIndex) => (
                <div key={itemIndex} className="pl-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
