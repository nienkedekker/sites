import type { YearSummary } from "./summary";
import { describeCounts, MONTHS, SERIES, SeriesRows } from "./series";
import { barCentre, tooltipAlign } from "./tooltip";

export function niceScale(max: number) {
  const step = max > 30 ? 10 : 5;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  return { top, ticks };
}

interface MediaChartProps {
  summary: YearSummary | null;
  failed?: boolean;
  failedMessage?: string;
}

export default function MediaChart({
  summary,
  failed = false,
  failedMessage = "Couldn't reach what.pm right now.",
}: MediaChartProps) {
  const now = new Date();
  const lastMonth =
    summary && summary.year === now.getUTCFullYear()
      ? now.getUTCMonth() + 1
      : 12;
  const months = summary?.months ?? [];
  const totals = months.map((m) => m.books + m.movies + m.shows);
  const { top, ticks } = niceScale(Math.max(0, ...totals));
  const peak = totals.indexOf(Math.max(...totals));

  return (
    <>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {SERIES.map(({ key, label, swatch }) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`size-2.5 ${swatch}`} aria-hidden="true" />
            <span className="text-ink-soft">{label}</span>
            {summary && (
              <span className="font-medium tabular-nums">
                {summary.counts[key]}
              </span>
            )}
          </li>
        ))}
      </ul>

      {failed && !summary ? (
        <p className="mt-auto pt-8 text-ink-soft">{failedMessage}</p>
      ) : (
        <div className="mt-auto flex gap-3 pt-8">
          <div className="relative h-40 w-5 shrink-0 text-right text-[0.7rem] text-ink-faint tabular-nums">
            {summary &&
              ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 translate-y-1/2"
                  style={{ bottom: `${(tick / top) * 100}%` }}
                >
                  {tick}
                </span>
              ))}
          </div>

          <div className="flex-1">
            <div className="relative h-40">
              {summary &&
                ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute inset-x-0 h-px bg-line"
                    style={{ bottom: `${(tick / top) * 100}%` }}
                    aria-hidden="true"
                  />
                ))}

              <div className="absolute inset-0 flex" aria-hidden={!summary}>
                {MONTHS.map((name, i) => {
                  const month = months[i];
                  const total = totals[i] ?? 0;
                  const upcoming = i + 1 > lastMonth;
                  const segments = month
                    ? [...SERIES].reverse().filter(({ key }) => month[key] > 0)
                    : [];

                  if (!summary) {
                    return (
                      <div
                        key={name}
                        className="flex flex-1 items-end justify-center"
                      >
                        <span
                          className="skeleton w-3/4 max-w-6"
                          style={{ height: `${25 + ((i * 37) % 50)}%` }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={name}
                      className="group relative flex flex-1 items-end justify-center"
                      role={upcoming ? undefined : "img"}
                      tabIndex={upcoming ? undefined : 0}
                      aria-label={
                        upcoming ? undefined : `${name}: ${describeCounts(month)}`
                      }
                    >
                      {i === peak && total > 0 && (
                        <span
                          className="absolute text-[0.7rem] font-medium text-ink-soft tabular-nums"
                          style={{
                            bottom: `calc(${(total / top) * 100}% + 4px)`,
                          }}
                        >
                          {total}
                        </span>
                      )}
                      <div
                        className="flex w-3/4 max-w-6 flex-col gap-[2px] transition-opacity group-hover:opacity-85"
                        style={{ height: `${(total / top) * 100}%` }}
                      >
                        {segments.map(({ key, swatch }) => (
                          <span
                            key={key}
                            className={swatch}
                            style={{ flexGrow: month[key], flexBasis: 0 }}
                          />
                        ))}
                      </div>

                      {!upcoming && (
                        <div
                          className={`tooltip ${tooltipAlign(
                            barCentre(i, MONTHS.length)
                          )}`}
                        >
                          <p className="mb-1 font-medium">{name}</p>
                          <SeriesRows counts={month} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-2 flex text-[0.7rem] text-ink-faint"
              aria-hidden="true"
            >
              {MONTHS.map((name, i) => (
                <span
                  key={name}
                  className={`flex-1 text-center ${i + 1 > lastMonth ? "opacity-40" : ""}`}
                >
                  {name[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The wrapper is the sr-only box: a table ignores width: 1px and would
          stretch the page on phones */}
      {summary && (
        <div className="sr-only">
          <table>
            <caption>
              Books, movies and TV seasons logged per month in {summary.year}
            </caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                {SERIES.map(({ key, label }) => (
                  <th key={key} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.slice(0, lastMonth).map((month, i) => (
                <tr key={month.month}>
                  <th scope="row">{MONTHS[i]}</th>
                  {SERIES.map(({ key }) => (
                    <td key={key}>{month[key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
