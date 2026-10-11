"use client";

import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Cover, TYPE_LABEL } from "@/components/ui/cover";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";
import type { ExternalResult } from "@/types/external-api";

export type Match = ExternalResult & { itemtype: ValidItemType };

// What the box says it searches, by type
const SEARCHING: Record<ValidItemType, string> = {
  Book: "books",
  Movie: "films",
  Show: "TV shows",
};

async function fetchMatches(
  itemtype: ValidItemType,
  query: string,
  signal: AbortSignal,
): Promise<Match[]> {
  try {
    const params = new URLSearchParams({ type: itemtype, q: query });
    const res = await fetch(`/api/titles?${params}`, { signal });
    if (!res.ok) return [];
    const results: ExternalResult[] = await res.json();
    return results.map((result) => ({ ...result, itemtype }));
  } catch {
    return [];
  }
}

// How the compact box says what it adds, by type
const ADDING: Record<ValidItemType, string> = {
  Book: "a book",
  Movie: "a film",
  Show: "a show",
};

// Pick a type, then search it: the first match is highlighted, arrows move
// the highlight, Enter or a click adds it, Escape closes. Compact, it's a
// small box beside a page's title, with "/" as its key
export function QueueSearch({
  inputRef,
  onPick,
  compact = false,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: (match: Match) => void;
  compact?: boolean;
}) {
  const listId = useId();
  const [itemType, setItemType] = useState<ValidItemType>("Book");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Keep what's typed and search the new type for it, back in the box
  const changeType = (type: ValidItemType) => {
    setItemType(type);
    setMatches([]);
    inputRef.current?.focus();
  };

  const trimmed = query.trim();
  const searchable = trimmed.length >= 2 && trimmed.length <= 200;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const found = await fetchMatches(itemType, trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setMatches(found);
      setActive(0);
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, searchable, itemType]);

  const shown = open && searchable && matches.length > 0;

  function pick(match: Match) {
    setQuery("");
    setMatches([]);
    setOpen(false);
    onPick(match);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!shown) {
      if (event.key === "ArrowDown" && matches.length > 0) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(matches[active]);
    }
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Type"
        className={`flex gap-4 font-mono text-xs text-ink-soft ${compact ? "mb-2 justify-end" : "mb-3"}`}
      >
        {VALID_ITEM_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={itemType === type}
            onClick={() => changeType(type)}
            className={`cursor-pointer underline-offset-4 ${
              itemType === type
                ? "text-ink underline decoration-ink"
                : "hover:text-ink"
            }`}
          >
            {TYPE_LABEL[type]}
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={
            compact
              ? `Add ${ADDING[itemType]} to Up next…`
              : `Search ${SEARCHING[itemType]}`
          }
          aria-label={`Search ${SEARCHING[itemType]}`}
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={listId}
          aria-activedescendant={shown ? `${listId}-${active}` : undefined}
          className={`block w-full border border-rule bg-panel text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${compact ? "py-2.5 pl-3.5 pr-10 text-sm" : "py-4 pl-5 pr-28 text-[22px]"}`}
        />
        {compact ? (
          <kbd
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border border-line-strong px-1.5 font-mono text-[0.6875rem] leading-5 text-ink-faint"
            aria-hidden="true"
          >
            /
          </kbd>
        ) : (
          <span
            className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-faint"
            aria-hidden="true"
          >
            ↵ to add
          </span>
        )}

        <ul
          id={listId}
          role="listbox"
          aria-label="Matches"
          hidden={!shown}
          // Compact, the matches open wider than the box, to its left
          className={`absolute top-full z-20 max-h-[28rem] overflow-y-auto border border-rule bg-panel ${compact ? "right-0 mt-1 w-[min(32rem,calc(100vw-2rem))]" : "inset-x-0 border-t-0"}`}
        >
          {shown &&
            matches.map((match, i) => (
              <li
                key={`${match.itemtype}|${match.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(match)}
                className={`flex cursor-pointer items-center gap-4 border-t border-line px-5 py-2.5 first:border-t-0 ${
                  i === active ? "bg-panel-2" : ""
                }`}
              >
                <Cover
                  src={match.cover}
                  title={match.title}
                  type={match.itemtype}
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
      </div>
    </div>
  );
}
