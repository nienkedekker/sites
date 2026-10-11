"use client";

import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { MatchList } from "@/components/ui/match-list";
import { SearchField } from "@/components/ui/search-field";
import { TYPE_NAMES } from "@/utils/constants/app";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";
import type { ExternalResult } from "@/types/external-api";

export type Match = ExternalResult & { itemtype: ValidItemType };

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
        className="mb-3 flex flex-wrap gap-2"
      >
        {VALID_ITEM_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={itemType === type}
            onClick={() => changeType(type)}
            className="tag"
          >
            {TYPE_NAMES[type].many}
          </button>
        ))}
      </div>
      <SearchField
        ref={inputRef}
        label={`Search ${TYPE_NAMES[itemType].inText}`}
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
        placeholder={`Search ${TYPE_NAMES[itemType].inText}`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown ? `${listId}-${active}` : undefined}
      >
        <MatchList
          id={listId}
          label="Matches"
          matches={matches}
          hidden={!shown}
          active={active}
          onActive={setActive}
          onPick={pick}
          className="-inset-x-px top-[calc(100%+1px)] [&>li]:px-5"
        />
      </SearchField>
    </div>
  );
}
