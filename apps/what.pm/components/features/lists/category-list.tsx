import Link from "next/link";
import { formatPlural } from "@nienke/ui/format";
import { SWATCH, type ItemType } from "@nienke/ui/series";
import EditItemDialog from "./edit-item-dialog";
import { ConfirmDeleteDialog } from "@/components/features/confirm-delete-dialog";
import { deleteItemAction } from "@/app/actions/items";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { ItemBadges } from "@/components/features/lists/item-badges";
import { ItemSource } from "@/components/features/lists/item-source";
import { credit } from "@/components/features/lists/credit";
import { ColumnHeader } from "@/components/features/lists/column-header";
import { ItemTitle } from "@/components/ui/item-row";

interface CategoryListProps {
  categoryTitle: string;
  items: Item[];
  showYearLink?: boolean;
}

// A logged show is a season of it; books and films say who made them and when
function ItemMetadata({ item }: { item: Item }) {
  if (item.itemtype === "Show") {
    return item.season ? <span>Season {item.season}</span> : null;
  }
  if (item.itemtype !== "Book" && item.itemtype !== "Movie") return null;
  const line = credit({
    itemtype: item.itemtype,
    creator: item.itemtype === "Book" ? item.author : item.director,
    year: item.published_year,
  });
  return line ? <span>{line}</span> : null;
}

export function CategoryList({
  categoryTitle,
  items,
  showYearLink = false,
}: CategoryListProps) {
  const headingId = `${categoryTitle.toLowerCase().replace(/\s+/g, "-")}-heading`;
  const named = items[0]?.itemtype || categoryTitle.slice(0, -1);
  const itemType: ItemType = named in SWATCH ? (named as ItemType) : "Book";

  return (
    <section aria-labelledby={headingId}>
      <ColumnHeader
        id={headingId}
        type={itemType}
        title={categoryTitle}
        count={formatPlural(items.length, "item")}
      />

      {items.length > 0 ? (
        <ol>
          {items.map((item, index) => (
            <li key={item.id} id={`item-${item.id}`}>
              <article className="flex gap-4 border-b border-line py-4">
                <span
                  className="w-5 shrink-0 pt-0.5 font-mono text-xs text-ink-faint tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <ItemTitle title={item.title} />
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
                      <ConfirmDeleteDialog
                        description="This action cannot be undone. This will permanently delete the item."
                        action={deleteItemAction}
                        fields={{
                          id: item.id,
                          belongsToYear: item.belongs_to_year,
                        }}
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
