import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/ui/highlight-text";
import { ItemBadges } from "@/components/features/lists/item-badges";
import EditItemDialog from "@/components/features/lists/edit-item-dialog";
import { ItemSource } from "@/components/features/lists/item-source";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { cn } from "@/utils/ui";
import { CATEGORY_CONFIG } from "@/utils/constants/app";

const SWATCH_MAP: Record<string, string> = {
  Book: "bg-books",
  Movie: "bg-movies",
  Show: "bg-shows",
};

interface SearchResultsProps {
  results: Item[];
  query: string;
  filterType: string;
  onClearFilter: () => void;
  onItemSaved?: () => void;
}

function ResultMetadata({ item, query }: { item: Item; query: string }) {
  switch (item.itemtype) {
    case "Book":
      return (
        <>
          {item.author && (
            <span>
              by <HighlightText text={item.author} query={query} />
            </span>
          )}
          {item.published_year && <span>({item.published_year})</span>}
        </>
      );
    case "Movie":
      return (
        <span>
          {item.director && (
            <>
              dir. <HighlightText text={item.director} query={query} />
            </>
          )}
          {item.director && item.published_year && " · "}
          {item.published_year}
        </span>
      );
    case "Show":
      return item.season ? <span>Season {item.season}</span> : null;
    default:
      return null;
  }
}

export function SearchResults({
  results,
  query,
  filterType,
  onClearFilter,
  onItemSaved,
}: SearchResultsProps) {
  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  if (!hasResults && hasQuery) {
    return (
      <div>
        <p className="display text-[1.875rem] text-ink-soft sm:text-[2.5rem]">
          Nothing for “{query}”.
        </p>
        {filterType !== "all" && (
          <Button
            type="button"
            onClick={onClearFilter}
            variant="outline"
            size="sm"
            className="mt-6"
          >
            Show all types
          </Button>
        )}
      </div>
    );
  }

  if (!hasResults) return null;

  return (
    <section aria-labelledby="search-results-heading" className="space-y-14">
      <h2 id="search-results-heading" className="sr-only">
        Search Results
      </h2>

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
          <div key={type}>
            <h3 className="flex items-end justify-between gap-4 border-b border-rule pb-3">
              <span className="display flex items-center gap-3 text-[1.875rem] text-ink">
                <span
                  className={cn("size-3 shrink-0", SWATCH_MAP[type])}
                  aria-hidden="true"
                />
                {title}
              </span>
              <span className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
                {categoryItems.length}{" "}
                {categoryItems.length === 1 ? "match" : "matches"}
              </span>
            </h3>

            <ul>
              {categoryItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-line py-4"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium leading-snug tracking-[-0.01em] text-ink">
                      <HighlightText text={item.title} query={query} />
                    </h4>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-ink-soft">
                      <ResultMetadata item={item} query={query} />
                      <ItemBadges item={item} className="ml-1.5" />
                    </p>
                    <IsLoggedIn>
                      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-soft">
                        <EditItemDialog
                          item={item}
                          onSaved={onItemSaved}
                          className="link hover:text-ink"
                        />
                        <ItemSource item={item} />
                      </div>
                    </IsLoggedIn>
                  </div>

                  <Link
                    href={`/year/${item.belongs_to_year}`}
                    className="tag shrink-0 tabular-nums"
                    aria-label={`Logged in ${item.belongs_to_year}`}
                  >
                    {item.belongs_to_year}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
