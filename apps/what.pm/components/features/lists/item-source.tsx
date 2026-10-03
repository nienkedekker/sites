import { formatCount } from "@nienke/ui/format";
import { Item } from "@/types";
import { isOpenLibraryKey } from "@/utils/data/external-ids";

function sourceOf(item: Item) {
  if (!item.external_id) return null;
  if (item.itemtype === "Book") {
    return isOpenLibraryKey(item.external_id)
      ? {
          name: "OpenLibrary",
          href: `https://openlibrary.org${item.external_id}`,
        }
      : {
          name: "Google Books",
          href: `https://books.google.com/books?id=${item.external_id}`,
        };
  }
  const path = item.itemtype === "Movie" ? "movie" : "tv";
  return {
    name: "TMDB",
    href: `https://www.themoviedb.org/${path}/${item.external_id}`,
  };
}

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
}

export function ItemSource({ item }: { item: Item }) {
  const source = sourceOf(item);
  const isBook = item.itemtype === "Book";
  const detail = isBook
    ? item.pages && `${formatCount(item.pages)} pages`
    : item.runtime_minutes && formatRuntime(item.runtime_minutes);

  return (
    <span className="flex items-center gap-1.5 text-ink-faint">
      {source ? (
        <a
          href={source.href}
          target="_blank"
          rel="noreferrer"
          className="link hover:text-ink"
        >
          {source.name}
        </a>
      ) : (
        <span className="text-danger">not linked</span>
      )}
      <span aria-hidden="true">·</span>
      {detail ? (
        <span className="tabular-nums">{detail}</span>
      ) : (
        <span className="text-danger">
          {isBook ? "no pages" : "no runtime"}
        </span>
      )}
    </span>
  );
}
