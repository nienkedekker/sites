"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface Props {
  // Every genre with its number of books, the most common first
  genres: { genre: string; count: number }[];
  total: number;
  // null for all of them
  current: string | null;
  onPick: (genre: string | null) => void;
}

// The genre to show, as a button that opens every genre with its count.
// It closes on Escape, a click elsewhere, or tabbing out, and the arrow keys
// go up and down it
export function GenreMenu({ genres, total, current, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuId = useId();
  const options = [
    { genre: null, label: "All", count: total },
    ...genres.map(({ genre, count }) => ({ genre, label: genre, count })),
  ];

  const items = () => [
    ...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ];

  useEffect(() => {
    if (!open) return;
    // Start on the genre shown
    listRef.current
      ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      ?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? list.length - 1
          : (at + (event.key === "ArrowDown" ? 1 : -1) + list.length) %
            list.length;
    list[next]?.focus();
  };

  return (
    <div
      ref={wrapRef}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      className="relative flex shrink-0 border-r border-rule"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 whitespace-nowrap text-ink hover:bg-panel-2"
      >
        <span className="uppercase tracking-[0.06em] text-ink-faint">
          Genre
        </span>
        {current ?? "All"}
        <span aria-hidden="true">▾</span>
      </button>
      <ul
        ref={listRef}
        id={menuId}
        role="group"
        aria-label="Genres"
        hidden={!open}
        className="own-grain absolute top-full left-0 z-20 -mt-px max-h-[60vh] min-w-56 overflow-y-auto border border-rule bg-paper py-1"
      >
        {options.map(({ genre, label, count }) => (
          <li key={label}>
            <button
              type="button"
              aria-pressed={genre === current}
              onClick={() => {
                onPick(genre);
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-6 px-3 py-1.5 text-left text-ink hover:bg-panel-2 focus-visible:bg-panel-2 aria-pressed:bg-ink aria-pressed:text-paper"
            >
              {label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
