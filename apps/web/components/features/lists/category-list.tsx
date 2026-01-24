import Link from "next/link";
import DeleteItemDialog from "./delete-item-dialog";
import { Button } from "@/components/ui/button";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { BookOpen, Film, Tv, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/utils/ui";
import { cardStyles, textStyles, badgeStyles } from "@/utils/styles";

interface CategoryListProps {
  categoryTitle: string;
  items: Item[];
  showYearLink?: boolean;
}

const getIcon = (itemType: string) => {
  switch (itemType) {
    case "Book":
      return <BookOpen className="w-5 h-5" />;
    case "Movie":
      return <Film className="w-5 h-5" />;
    case "Show":
      return <Tv className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

const getTypeColor = () => {
  return cardStyles;
};

export function CategoryList({
  categoryTitle,
  items,
  showYearLink = false,
}: CategoryListProps) {
  const headingId = `${categoryTitle.toLowerCase().replace(/\s+/g, "-")}-heading`;
  const itemType = items[0]?.itemtype || categoryTitle.slice(0, -1); // Remove 's' from plural

  return (
    <section aria-labelledby={headingId} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 text-gray-300 dark:text-gray-600">
          {getIcon(itemType)}
        </div>
        <div>
          <h2
            id={headingId}
            className="text-sm font-semibold uppercase text-gray-600 dark:text-gray-400"
          >
            {categoryTitle}
          </h2>
          <p className={cn("text-sm", textStyles.muted)}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "group relative p-3 rounded-lg border transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700 min-h-[85px] flex flex-col",
                getTypeColor(),
              )}
            >
              {/* Item Number */}
              <div className="absolute -left-2 -top-2 w-6 h-6 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>

              {/* Main Content */}
              <div className="ml-5 flex-1 flex flex-col overflow-hidden justify-center">
                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Metadata */}
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-1 mt-0.5 text-xs",
                          textStyles.muted,
                        )}
                      >
                        {item.itemtype === "Book" && item.author && (
                          <span>by {item.author}</span>
                        )}
                        {item.itemtype === "Movie" && (
                          <span>
                            {item.director && `dir. ${item.director}`}
                            {item.director && item.published_year && " • "}
                            {item.published_year}
                          </span>
                        )}
                        {item.itemtype === "Show" && item.season && (
                          <span>Season {item.season}</span>
                        )}

                        {item.published_year && item.itemtype === "Book" && (
                          <span className="text-xs">
                            ({item.published_year})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5">
                      {/* In Progress Badge - Shows only */}
                      {item.itemtype === "Show" && item.in_progress && (
                        <div
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
                            badgeStyles.progress,
                          )}
                          aria-label="Currently watching this show"
                        >
                          <Clock className="w-3 h-3" />
                          In Progress
                        </div>
                      )}

                      {/* Redo Badge */}
                      {item.redo && (
                        <div
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
                            badgeStyles.amber,
                          )}
                          aria-label={
                            item.itemtype === "Book"
                              ? "This was a re-read"
                              : "This was a rewatch"
                          }
                        >
                          <RotateCcw className="w-3 h-3" />
                          {item.itemtype === "Book" ? "Reread" : "Rewatch"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Year Link */}
                  {showYearLink && (
                    <div className="pt-2 border-t border-current/10">
                      <Link
                        href={`/year/${item.belongs_to_year}`}
                        className={cn(
                          "text-xs hover:underline transition-colors",
                          textStyles.mutedLight,
                          "hover:text-gray-700 dark:hover:text-gray-300",
                        )}
                        aria-label={`View all items from ${item.belongs_to_year}`}
                      >
                        Added in {item.belongs_to_year}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Actions - Always at bottom */}
                <IsLoggedIn>
                  <div
                    className="flex items-center gap-1 pt-1 mt-auto"
                    role="group"
                    aria-label={`Actions for ${item.title}`}
                  >
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1.5 text-xs"
                    >
                      <Link
                        href={`/item/${item.id}`}
                        aria-label={`Update ${item.title}`}
                      >
                        Edit
                      </Link>
                    </Button>
                    <DeleteItemDialog
                      itemId={item.id}
                      belongsToYear={item.belongs_to_year}
                    />
                  </div>
                </IsLoggedIn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed",
            "text-gray-400 dark:text-gray-600",
          )}
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            {getIcon(itemType)}
          </div>
          <p className="text-center font-medium">
            I did not log any {categoryTitle.toLowerCase()} this year.
          </p>
        </div>
      )}
    </section>
  );
}
