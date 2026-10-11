"use client";

import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Cover } from "@/components/ui/cover";
import { SearchField } from "@/components/ui/search-field";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";
import type { ExternalResult } from "@/types/external-api";

export type Match = ExternalResult & { itemtype: ValidItemType };

// The types to pick from, named as the columns of the log are
const PICKER = Object.fromEntries(
  CATEGORY_CONFIG.map(({ type, title }) => [type, title]),
) as Record<ValidItemType, string>;

// What the box says it searches, by type
const SEARCHING: Record<ValidItemType, string> = {
  Book: "books",
  Movie: "movies",
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

// Pick a type, then search it: the first match is highlighted, arrows move
// the highlight, Enter or a click adds it, Escape closes
export function QueueSearch({
  inputRef,
  onPick,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: (match: Match) => void;
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
        className="mb-3 flex gap-4 font-mono text-xs text-ink-soft"
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
            {PICKER[type]}
          </button>
        ))}
      </div>
      <SearchField
        ref={inputRef}
        label={`Search ${SEARCHING[itemType]}`}
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onClear={() => {
          setQuery("");
          setMatches([]);
          inputRef.current?.focus();
        }}
        hint="↵ to add"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={`Search ${SEARCHING[itemType]}`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown ? `${listId}-${active}` : undefined}
      >
        <ul
          id={listId}
          role="listbox"
          aria-label="Matches"
          hidden={!shown}
          className="absolute inset-x-0 top-full z-20 max-h-[28rem] overflow-y-auto border border-t-0 border-rule bg-panel"
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
      </SearchField>
    </div>
  );
}
