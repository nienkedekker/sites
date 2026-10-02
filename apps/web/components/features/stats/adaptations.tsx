import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import type { Adaptation } from "@/utils/data/patterns";

const SWATCH = { Movie: "bg-movies", Show: "bg-shows" };

function order({ book, screen }: Adaptation) {
  if (book.year === screen.year) return `both in ${book.year}`;
  return book.year < screen.year
    ? `read ${book.year}, watched ${screen.year}`
    : `watched ${screen.year}, read ${book.year}`;
}

export function Adaptations({ pairs }: { pairs: Adaptation[] }) {
  return (
    <section
      aria-labelledby="adaptations-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead
        id="adaptations-heading"
        note={`${pairs.length} ${pairs.length === 1 ? "pair" : "pairs"}`}
      >
        Page to screen
      </CardHead>

      <ul className="mt-6">
        {pairs.map((pair) => (
          <li
            key={`${pair.book.title}|${pair.screen.title}`}
            className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
              <span className="size-2.5 shrink-0 bg-books" aria-hidden="true" />
              <Link
                href={`/search?q=${encodeURIComponent(pair.book.title)}`}
                className="link truncate"
              >
                {pair.book.title}
              </Link>
              <span className="text-ink-faint" aria-hidden="true">
                →
              </span>
              <span className="sr-only">became</span>
              <span
                className={`size-2.5 shrink-0 ${SWATCH[pair.screen.type]}`}
                aria-hidden="true"
              />
              <Link
                href={`/search?q=${encodeURIComponent(pair.screen.title)}`}
                className="link truncate"
              >
                {pair.screen.title}
              </Link>
            </span>
            <span className="font-mono text-xs whitespace-nowrap text-ink-soft tabular-nums">
              {order(pair)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
