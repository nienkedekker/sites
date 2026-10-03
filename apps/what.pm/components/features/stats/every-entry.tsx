import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { formatCount } from "@nienke/ui/format";
import { describeCounts, SERIES, SWATCH } from "@nienke/ui/series";
import type { YearEntries } from "@/utils/data/stats";

function describe(entries: YearEntries["entries"]) {
  const counts = { books: 0, movies: 0, shows: 0 };
  for (const entry of entries) {
    counts[SERIES.find(({ type }) => type === entry.type)!.key] += 1;
  }
  return describeCounts(counts);
}

export function EveryEntry({ years }: { years: YearEntries[] }) {
  const total = years.reduce((sum, { entries }) => sum + entries.length, 0);

  return (
    <section aria-labelledby="every-entry-heading" className="panel">
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
