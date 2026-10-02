import Link from "next/link";
import type { Revisit } from "@/utils/data/stats";

const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };
const VERB = { Book: "read", Movie: "watched", Show: "watched" };

/** The books, movies and shows gone back to most, each linking to a search */
export function MostReread({ titles }: { titles: Revisit[] }) {
  return (
    <section
      aria-labelledby="most-reread-heading"
      className="card flex h-full flex-col p-6 sm:p-7"
    >
      <h2 id="most-reread-heading" className="font-medium tracking-[-0.01em]">
        Most reread &amp; rewatched
      </h2>

      <ol className="mt-auto pt-6">
        {titles.map(({ title, type, times }) => (
          <li key={`${type}-${title}`}>
            <Link
              href={`/search?q=${encodeURIComponent(title)}`}
              className="group flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
            >
              <span
                className={`size-2.5 shrink-0 ${SWATCH[type]}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink">
                {title}
              </span>
              <span
                className="shrink-0 font-mono text-xs text-ink-soft tabular-nums"
                aria-label={`${VERB[type]} ${times} times`}
              >
                {times}×
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
