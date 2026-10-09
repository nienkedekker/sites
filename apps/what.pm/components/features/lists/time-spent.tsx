import { formatCount, formatPlural } from "@nienke/ui/format";
import type { TimeSpent as Spent } from "@/utils/data/patterns";

export function hasTimeSpent(spent: Spent) {
  return spent.pages > 0 || Math.round(spent.minutes / 60) > 0;
}

export function TimeSpent({
  spent,
  divided = true,
}: {
  spent: Spent;
  // Off when there's no chart above it to divide from
  divided?: boolean;
}) {
  const hours = Math.round(spent.minutes / 60);
  if (!hasTimeSpent(spent)) return null;

  return (
    <dl
      className={`grid gap-x-10 gap-y-3 sm:grid-cols-2 ${
        divided ? "mt-6 border-t border-line pt-5" : ""
      }`}
    >
      {spent.pages > 0 && (
        <div>
          <dt className="sr-only">Pages read</dt>
          <dd>
            <p className="stat-figure text-3xl font-medium text-ink/75">
              {formatCount(spent.pages)}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              pages{" "}
              <span className="text-ink-faint">
                from {formatPlural(spent.booksWithPages, "book")}
              </span>
            </p>
          </dd>
        </div>
      )}
      {hours > 0 && (
        <div>
          <dt className="sr-only">Hours watched</dt>
          <dd>
            <p className="stat-figure text-3xl font-medium text-ink/75">
              {formatCount(hours)}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {hours === 1 ? "hour" : "hours"} watched{" "}
              <span className="text-ink-faint">
                from{" "}
                {[
                  spent.moviesWithRuntime > 0 &&
                    formatPlural(spent.moviesWithRuntime, "movie"),
                  spent.showsWithRuntime > 0 &&
                    formatPlural(spent.showsWithRuntime, "TV season"),
                ]
                  .filter(Boolean)
                  .join(" and ")}
              </span>
            </p>
          </dd>
        </div>
      )}
    </dl>
  );
}
