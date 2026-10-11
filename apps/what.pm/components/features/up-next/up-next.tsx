"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { sourceOf } from "@/components/features/lists/item-source";
import { ItemTitle } from "@/components/ui/item-row";
import { Cover, TYPE_LABEL } from "@/components/ui/cover";
import { removeWanted } from "@/app/actions/recommendations";
import { startUpNextAction } from "@/app/actions/items";
import type { ValidItemType } from "@/types/shared";

export interface QueueItem {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  published_year: number | null;
  cover: string | null;
  reason?: string | null;
  // Added on this page and still being saved
  saving?: boolean;
}

type Result = { error: string | null };

const keyOf = (item: Pick<QueueItem, "itemtype" | "external_id">) =>
  `${item.itemtype}|${item.external_id}`;

const formOf = (fields: Record<string, string | number | null | undefined>) => {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined && value !== "") {
      formData.set(name, String(value));
    }
  }
  return formData;
};

const OFFLINE: Result = { error: "Couldn’t reach the server. Try again." };

// Up next as one queue, newest first. Things are added from the box beside
// Discover's title; removing shows straight away and undoes itself if the
// save fails
export function UpNext({ items }: { items: QueueItem[] }) {
  const [queue, remove] = useOptimistic(
    items,
    (state, gone: Pick<QueueItem, "itemtype" | "external_id">) =>
      state.filter((item) => keyOf(item) !== keyOf(gone)),
  );
  const [, startTransition] = useTransition();
  // Errors show; what was removed is only read out, as the list shows it
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  const removeItem = (item: QueueItem) => {
    setNotice(undefined);
    startTransition(async () => {
      remove(item);
      const { error } = await removeWanted(
        formOf({ itemtype: item.itemtype, externalId: item.external_id }),
      ).catch(() => OFFLINE);
      setNotice(
        error
          ? { text: error, error: true }
          : { text: `Removed ${item.title}.`, error: false },
      );
    });
  };

  if (queue.length === 0 && !notice?.error) {
    return (
      <p aria-live="polite" className="sr-only">
        {notice?.text}
      </p>
    );
  }

  return (
    <>
      <p aria-live="polite" className="font-mono text-xs">
        <span className={notice?.error ? "text-danger" : "sr-only"}>
          {notice?.text}
        </span>
      </p>
      <ol>
        {queue.map((item, i) => (
          <QueueRow
            key={keyOf(item)}
            item={item}
            number={i + 1}
            onRemove={() => removeItem(item)}
          />
        ))}
      </ol>
      {queue.length === 1 && (
        <p className="mt-4 text-sm text-ink-faint">Nice. Add a few more.</p>
      )}
    </>
  );
}

// A row of the queue: cover, title and what it is, and what can be done with
// it on the right
function Row({
  number,
  cover,
  title,
  href,
  meta,
  type,
  note,
  dim = false,
  children,
}: {
  number: number;
  cover: ReactNode;
  title: string;
  href?: string;
  meta: (string | number | null)[];
  type: ValidItemType;
  note?: string | null;
  dim?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-4 border-t border-line py-4 first:border-t-0 transition-opacity sm:gap-6 ${dim ? "opacity-60" : ""}`}
    >
      <span className="w-6 shrink-0 font-mono text-sm text-ink-faint tabular-nums">
        {String(number).padStart(2, "0")}
      </span>
      {cover}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          {/* The queue is the page's main list, so its titles are larger */}
          <ItemTitle title={title} href={href} className="text-[21px]" />
          <p className="mt-1 text-sm text-ink-soft">
            {meta.filter(Boolean).map((part) => `${part} · `)}
            <span className="font-mono text-xs uppercase tracking-[0.06em]">
              {TYPE_LABEL[type]}
            </span>
          </p>
          {note && <p className="mt-2 text-sm text-ink">{note}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-4 font-mono text-xs">
          {children}
        </div>
      </div>
    </li>
  );
}

function QueueRow({
  item,
  number,
  onRemove,
}: {
  item: QueueItem;
  number: number;
  onRemove: () => void;
}) {
  const [starting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const href = sourceOf({ ...item, author: item.creator })?.href;

  // Starting logs it to this year as in progress, which a movie can't be
  const start = () => {
    setError(null);
    startTransition(async () => {
      const { error } = await startUpNextAction(
        formOf({ itemtype: item.itemtype, externalId: item.external_id }),
      ).catch(() => OFFLINE);
      setError(error);
    });
  };

  return (
    <Row
      number={number}
      cover={<Cover src={item.cover} title={item.title} type={item.itemtype} />}
      title={item.title}
      href={item.saving ? undefined : href}
      meta={[item.creator, item.published_year]}
      type={item.itemtype}
      note={item.reason}
      dim={item.saving || starting}
    >
      {error && (
        <span role="alert" className="text-danger">
          {error}
        </span>
      )}
      {item.itemtype !== "Movie" && (
        <button
          type="button"
          onClick={start}
          disabled={item.saving || starting}
          aria-label={`Start ${item.title}`}
          className="cursor-pointer text-ink underline underline-offset-4 disabled:cursor-default"
        >
          {starting ? "Starting…" : "Start"}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={item.saving || starting}
        aria-label={`Remove ${item.title}`}
        className="cursor-pointer text-ink-soft transition-colors hover:text-ink disabled:cursor-default"
      >
        Remove
      </button>
    </Row>
  );
}
