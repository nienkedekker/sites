import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";

export default async function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <Suspense fallback={<ItemsListSkeleton />}>
      <ItemsList year={currentYear} />
    </Suspense>
  );
}
