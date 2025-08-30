"use client";

import { searchItems } from "@/app/actions/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchResultsSkeleton } from "@/components/features/skeletons/search-skeleton";
import { Item } from "@/types";
import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
  useRef,
} from "react";
import { Search, X, Filter, SortAsc, SortDesc } from "lucide-react";
import Link from "next/link";

const categories = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
];

const sortOptions = [
  { value: "relevance", label: "Relevance", icon: null },
  { value: "title-asc", label: "Title A-Z", icon: SortAsc },
  { value: "title-desc", label: "Title Z-A", icon: SortDesc },
  { value: "year-desc", label: "Newest First", icon: SortDesc },
  { value: "year-asc", label: "Oldest First", icon: SortAsc },
];

function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
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

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;

  const regex = new RegExp(
    `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SearchForm() {
  const [state, formAction, isPending] = useActionState(searchItems, {
    query: "",
    results: [],
    initial: true,
  });

  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [isPendingTransition, startTransition] = useTransition();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (query.trim().length >= 2) {
          startTransition(() => {
            const formData = new FormData();
            formData.append("query", query.trim());
            formAction(formData);
          });
        } else if (query.trim().length === 0) {
          // Clear results when search is empty
          startTransition(() => {
            const formData = new FormData();
            formData.append("query", "");
            formAction(formData);
          });
        }
      }, 300); // 300ms debounce delay
    },
    [formAction],
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setInputValue("");
    setFilterType("all");
    setSortBy("relevance");
    startTransition(() => {
      const formData = new FormData();
      formData.append("query", "");
      formAction(formData);
    });
  }, [formAction]);

  // Manual search submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim().length >= 2) {
        debouncedSearch(inputValue);
      }
    },
    [inputValue, debouncedSearch],
  );

  // Sort and filter results
  const sortedAndFilteredResults = useCallback(() => {
    let results = [...state.results];

    // Apply type filter
    if (filterType !== "all") {
      results = results.filter((item) => item.itemtype === filterType);
    }

    // Apply sorting
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
  }, [state.results, sortBy, filterType]);

  useEffect(() => {
    const isCurrentlySearching = isPending || isPendingTransition;
    setIsSearching(isCurrentlySearching);
  }, [isPending, isPendingTransition]);

  // Initialize input value from state
  useEffect(() => {
    if (state.query && !inputValue) {
      setInputValue(state.query);
    }
  }, [state.query, inputValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const processedResults = sortedAndFilteredResults();
  const hasResults = processedResults.length > 0;
  const hasQuery = inputValue.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Enhanced Search Form */}
      <form
        ref={searchFormRef}
        onSubmit={handleSubmit}
        className="space-y-4"
        role="search"
        aria-label="Search for books, movies, and TV shows"
      >
        {/* Main search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Input
            type="text"
            id="search-query"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Search titles, authors, directors..."
            className="pl-10 pr-12 py-3 text-base w-full max-w-2xl sm:text-sm"
            aria-describedby="search-instructions search-results-status"
            autoComplete="off"
          />
          {hasQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 h-auto p-0"
              aria-label="Clear search"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </Button>
          )}
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <LoadingSpinner size={20} />
            </div>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-1 xs:flex-initial">
              <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-8 text-sm">
                  <SelectValue aria-label="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Book">Books Only</SelectItem>
                  <SelectItem value="Movie">Movies Only</SelectItem>
                  <SelectItem value="Show">TV Shows Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-1 xs:flex-initial">
              <span className="text-sm text-gray-500 flex-shrink-0">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-8 text-sm">
                  <SelectValue aria-label="Sort results" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count - only show when we have results */}
          {hasResults && (
            <span className="text-sm text-gray-600 sm:ml-auto">
              {processedResults.length} result
              {processedResults.length !== 1 ? "s" : ""}
              {filterType !== "all" && (
                <span className="hidden xs:inline">
                  {" "}
                  ({filterType.toLowerCase()}s only)
                </span>
              )}
            </span>
          )}
        </div>

        <div id="search-instructions" className="sr-only">
          Search through your books, movies, and TV shows. Results appear as you
          type.
        </div>
      </form>

      {/* Status announcements for screen readers */}
      <div
        id="search-results-status"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {isSearching && "Searching through your items..."}
        {!state.initial &&
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

      {/* Show no results state */}
      {!state.initial &&
        !isSearching &&
        hasQuery &&
        processedResults.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No results found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              Try different keywords or check your spelling
            </p>
            {state.results.length > 0 && filterType !== "all" && (
              <Button
                onClick={() => setFilterType("all")}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Show all types
              </Button>
            )}
          </div>
        )}

      {/* Show enhanced results */}
      {!isSearching && hasResults && (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">
            Search Results
          </h2>

          {/* Single column layout with better formatting */}
          <div className="space-y-6">
            {categories.map(({ title, type }) => {
              const categoryItems = processedResults.filter(
                (item: Item) => item.itemtype === type,
              );

              if (
                categoryItems.length === 0 ||
                (filterType !== "all" && filterType !== type)
              ) {
                return null;
              }

              return (
                <div
                  key={type}
                  className="bg-card rounded-lg border p-4 sm:p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {title}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({categoryItems.length})
                    </span>
                  </h3>

                  <div className="grid gap-3 sm:gap-4">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-background rounded border hover:shadow-sm transition-shadow gap-2 sm:gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
                            <h4 className="font-medium text-foreground break-words">
                              <HighlightText
                                text={item.title}
                                query={inputValue}
                              />
                            </h4>
                            {item.redo && (
                              <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded self-start xs:self-center">
                                {item.itemtype === "Book"
                                  ? "Reread"
                                  : "Rewatch"}
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            {item.itemtype === "Book" && item.author && (
                              <p>
                                by{" "}
                                <HighlightText
                                  text={item.author}
                                  query={inputValue}
                                />
                              </p>
                            )}
                            {item.itemtype === "Movie" && item.director && (
                              <p>
                                directed by{" "}
                                <HighlightText
                                  text={item.director}
                                  query={inputValue}
                                />
                              </p>
                            )}
                            {item.itemtype === "Show" && item.season && (
                              <p>Season {item.season}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs">
                              {item.published_year && (
                                <span>Published: {item.published_year}</span>
                              )}
                              <span>Added {item.belongs_to_year}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end sm:flex-col sm:items-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs px-3"
                          >
                            <Link href={`/item/${item.id}`}>Edit</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
