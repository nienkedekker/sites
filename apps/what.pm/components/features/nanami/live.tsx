"use client";

import { useEffect, useState } from "react";
import { isStale, type Status, type StoredReport } from "@/utils/data/nanami";

export type Lit = Status | "unknown";

const LIGHT: Record<Lit, { swatch: string; label: string }> = {
  ok: { swatch: "bg-ok", label: "Running" },
  warn: { swatch: "bg-warn", label: "Needs a look" },
  down: { swatch: "bg-down", label: "Down" },
  unknown: { swatch: "border border-line-strong", label: "No report" },
};

// Home is in Amsterdam, and a fixed zone keeps the server and browser render the same
export const clock = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ago(ms: number) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 48
    ? `${hours} h ${minutes % 60} min ago`
    : `${Math.floor(hours / 24)} days ago`;
}

export function Light({ status, label }: { status: Lit; label?: string }) {
  const { swatch, label: fallback } = LIGHT[status];
  return (
    <span
      className={`mt-1.5 size-2.5 shrink-0 ${swatch}`}
      title={label ?? fallback}
    >
      <span className="sr-only">{label ?? fallback}: </span>
    </span>
  );
}

// The latest report, fetched every minute while the page is in view. nanami
// pushes once a minute, so polling faster would only fetch the same report
export function useReport(initial: StoredReport | null, renderedAt: number) {
  const [report, setReport] = useState(initial);
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/nanami", {
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401) return location.reload();
        if (res.ok) setReport(await res.json());
      } catch {
      }
      setNow(Date.now());
    };

    let poll: ReturnType<typeof setInterval> | undefined;
    const tick = setInterval(() => setNow(Date.now()), 15000);
    const sync = () => {
      clearInterval(poll);
      if (document.hidden) return;
      fetchReport();
      poll = setInterval(fetchReport, 60000);
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return { report, now, stale: isStale(report, now) };
}

interface HeadlineProps {
  report: StoredReport | null;
  stale: boolean;
  now: number;
  status: Lit;
  children: string;
}

export function Headline({
  report,
  stale,
  now,
  status,
  children,
}: HeadlineProps) {
  const text = !report
    ? "nanami hasn't reported yet"
    : stale
      ? `nanami has been quiet since ${clock(new Date(report.receivedAt).toISOString())}`
      : children;
  return (
    <section className="framed flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-panel p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Light status={!report || stale ? "down" : status} />
        <h2 className="card-title text-lg">{text}</h2>
      </div>
      {report && (
        <p className="font-mono text-xs text-ink-soft tabular-nums">
          Last heard {ago(now - report.receivedAt)}
        </p>
      )}
    </section>
  );
}
