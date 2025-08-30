import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";

export default async function YearPage(props: {
  params: Promise<{ year: string }>;
}) {
  const params = await props.params;
  const year = parseInt(params.year, 10);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 -ml-6 px-6 text-sky-950 dark:text-sky-50">
        {year}
      </h1>
      <Suspense fallback={<ItemsListSkeleton />}>
        <ItemsList year={year} />
      </Suspense>
    </div>
  );
}
