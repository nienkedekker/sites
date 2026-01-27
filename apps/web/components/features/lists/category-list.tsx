import Link from "next/link";
import DeleteItemDialog from "./delete-item-dialog";
import { Button } from "@/components/ui/button";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import {
  BookOpen,
  Film,
  Tv,
  RotateCcw,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/ui";
import { cardStyles, textStyles, badgeStyles } from "@/utils/styles";

interface CategoryListProps {
  categoryTitle: string;
  items: Item[];
  showYearLink?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Book: BookOpen,
  Movie: Film,
  Show: Tv,
};

function ItemBadge({
  icon: Icon,
  label,
  variant,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  variant: "progress" | "amber";
  ariaLabel: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
        badgeStyles[variant],
      )}
      aria-label={ariaLabel}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Renders the metadata line based on item type */
function ItemMetadata({ item }: { item: Item }) {
  switch (item.itemtype) {
    case "Book":
      return (
        <>
          {item.author && <span>by {item.author}</span>}
          {item.published_year && <span>({item.published_year})</span>}
        </>
      );
    case "Movie":
      return (
        <span>
          {item.director && `dir. ${item.director}`}
          {item.director && item.published_year && " • "}
          {item.published_year}
        </span>
      );
    case "Show":
      return item.season ? <span>Season {item.season}</span> : null;
    default:
      return null;
  }
}

/** Renders the appropriate badge(s) for an item */
function ItemBadges({ item }: { item: Item }) {
  // Show in progress + rewatch
  if (item.itemtype === "Show" && item.in_progress && item.redo) {
    return (
      <ItemBadge
        icon={RotateCcw}
        label="Rewatch in progress"
        variant="progress"
        ariaLabel="Currently rewatching this show"
      />
    );
  }

  // Show in progress (not rewatch)
  if (item.itemtype === "Show" && item.in_progress) {
    return (
      <ItemBadge
        icon={Clock}
        label="In Progress"
        variant="progress"
        ariaLabel="Currently watching this show"
      />
    );
  }

  // Redo badge (not currently in progress)
  if (item.redo) {
    const isBook = item.itemtype === "Book";
    return (
      <ItemBadge
        icon={RotateCcw}
        label={isBook ? "Reread" : "Rewatch"}
        variant="amber"
        ariaLabel={isBook ? "This was a re-read" : "This was a rewatch"}
      />
    );
  }

  return null;
}

export function CategoryList({
  categoryTitle,
  items,
  showYearLink = false,
}: CategoryListProps) {
  const headingId = `${categoryTitle.toLowerCase().replace(/\s+/g, "-")}-heading`;
  const itemType = items[0]?.itemtype || categoryTitle.slice(0, -1);
  const Icon = ICON_MAP[itemType] || BookOpen;

  return (
    <section aria-labelledby={headingId}>
      <header className="flex items-center gap-3 mb-6">
        <div className="p-2 text-gray-300 dark:text-gray-600">
          <Icon className="w-5 h-5" aria-hidden="true" />
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
      </header>

      {items.length > 0 ? (
        <ul className="space-y-5">
          {items.map((item, index) => (
            <li key={item.id}>
              <article
                className={cn(
                  "relative p-5 rounded-lg border transition-colors hover:border-gray-300 dark:hover:border-gray-700",
                  cardStyles,
                )}
              >
                <span
                  className="absolute -left-2 -top-2 w-6 h-6 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-full flex items-center justify-center text-xs font-medium"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "flex flex-wrap items-center gap-1 mt-0.5 text-xs",
                        textStyles.muted,
                      )}
                    >
                      <ItemMetadata item={item} />
                    </p>
                  </div>
                  <ItemBadges item={item} />
                </div>

                {showYearLink && (
                  <div className="pt-2 mt-2 border-t border-current/10">
                    <Link
                      href={`/year/${item.belongs_to_year}`}
                      className={cn(
                        "text-xs hover:underline transition-colors",
                        textStyles.mutedLight,
                        "hover:text-gray-700 dark:hover:text-gray-300",
                      )}
                    >
                      Added in {item.belongs_to_year}
                    </Link>
                  </div>
                )}

                <IsLoggedIn>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      asChild
                      variant="link"
                      className="text-xs p-0 h-auto"
                    >
                      <Link href={`/item/${item.id}`}>Edit</Link>
                    </Button>
                    <DeleteItemDialog
                      itemId={item.id}
                      belongsToYear={item.belongs_to_year}
                    />
                  </div>
                </IsLoggedIn>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-6 sm:p-12 rounded-xl border-2 border-dashed",
            "text-gray-400 dark:text-gray-600",
          )}
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-center font-medium">
            I did not log any {categoryTitle.toLowerCase()} this year.
          </p>
        </div>
      )}
    </section>
  );
}
