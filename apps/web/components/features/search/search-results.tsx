import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/ui/highlight-text";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { cn } from "@/utils/ui";
import { cardStyles, textStyles, badgeStyles } from "@/utils/styles";
import { CATEGORY_CONFIG } from "@/utils/constants/app";

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
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No results found for "{query}"
        </p>
        {filterType !== "all" && (
          <Button
            onClick={onClearFilter}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Show all types
          </Button>
        )}
      </div>
    );
  }

  if (!hasResults) return null;

  return (
    <section aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="sr-only">
        Search Results
      </h2>

      <div className="space-y-8">
        {/* Results count */}
        <div className={cn("text-xs", textStyles.mutedLight)}>
          {results.length} result{results.length !== 1 ? "s" : ""}
          {filterType !== "all" && (
            <span> • {filterType.toLowerCase()}s only</span>
          )}
        </div>

        {CATEGORY_CONFIG.map(({ title, type }) => {
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
            <div key={type} className="space-y-4">
              <h3
                className={cn(
                  "text-sm font-semibold uppercase flex items-center gap-2",
                  textStyles.muted,
                )}
              >
                {title}
                <span className="text-xs font-normal">
                  ({categoryItems.length})
                </span>
              </h3>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className={cn("p-4 border", cardStyles)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                          <HighlightText text={item.title} query={query} />
                        </h4>

                        <div
                          className={cn(
                            "flex flex-wrap items-center gap-1 text-xs leading-relaxed",
                            textStyles.muted,
                          )}
                        >
                          {item.itemtype === "Book" && item.author && (
                            <span>
                              by{" "}
                              <HighlightText text={item.author} query={query} />
                            </span>
                          )}
                          {item.itemtype === "Movie" && item.director && (
                            <span>
                              dir.{" "}
                              <HighlightText
                                text={item.director}
                                query={query}
                              />
                              {item.director && item.published_year && " • "}
                              {item.published_year}
                            </span>
                          )}
                          {item.itemtype === "Show" && item.season && (
                            <span>Season {item.season}</span>
                          )}
                          {item.published_year && item.itemtype === "Book" && (
                            <span>({item.published_year})</span>
                          )}
                          <span>• Added {item.belongs_to_year}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 flex-shrink-0">
                        {item.redo && (
                          <div
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
                              badgeStyles.amber,
                            )}
                          >
                            {item.itemtype === "Book" ? "Reread" : "Rewatch"}
                          </div>
                        )}

                        <IsLoggedIn>
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                          >
                            <Link href={`/item/${item.id}`}>Edit</Link>
                          </Button>
                        </IsLoggedIn>
                      </div>
                    </div>
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
