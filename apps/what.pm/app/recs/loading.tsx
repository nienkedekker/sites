import PageHeader from "@nienke/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeColumnsSkeleton } from "@/components/features/skeletons/type-columns-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader intro="Picked from the log.">Recommendations</PageHeader>
      <Skeleton className="mb-12 h-4 w-72 max-w-full" />
      <TypeColumnsSkeleton label="Loading recommendations" />
    </>
  );
}
