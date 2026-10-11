"use client";

import type { ReactNode } from "react";
import {
  Fragment,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { externalProps } from "@nienke/ui/external";
import { formatCount, formatDate, formatPlural } from "@nienke/ui/format";
import { sourceOf } from "@/components/features/lists/item-source";
import { byline } from "@/components/features/recs/entries";
import { Cover } from "@/components/ui/cover";
import {
  dismissRecommendation,
  removeWanted,
  wantRecommendation,
} from "@/app/actions/recommendations";
import type { ValidItemType } from "@/types/shared";

export interface ForYouPick {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  published_year: number | null;
  reason: string;
  because: string[];
  cover: string | null;
  upNext: boolean;
}

const COLUMNS: { type: ValidItemType; title: string; hint: string }[] = [
  { type: "Book", title: "Books", hint: "novels, non-fiction, comics" },
  { type: "Movie", title: "Films", hint: "features and docs" },
  { type: "Show", title: "TV", hint: "series and limited runs" },
];

const keyOf = (pick: ForYouPick) => `${pick.itemtype}|${pick.external_id}`;

const fields = (pick: ForYouPick, extra: Record<string, string> = {}) => {
  const data = new FormData();
  data.set("itemtype", pick.itemtype);
  data.set("externalId", pick.external_id);
  for (const [name, value] of Object.entries(extra)) data.set(name, value);
  return data;
};

// The minute, read on the client only: the server can't know how long ago
// the picks were when the page is read
const minuteNow = () => Math.floor(Date.now() / 60_000);
const noChange = () => () => {};

function ago(at: string, minute: number) {
  const minutes = minute - Math.floor(new Date(at).getTime() / 60_000);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (minutes < 1) return "just now";
  if (minutes < 60) return format.format(-minutes, "minute");
  if (minutes < 60 * 24)
    return format.format(-Math.floor(minutes / 60), "hour");
  return format.format(-Math.floor(minutes / (60 * 24)), "day");
}

function PickedAt({ at }: { at: string }) {
  const minute = useSyncExternalStore(noChange, minuteNow, () => null);
  return (
    <>
      picked{" "}
      {minute === null
        ? formatDate(new Date(at), {
            day: "numeric",
            month: "short",
            timeZone: "Europe/Amsterdam",
          })
        : ago(at, minute)}
    </>
  );
}

const primary =
  "shrink-0 cursor-pointer bg-ink px-4 py-2 font-mono text-xs text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink";
const bordered =
  "shrink-0 cursor-pointer border border-rule px-4 py-2 font-mono text-xs text-ink transition-colors hover:bg-panel-2";

// Where there's nothing yet, or while Claude is at it: rows to come, fading
// down the column, pulsing while loading
function GhostRows({ loading }: { loading: boolean }) {
  return (
    <ul aria-hidden="true">
      {[1, 0.7, 0.45, 0.2].map((opacity) => (
        <li
          key={opacity}
          style={{ opacity }}
          className="flex gap-4 border-b border-line py-5"
        >
          <div
            className={`h-24 w-16 shrink-0 border border-dashed border-line-strong ${loading ? "motion-safe:animate-pulse" : ""}`}
          />
          <div
            className={`flex-1 space-y-2.5 pt-1 ${loading ? "motion-safe:animate-pulse" : ""}`}
          >
            <div className="h-3 w-4/5 bg-line" />
            <div className="h-2.5 w-1/2 bg-line" />
            <div className="h-2.5 w-2/3 bg-line" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Because({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null;
  const shown = titles.slice(0, 2);
  return (
    <p className="mt-2 text-sm text-ink">
      Because you loved{" "}
      {shown.map((title, i) => (
        <Fragment key={title}>
          {i > 0 && " and "}
          <em>{title}</em>
        </Fragment>
      ))}
    </p>
  );
}

function PickRow({
  pick,
  onUpNext,
  onNotForMe,
  busy,
  error,
}: {
  pick: ForYouPick;
  onUpNext: () => void;
  onNotForMe: () => void;
  busy: boolean;
  error: string | null;
}) {
  const href = sourceOf({ ...pick, author: pick.creator })?.href;
  const meta = byline(pick);
  return (
    <li className="flex gap-4 border-b border-line py-5">
      <Cover
        src={pick.cover}
        title={pick.title}
        type={pick.itemtype}
        sizes="64px"
        className="h-24 w-16 self-start"
      />
      <div className="min-w-0 flex-1">
        <h3 className="wrap-break-word text-[17px] font-medium leading-snug tracking-[-0.01em] text-ink">
          {href ? (
            <a
              href={href}
              className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
              {...externalProps(href)}
            >
              {pick.title}
            </a>
          ) : (
            pick.title
          )}
        </h3>
        {meta && <p className="mt-1 text-sm text-ink-soft">{meta}</p>}
        <Because titles={pick.because} />
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{pick.reason}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs">
          <button
            type="button"
            onClick={onUpNext}
            disabled={busy}
            aria-pressed={pick.upNext}
            aria-label={`Put ${pick.title} on Up next`}
            className="cursor-pointer border border-rule px-2.5 py-1 text-ink transition-colors hover:bg-panel-2 disabled:cursor-wait aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {pick.upNext ? "✓ In Up next" : "+ Up next"}
          </button>
          <button
            type="button"
            onClick={onNotForMe}
            disabled={busy}
            aria-label={`Not for me: ${pick.title}`}
            className="link cursor-pointer text-ink-soft hover:text-ink disabled:cursor-wait"
          >
            Not for me
          </button>
          {error && (
            <span role="alert" className="text-danger">
              {error}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

// Books, films and TV side by side, with rows to come before there are picks
export function PickColumns({
  picks,
  loading = false,
  hints = false,
  row,
}: {
  picks: ForYouPick[] | null;
  loading?: boolean;
  hints?: boolean;
  row?: (pick: ForYouPick) => ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-10">
      {COLUMNS.map(({ type, title, hint }) => {
        const shown = picks?.filter((pick) => pick.itemtype === type) ?? null;
        return (
          <section key={type} aria-labelledby={`picks-${type}`}>
            <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
              <h2
                id={`picks-${type}`}
                className="display text-[2.25rem] text-ink"
              >
                {title}
              </h2>
              <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
                {shown && !loading ? shown.length : "—"}
              </p>
            </header>
            {hints && (
              <p className="mt-2 font-mono text-[0.6875rem] text-ink-faint">
                {hint}
              </p>
            )}
            {shown && !loading && row ? (
              shown.length > 0 ? (
                <ul>{shown.map(row)}</ul>
              ) : (
                <p className="py-5 text-sm text-ink-soft">
                  Nothing left here. Pick again for more.
                </p>
              )
            ) : (
              <GhostRows loading={loading} />
            )}
          </section>
        );
      })}
    </div>
  );
}

function StatusBand({
  title,
  detail,
  action,
  busy = false,
}: {
  title: string;
  detail: ReactNode;
  action: ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      aria-busy={busy}
      className="mb-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-y border-rule py-4"
    >
      <div aria-live="polite" className="min-w-0">
        <p className="text-ink">{title}</p>
        <p className="mt-1 font-mono text-xs text-ink-soft">{detail}</p>
      </div>
      {action}
    </div>
  );
}

// The page while it loads, before anything's known
export function ForYouSkeleton() {
  return (
    <>
      <StatusBand title="Loading your picks…" detail="—" action={null} busy />
      <PickColumns picks={null} loading />
    </>
  );
}

export function ForYou({
  picks,
  logCount,
  batchAt,
}: {
  picks: ForYouPick[];
  // How many titles are in the log, all of which Claude reads
  logCount: number;
  // When the picks shown were made, if ever
  batchAt: string | null;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  // Changes made here, shown before the page has caught up with them
  const [hidden, setHidden] = useState(() => new Set<string>());
  const [upNext, setUpNext] = useState(() => new Map<string, boolean>());
  const [busy, setBusy] = useState(() => new Set<string>());
  const [rowError, setRowError] = useState<{ key: string; error: string }>();

  const shown = picks
    .filter((pick) => !hidden.has(keyOf(pick)))
    .map((pick) => ({
      ...pick,
      upNext: upNext.get(keyOf(pick)) ?? pick.upNext,
    }));
  const loading = running || refreshing;

  const run = async () => {
    // One run at a time, however often the button's pressed
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/picks", {
        method: "POST",
        signal: current.signal,
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string | null;
      };
      if (!response.ok || body.error) {
        setError(body.error ?? "The server didn’t answer. Try again.");
        return;
      }
      setHidden(new Set());
      setUpNext(new Map());
      // Still loading until the new picks are on the page
      startRefresh(() => router.refresh());
    } catch {
      if (!current.signal.aborted) {
        setError(
          "Couldn’t reach the server. Check your connection and try again.",
        );
      }
    } finally {
      controller.current = null;
      setRunning(false);
    }
  };

  const cancel = () => controller.current?.abort();

  const mark = (key: string, on: boolean) =>
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const toggleUpNext = async (pick: ForYouPick) => {
    const key = keyOf(pick);
    if (busy.has(key)) return;
    const want = !pick.upNext;
    // Shown before the action starts, as Next holds back updates made
    // alongside a server action until it's done
    flushSync(() => {
      mark(key, true);
      setRowError(undefined);
      setUpNext((current) => new Map(current).set(key, want));
    });
    try {
      const result = await (want ? wantRecommendation : removeWanted)(
        fields(pick),
      );
      if (result.error) throw new Error(result.error);
    } catch (err) {
      setUpNext((current) => new Map(current).set(key, !want));
      setRowError({
        key,
        error: err instanceof Error ? err.message : "That didn’t work.",
      });
    } finally {
      mark(key, false);
    }
  };

  const notForMe = async (pick: ForYouPick) => {
    const key = keyOf(pick);
    if (busy.has(key)) return;
    flushSync(() => {
      mark(key, true);
      setRowError(undefined);
      setHidden((current) => new Set(current).add(key));
    });
    try {
      const result = await dismissRecommendation(
        fields(pick, { title: pick.title, kind: "not_for_me" }),
      );
      if (result.error) throw new Error(result.error);
    } catch (err) {
      setHidden((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      setRowError({
        key,
        error: err instanceof Error ? err.message : "That didn’t work.",
      });
    } finally {
      mark(key, false);
    }
  };

  const titles = formatPlural(logCount, "logged title");
  let band: ReactNode;
  if (logCount === 0) {
    band = (
      <StatusBand
        title="Nothing to pick from yet."
        detail={
          <>
            Picks need a few logged titles first.{" "}
            <Link href="/create" className="link text-ink">
              Log something
            </Link>
          </>
        }
        action={
          <button type="button" disabled className={primary}>
            Pick the first ones →
          </button>
        }
      />
    );
  } else if (loading) {
    band = (
      <StatusBand
        title="Reading your log…"
        detail={`${formatCount(logCount)} titles · usually takes about two minutes`}
        busy
        action={
          <button
            type="button"
            onClick={cancel}
            disabled={refreshing}
            className={bordered}
          >
            Cancel
          </button>
        }
      />
    );
  } else if (error) {
    band = (
      <StatusBand
        title="Couldn’t pick right now."
        detail={error}
        action={
          <button type="button" onClick={run} className={primary}>
            Try again
          </button>
        }
      />
    );
  } else if (batchAt) {
    band = (
      <StatusBand
        title={
          shown.length > 0
            ? `${formatPlural(shown.length, "pick")} from your log`
            : "Nothing left from the last picks."
        }
        detail={
          <>
            <PickedAt at={batchAt} /> · based on {titles}
          </>
        }
        action={
          <button type="button" onClick={run} className={bordered}>
            ↻ Pick again
          </button>
        }
      />
    );
  } else {
    band = (
      <StatusBand
        title="Nothing picked yet."
        detail={`Claude reads your ${titles} and suggests what to try next.`}
        action={
          <button type="button" onClick={run} className={primary}>
            Pick the first ones →
          </button>
        }
      />
    );
  }

  return (
    <>
      {band}
      <PickColumns
        picks={batchAt ? shown : null}
        loading={loading}
        hints={!batchAt && !loading}
        row={(pick) => (
          <PickRow
            key={keyOf(pick)}
            pick={pick}
            onUpNext={() => toggleUpNext(pick)}
            onNotForMe={() => notForMe(pick)}
            busy={busy.has(keyOf(pick))}
            error={rowError?.key === keyOf(pick) ? rowError.error : null}
          />
        )}
      />
    </>
  );
}
