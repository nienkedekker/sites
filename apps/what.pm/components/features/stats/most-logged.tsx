import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import Meter from "@nienke/ui/meter";
import { SWATCH } from "@nienke/ui/series";
import type { Person } from "@/utils/data/stats";

interface MostLoggedProps {
  id: string;
  title: string;
  people: Person[];
}

export function MostLogged({ id, title, people }: MostLoggedProps) {
  const most = Math.max(1, ...people.map((person) => person.count));

  return (
    <section aria-labelledby={`${id}-heading`} className="panel h-full">
      <CardHead id={`${id}-heading`}>{title}</CardHead>

      <ol className="mt-5">
        {people.map(({ name, count, type }) => (
          <li key={name}>
            <Link
              href={`/search?q=${encodeURIComponent(name)}`}
              className="group block border-b border-line py-2.5 last:border-b-0"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink">
                  {name}
                </span>
                <span className="font-mono text-xs text-ink-soft tabular-nums">
                  {count}
                </span>
              </span>
              <Meter
                value={count}
                max={most}
                fill={SWATCH[type]}
                className="mt-1.5"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
