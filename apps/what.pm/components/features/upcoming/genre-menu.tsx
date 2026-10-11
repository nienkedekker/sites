"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface Props {
  genres: { genre: string; count: number }[];
  total: number;
  current: string | null;
  onPick: (genre: string | null) => void;
}

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
        className="flex cursor-pointer items-center gap-2 py-2.5 pr-4 whitespace-nowrap text-ink transition-colors hover:text-ink-soft"
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
        className="popover absolute top-full left-0 z-20 -mt-px max-h-[60vh] min-w-56 overflow-y-auto py-1"
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
              className="option"
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
