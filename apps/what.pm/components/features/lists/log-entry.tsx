import Link from "next/link";
import TagLink from "@nienke/ui/tag-link";
import EditItemDialog from "./edit-item-dialog";
import { ConfirmDeleteDialog } from "@/components/features/confirm-delete-dialog";
import { deleteItemAction } from "@/app/actions/items";
import { Item } from "@/types";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { ItemBadges } from "@/components/features/lists/item-badges";
import { ItemSource } from "@/components/features/lists/item-source";
import { MADE_BY } from "@/components/features/lists/credit";
import { ItemActions, ItemRow } from "@/components/ui/item-row";
import { HighlightText } from "@/components/ui/highlight-text";

// A logged show is a season of it; books and films say who made them and
// when. A search marks what it matched in the title and the maker.
function ItemMetadata({ item, query }: { item: Item; query: string }) {
  if (item.itemtype === "Show") {
    return item.season ? <span>Season {item.season}</span> : null;
  }
  if (item.itemtype !== "Book" && item.itemtype !== "Movie") return null;
  const creator = item.itemtype === "Book" ? item.author : item.director;
  if (!creator && !item.published_year) return null;
  return (
    <span>
      {creator && (
        <>
          {MADE_BY[item.itemtype]}{" "}
          <HighlightText text={creator} query={query} />
        </>
      )}
      {creator && item.published_year && " "}
      {item.published_year && `(${item.published_year})`}
    </span>
  );
}

export function LogEntry({
  item,
  number,
  query = "",
  showYear = false,
  canDelete = false,
  onSaved,
}: {
  item: Item;
  number?: number;
  query?: string;
  showYear?: boolean;
  canDelete?: boolean;
  onSaved?: () => void;
}) {
  return (
    <ItemRow
      as="article"
      className="border-b border-line py-4"
      cover={
        number !== undefined && (
          <span
            className="w-5 shrink-0 pt-0.5 font-mono text-xs text-ink-faint tabular-nums"
            aria-hidden="true"
          >
            {String(number).padStart(2, "0")}
          </span>
        )
      }
      title={<HighlightText text={item.title} query={query} />}
      meta={
        <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <ItemMetadata item={item} query={query} />
          <ItemBadges item={item} className="ml-1.5" />
        </span>
      }
      aside={
        showYear && (
          <TagLink as={Link} href={`/year/${item.belongs_to_year}`}>
            <span className="sr-only">Logged in </span>
            {item.belongs_to_year}
          </TagLink>
        )
      }
    >
      <IsLoggedIn>
        <ItemActions>
          <EditItemDialog
            item={item}
            onSaved={onSaved}
            className="link hover:text-ink"
          />
          {canDelete && (
            <ConfirmDeleteDialog
              description="This action cannot be undone. This will permanently delete the item."
              action={deleteItemAction}
              fields={{
                id: item.id,
                belongsToYear: item.belongs_to_year,
              }}
            />
          )}
          <ItemSource item={item} />
        </ItemActions>
      </IsLoggedIn>
    </ItemRow>
  );
}
