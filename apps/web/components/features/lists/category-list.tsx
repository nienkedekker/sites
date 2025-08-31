import Link from "next/link";
import DeleteItemDialog from "./delete-item-dialog";
import { Button } from "@/components/ui/button";
import { Item } from "@/types";
import IsLoggedIn from "@/components/is-logged-in";

interface CategoryListProps {
  categoryTitle: string;
  items: Item[];
  showYearLink?: boolean;
}

export function CategoryList({
  categoryTitle,
  items,
  showYearLink = false,
}: CategoryListProps) {
  const headingId = `${categoryTitle.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <h2 id={headingId} className="font-bold -ml-4">
        {categoryTitle}
      </h2>
      {items.length > 0 ? (
        <ol
          className="list-decimal list-outside text-gray-400 space-y-2"
          aria-label={`List of ${categoryTitle.toLowerCase()}`}
        >
          {items.map((item) => (
            <li key={item.id} className="pl-2">
              <div className="text-gray-700 dark:text-gray-300">
                {item.itemtype === "Book" && (
                  <>
                    <span className="sr-only">By </span>
                    <span>{item.author}, </span>
                  </>
                )}
                <span className="text-sky-900 dark:text-sky-200 font-medium">
                  {item.title}
                </span>
                {item.itemtype === "Movie" && (
                  <>
                    <span className="sr-only"> directed by </span>
                    <span>
                      {" "}
                      ({item.director || "Unknown Director"},{" "}
                      {item.published_year})
                    </span>
                  </>
                )}
                {item.itemtype === "Show" && (
                  <>
                    <span className="sr-only"> season </span>
                    <span> (season {item.season || "Unknown"})</span>
                  </>
                )}
              </div>

              {item.redo && (
                <span
                  className="ml-2 px-2 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700"
                  aria-label={
                    item.itemtype === "Book"
                      ? "This was a re-read"
                      : "This was a rewatch"
                  }
                >
                  {item.itemtype === "Book" ? "Reread" : "Rewatch"}
                </span>
              )}

              {showYearLink && (
                <div className="flex">
                  <Link
                    href={`/year/${item.belongs_to_year}`}
                    className="text-sm text-gray-500 hover:underline"
                    aria-label={`View all items from ${item.belongs_to_year}`}
                  >
                    Added in {item.belongs_to_year}
                  </Link>
                </div>
              )}

              <IsLoggedIn>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label={`Actions for ${item.title}`}
                >
                  <Button
                    asChild
                    className="text-xs p-0 cursor-pointer"
                    variant="link"
                  >
                    <Link
                      href={`/item/${item.id}`}
                      aria-label={`Update ${item.title}`}
                    >
                      Update
                    </Link>
                  </Button>
                  <DeleteItemDialog
                    itemId={item.id}
                    belongsToYear={item.belongs_to_year}
                  />
                </div>
              </IsLoggedIn>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-gray-500 italic -ml-4" role="status">
          No {categoryTitle.toLowerCase()} found.
        </p>
      )}
    </section>
  );
}
