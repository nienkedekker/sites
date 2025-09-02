import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default async function YearPage(props: {
  params: Promise<{ year: string }>;
}) {
  const params = await props.params;
  const year = parseInt(params.year, 10);

  return (
    <div className="space-y-4">
      <PageHeader>{year}</PageHeader>
      <Suspense fallback={<ItemsListSkeleton />}>
        <ItemsList year={year} />
      </Suspense>
    </div>
  );
}
