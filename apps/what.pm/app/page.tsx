import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { JSON_LD, jsonLdScript } from "@/utils/agents/discovery";
import { thisYear } from "@/utils/server/clock";

export default async function Home() {
  const currentYear = await thisYear();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(JSON_LD) }}
      />
      <Suspense fallback={<ItemsListSkeleton />}>
        <ItemsList year={currentYear} />
      </Suspense>
    </>
  );
}
