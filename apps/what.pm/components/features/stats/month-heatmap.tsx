import type { CSSProperties } from "react";
import CardHead from "@nienke/ui/card-head";
import type { MonthCell, MonthRow } from "@/utils/data/stats";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const LEVELS = [18, 38, 60, 82, 100];

function cellStyle(count: number, max: number): CSSProperties | undefined {
  if (count === 0) return undefined;
  const level = Math.min(
    LEVELS.length - 1,
    Math.floor((count / max) * LEVELS.length),
  );
  return {
    backgroundColor: `color-mix(in srgb, var(--movies) ${LEVELS[level]}%, transparent)`,
  };
}

const SERIES = [
  { key: "books", label: "Books", noun: "books", swatch: "bg-books" },
  { key: "movies", label: "Movies", noun: "movies", swatch: "bg-movies" },
  { key: "shows", label: "TV seasons", noun: "TV seasons", swatch: "bg-shows" },
] as const;
const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };
const TITLE_LIMIT = 4;

const total = (cell: MonthCell) => cell.books + cell.movies + cell.shows;

function describe(cell: MonthCell) {
  const count = total(cell);
  if (count === 0) return "nothing logged";
  return `${count} logged: ${SERIES.filter(({ key }) => cell[key] > 0)
    .map(({ key, noun }) => `${cell[key]} ${noun}`)
    .join(", ")}`;
}

function CellTooltip({
  label,
  cell,
  align,
}: {
  label: string;
  cell: MonthCell;
  align: "start" | "center" | "end";
}) {
  const count = total(cell);
  const more = cell.titles.length - TITLE_LIMIT;

  return (
    <div
      className={`tooltip max-w-[min(16rem,calc(100vw-7rem))] text-left group-focus:opacity-100 ${
        align === "start"
          ? "left-0"
          : align === "end"
            ? "right-0"
            : "left-1/2 -translate-x-1/2"
      }`}
      aria-hidden="true"
    >
      <p className="flex items-baseline justify-between gap-4 font-medium">
        {label}
        <span className="font-mono font-normal text-ink-soft tabular-nums">
          {count}
        </span>
      </p>
      {count === 0 ? (
        <p className="mt-1 text-ink-soft">Nothing logged</p>
      ) : (
        <>
          <div className="mt-1">
            {SERIES.filter(({ key }) => cell[key] > 0).map(
              ({ key, label, swatch }) => (
                <p key={key} className="flex items-center gap-2">
                  <span className={`size-2 ${swatch}`} />
                  {label}
                  <span className="ml-auto pl-3 tabular-nums">{cell[key]}</span>
                </p>
              ),
            )}
          </div>
          <ul className="mt-2 space-y-0.5 border-t border-line pt-2 text-ink-soft">
            {cell.titles.slice(0, TITLE_LIMIT).map(({ title, type }, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`size-1.5 shrink-0 ${SWATCH[type]}`} />
                <span className="min-w-0 wrap-break-word">{title}</span>
              </li>
            ))}
            {more > 0 && <li className="text-ink-faint">and {more} more</li>}
          </ul>
        </>
      )}
    </div>
  );
}

export function MonthHeatmap({ rows }: { rows: MonthRow[] }) {
  const now = new Date();
  const max = Math.max(1, ...rows.flatMap((row) => row.months.map(total)));

  return (
    <section
      aria-labelledby="month-heatmap-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead
        id="month-heatmap-heading"
        note={rows.length > 0 && `since ${rows[0].year}`}
      >
        When I log
      </CardHead>

      <table className="mt-5 w-full table-fixed border-separate border-spacing-[3px] text-[0.7rem]">
        <caption className="sr-only">Items logged per month, by year</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10">
              <span className="sr-only">Year</span>
            </th>
            {MONTHS.map((month) => (
              <th
                key={month}
                scope="col"
                className="font-normal text-ink-faint"
              >
                <span aria-hidden="true">{month[0]}</span>
                <span className="sr-only">{month}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ year, months }) => (
            <tr key={year}>
              <th
                scope="row"
                className="w-10 pr-1 text-left font-mono font-normal text-ink-soft tabular-nums"
              >
                {year}
              </th>
              {months.map((cell, i) => {
                const upcoming =
                  year === now.getFullYear() && i > now.getMonth();
                const count = total(cell);
                const label = `${MONTHS[i]} ${year}`;

                if (upcoming) return <td key={i} className="h-5" />;

                return (
                  <td key={i} className="h-5 p-0">
                    <div
                      role="img"
                      tabIndex={0}
                      aria-label={`${label}: ${describe(cell)}`}
                      className={`group relative h-full w-full ${count === 0 ? "bg-line" : ""}`}
                      style={cellStyle(count, max)}
                    >
                      <CellTooltip
                        label={label}
                        cell={cell}
                        align={i < 2 ? "start" : i > 6 ? "end" : "center"}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="mt-4 flex items-center justify-end gap-1 font-mono text-[0.7rem] text-ink-faint"
        aria-hidden="true"
      >
        Fewer
        <span className="ml-1 size-3 bg-line" />
        {LEVELS.map((level) => (
          <span
            key={level}
            className="size-3"
            style={{
              backgroundColor: `color-mix(in srgb, var(--movies) ${level}%, transparent)`,
            }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </section>
  );
}
