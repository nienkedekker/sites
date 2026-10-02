import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import type { Adaptation } from "@/utils/data/patterns";

const SHOWN = 14;

type Screen = Adaptation["screen"];

interface BookRow {
  book: Adaptation["book"];
  screens: Screen[];
  gap: number;
}

// One row per book, ordered by the longest time between reading it and
// watching (or the other way round). Pairs where the first read or watch
// happened before I started logging are left out, since that gap is unknown.
function longestWaits(pairs: Adaptation[]): BookRow[] {
  const rows = new Map<string, BookRow>();
  for (const { book, screen } of pairs) {
    if (book.before || screen.before) continue;
    const key = `${book.title}|${book.author}`;
    const row = rows.get(key) ?? { book, screens: [], gap: 0 };
    row.screens.push(screen);
    row.gap = Math.max(row.gap, Math.abs(screen.year - book.year));
    rows.set(key, row);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      screens: [...row.screens].sort((a, b) => a.year - b.year),
    }))
    .sort((a, b) => b.gap - a.gap || a.book.title.localeCompare(b.book.title))
    .slice(0, SHOWN);
}

export function Adaptations({ pairs }: { pairs: Adaptation[] }) {
  const rows = longestWaits(pairs);

  return (
    <section
      aria-labelledby="adaptations-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead id="adaptations-heading" note="longest waits">
        Page to screen
      </CardHead>

      <ul className="mt-6 grid md:grid-cols-2 md:gap-x-10">
        {rows.map(({ book, screens }) => (
          <li
            key={`${book.title}|${book.author}`}
            className="border-t border-line py-3 first:border-t-0 md:[&:nth-child(2)]:border-t-0"
          >
            <span className="flex justify-between gap-4 text-sm text-ink">
              <Link
                href={`/search?q=${encodeURIComponent(book.title)}`}
                className="link truncate"
              >
                {book.title}
              </Link>
              <span className="shrink-0 font-mono text-xs text-ink-soft tabular-nums">
                read {book.year}
              </span>
            </span>
            {screens.map((screen) => (
              <span
                key={`${screen.title}|${screen.year}`}
                className="mt-1 flex justify-between gap-4 pl-4 text-xs text-ink-soft"
              >
                <span className="truncate">
                  <span aria-hidden="true">↳ </span>
                  {screen.title}
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  watched {screen.year}
                </span>
              </span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
