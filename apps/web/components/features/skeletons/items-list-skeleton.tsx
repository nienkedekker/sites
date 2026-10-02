import { Skeleton } from "@/components/ui/skeleton";

/** The year page's shape: header, chart card, three columns of rows */
export function ItemsListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading items">
      <div className="mb-12 max-w-2xl sm:mb-16">
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="h-16 w-48" />
        <Skeleton className="mt-5 h-6 w-80 max-w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="mt-20 grid grid-cols-1 gap-16 sm:mt-28 lg:grid-cols-3 lg:gap-10">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div key={columnIndex}>
            <div className="border-b border-rule pb-3">
              <Skeleton className="h-9 w-32" />
            </div>
            {Array.from({ length: 4 }).map((_, itemIndex) => (
              <div key={itemIndex} className="border-b border-line py-4 pl-9">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
