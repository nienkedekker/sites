import { Skeleton } from "@/components/ui/skeleton";

export function TypeColumnsSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-10"
    >
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex}>
          <div className="border-b border-rule pb-3">
            <Skeleton className="h-9 w-32" />
          </div>
          {Array.from({ length: 4 }).map((_, itemIndex) => (
            <div key={itemIndex} className="border-b border-line py-5">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
