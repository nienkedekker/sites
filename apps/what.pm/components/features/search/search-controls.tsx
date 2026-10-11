import { Ref } from "react";
import { SearchField } from "@/components/ui/search-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchSuggestion } from "@/utils/data/search-context";
import { TYPE_NAMES } from "@/utils/constants/app";
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
  { value: "Book", label: TYPE_NAMES.Book.many, swatch: "bg-books" },
  { value: "Movie", label: TYPE_NAMES.Movie.many, swatch: "bg-movies" },
  { value: "Show", label: TYPE_NAMES.Show.many, swatch: "bg-shows" },
] as const;

interface SearchInputProps {
  ref?: Ref<HTMLInputElement>;
  value: string;
  isSearching: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchInput({
  ref,
  value,
  isSearching,
  onChange,
  onClear,
}: SearchInputProps) {
  return (
    <SearchField
      ref={ref}
      id="search-query"
      label="Search items"
      value={value}
      onValueChange={onChange}
      onClear={onClear}
      busy={isSearching}
      onKeyDown={(e) => {
        if (e.key === "Escape" && value) {
          e.preventDefault();
          onClear();
        }
      }}
      placeholder="A title, author or director…"
      aria-describedby="search-instructions search-results-status"
    >
      <p id="search-instructions" className="sr-only">
        Results update as you type. Press Escape to clear, or / to jump back
        here.
      </p>
    </SearchField>
  );
}

interface SearchFiltersProps {
  counts: Record<(typeof TYPE_FILTERS)[number]["value"], number>;
  filterType: string;
  sortBy: string;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

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
              className="tag"
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
              <span className="tabular-nums opacity-70">
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
        Or try someone I really like:
      </h2>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map(({ name, count }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onPick(name)}
              className="tag"
            >
              {name}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
