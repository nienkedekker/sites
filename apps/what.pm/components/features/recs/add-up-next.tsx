"use client";

import { useId, useState, useTransition } from "react";
import { TitleAutocomplete } from "@/components/forms/title-autocomplete";
import { addUpNext } from "@/app/actions/recommendations";
import type { ExternalResult } from "@/types/external-api";
import type { ValidItemType } from "@/types/shared";

const TYPES: { type: ValidItemType; label: string }[] = [
  { type: "Book", label: "Book" },
  { type: "Movie", label: "Movie" },
  { type: "Show", label: "TV show" },
];

export function AddUpNext() {
  const inputId = useId();
  const [itemType, setItemType] = useState<ValidItemType>("Book");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<ExternalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changeType = (type: ValidItemType) => {
    setItemType(type);
    setTitle("");
    setPicked(null);
    setError(null);
  };

  const add = () => {
    if (!picked) return;
    const formData = new FormData();
    formData.set("itemtype", itemType);
    formData.set("externalId", picked.id);
    formData.set("title", picked.title);
    if (picked.creator) formData.set("creator", picked.creator);
    if (picked.year) formData.set("year", String(picked.year));
    setError(null);
    startTransition(async () => {
      const result = await addUpNext(formData).catch(() => ({
        error: "Couldn’t reach the server. Try again.",
      }));
      setError(result.error);
      if (!result.error) {
        setTitle("");
        setPicked(null);
      }
    });
  };

  return (
    <section aria-labelledby={`${inputId}-heading`} className="mb-16 max-w-xl">
      <h2 id={`${inputId}-heading`} className="card-title">
        Add to up next
      </h2>
      <div
        role="radiogroup"
        aria-label="Type"
        className="mt-3 flex gap-4 font-mono text-xs text-ink-soft"
      >
        {TYPES.map(({ type, label }) => (
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
            {label}
          </button>
        ))}
      </div>
      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Title
        </label>
        <TitleAutocomplete
          key={itemType}
          id={inputId}
          itemType={itemType}
          value={title}
          placeholder="Search for a title"
          onChange={(event) => {
            setTitle(event.target.value);
            setPicked(null);
          }}
          onSelect={(result) => {
            setTitle(result.title);
            setPicked(result);
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-soft">
          {picked && (
            <span>
              {[picked.creator, picked.year].filter(Boolean).join(" · ")}
            </span>
          )}
          <button
            type="submit"
            disabled={!picked || pending}
            aria-busy={pending}
            className="link cursor-pointer text-ink disabled:cursor-default disabled:text-ink-faint disabled:no-underline"
          >
            {pending ? "adding…" : "add"}
          </button>
          {!picked && title.trim().length > 1 && (
            <span>pick a match from the list</span>
          )}
          {error && (
            <span role="alert" className="text-danger">
              {error}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
