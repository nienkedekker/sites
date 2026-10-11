"use client";

import { Cover } from "@/components/ui/cover";
import { cn } from "@/utils/ui";
import type { ExternalResult } from "@/types/external-api";
import type { ValidItemType } from "@/types/shared";

type Match = ExternalResult & { itemtype?: ValidItemType };

// The listbox under a combobox: the input keeps focus and points at the
// active row with aria-activedescendant, so rows are `${id}-${index}`
export function MatchList<T extends Match>({
  id,
  label,
  matches,
  type,
  active,
  onActive,
  onPick,
  hidden,
  className,
}: {
  id: string;
  label: string;
  matches: T[];
  type?: ValidItemType;
  active: number;
  onActive: (index: number) => void;
  onPick: (match: T) => void;
  hidden?: boolean;
  className?: string;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label={label}
      hidden={hidden}
      className={cn(
        "popover absolute top-full z-20 max-h-80 overflow-y-auto border-t-0",
        className,
      )}
    >
      {!hidden &&
        matches.map((match, i) => (
          <li
            key={`${match.itemtype ?? type}|${match.id}`}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActive(i)}
            onClick={() => onPick(match)}
            className="option justify-start gap-4 border-t border-line first:border-t-0"
          >
            <Cover
              src={match.cover}
              title={match.title}
              type={match.itemtype ?? type ?? "Book"}
              size="small"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">
                {match.title}
              </span>
              {(match.creator || match.year) && (
                <span className="mt-0.5 block truncate text-sm text-ink-soft">
                  {[match.creator, match.year].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </li>
        ))}
    </ul>
  );
}
