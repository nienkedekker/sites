"use client";

import { searchItems, type SearchState } from "@/app/actions/search";
import { SearchResultsSkeleton } from "@/components/features/skeletons/search-skeleton";
import {
  SearchInput,
  SearchFilters,
  SearchSuggestions,
} from "@/components/features/search/search-controls";
import { SearchResults } from "@/components/features/search/search-results";
import { YearStrip } from "@/components/features/search/year-strip";
import { Button } from "@/components/ui/button";
import type { SearchContext } from "@/utils/data/search-context";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

const INITIAL_STATE: SearchState = { query: "", results: [], initial: true };

export default function SearchForm({
  suggestions,
  years,
  initialQuery = "",
}: SearchContext & { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [searchState, setSearchState] = useState<SearchState>(INITIAL_STATE);
  const [failed, setFailed] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [isSearching, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRequest = useRef(0);

  const runSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    const request = ++latestRequest.current;

    if (trimmed.length === 0) {
      setSearchState(INITIAL_STATE);
      setFailed(false);
      return;
    }
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("query", trimmed);
      try {
        const result = await searchItems(formData);
        if (request !== latestRequest.current) return;
        setSearchState(result);
        setFailed(false);
      } catch {
        if (request !== latestRequest.current) return;
        setSearchState({ query: trimmed, results: [], initial: false });
        setFailed(true);
      }
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing =
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setFilterType("all");
    runSearch("");
    inputRef.current?.focus();
  };

  const searchFor = (value: string) => {
    setQuery(value);
    runSearch(value);
    inputRef.current?.focus();
  };

  const typeCounts = useMemo(() => {
    const counts = {
      all: searchState.results.length,
      Book: 0,
      Movie: 0,
      Show: 0,
    };
    for (const item of searchState.results) {
      if (item.itemtype in counts) {
        counts[item.itemtype as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [searchState.results]);

  const processedResults = useMemo(() => {
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
      default:
        break;
    }

    return results;
  }, [searchState.results, sortBy, filterType]);

  const hasResults = processedResults.length > 0;
  const hasQuery = searchState.query.trim().length > 0;
  const showSuggestions =
    !failed &&
    (searchState.initial || (!isSearching && hasQuery && !hasResults));

  return (
    <div className="space-y-12">
      <form
        role="search"
        aria-label="Search for books, movies, and TV shows"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(query);
        }}
      >
        <SearchInput
          ref={inputRef}
          value={query}
          isSearching={isSearching}
          onChange={setQuery}
          onClear={clearSearch}
        />
      </form>

      <div
        id="search-results-status"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {isSearching && "Searching through your items..."}
        {!searchState.initial &&
          !failed &&
          !isSearching &&
          hasQuery &&
          processedResults.length === 0 &&
          "No results found for your search."}
        {!isSearching &&
          hasResults &&
          `Found ${processedResults.length} result${processedResults.length !== 1 ? "s" : ""}.`}
      </div>

      {!searchState.initial && typeCounts.all > 0 && (
        <SearchFilters
          counts={typeCounts}
          filterType={filterType}
          sortBy={sortBy}
          onFilterChange={setFilterType}
          onSortChange={setSortBy}
        />
      )}

      {isSearching && !hasResults && hasQuery && <SearchResultsSkeleton />}

      {!searchState.initial && hasResults && (
        <YearStrip results={processedResults} years={years} />
      )}

      {failed && !isSearching && (
        <div role="alert">
          <p className="display text-[1.875rem] text-ink-soft sm:text-[2.5rem]">
            Search didn’t go through.
          </p>
          <p className="mt-3 text-ink-soft">
            Couldn’t reach the server. Check your connection and try again.
          </p>
          <Button
            type="button"
            onClick={() => runSearch(searchState.query)}
            variant="outline"
            size="sm"
            className="mt-6"
          >
            Try again
          </Button>
        </div>
      )}

      {!failed && !searchState.initial && !(isSearching && !hasResults) && (
        <SearchResults
          results={processedResults}
          query={searchState.query}
          filterType={filterType}
          onClearFilter={() => setFilterType("all")}
          onItemSaved={() => runSearch(searchState.query)}
        />
      )}

      {showSuggestions && (
        <SearchSuggestions suggestions={suggestions} onPick={searchFor} />
      )}
    </div>
  );
}
