import { expect, test } from "vitest";
import {
  isStale,
  parseReport,
  STALE_AFTER_MS,
  summarize,
  type Download,
} from "@/utils/data/nanami";

const report = {
  sentAt: "2026-10-10T15:00:00Z",
  checks: {
    player: { status: "ok", detail: "Healthy", since: "2026-10-10T08:00:00Z" },
    power: { status: "warn", detail: "On battery, 35%" },
  },
  facts: [{ label: "Uptime", value: "3 days" }],
};

test("parseReport keeps a well-formed report as is", () => {
  expect(parseReport(report)).toEqual(report);
});

test("parseReport refuses anything outside the expected shape", () => {
  const broken = [
    null,
    "report",
    { ...report, sentAt: "yesterday" },
    { ...report, facts: "none" },
    { ...report, checks: { Player: report.checks.player } },
    { ...report, checks: { player: { status: "fine", detail: "" } } },
    {
      ...report,
      checks: { player: { status: "ok", detail: "x".repeat(201) } },
    },
    {
      ...report,
      checks: { player: { status: "ok", detail: "", since: "soon" } },
    },
    { ...report, facts: [{ label: "Uptime" }] },
  ];
  for (const body of broken) expect(parseReport(body)).toBeNull();
});

test("a report goes stale after three missed pushes", () => {
  const receivedAt = Date.UTC(2026, 9, 10, 15);
  const stored = { ...parseReport(report)!, receivedAt };
  expect(isStale(stored, receivedAt + STALE_AFTER_MS)).toBe(false);
  expect(isStale(stored, receivedAt + STALE_AFTER_MS + 1)).toBe(true);
  expect(isStale(null, receivedAt)).toBe(true);
});

const topology = {
  columns: ["A", "B", "C", "D", "E", "F"],
  subheadings: [{ column: 5, row: 3, text: "Screens" }],
  stages: [
    {
      title: "Serves",
      parts: [
        {
          id: "app",
          name: "App",
          role: "Serves",
          check: "app",
          href: "https://app.example",
          at: [4, 2],
        },
        { id: "tv", name: "TV", role: "Watches", at: [5, 3] },
      ],
    },
  ],
  links: [
    {
      from: "app",
      to: "tv",
      label: "Wi-Fi",
      twoWay: true,
      bend: 0.12,
      labelAt: "end",
    },
  ],
};

test("parseReport keeps a well-formed topology", () => {
  expect(parseReport({ ...report, topology })?.topology).toEqual(topology);
});

test("parseReport drops fields the diagram doesn't know", () => {
  const extra = structuredClone(topology) as typeof topology &
    Record<string, unknown>;
  (extra.stages[0].parts[0] as Record<string, unknown>).onclick = "alert(1)";
  (extra.links[0] as Record<string, unknown>).style = "x";
  const parsed = parseReport({ ...report, topology: extra })?.topology;
  expect(parsed?.stages[0].parts[0]).not.toHaveProperty("onclick");
  expect(parsed?.links[0]).not.toHaveProperty("style");
});

test("parseReport refuses a topology that doesn't fit", () => {
  const broken = (change: (t: typeof topology) => void) => {
    const copy = structuredClone(topology);
    change(copy);
    return copy;
  };
  for (const bad of [
    broken((t) => (t.stages[0].parts[0].href = "javascript:alert(1)")),
    broken((t) => (t.stages[0].parts[0].at = [6, 0])),
    broken((t) => (t.stages[0].parts[0].id = "Not An Id")),
    broken((t) => (t.links[0].bend = 2)),
    broken((t) => t.columns.pop()),
    broken((t) => (t.subheadings[0].row = 9)),
  ]) {
    expect(parseReport({ ...report, topology: bad })).toBeNull();
  }
});

const downloads = {
  items: [
    {
      title: "Pillion",
      kind: "movie",
      state: "downloading",
      progress: 64.2,
      detail: "5.1 GB of 7.9 GB, 4 min left",
    },
    { title: "Hex", kind: "book", state: "queued", detail: "1 MB" },
    {
      title: "The Everlasting",
      kind: "book",
      state: "waiting",
      detail: "Not found yet, looks again daily",
    },
  ],
  finished: [{ title: "Mind Game", kind: "movie", at: "2026-10-10T15:22:20Z" }],
};

test("parseReport keeps well-formed downloads", () => {
  expect(parseReport({ ...report, downloads })?.downloads).toEqual(downloads);
});

test("parseReport refuses downloads that don't fit", () => {
  const broken = (change: (d: typeof downloads) => void) => {
    const copy = structuredClone(downloads);
    change(copy);
    return copy;
  };
  for (const bad of [
    broken((d) => (d.items[0].kind = "song")),
    broken((d) => (d.items[0].state = "stuck")),
    broken((d) => (d.items[0].progress = 101)),
    broken((d) => (d.items[0].title = "x".repeat(121))),
    broken((d) => (d.finished[0].at = "lately")),
    { items: downloads.items },
  ]) {
    expect(parseReport({ ...report, downloads: bad })).toBeNull();
  }
});

test("summarize counts what's in progress and leaves out what's waiting", () => {
  const items = parseReport({ ...report, downloads })!.downloads!.items;
  expect(summarize(items)).toBe("1 downloading, 1 queued");
  const waiting = items.filter(({ state }) => state === "waiting");
  expect(summarize(waiting)).toBe("Nothing downloading");
  const failed: Download[] = [{ ...items[0], state: "failed" }];
  expect(summarize(failed)).toBe("1 failed");
});
