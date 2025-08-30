"use client";

import { searchItems } from "@/app/actions";
import { CategoryList } from "@/components/lists/category-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchResultsSkeleton } from "@/components/skeletons/search-skeleton";
import { Item } from "@/types";
import { useActionState, useEffect, useState } from "react";

const categories = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
];

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SearchForm() {
  const [state, formAction, isPending] = useActionState(searchItems, {
    query: "",
    results: [],
    initial: true,
  });

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isPending) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [isPending]);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={formAction}
        className="mb-6 flex gap-2"
        role="search"
        aria-label="Search for books, movies, and TV shows"
      >
        <label htmlFor="search-query" className="sr-only">
          Search for books, movies, and TV shows
        </label>
        <Input
          type="text"
          id="search-query"
          name="query"
          placeholder="Search items..."
          defaultValue={state.query}
          className="border p-2 rounded-md w-96"
          aria-describedby="search-instructions"
        />
        <div id="search-instructions" className="sr-only">
          Enter keywords to search through your books, movies, and TV shows
        </div>
        <Button
          type="submit"
          disabled={isSearching}
          aria-describedby="search-results-status"
        >
          {isSearching && (
            <>
              <LoadingSpinner />
              <span className="ml-2">Searching...</span>
            </>
          )}
          {!isSearching && "Search"}
        </Button>
      </form>

      <div
        id="search-results-status"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {isSearching && "Searching through your items..."}
        {!state.initial &&
          !isSearching &&
          state.results.length === 0 &&
          "No results found for your search."}
        {!isSearching &&
          state.results.length > 0 &&
          `Found ${state.results.length} results.`}
      </div>

      {/* Show skeleton while searching */}
      {isSearching && <SearchResultsSkeleton />}

      {/* Show no results message */}
      {!state.initial && !isSearching && state.results.length === 0 && (
        <p className="mt-3 text-gray-600" aria-hidden="true">
          No results found.
        </p>
      )}

      {/* Show results */}
      {!isSearching && state.results.length > 0 && (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">
            Search Results
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-32 px-6">
            {categories.map(({ title, type }) => {
              const categoryItems = state.results.filter(
                (item: Item) => item.itemtype === type,
              );
              return categoryItems.length > 0 ? (
                <CategoryList
                  key={type}
                  categoryTitle={title}
                  items={categoryItems}
                  showYearLink={true}
                />
              ) : null;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
