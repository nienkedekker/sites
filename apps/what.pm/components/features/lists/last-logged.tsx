import { formatDate } from "@nienke/ui/format";
import { getRecentItems } from "@/utils/data/items";
import type { TypedItem } from "@/types/shared";

const SWATCH_MAP: Record<TypedItem["itemtype"], string> = {
  Book: "bg-books",
  Movie: "bg-movies",
  Show: "bg-shows",
};

const LABEL_MAP: Record<TypedItem["itemtype"], string> = {
  Book: "Book",
  Movie: "Movie",
  Show: "TV",
};

export async function LastLogged({
  limit,
  className = "",
}: {
  limit: number;
  className?: string;
}) {
  const result = await getRecentItems(limit);
  if (!result.success || result.data.length === 0) return null;

  return (
    <section aria-labelledby="last-logged-heading" className={className}>
      <h2 id="last-logged-heading" className="tag">
        Last logged
      </h2>
      <ol className="mt-4 border-t border-rule">
        {result.data.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b border-line py-3"
          >
            <span
              className={`size-2.5 shrink-0 ${SWATCH_MAP[item.itemtype]}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate font-medium tracking-[-0.01em]">
              {item.title}
              {item.itemtype === "Show" && item.season && (
                <span className="font-normal text-ink-soft">
                  {" "}
                  S{item.season}
                </span>
              )}
            </span>
            <span className="shrink-0 font-mono text-xs text-ink-soft">
              <span className="sr-only">{LABEL_MAP[item.itemtype]}, </span>
              {item.created_at &&
                formatDate(new Date(item.created_at), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
