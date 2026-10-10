import type { ReactNode } from "react";
import { externalProps } from "@nienke/ui/external";
import { formatPlural } from "@nienke/ui/format";
import { SWATCH } from "@nienke/ui/series";
import { sourceOf } from "@/components/features/lists/item-source";
import { SelectBox } from "@/components/features/recs/bulk-select";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import type { ValidItemType } from "@/types/shared";

interface Entry {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  published_year: number | null;
}

export function byline(entry: Entry) {
  const made =
    entry.creator &&
    (entry.itemtype === "Book"
      ? `by ${entry.creator}`
      : entry.itemtype === "Movie"
        ? `dir. ${entry.creator}`
        : `created by ${entry.creator}`);
  return [made, entry.published_year].filter(Boolean).join(" · ");
}

export function EntryTitle({ entry }: { entry: Entry }) {
  const href = sourceOf({ ...entry, author: entry.creator })?.href;
  return (
    <h3 className="wrap-break-word font-medium leading-snug tracking-[-0.01em] text-ink">
      {href ? (
        <a
          href={href}
          className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
          {...externalProps(href)}
        >
          {entry.title}
        </a>
      ) : (
        entry.title
      )}
    </h3>
  );
}

// Selectable entries get a checkbox for the BulkSelect around them
export function TypeColumns<T extends Entry>({
  entries,
  noun,
  render,
  selectable = false,
}: {
  entries: T[];
  noun: string;
  render: (entry: T) => ReactNode;
  selectable?: boolean;
}) {
  const columns = CATEGORY_CONFIG.map(({ title, type }) => ({
    title,
    type,
    entries: entries.filter((entry) => entry.itemtype === type),
  })).filter((column) => column.entries.length > 0);

  return (
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-10">
      {columns.map(({ title, type, entries }) => (
        <section key={type} aria-labelledby={`${type}-heading`}>
          <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
            <h2
              id={`${type}-heading`}
              className="display flex items-center gap-3 text-ink text-[1.875rem] sm:text-[2.5rem]"
            >
              <span
                className={`size-3 shrink-0 ${SWATCH[type]}`}
                aria-hidden="true"
              />
              {title}
            </h2>
            <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
              {formatPlural(entries.length, noun)}
            </p>
          </header>
          <ul>
            {entries.map((entry) => (
              <li key={entry.external_id} className="border-b border-line py-5">
                {selectable ? (
                  <div className="flex gap-3">
                    <SelectBox
                      itemtype={entry.itemtype}
                      externalId={entry.external_id}
                      title={entry.title}
                    />
                    <div className="min-w-0 flex-1">{render(entry)}</div>
                  </div>
                ) : (
                  render(entry)
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
