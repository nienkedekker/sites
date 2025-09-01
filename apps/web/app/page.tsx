import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default async function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <PageHeader>{currentYear}</PageHeader>

      <Suspense fallback={<ItemsListSkeleton />}>
        <ItemsList year={currentYear} />
      </Suspense>
    </div>
  );
}
