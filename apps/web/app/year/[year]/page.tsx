import { Suspense } from "react";
import { notFound } from "next/navigation";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";

export default async function YearPage(props: {
  params: Promise<{ year: string }>;
}) {
  const params = await props.params;
  const year = parseInt(params.year, 10);

  if (isNaN(year)) {
    notFound();
  }

  return (
    <Suspense fallback={<ItemsListSkeleton />}>
      <ItemsList year={year} />
    </Suspense>
  );
}
