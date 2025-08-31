"use client";

import { useForm } from "react-hook-form";
import { searchItems, type SearchState } from "@/app/actions/search";
import { SearchResultsSkeleton } from "@/components/features/skeletons/search-skeleton";
import { SearchControls } from "@/components/features/search/search-controls";
import { SearchResults } from "@/components/features/search/search-results";
import { useCallback, useEffect, useState, useTransition, useRef } from "react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

type SearchFormData = {
  query: string;
};

// TODO: when pressing backspace, don't search again immediately
export default function SearchForm({ isLoggedIn = false }) {
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
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [isPendingTransition, startTransition] = useTransition();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (query.trim().length >= 2) {
          startTransition(async () => {
            const formData = new FormData();
            formData.append("query", query.trim());
            const result = await searchItems(searchState, formData);
            setSearchState(result);
          });
        } else if (query.trim().length === 0) {
          // Clear results when search is empty
          startTransition(async () => {
            const formData = new FormData();
            formData.append("query", "");
            const result = await searchItems(searchState, formData);
            setSearchState(result);
          });
        }
      }, 300); // 300ms debounce delay
    },
    [searchState],
  );

  const onSubmit = (data: SearchFormData) => {
    if (data.query.trim().length >= 2) {
      debouncedSearch(data.query);
    }
  };

  // Watch for changes to the search query and trigger debounced search
  const watchedQuery = form.watch("query");
  useEffect(() => {
    debouncedSearch(watchedQuery);
  }, [watchedQuery, debouncedSearch]);

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

  useEffect(() => {
    const isCurrentlySearching = isPendingTransition;
    setIsSearching(isCurrentlySearching);
  }, [isPendingTransition]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const processedResults = sortedAndFilteredResults();
  const hasResults = processedResults.length > 0;
  const hasQuery = watchedQuery.trim().length > 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
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
                  onSubmit={form.handleSubmit(onSubmit)}
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

        {/* Show skeleton while searching */}
        {isSearching && <SearchResultsSkeleton />}

        {/* Show results or no results state */}
        {!searchState.initial && !isSearching && (
          <SearchResults
            results={processedResults}
            query={watchedQuery}
            filterType={filterType}
            isLoggedIn={isLoggedIn}
            onClearFilter={() => setFilterType("all")}
          />
        )}
      </form>
    </Form>
  );
}
