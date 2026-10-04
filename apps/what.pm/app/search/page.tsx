import { Suspense } from "react";
import SearchForm from "@/components/features/search/search-form";
import PageHeader from "@nienke/ui/page-header";
import { SearchResultsSkeleton } from "@/components/features/skeletons/search-skeleton";
import {
  getSearchContext,
  type SearchContext,
} from "@/utils/data/search-context";

interface SearchProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default function SearchPage({ searchParams }: SearchProps) {
  return (
    <div className="max-w-3xl">
      <PageHeader>Search</PageHeader>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Search({ searchParams }: SearchProps) {
  const { q } = await searchParams;
  const initialQuery = (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? "";

  let context: SearchContext = { suggestions: [], years: [] };
  try {
    context = await getSearchContext();
  } catch (error) {
    console.error("Error building search context:", error);
  }

  return <SearchForm {...context} initialQuery={initialQuery} />;
}
