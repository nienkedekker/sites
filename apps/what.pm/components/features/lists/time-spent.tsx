import { formatCount, formatPlural } from "@nienke/ui/format";
import type { TimeSpent as Spent } from "@/utils/data/patterns";

export function TimeSpent({ spent }: { spent: Spent }) {
  const hours = Math.round(spent.minutes / 60);
  if (spent.pages === 0 && hours === 0) return null;

  return (
    <dl className="mt-6 grid gap-x-10 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
      {spent.pages > 0 && (
        <div>
          <dt className="sr-only">Pages read</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="stat-figure text-3xl">
              {formatCount(spent.pages)}
            </span>
            <span className="text-sm text-ink-soft">pages</span>
            <span className="font-mono text-xs text-ink-faint">
              from {formatPlural(spent.booksWithPages, "book")}
            </span>
          </dd>
        </div>
      )}
      {hours > 0 && (
        <div>
          <dt className="sr-only">Hours watched</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="stat-figure text-3xl">{formatCount(hours)}</span>
            <span className="text-sm text-ink-soft">
              {hours === 1 ? "hour" : "hours"} watched
            </span>
            <span className="font-mono text-xs text-ink-faint">
              from{" "}
              {formatPlural(
                spent.screensWithRuntime,
                "movie or season",
                "movies and seasons",
              )}
            </span>
          </dd>
        </div>
      )}
    </dl>
  );
}
