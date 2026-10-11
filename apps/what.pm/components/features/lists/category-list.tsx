import { formatPlural } from "@nienke/ui/format";
import { SWATCH, type ItemType } from "@nienke/ui/series";
import { Item } from "@/types";
import { ColumnHeader } from "@/components/features/lists/column-header";
import { LogEntry } from "@/components/features/lists/log-entry";

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
              <LogEntry
                item={item}
                number={index + 1}
                showYear={showYearLink}
                canDelete
              />
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
