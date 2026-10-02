import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { Item } from "@/types";

const SERIES = [
  { type: "Book", label: "Books", noun: "books", swatch: "bg-books" },
  { type: "Movie", label: "Movies", noun: "movies", swatch: "bg-movies" },
  { type: "Show", label: "TV seasons", noun: "TV seasons", swatch: "bg-shows" },
] as const;

type Counts = Record<(typeof SERIES)[number]["type"], number>;

interface YearStripProps {
  results: Item[];
  years: number[];
}

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
      <CardHead
        id="year-strip-heading"
        note={
          <>
            {results.length} {results.length === 1 ? "match" : "matches"} in{" "}
            {yearsWithMatches} {yearsWithMatches === 1 ? "year" : "years"}
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

                <span
                  className={`tooltip ${
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
