"use client";

import { searchItems } from "@/app/actions";
import { CategoryList } from "@/components/lists/category-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item } from "@/types";
import { useActionState } from "react";

const categories = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
];

export default function SearchForm() {
  const [state, formAction] = useActionState(searchItems, {
    query: "",
    results: [],
    initial: true,
  });

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="mb-6 flex gap-2" role="search" aria-label="Search for books, movies, and TV shows">
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
        <Button type="submit" aria-describedby="search-results-status">Search</Button>
      </form>

      <div id="search-results-status" role="status" aria-live="polite" className="sr-only">
        {!state.initial && state.results.length === 0 && "No results found for your search."}
        {state.results.length > 0 && `Found ${state.results.length} results.`}
      </div>

      {!state.initial && state.results.length === 0 && (
        <p className="mt-3 text-gray-600" aria-hidden="true">No results found.</p>
      )}

      {state.results.length > 0 && (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="sr-only">Search Results</h2>
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
