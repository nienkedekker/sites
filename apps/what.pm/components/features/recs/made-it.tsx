import Link from "next/link";
import { formatDate, formatPlural } from "@nienke/ui/format";
import { SWATCH } from "@nienke/ui/series";
import type { LoggedPick } from "@/utils/data/recommend";
import type { Tables } from "@/types";

function waited(days: number) {
  return days === 0
    ? "the day I saved it"
    : `${formatPlural(days, "day")} after saving`;
}

export function MadeIt({
  picks,
  saved,
}: {
  picks: LoggedPick<Tables<"wanted">>[];
  saved: number;
}) {
  return (
    <section aria-labelledby="made-it-heading" className="mt-24">
      <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <h2
          id="made-it-heading"
          className="display text-ink text-[1.875rem] sm:text-[2.5rem]"
        >
          Made it into the log
        </h2>
        <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
          {picks.length} of {formatPlural(saved, "saved pick")}
        </p>
      </header>
      <ul>
        {picks.map(({ pick, item, days }) => (
          <li
            key={`${pick.itemtype}|${pick.external_id}`}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
          >
            <span className="flex items-baseline gap-3">
              <span
                className={`size-2.5 shrink-0 ${SWATCH[item.itemtype]}`}
                aria-hidden="true"
              />
              <Link
                href={`/year/${item.belongs_to_year}#item-${item.id}`}
                className="wrap-break-word font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
              >
                {item.title}
              </Link>
            </span>
            <span className="font-mono text-xs text-ink-soft">
              logged{" "}
              {formatDate(new Date(item.created_at!), {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Europe/Amsterdam",
              })}
              , {waited(days)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
