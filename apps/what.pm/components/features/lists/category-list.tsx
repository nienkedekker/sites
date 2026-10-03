import Link from "next/link";
import DeleteItemDialog from "./delete-item-dialog";
import EditItemDialog from "./edit-item-dialog";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { cn } from "@/utils/ui";
import { ItemBadges } from "@/components/features/lists/item-badges";
import { ItemSource } from "@/components/features/lists/item-source";

interface CategoryListProps {
  categoryTitle: string;
  items: Item[];
  showYearLink?: boolean;
}

const SWATCH_MAP: Record<string, string> = {
  Book: "bg-books",
  Movie: "bg-movies",
  Show: "bg-shows",
};

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

export function CategoryList({
  categoryTitle,
  items,
  showYearLink = false,
}: CategoryListProps) {
  const headingId = `${categoryTitle.toLowerCase().replace(/\s+/g, "-")}-heading`;
  const itemType = items[0]?.itemtype || categoryTitle.slice(0, -1);
  const swatch = SWATCH_MAP[itemType] ?? SWATCH_MAP.Book;

  return (
    <section aria-labelledby={headingId}>
      <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <h2
          id={headingId}
          className="display flex items-center gap-3 text-ink text-[1.875rem] sm:text-[2.5rem]"
        >
          <span className={cn("size-3 shrink-0", swatch)} aria-hidden="true" />
          {categoryTitle}
        </h2>
        <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      {items.length > 0 ? (
        <ol>
          {items.map((item, index) => (
            <li key={item.id}>
              <article className="flex gap-4 border-b border-line py-4">
                <span
                  className="w-5 shrink-0 pt-0.5 font-mono text-xs text-ink-faint tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-medium leading-snug tracking-[-0.01em] text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-ink-soft">
                    <ItemMetadata item={item} />
                    <ItemBadges item={item} className="ml-1.5" />
                  </p>

                  {showYearLink && (
                    <Link
                      href={`/year/${item.belongs_to_year}`}
                      className="link mt-2 inline-block font-mono text-xs text-ink-faint hover:text-ink"
                    >
                      Added in {item.belongs_to_year}
                    </Link>
                  )}

                  <IsLoggedIn>
                    <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-soft">
                      <EditItemDialog
                        item={item}
                        className="link hover:text-ink"
                      />
                      <DeleteItemDialog
                        itemId={item.id}
                        belongsToYear={item.belongs_to_year}
                      />
                      <ItemSource item={item} />
                    </div>
                  </IsLoggedIn>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 border border-dashed border-line-strong p-6 text-ink-soft">
          I did not log any {categoryTitle.toLowerCase()} this year.
        </p>
      )}
    </section>
  );
}
