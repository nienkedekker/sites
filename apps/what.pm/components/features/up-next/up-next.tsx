"use client";

import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { sourceOf } from "@/components/features/lists/item-source";
import {
  QueueSearch,
  type Match,
} from "@/components/features/up-next/queue-search";
import { ItemTitle } from "@/components/ui/item-row";
import { Cover, TYPE_LABEL } from "@/components/ui/cover";
import { addUpNext, removeWanted } from "@/app/actions/recommendations";
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

type Change =
  { add: QueueItem } | { remove: Pick<QueueItem, "itemtype" | "external_id"> };

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

// Up next as one queue, newest first, with a search box over it that adds
// books, films and shows alike. Adding and removing show straight away and
// undo themselves if the save fails
export function UpNext({ items }: { items: QueueItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, change] = useOptimistic(items, (state, update: Change) =>
    "add" in update
      ? [update.add, ...state]
      : state.filter((item) => keyOf(item) !== keyOf(update.remove)),
  );
  const [, startTransition] = useTransition();
  // Errors and repeats show under the box; what was added or removed is only
  // read out, since the list itself shows it
  const [notice, setNotice] = useState<{
    text: string;
    kind: "error" | "info" | "done";
  }>();
  const queued = new Set(queue.map(keyOf));

  const run = (update: Change, save: () => Promise<Result>, done: string) => {
    setNotice(undefined);
    startTransition(async () => {
      change(update);
      const { error } = await save().catch(() => OFFLINE);
      setNotice(
        error ? { text: error, kind: "error" } : { text: done, kind: "done" },
      );
    });
  };

  const addMatch = (match: Match) => {
    inputRef.current?.focus();
    const item: QueueItem = {
      itemtype: match.itemtype,
      external_id: match.id,
      title: match.title,
      creator: match.creator,
      published_year: match.year,
      cover: match.cover ?? null,
      saving: true,
    };
    if (queued.has(keyOf(item))) {
      setNotice({
        text: `${match.title} is already in your queue.`,
        kind: "info",
      });
      return;
    }
    run(
      { add: item },
      () =>
        addUpNext(
          formOf({
            itemtype: match.itemtype,
            externalId: match.id,
            title: match.title,
            creator: match.creator,
            year: match.year,
          }),
        ),
      `Added ${match.title}.`,
    );
  };

  const remove = (item: QueueItem) =>
    run(
      { remove: item },
      () =>
        removeWanted(
          formOf({ itemtype: item.itemtype, externalId: item.external_id }),
        ),
      `Removed ${item.title}.`,
    );

  return (
    <>
      <div>
        <QueueSearch inputRef={inputRef} onPick={addMatch} />
        <p aria-live="polite" className="mt-2 min-h-5 font-mono text-xs">
          <span
            className={
              notice?.kind === "error"
                ? "text-danger"
                : notice?.kind === "info"
                  ? "text-ink-faint"
                  : "sr-only"
            }
          >
            {notice?.text}
          </span>
        </p>

        {queue.length > 0 && (
          <>
            <ol className="mt-8">
              {queue.map((item, i) => (
                <QueueRow
                  key={keyOf(item)}
                  item={item}
                  number={i + 1}
                  onRemove={() => remove(item)}
                />
              ))}
            </ol>
            {queue.length === 1 && (
              <p className="mt-4 text-sm text-ink-faint">
                Nice. Add a few more.
              </p>
            )}
          </>
        )}
      </div>
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
