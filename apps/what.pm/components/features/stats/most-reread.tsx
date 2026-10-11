import Link from "next/link";
import Panel from "@nienke/ui/panel";
import { SWATCH } from "@nienke/ui/series";
import type { Revisit } from "@/utils/data/stats";

const VERB = { Book: "read", Movie: "watched", Show: "watched" };

export function MostReread({ titles }: { titles: Revisit[] }) {
  return (
    <Panel
      id="most-reread-heading"
      title="Most reread & rewatched"
      align="bottom"
      className="h-full"
    >
      <ol>
        {titles.map(({ title, type, times }) => (
          <li key={`${type}-${title}`}>
            <Link
              href={`/search?q=${encodeURIComponent(title)}`}
              className="group flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
            >
              <span
                className={`size-2.5 shrink-0 ${SWATCH[type]}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 wrap-break-word text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink">
                {title}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-soft tabular-nums">
                <span aria-hidden="true">{times}×</span>
                <span className="sr-only">
                  , {VERB[type]} {times} times
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
