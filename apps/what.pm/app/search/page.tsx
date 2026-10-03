import SearchForm from "@/components/features/search/search-form";
import PageHeader from "@nienke/ui/page-header";
import {
  getSearchContext,
  type SearchContext,
} from "@/utils/data/search-context";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await props.searchParams;
  const initialQuery = (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? "";

  let context: SearchContext = { suggestions: [], years: [] };
  try {
    context = await getSearchContext();
  } catch (error) {
    console.error("Error building search context:", error);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader>Search</PageHeader>
      <SearchForm {...context} initialQuery={initialQuery} />
    </div>
  );
}
