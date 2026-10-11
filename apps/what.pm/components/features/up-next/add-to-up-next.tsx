"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addUpNext } from "@/app/actions/recommendations";
import {
  QueueSearch,
  type Match,
} from "@/components/features/up-next/queue-search";

// Typing "/" anywhere but in a field goes to the box
const isField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

// The search box beside Discover's title, adding to up next. Saving refreshes
// the page, which shows the queue; the box only says how it went
export function AddToUpNext() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isField(event.target)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const add = (match: Match) => {
    const formData = new FormData();
    formData.set("itemtype", match.itemtype);
    formData.set("externalId", match.id);
    formData.set("title", match.title);
    if (match.creator) formData.set("creator", match.creator);
    if (match.year) formData.set("year", String(match.year));
    setNotice({ text: `Adding ${match.title}…`, error: false });
    startTransition(async () => {
      const { error } = await addUpNext(formData).catch(() => ({
        error: "Couldn’t reach the server. Try again.",
      }));
      setNotice(
        error
          ? { text: error, error: true }
          : { text: `Added ${match.title} to Up next.`, error: false },
      );
    });
  };

  return (
    <div className="w-full sm:w-96">
      <QueueSearch inputRef={inputRef} onPick={add} compact />
      {/* Under the box without pushing the title row around */}
      <div className="relative">
        <p
          aria-live="polite"
          aria-busy={saving}
          className={`absolute inset-x-0 top-1.5 truncate font-mono text-xs ${notice?.error ? "text-danger" : "text-ink-faint"}`}
        >
          {notice?.text}
        </p>
      </div>
    </div>
  );
}
