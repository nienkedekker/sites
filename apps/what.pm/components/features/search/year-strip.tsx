import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { formatPlural } from "@nienke/ui/format";
import {
  describeCounts,
  SERIES,
  SeriesRows,
  type SeriesCounts,
} from "@nienke/ui/series";
import { barCentre, tooltipAlign } from "@nienke/ui/tooltip";
import { Item } from "@/types";

interface YearStripProps {
  results: Item[];
  years: number[];
}

export function YearStrip({ results, years }: YearStripProps) {
  const byYear = new Map<number, SeriesCounts>();
  for (const item of results) {
    const counts = byYear.get(item.belongs_to_year) ?? {
      books: 0,
      movies: 0,
      shows: 0,
    };
    const series = SERIES.find(({ type }) => type === item.itemtype);
    if (series) counts[series.key] += 1;
    byYear.set(item.belongs_to_year, counts);
  }

  const matchYears = [...byYear.keys()];
  const range =
    years.length > 0
      ? years
      : Array.from(
          {
            length: Math.max(...matchYears) - Math.min(...matchYears) + 1,
          },
          (_, i) => Math.min(...matchYears) + i,
        );

  const total = (counts?: SeriesCounts) =>
    counts ? counts.books + counts.movies + counts.shows : 0;
  const peak = Math.max(1, ...range.map((year) => total(byYear.get(year))));
  const yearsWithMatches = matchYears.length;

  return (
    <section aria-labelledby="year-strip-heading" className="panel">
      <CardHead
        id="year-strip-heading"
        note={
          <>
            {formatPlural(results.length, "match", "matches")} in{" "}
            {formatPlural(yearsWithMatches, "year")}
          </>
        }
      >
        Across the years
      </CardHead>

      <ol className="mt-10 flex h-24 items-end gap-[3px] border-b border-line-strong">
        {range.map((year, i) => {
          const counts = byYear.get(year);
          const sum = total(counts);

          if (!counts || sum === 0) {
            return <li key={year} className="flex-1" aria-hidden="true" />;
          }

          return (
            <li key={year} className="flex h-full flex-1 items-end">
              <Link
                href={`/year/${year}`}
                aria-label={`${year}: ${describeCounts(counts, { skipZero: true })}`}
                className="group relative flex h-full w-full items-end justify-center"
              >
                {sum === peak && (
                  <span
                    className="absolute font-mono text-[0.7rem] font-medium text-ink-soft tabular-nums"
                    style={{ bottom: "calc(100% + 4px)" }}
                    aria-hidden="true"
                  >
                    {sum}
                  </span>
                )}
                <span
                  className="flex w-full max-w-5 flex-col gap-px transition-opacity group-hover:opacity-80"
                  style={{ height: `${(sum / peak) * 100}%` }}
                >
                  {[...SERIES]
                    .reverse()
                    .filter(({ key }) => counts[key] > 0)
                    .map(({ key, swatch }) => (
                      <span
                        key={key}
                        className={swatch}
                        style={{ flexGrow: counts[key], flexBasis: 0 }}
                      />
                    ))}
                </span>

                <div
                  className={`tooltip ${tooltipAlign(barCentre(i, range.length))}`}
                >
                  <p className="mb-1 font-medium">{year}</p>
                  <SeriesRows counts={counts} skipZero />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-2 flex justify-between font-mono text-[0.7rem] text-ink-faint tabular-nums"
        aria-hidden="true"
      >
        <span>{range[0]}</span>
        <span>{range[range.length - 1]}</span>
      </div>
    </section>
  );
}
