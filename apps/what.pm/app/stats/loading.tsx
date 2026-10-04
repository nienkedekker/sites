import PageHeader from "@nienke/ui/page-header";
import { StatsPageSkeleton } from "@/components/features/skeletons/stats-skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeader intro="Books, movies and TV seasons over the years">
        Stats
      </PageHeader>
      <StatsPageSkeleton />
    </div>
  );
}
