"use client";

import { useForm } from "react-hook-form";
import { searchItems, type SearchState } from "@/app/actions/search";
import { SearchResultsSkeleton } from "@/components/features/skeletons/search-skeleton";
import { SearchControls } from "@/components/features/search/search-controls";
import { SearchResults } from "@/components/features/search/search-results";
import { useCallback, useState, useTransition } from "react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

type SearchFormData = {
  query: string;
};

export default function SearchForm() {
  const form = useForm<SearchFormData>({
    defaultValues: {
      query: "",
    },
  });

  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    results: [],
    initial: true,
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [isSearching, startTransition] = useTransition();

  const onSubmit = async (data: SearchFormData) => {
    if (data.query.trim().length >= 2) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("query", data.query.trim());
        const result = await searchItems(formData);
        setSearchState(result);
      });
    } else if (data.query.trim().length === 0) {
      // Clear results when search is empty
      startTransition(async () => {
        const formData = new FormData();
        formData.append("query", "");
        const result = await searchItems(formData);
        setSearchState(result);
      });
    }
  };

  const sortedAndFilteredResults = useCallback(() => {
    let results = [...searchState.results];

    if (filterType !== "all") {
      results = results.filter((item) => item.itemtype === filterType);
    }

    switch (sortBy) {
      case "title-asc":
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        results.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "year-desc":
        results.sort(
          (a, b) => (b.published_year || 0) - (a.published_year || 0),
        );
        break;
      case "year-asc":
        results.sort(
          (a, b) => (a.published_year || 0) - (b.published_year || 0),
        );
        break;
      default: // relevance - keep original order
        break;
    }

    return results;
  }, [searchState.results, sortBy, filterType]);

  const processedResults = sortedAndFilteredResults();
  const hasResults = processedResults.length > 0;
  const hasQuery = searchState.query.trim().length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SearchControls
                  inputValue={field.value}
                  sortBy={sortBy}
                  filterType={filterType}
                  isSearching={isSearching}
                  onInputChange={(e) => field.onChange(e.target.value)}
                  onSortChange={setSortBy}
                  onFilterChange={setFilterType}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Status announcements for screen readers */}
        <div
          id="search-results-status"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {isSearching && "Searching through your items..."}
          {!searchState.initial &&
            !isSearching &&
            hasQuery &&
            processedResults.length === 0 &&
            "No results found for your search."}
          {!isSearching &&
            hasResults &&
            `Found ${processedResults.length} result${processedResults.length !== 1 ? "s" : ""}.`}
        </div>

        {/* Show skeleton while searching (but not on initial load) */}
        {isSearching && hasQuery && <SearchResultsSkeleton />}

        {/* Show results or no results state */}
        {!searchState.initial && !isSearching && (
          <SearchResults
            results={processedResults}
            query={searchState.query}
            filterType={filterType}
            onClearFilter={() => setFilterType("all")}
          />
        )}
      </form>
    </Form>
  );
}
