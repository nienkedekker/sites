import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import Meter from "@nienke/ui/meter";
import { SWATCH, type ItemType } from "@nienke/ui/series";

function PartList({
  label,
  parts,
  className = "",
}: {
  label: string;
  parts: { name: string; count: number }[];
  className?: string;
}) {
  return (
    <ul aria-label={label} className={`space-y-1 ${className}`}>
      {parts.map((part) => (
        <li
          key={part.name}
          className="flex items-baseline justify-between gap-3 text-xs text-ink-soft"
        >
          <span className="truncate">{part.name}</span>
          <span className="font-mono tabular-nums">{part.count}</span>
        </li>
      ))}
    </ul>
  );
}

interface MostLoggedProps {
  id: string;
  title: string;
  note?: string;
  people: {
    name: string;
    count: number;
    type?: ItemType;
    // Folded away under the row, like the subgenres of literary fiction,
    // with tags that cut across them below a rule
    parts?: { name: string; count: number }[];
    tags?: { name: string; count: number }[];
  }[];
  // Names that search can't find, like genres, aren't links
  linked?: boolean;
}

export function MostLogged({
  id,
  title,
  note,
  people,
  linked = true,
}: MostLoggedProps) {
  const most = Math.max(1, ...people.map((person) => person.count));
  const row = "group block border-b border-line py-2.5 last:border-b-0";

  return (
    <section aria-labelledby={`${id}-heading`} className="panel h-full">
      <CardHead id={`${id}-heading`} note={note}>
        {title}
      </CardHead>

      <ol className="mt-5">
        {people.map(({ name, count, type, parts, tags }) => {
          const label = (
            <span
              className={`truncate text-sm text-ink ${linked ? "underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink" : ""}`}
            >
              {name}
            </span>
          );
          const figure = (
            <span className="font-mono text-xs text-ink-soft tabular-nums">
              {count}
            </span>
          );
          const meter = (
            <Meter
              value={count}
              max={most}
              fill={type ? SWATCH[type] : "bg-ink"}
              className="mt-1.5"
            />
          );

          if (parts && parts.length > 0) {
            return (
              <li key={name} className={row}>
                <details className="group/parts">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-baseline gap-1.5">
                        {label}
                        <svg
                          viewBox="0 0 12 12"
                          className="size-2.5 shrink-0 text-ink-faint transition-transform group-open/parts:rotate-90"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 2l4 4-4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </span>
                      {figure}
                    </span>
                    {meter}
                  </summary>
                  <div className="mt-2.5 border-l border-line pl-3">
                    <PartList label={`${name} by subgenre`} parts={parts} />
                    {tags && tags.length > 0 && (
                      <PartList
                        label={`${name} tags`}
                        parts={tags}
                        className="mt-2 border-t border-line pt-2"
                      />
                    )}
                  </div>
                </details>
              </li>
            );
          }

          const content = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                {label}
                {figure}
              </span>
              {meter}
            </>
          );
          return (
            <li key={name} className={linked ? undefined : row}>
              {linked ? (
                <Link
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className={row}
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
