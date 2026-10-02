import SearchForm from "@/components/features/search/search-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  getSearchContext,
  type SearchContext,
} from "@/utils/data/search-context";

export default async function SearchPage() {
  // Search still works without suggestions or the year range
  let context: SearchContext = { suggestions: [], years: [] };
  try {
    context = await getSearchContext();
  } catch (error) {
    console.error("Error building search context:", error);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader>Search</PageHeader>
      <SearchForm {...context} />
    </div>
  );
}
