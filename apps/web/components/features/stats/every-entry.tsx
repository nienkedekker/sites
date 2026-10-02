import Link from "next/link";
import type { YearEntries } from "@/utils/data/stats";

// The same swatches as every other chart
const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };
const NOUN = { Book: "books", Movie: "movies", Show: "TV seasons" };

function describe(entries: YearEntries["entries"]) {
  const counts = { Book: 0, Movie: 0, Show: 0 };
  for (const entry of entries) counts[entry.type] += 1;
  return (Object.keys(counts) as (keyof typeof counts)[])
    .map((type) => `${counts[type]} ${NOUN[type]}`)
    .join(", ");
}

/**
 * The whole log: one row per year, one square per book, movie or TV season,
 * three squares high. Hovering a square shows its title; each year links to
 * its page.
 */
export function EveryEntry({ years }: { years: YearEntries[] }) {
  const total = years.reduce((sum, { entries }) => sum + entries.length, 0);

  return (
    <section
      aria-labelledby="every-entry-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="every-entry-heading" className="font-medium tracking-[-0.01em]">
          Every entry
        </h2>
        <p className="font-mono text-xs text-ink-soft tabular-nums">
          {total.toLocaleString("en-GB")} in {years.length} years
        </p>
      </div>

      <ol className="mt-6 space-y-2">
        {years.map(({ year, entries }) => (
          <li key={year}>
            {entries.length > 0 ? (
              <Link
                href={`/year/${year}`}
                aria-label={`${year}: ${describe(entries)}`}
                className="group flex items-center gap-3"
              >
                <span className="w-10 shrink-0 font-mono text-xs text-ink-soft tabular-nums transition-colors group-hover:text-ink">
                  {year}
                </span>
                <span
                  className="grid grid-flow-col grid-rows-[repeat(3,5px)] auto-cols-[5px] gap-[2px]"
                  aria-hidden="true"
                >
                  {entries.map((entry) => (
                    <span
                      key={entry.id}
                      title={entry.title}
                      className={`${SWATCH[entry.type]} transition-opacity group-hover:opacity-85`}
                    />
                  ))}
                </span>
                <span className="font-mono text-xs text-ink-faint tabular-nums">
                  {entries.length}
                </span>
              </Link>
            ) : (
              // Years with nothing logged keep their place, as a hairline
              <span className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-xs text-ink-faint tabular-nums">
                  {year}
                </span>
                <span className="h-px w-6 bg-line-strong" aria-hidden="true" />
                <span className="sr-only">nothing logged</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
