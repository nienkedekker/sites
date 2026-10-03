import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import type { Rhythm } from "@/utils/data/patterns";

const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };
const VERB = { Book: "Read", Movie: "Watched", Show: "Watched" };
const AGAIN = { Book: "reread", Movie: "rewatch", Show: "rewatch" };

const roundEvery = (every: number) => Math.round(every * 2) / 2;

function formatEvery(every: number) {
  const rounded = roundEvery(every);
  return rounded === 1 ? "every year" : `every ~${rounded} yrs`;
}

function describeEvery(every: number) {
  const rounded = roundEvery(every);
  return rounded === 1 ? "Every year" : `About every ${rounded} years`;
}

const listYears = (years: number[]) =>
  years.length > 1
    ? `${years.slice(0, -1).join(", ")} and ${years[years.length - 1]}`
    : String(years[0]);

export function RereadRhythm({ rhythms }: { rhythms: Rhythm[] }) {
  const currentYear = new Date().getFullYear();
  const first = Math.min(...rhythms.map(({ years }) => years[0]));
  const span = Array.from(
    { length: currentYear - first + 1 },
    (_, i) => first + i,
  );

  return (
    <section
      aria-labelledby="reread-rhythm-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead
        id="reread-rhythm-heading"
        note={`${first}–${currentYear}`}
      >
        Reread rhythm
      </CardHead>

      <ol className="mt-6">
        {rhythms.map(({ title, type, season, years, every, due }) => {
          const name = season ? `${title}, season ${season}` : title;
          return (
            <li
              key={`${type}-${title}-${season ?? ""}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(0,14rem)_1fr_auto]"
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

              <span className="col-span-2 flex gap-[3px] sm:col-span-1 sm:row-start-1 sm:col-start-2">
                {span.map((year) => (
                  <span
                    key={year}
                    aria-hidden="true"
                    title={years.includes(year) ? String(year) : undefined}
                    className={`h-3 min-w-0 flex-1 ${
                      years.includes(year) ? SWATCH[type] : "bg-line"
                    }`}
                  />
                ))}
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
      </ol>
    </section>
  );
}
