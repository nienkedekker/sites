import PageHeader from "@nienke/ui/page-header";
import { TypeColumnsSkeleton } from "@/components/features/skeletons/type-columns-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader intro="Books, movies, and TV shows to read/watch">
        Up next
      </PageHeader>
      <TypeColumnsSkeleton label="Loading up next" />
    </>
  );
}
