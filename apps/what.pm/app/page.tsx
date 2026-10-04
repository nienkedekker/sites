import { Suspense } from "react";
import ItemsList from "@/components/features/lists/items-list";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { JSON_LD, jsonLdScript } from "@/utils/agents/discovery";
import { getCurrentYear } from "@/utils/formatters/date";

export default async function Home() {
  const currentYear = getCurrentYear();

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
