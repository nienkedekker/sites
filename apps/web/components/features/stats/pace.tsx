import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { formatCount, formatDate } from "@nienke/ui/format";
import { PaceChart } from "@/components/features/charts/pace-chart";
import { dayOfYear, daysInYear, type PaceYear } from "@/utils/data/patterns";

const STEP = 7;

// days is sorted, so count everything up to and including `day`
function countBy(days: number[], day: number) {
  let count = 0;
  while (count < days.length && days[count] <= day) count++;
  return count;
}

export function Pace({ years }: { years: PaceYear[] }) {
  const now = new Date();
  const today = dayOfYear(now);
  const thisYear = now.getUTCFullYear();
  const current = years.find(({ year }) => year === thisYear);
  const past = years.filter(({ year }) => year < thisYear);

  if (!current || past.length === 0) return null;

  const soFar = countBy(current.days, today);
  const lastYear = past.find(({ year }) => year === thisYear - 1);
  const lastYearSoFar = lastYear ? countBy(lastYear.days, today) : null;
  const best = past
    .map(({ year, days }) => ({ year, count: countBy(days, today) }))
    .reduce((a, b) => (b.count > a.count ? b : a));
  const projected = Math.round((soFar / (today + 1)) * daysInYear(thisYear));
  const difference = lastYearSoFar === null ? null : soFar - lastYearSoFar;

  const points = Array.from(
    { length: Math.ceil(366 / STEP) + 1 },
    (_, i) => Math.min(i * STEP, 365),
  );
  if (!points.includes(today)) points.push(today);
  points.sort((a, b) => a - b);

  const data = points.map((day) => ({
    day,
    ...Object.fromEntries(
      years.map(({ year, days }) => [
        String(year),
        year === thisYear && day > today ? null : countBy(days, day),
      ]),
    ),
  }));

  const date = formatDate(now, { month: "long", day: "numeric" });

  return (
    <section
      aria-labelledby="pace-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead id="pace-heading" note={`as of ${date}`}>
        Pace
      </CardHead>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <div className="flex flex-col">
          <p className="stat-figure text-6xl">{formatCount(soFar)}</p>
          <p className="mt-3 text-sm text-ink-soft">
            logged so far this year
            {difference !== null &&
              difference !== 0 &&
              `, ${formatCount(Math.abs(difference))} ${
                difference > 0 ? "ahead of" : "behind"
              } last year`}
            {difference === 0 && ", level with last year"}.
          </p>

          <dl className="mt-auto space-y-0 pt-6 font-mono text-xs">
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink-soft">On pace for</dt>
              <dd className="tabular-nums text-ink">
                ~{formatCount(projected)}
              </dd>
            </div>
            {lastYear && lastYearSoFar !== null && (
              <div className="flex justify-between gap-4 border-b border-line py-2">
                <dt className="text-ink-soft">{lastYear.year} by now</dt>
                <dd className="tabular-nums text-ink">
                  {formatCount(lastYearSoFar)}
                  <span className="text-ink-faint">
                    {" "}
                    of {formatCount(lastYear.days.length)}
                  </span>
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-ink-soft">Best by now</dt>
              <dd className="tabular-nums text-ink">
                <Link href={`/year/${best.year}`} className="link">
                  {best.year}
                </Link>
                , {formatCount(best.count)}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <PaceChart
            data={data}
            series={years.map(({ year }) => ({
              year,
              current: year === thisYear,
              previous: year === thisYear - 1,
            }))}
          />
          <p
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-ink-faint"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-movies" />
              {thisYear}
            </span>
            {lastYear && (
              <span className="flex items-center gap-1.5">
                <span className="h-px w-3 bg-ink-faint" />
                {lastYear.year}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3 bg-line-strong" />
              earlier years
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
