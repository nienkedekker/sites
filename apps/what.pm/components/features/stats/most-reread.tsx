import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { SWATCH } from "@nienke/ui/series";
import type { Revisit } from "@/utils/data/stats";

const VERB = { Book: "read", Movie: "watched", Show: "watched" };

export function MostReread({ titles }: { titles: Revisit[] }) {
  return (
    <section
      aria-labelledby="most-reread-heading"
      className="panel flex h-full flex-col"
    >
      <CardHead id="most-reread-heading">Most reread &amp; rewatched</CardHead>

      <ol className="mt-auto pt-6">
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
    </section>
  );
}
