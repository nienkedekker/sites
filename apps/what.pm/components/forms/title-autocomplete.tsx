"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import type { ValidItemType } from "@/types/shared";
import type { ExternalResult } from "@/types/external-api";

const SOURCE = { Book: "OpenLibrary", Movie: "TMDB", Show: "TMDB" } as const;

async function fetchTitles(
  type: ValidItemType,
  query: string,
  signal: AbortSignal,
): Promise<ExternalResult[] | null> {
  try {
    const params = new URLSearchParams({ type, q: query });
    const res = await fetch(`/api/titles?${params}`, { signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

interface TitleAutocompleteProps extends Omit<
  ComponentProps<"input">,
  "value" | "onSelect"
> {
  itemType: ValidItemType;
  value: string;
  onSelect: (result: ExternalResult) => void;
}

export function TitleAutocomplete({
  itemType,
  value,
  onChange,
  onBlur,
  onSelect,
  ...props
}: TitleAutocompleteProps) {
  const listId = useId();
  const focused = useRef(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [failed, setFailed] = useState(false);

  const trimmed = query.trim();
  const searchable = trimmed.length >= 2 && trimmed.length <= 200;

  useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const found = await fetchTitles(itemType, trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setFailed(found === null);
      setResults(found ?? []);
      setActive(-1);
      if (focused.current) setOpen(true);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, searchable, itemType]);

  const showList = open && searchable && results.length > 0;

  function choose(result: ExternalResult) {
    setOpen(false);
    setResults([]);
    setQuery("");
    onSelect(result);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    onChange?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    focused.current = false;
    setOpen(false);
    onBlur?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => {
          focused.current = true;
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && active >= 0 ? `${listId}-${active}` : undefined
        }
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Matches from ${SOURCE[itemType]}`}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto border border-rule bg-panel"
        >
          {results.map((result, i) => (
            <li
              key={result.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(result)}
              className={`cursor-pointer border-b border-line px-3 py-2 last:border-b-0 ${
                i === active ? "bg-panel-2" : ""
              }`}
            >
              <span className="block wrap-break-word text-sm font-medium text-ink">
                {result.title}
              </span>
              {(result.year || result.creator) && (
                <span className="mt-0.5 block truncate font-mono text-xs text-ink-soft">
                  {[result.year, result.creator].filter(Boolean).join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {searchable && failed && (
        <p className="mt-1.5 font-mono text-xs text-ink-faint">
          Couldn’t reach {SOURCE[itemType]}, so fill this one in yourself.
        </p>
      )}
    </div>
  );
}
