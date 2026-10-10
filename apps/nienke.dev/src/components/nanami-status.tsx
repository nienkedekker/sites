import { Fragment, useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import { externalProps } from "@nienke/ui/external";
import { StatList, StatRow } from "@nienke/ui/stat-list";
import Tag from "@nienke/ui/tag";
import {
  isStale,
  type Check,
  type Part,
  type Status,
  type StoredReport,
} from "../lib/nanami-report";
import NanamiDiagram from "./nanami-diagram";

// The Mac itself, shown apart from the flow; the flow comes with the report
const machine: Part[] = [
  { id: "power", name: "Power", role: "", check: "power" },
  { id: "disk", name: "Disk", role: "", check: "disk" },
  { id: "agents", name: "Launch agents", role: "", check: "agents" },
];

const LIGHT: Record<Status | "unknown", { swatch: string; label: string }> = {
  ok: { swatch: "bg-ok", label: "Running" },
  warn: { swatch: "bg-warn", label: "Needs a look" },
  down: { swatch: "bg-down", label: "Down" },
  unknown: { swatch: "border border-line-strong", label: "No report" },
};

// Home is in Amsterdam, and a fixed zone keeps the server and browser render the same
const clock = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function ago(ms: number) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours} h ${minutes % 60} min ago` : `${Math.floor(hours / 24)} days ago`;
}

function Light({ status }: { status: Status | "unknown" }) {
  const { swatch, label } = LIGHT[status];
  return (
    <span className={`mt-1.5 size-2.5 shrink-0 ${swatch}`} title={label}>
      <span className="sr-only">{label}: </span>
    </span>
  );
}

function PartRow({ part, check }: { part: Part; check?: Check }) {
  const status = part.check ? (check?.status ?? "unknown") : null;
  return (
    <li className="flex gap-2.5 border-t border-line py-2.5 first:border-t-0">
      {status ? <Light status={status} /> : <span className="size-2.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {part.href ? (
            <a href={part.href} {...externalProps(part.href)} className="link">
              {part.name}
            </a>
          ) : (
            part.name
          )}
        </p>
        <p className="font-mono text-xs text-ink-faint">{part.role}</p>
        {check && (
          <p className="mt-1 text-xs text-ink-soft [overflow-wrap:anywhere]">
            {check.detail}
            {check.status !== "ok" && check.since && `, since ${clock(check.since)}`}
          </p>
        )}
      </div>
    </li>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-1 font-mono text-sm text-ink-faint" aria-hidden="true">
      ↓
    </div>
  );
}

interface Props {
  initial: StoredReport | null;
  renderedAt: number;
}

export default function NanamiStatus({ initial, renderedAt }: Props) {
  const [report, setReport] = useState(initial);
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/nanami", { signal: AbortSignal.timeout(8000) });
        // Signed out somewhere else, or the session ran out
        if (res.status === 401) return location.reload();
        if (res.ok) setReport(await res.json());
      } catch {
        // Keep showing the last report; its age says how old it is
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

  const stale = isStale(report, now);
  // An old report says what was true then, not now, so its lights go grey
  const checks = (!stale && report?.checks) || {};
  // The layout still holds when the report is old, only its lights go grey
  const topology = report?.topology;
  const results = Object.values(checks);
  const problems = results.filter(({ status }) => status !== "ok").length;
  const headline = !report
    ? "nanami hasn't reported yet"
    : stale
      ? `nanami has been quiet since ${clock(new Date(report.receivedAt).toISOString())}`
      : problems === 0
        ? `All ${results.length} checks pass`
        : `${problems} of ${results.length} checks need a look`;

  return (
    <div className="space-y-6">
      <section className="framed flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Light status={!report || stale ? "down" : problems ? "warn" : "ok"} />
          <h2 className="card-title text-lg">{headline}</h2>
        </div>
        {report && (
          <p className="font-mono text-xs text-ink-soft tabular-nums">
            Last heard {ago(now - report.receivedAt)}
          </p>
        )}
      </section>

      {/* The diagram on wide screens, the stages on narrow ones where it would be too small to read */}
      {topology && (
        <section aria-label="Topology" className="card hidden p-4 lg:block">
          <NanamiDiagram checks={checks} topology={topology} />
        </section>
      )}

      <section aria-label="How it fits together" className="flex flex-col lg:hidden">
        {(topology?.stages ?? []).map((stage, i) => (
          <Fragment key={stage.title}>
            {i > 0 && <Arrow />}
            <div className="card px-4 pt-4 pb-1.5 md:grid md:grid-cols-[8rem_1fr] md:gap-6 md:pb-4">
              <CardHead as="h3" tag={<Tag>{String(i + 1).padStart(2, "0")}</Tag>}>
                {stage.title}
              </CardHead>
              {/* Side by side the parts need no rules between them */}
              <ul className="mt-2 grid gap-x-6 sm:grid-cols-2 sm:[&>li]:border-t-0 md:mt-0 lg:grid-cols-4">
                {stage.parts.map((part) => (
                  <PartRow
                    key={part.name}
                    part={part}
                    check={part.check ? checks[part.check] : undefined}
                  />
                ))}
              </ul>
            </div>
          </Fragment>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <CardHead as="h3">The Mac</CardHead>
          <ul className="mt-2">
            {machine.map((part) => (
              <PartRow
                key={part.name}
                part={part}
                check={part.check ? checks[part.check] : undefined}
              />
            ))}
          </ul>
        </section>
        {report && report.facts.length > 0 && (
          <section className="card p-5 sm:p-6">
            <CardHead as="h3" note={stale ? "from the last report" : undefined}>
              Facts
            </CardHead>
            <StatList className="mt-3 text-sm">
              {report.facts.map(({ label, value }) => (
                <StatRow key={label} label={label}>
                  {value}
                </StatRow>
              ))}
            </StatList>
          </section>
        )}
      </div>

      <p className="font-mono text-xs text-ink-faint">
        Links to the apps only open from my own devices.
      </p>
    </div>
  );
}
