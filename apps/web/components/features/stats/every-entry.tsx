import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { formatCount } from "@nienke/ui/format";
import type { YearEntries } from "@/utils/data/stats";

const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };
const NOUN = { Book: "books", Movie: "movies", Show: "TV seasons" };

function describe(entries: YearEntries["entries"]) {
  const counts = { Book: 0, Movie: 0, Show: 0 };
  for (const entry of entries) counts[entry.type] += 1;
  return (Object.keys(counts) as (keyof typeof counts)[])
    .map((type) => `${counts[type]} ${NOUN[type]}`)
    .join(", ");
}

export function EveryEntry({ years }: { years: YearEntries[] }) {
  const total = years.reduce((sum, { entries }) => sum + entries.length, 0);

  return (
    <section
      aria-labelledby="every-entry-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead
        id="every-entry-heading"
        note={`${formatCount(total)} in ${years.length} years`}
      >
        Every entry
      </CardHead>

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
                  className="grid grid-flow-col grid-rows-[repeat(5,5px)] sm:grid-rows-[repeat(3,5px)] auto-cols-[5px] gap-[2px]"
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
