import Link from "next/link";
import { Item } from "@/types";

// Same order and colours as the month-by-month chart
const SERIES = [
  { type: "Book", label: "Books", noun: "books", swatch: "bg-books" },
  { type: "Movie", label: "Movies", noun: "movies", swatch: "bg-movies" },
  { type: "Show", label: "TV seasons", noun: "TV seasons", swatch: "bg-shows" },
] as const;

type Counts = Record<(typeof SERIES)[number]["type"], number>;

interface YearStripProps {
  results: Item[];
  /** Every logged year, so years without matches show as gaps */
  years: number[];
}

/**
 * Which years the matches were logged in: one stacked column per year,
 * each linking to that year's page.
 */
export function YearStrip({ results, years }: YearStripProps) {
  const byYear = new Map<number, Counts>();
  for (const item of results) {
    const counts = byYear.get(item.belongs_to_year) ?? {
      Book: 0,
      Movie: 0,
      Show: 0,
    };
    if (item.itemtype in counts) counts[item.itemtype as keyof Counts] += 1;
    byYear.set(item.belongs_to_year, counts);
  }

  // Fall back to the matches' own range if the full range didn't load
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

  const total = (counts?: Counts) =>
    counts ? counts.Book + counts.Movie + counts.Show : 0;
  const peak = Math.max(1, ...range.map((year) => total(byYear.get(year))));
  const yearsWithMatches = matchYears.length;

  return (
    <section
      aria-labelledby="year-strip-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="year-strip-heading" className="font-medium tracking-[-0.01em]">
          Across the years
        </h2>
        <p className="font-mono text-xs text-ink-soft">
          {results.length} {results.length === 1 ? "match" : "matches"} in{" "}
          {yearsWithMatches} {yearsWithMatches === 1 ? "year" : "years"}
        </p>
      </div>

      <ol className="mt-10 flex h-24 items-end gap-[3px] border-b border-line-strong">
        {range.map((year, i) => {
          const counts = byYear.get(year);
          const sum = total(counts);

          if (!counts || sum === 0) {
            return <li key={year} className="flex-1" aria-hidden="true" />;
          }

          const description = SERIES.filter(({ type }) => counts[type] > 0)
            .map(({ type, noun }) => `${counts[type]} ${noun}`)
            .join(", ");

          return (
            <li key={year} className="flex h-full flex-1 items-end">
              <Link
                href={`/year/${year}`}
                aria-label={`${year}: ${description}`}
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
                    .filter(({ type }) => counts[type] > 0)
                    .map(({ type, swatch }) => (
                      <span
                        key={type}
                        className={swatch}
                        style={{ flexGrow: counts[type], flexBasis: 0 }}
                      />
                    ))}
                </span>

                {/* Hover / focus tooltip */}
                {/* Edge years anchor to the chart's sides, to stay on screen */}
                <span
                  className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max border border-line bg-panel px-3 py-2 text-xs text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
                    i < 3
                      ? "left-0"
                      : i > range.length - 4
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <span className="mb-1 block font-medium">{year}</span>
                  {SERIES.filter(({ type }) => counts[type] > 0).map(
                    ({ type, label, swatch }) => (
                      <span key={type} className="flex items-center gap-2">
                        <span className={`size-2 ${swatch}`} />
                        {label}
                        <span className="ml-auto pl-3 tabular-nums">
                          {counts[type]}
                        </span>
                      </span>
                    ),
                  )}
                </span>
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
