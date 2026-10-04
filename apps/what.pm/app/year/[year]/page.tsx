import { Suspense } from "react";
import { notFound } from "next/navigation";
import ItemsList from "@/components/features/lists/items-list";
import { ScrollToHash } from "@/components/features/scroll-to-hash";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { isLoggedYear, parseYear } from "@/utils/data/items";
import type { Metadata } from "next";

interface YearParams {
  params: Promise<{ year: string }>;
}

// None at build time: each year renders on its first visit, then stays cached
export async function generateStaticParams() {
  return [];
}

async function loadYear({ params }: YearParams) {
  const year = parseYear((await params).year);
  if (year === null || !(await isLoggedYear(year))) notFound();
  return year;
}

export async function generateMetadata(props: YearParams): Promise<Metadata> {
  const year = await loadYear(props);
  return {
    title: `${year}`,
    description: `What I read and watched in ${year}.`,
  };
}

export default async function YearPage(props: YearParams) {
  const year = await loadYear(props);

  return (
    <Suspense fallback={<ItemsListSkeleton />}>
      <ItemsList year={year} />
      <ScrollToHash />
    </Suspense>
  );
}
