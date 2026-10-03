import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import type { Person } from "@/utils/data/stats";

const SWATCH = { Book: "bg-books", Movie: "bg-movies", Show: "bg-shows" };

interface MostLoggedProps {
  id: string;
  title: string;
  people: Person[];
}

export function MostLogged({ id, title, people }: MostLoggedProps) {
  const most = Math.max(1, ...people.map((person) => person.count));

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="above-grain card h-full p-6 sm:p-7"
    >
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
              <span className="mt-1.5 block h-1 bg-line" aria-hidden="true">
                <span
                  className={`block h-full ${SWATCH[type]}`}
                  style={{ width: `${(count / most) * 100}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
