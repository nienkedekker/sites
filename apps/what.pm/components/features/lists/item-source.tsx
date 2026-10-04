import { externalProps } from "@nienke/ui/external";
import { formatCount } from "@nienke/ui/format";
import { Item } from "@/types";

// Goodreads has no API, so books link to a search, where the book is nearly
// always the top result
export function sourceOf(
  item: Pick<Item, "itemtype" | "external_id" | "title" | "author">,
) {
  if (item.itemtype === "Book") {
    const query = [item.title, item.author].filter(Boolean).join(" ");
    return {
      name: "Goodreads",
      href: `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`,
    };
  }
  if (!item.external_id) return null;
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
          className="link hover:text-ink"
          {...externalProps(source.href)}
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
