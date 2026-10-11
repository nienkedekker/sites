import { formatPlural } from "@nienke/ui/format";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/features/lists/column-header";
import { LogEntry } from "@/components/features/lists/log-entry";
import { Item } from "@/types";
import { CATEGORY_CONFIG } from "@/utils/constants/app";

interface SearchResultsProps {
  results: Item[];
  query: string;
  filterType: string;
  onClearFilter: () => void;
  onItemSaved?: () => void;
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
        <p className="display display-section text-ink-soft">
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
    <section aria-label="Search results" className="space-y-14">
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

        const headingId = `search-${type.toLowerCase()}-heading`;
        return (
          <section key={type} aria-labelledby={headingId}>
            <ColumnHeader
              id={headingId}
              type={type}
              title={title}
              count={formatPlural(categoryItems.length, "match", "matches")}
            />

            <ul>
              {categoryItems.map((item) => (
                <li key={item.id}>
                  <LogEntry
                    item={item}
                    query={query}
                    showYear
                    onSaved={onItemSaved}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
