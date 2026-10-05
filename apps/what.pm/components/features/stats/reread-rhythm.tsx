import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { SWATCH } from "@nienke/ui/series";
import { tooltipAlign } from "@nienke/ui/tooltip";
import type { Rhythm } from "@/utils/data/patterns";
import { localDate } from "@/utils/formatters/date";

const VERB = { Book: "Read", Movie: "Watched", Show: "Watched" };
const AGAIN = { Book: "reread", Movie: "rewatch", Show: "rewatch" };

const roundEvery = (every: number) => Math.round(every * 2) / 2;

function formatEvery(every: number) {
  const rounded = roundEvery(every);
  return rounded === 1 ? "every year" : `every ~${rounded} years`;
}

function describeEvery(every: number) {
  const rounded = roundEvery(every);
  return rounded === 1 ? "Every year" : `About every ${rounded} years`;
}

const listYears = (years: number[]) =>
  years.length > 1
    ? `${years.slice(0, -1).join(", ")} and ${years[years.length - 1]}`
    : String(years[0]);

// Every fifth year on the axis, plus the first and last when they're clear
// of one
function axisYears(span: number[]) {
  const start = span[0];
  const end = span[span.length - 1];
  const ticks = span.filter((year) => year % 5 === 0);
  if (ticks.length === 0 || ticks[0] - start >= 3) ticks.unshift(start);
  if (end - ticks[ticks.length - 1] >= 3) ticks.push(end);
  return new Set(ticks);
}

export function RereadRhythm({
  rhythms,
  now,
}: {
  rhythms: Rhythm[];
  now: Date;
}) {
  const currentYear = localDate(now).year;
  const first = Math.min(...rhythms.map(({ years }) => years[0]));
  const span = Array.from(
    { length: currentYear - first + 1 },
    (_, i) => first + i,
  );
  const ticks = axisYears(span);

  return (
    <section aria-labelledby="reread-rhythm-heading" className="panel">
      <CardHead id="reread-rhythm-heading" note={`${first}–${currentYear}`}>
        Reread rhythm
      </CardHead>

      {/* Rows share the parent's columns, so every strip, and the axis below
          them, lines up whatever the width of its "every" label */}
      <ol className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
        {rhythms.map(({ title, type, season, years, every, due }) => {
          const name = season ? `${title}, season ${season}` : title;
          return (
            <li
              key={`${type}-${title}-${season ?? ""}`}
              className="col-span-2 grid grid-cols-subgrid items-center gap-y-2 border-b border-line py-3 nth-last-2:border-b-0 sm:col-span-3"
            >
              <Link
                href={`/search?q=${encodeURIComponent(title)}`}
                className="group flex min-w-0 items-center gap-3"
              >
                <span
                  className={`size-2.5 shrink-0 ${SWATCH[type]}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 wrap-break-word text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink">
                  {name}
                </span>
              </Link>

              <span className="group relative col-span-2 -my-1.5 flex gap-[3px] py-1.5 sm:col-span-1 sm:row-start-1 sm:col-start-2">
                {span.map((year) => (
                  <span
                    key={year}
                    aria-hidden="true"
                    className={`h-3 min-w-0 flex-1 ${
                      years.includes(year) ? SWATCH[type] : "bg-line"
                    }`}
                  />
                ))}

                <span
                  className={`tooltip max-w-[min(16rem,calc(100vw-7rem))] text-left ${tooltipAlign(0.5)}`}
                  aria-hidden="true"
                >
                  <span className="block font-medium">{name}</span>
                  <span className="mt-1 block text-ink-soft">
                    {VERB[type]} in{" "}
                    <span className="font-mono tabular-nums">
                      {listYears(years)}
                    </span>
                  </span>
                </span>
              </span>

              <span
                aria-hidden="true"
                className="row-start-1 col-start-2 flex items-center justify-end gap-2 font-mono text-xs whitespace-nowrap text-ink-soft tabular-nums sm:col-start-3"
              >
                {formatEvery(every)}
                {due && <span className="tag">due</span>}
              </span>

              <span className="sr-only">
                {VERB[type]} in {listYears(years)}. {describeEvery(every)}.
                {due && ` Due for another ${AGAIN[type]}.`}
              </span>
            </li>
          );
        })}

        <li
          aria-hidden="true"
          className="col-span-2 grid grid-cols-subgrid pt-1 sm:col-span-3"
        >
          <span className="col-span-2 flex gap-[3px] font-mono text-[0.7rem] text-ink-faint tabular-nums sm:col-span-1 sm:col-start-2">
            {span.map((year) => (
              <span key={year} className="relative h-4 min-w-0 flex-1">
                {ticks.has(year) && (
                  <span className="absolute left-1/2 -translate-x-1/2">
                    {year}
                  </span>
                )}
              </span>
            ))}
          </span>
        </li>
      </ol>
    </section>
  );
}
