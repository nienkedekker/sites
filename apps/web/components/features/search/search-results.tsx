import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/ui/highlight-text";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";

const categories = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
];

interface SearchResultsProps {
  results: Item[];
  query: string;
  filterType: string;
  onClearFilter: () => void;
}

export function SearchResults({
  results,
  query,
  filterType,
  onClearFilter,
}: SearchResultsProps) {
  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  // No results state
  if (!hasResults && hasQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No results found
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          Try different keywords or check your spelling
        </p>
        {filterType !== "all" && (
          <Button
            onClick={onClearFilter}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Show all types
          </Button>
        )}
      </div>
    );
  }

  // Results display
  if (!hasResults) return null;

  return (
    <section aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="sr-only">
        Search Results
      </h2>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Results count */}
        <span className="text-sm text-gray-600 sm:ml-auto">
          {results.length} result{results.length !== 1 ? "s" : ""}
          {filterType !== "all" && (
            <span className="hidden xs:inline">
              {" "}
              ({filterType.toLowerCase()}s only)
            </span>
          )}
        </span>

        {categories.map(({ title, type }) => {
          const categoryItems = results.filter(
            (item: Item) => item.itemtype === type,
          );

          if (
            categoryItems.length === 0 ||
            (filterType !== "all" && filterType !== type)
          ) {
            return null;
          }

          return (
            <div key={type} className="bg-card">
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
                      <div className="flex flex-row justify-between items-center gap-1 xs:gap-2 mb-2">
                        <h4 className="font-medium text-foreground break-words">
                          <HighlightText text={item.title} query={query} />
                        </h4>
                        {item.redo && (
                          <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded self-start xs:self-center">
                            {item.itemtype === "Book" ? "Reread" : "Rewatch"}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {item.itemtype === "Book" && item.author && (
                          <p>
                            by{" "}
                            <HighlightText text={item.author} query={query} />
                          </p>
                        )}
                        {item.itemtype === "Movie" && item.director && (
                          <p>
                            directed by{" "}
                            <HighlightText text={item.director} query={query} />
                          </p>
                        )}
                        {item.itemtype === "Show" && item.season && (
                          <p>Season {item.season}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span>Added {item.belongs_to_year}</span>
                        </div>
                      </div>
                    </div>

                    <IsLoggedIn>
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
                    </IsLoggedIn>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
