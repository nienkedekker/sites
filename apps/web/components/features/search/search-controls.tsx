import { ChangeEvent, FormEvent } from "react";
import { Search, Filter, SortDescIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
];

interface SearchControlsProps {
  inputValue: string;
  sortBy: string;
  filterType: string;
  isSearching: boolean;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onSortChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

export function SearchControls({
  inputValue,
  sortBy,
  filterType,
  isSearching,
  onInputChange,
  onSortChange,
  onFilterChange,
}: SearchControlsProps) {
  return (
    <div
      className="space-y-4 mx-auto w-full max-w-2xl"
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
          onChange={onInputChange}
          placeholder="Search titles, authors, directors..."
          className="pl-10 pr-12 py-3 text-base w-full sm:text-sm"
          aria-describedby="search-instructions search-results-status"
          autoComplete="off"
        />
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
            <Select value={filterType} onValueChange={onFilterChange}>
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
            <SortDescIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <Select value={sortBy} onValueChange={onSortChange}>
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
      </div>

      <div id="search-instructions" className="sr-only">
        Search through books, movies, and TV shows. Results appear as you type.
      </div>
    </div>
  );
}
