import CardHead from "@nienke/ui/card-head";
import { HeatCell, HeatLegend } from "@nienke/ui/heatmap";
import { describeCounts, MONTHS, SeriesRows, SWATCH } from "@nienke/ui/series";
import { barCentre } from "@nienke/ui/tooltip";
import { HeatGridKeys } from "./heat-grid-keys";
import type { MonthCell, MonthRow } from "@/utils/data/stats";

const TITLE_LIMIT = 4;

const total = (cell: MonthCell) => cell.books + cell.movies + cell.shows;

function describe(cell: MonthCell) {
  const count = total(cell);
  if (count === 0) return "nothing logged";
  const titles = cell.titles.slice(0, TITLE_LIMIT).map(({ title }) => title);
  const more = cell.titles.length - TITLE_LIMIT;
  if (more > 0) titles.push(`and ${more} more`);
  return `${count} logged: ${describeCounts(cell, { skipZero: true })}. ${titles.join(", ")}`;
}

function CellDetails({ cell }: { cell: MonthCell }) {
  const more = cell.titles.length - TITLE_LIMIT;

  if (total(cell) === 0) {
    return <p className="mt-1 text-ink-soft">Nothing logged</p>;
  }

  return (
    <>
      <div className="mt-1">
        <SeriesRows counts={cell} skipZero />
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
  );
}

export function MonthHeatmap({ rows, now }: { rows: MonthRow[]; now: Date }) {
  const max = Math.max(1, ...rows.flatMap((row) => row.months.map(total)));

  return (
    <section aria-labelledby="month-heatmap-heading" className="panel">
      <CardHead
        id="month-heatmap-heading"
        note={rows.length > 0 && `since ${rows[0].year}`}
      >
        When I log
      </CardHead>

      <table
        id="month-heatmap-table"
        className="mt-5 w-full table-fixed border-separate border-spacing-[3px] text-[0.7rem]"
      >
        <caption className="sr-only">
          Items logged per month, by year. Use the arrow keys to move between
          months.
        </caption>
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
          {rows.map(({ year, months }, row) => (
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
                const label = `${MONTHS[i]} ${year}`;

                if (upcoming) return <td key={i} className="h-5" />;

                return (
                  <td key={i} className="h-5 p-0">
                    <HeatCell
                      count={total(cell)}
                      max={max}
                      position={barCentre(i, MONTHS.length)}
                      label={`${label}: ${describe(cell)}`}
                      title={label}
                      tabbable={row === 0 && i === 0}
                    >
                      <CellDetails cell={cell} />
                    </HeatCell>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <HeatGridKeys tableId="month-heatmap-table" />

      <HeatLegend />
    </section>
  );
}
