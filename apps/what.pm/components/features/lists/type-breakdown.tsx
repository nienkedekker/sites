import { SERIES } from "@nienke/ui/series";
import type { YearSummary } from "@nienke/ui/summary";

export function TypeBreakdown({ counts }: { counts: YearSummary["counts"] }) {
  const total = counts.books + counts.movies + counts.shows;
  const largest = Math.max(1, counts.books, counts.movies, counts.shows);

  return (
    <dl className="space-y-4">
      {SERIES.map(({ key, label, swatch }) => {
        const count = counts[key];
        const share = total ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={key}
            className="grid grid-cols-[7rem_1fr_auto] items-center gap-x-4"
          >
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="h-5" aria-hidden="true">
              <span
                className={`block h-full ${swatch}`}
                style={{ width: `${(count / largest) * 100}%` }}
              />
            </dd>
            <dd className="w-20 text-right font-mono text-sm tabular-nums">
              <span className="text-ink">{count}</span>
              <span className="text-ink-faint"> · {share}%</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
