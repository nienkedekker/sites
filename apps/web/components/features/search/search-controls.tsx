import { Ref } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchSuggestion } from "@/utils/data/search-context";
import { cn } from "@/utils/ui";

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
];

const TYPE_FILTERS = [
  { value: "all", label: "All", swatch: null },
  { value: "Book", label: "Books", swatch: "bg-books" },
  { value: "Movie", label: "Movies", swatch: "bg-movies" },
  { value: "Show", label: "TV", swatch: "bg-shows" },
] as const;

interface SearchInputProps {
  ref?: Ref<HTMLInputElement>;
  value: string;
  isSearching: boolean;
  onChange: (value: string) => void;
}

/** The query, set large in the display serif on a single ink rule */
export function SearchInput({
  ref,
  value,
  isSearching,
  onChange,
}: SearchInputProps) {
  return (
    <div className="relative flex items-end gap-4 border-b border-rule focus-within:border-movies">
      <label htmlFor="search-query" className="sr-only">
        Search items
      </label>
      <input
        ref={ref}
        type="search"
        id="search-query"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A title, author or director…"
        aria-describedby="search-instructions search-results-status"
        autoComplete="off"
        spellCheck={false}
        className="display w-full min-w-0 bg-transparent pb-3 text-[clamp(2rem,6vw,3.5rem)] text-ink outline-none placeholder:text-ink-faint/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {isSearching && (
        <span className="mb-4 shrink-0 text-ink-soft" aria-hidden="true">
          <LoadingSpinner size={16} />
        </span>
      )}
      <p id="search-instructions" className="sr-only">
        Results update as you type. Press / to jump back here.
      </p>
    </div>
  );
}

interface SearchFiltersProps {
  counts: Record<(typeof TYPE_FILTERS)[number]["value"], number>;
  filterType: string;
  sortBy: string;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

/** Type toggles with live counts, and the sort order */
export function SearchFilters({
  counts,
  filterType,
  sortBy,
  onFilterChange,
  onSortChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by type"
      >
        {TYPE_FILTERS.map(({ value, label, swatch }) => {
          const active = filterType === value;
          const empty = counts[value] === 0;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={empty && !active}
              onClick={() => onFilterChange(value)}
              className={cn(
                "tag cursor-pointer transition-colors disabled:cursor-default disabled:border-line-strong disabled:text-ink-faint",
                active
                  ? "bg-ink text-paper"
                  : "hover:bg-panel-2 disabled:hover:bg-transparent",
              )}
            >
              {swatch && (
                <span
                  className={cn(
                    "size-2",
                    swatch,
                    active && "outline outline-paper",
                  )}
                  aria-hidden="true"
                />
              )}
              {label}
              <span className={cn("tabular-nums", !active && "text-ink-soft")}>
                {counts[value]}
              </span>
            </button>
          );
        })}
      </div>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger size="sm" className="w-40" aria-label="Sort by">
          <SelectValue />
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
  );
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onPick: (name: string) => void;
}

/** The people logged most, as a place to start */
export function SearchSuggestions({
  suggestions,
  onPick,
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <section aria-labelledby="search-suggestions-heading">
      <h2
        id="search-suggestions-heading"
        className="mb-4 font-mono text-xs text-ink-soft"
      >
        Try someone I keep coming back to
      </h2>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map(({ name, count }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onPick(name)}
              className="tag cursor-pointer transition-colors hover:bg-ink hover:text-paper"
            >
              {name}
              <span className="tabular-nums opacity-60">{count}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
