import Link from "next/link";
import { formatPlural } from "@nienke/ui/format";
import Panel from "@nienke/ui/panel";
import {
  describeCounts,
  SERIES,
  SeriesColumn,
  type SeriesCounts,
} from "@nienke/ui/series";
import { barCentre } from "@nienke/ui/tooltip";
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
    <Panel
      id="year-strip-heading"
      title="Across the years"
      note={
        <>
          {formatPlural(results.length, "match", "matches")} in{" "}
          {formatPlural(yearsWithMatches, "year")}
        </>
      }
    >
      <ol className="mt-4 flex h-24 items-end gap-[3px] border-b border-line-strong">
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
                <SeriesColumn
                  counts={counts}
                  top={peak}
                  peak={sum === peak}
                  label={year}
                  position={barCentre(i, range.length)}
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="axis-label mt-2 flex justify-between" aria-hidden="true">
        <span>{range[0]}</span>
        <span>{range[range.length - 1]}</span>
      </div>
    </Panel>
  );
}
