import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale, parseReport, STALE_AFTER_MS } from "../src/lib/nanami-report.ts";

const report = {
  sentAt: "2026-10-10T15:00:00Z",
  checks: {
    player: { status: "ok", detail: "Healthy", since: "2026-10-10T08:00:00Z" },
    power: { status: "warn", detail: "On battery, 35%" },
  },
  facts: [{ label: "Uptime", value: "3 days" }],
};

test("parseReport keeps a well-formed report as is", () => {
  assert.deepEqual(parseReport(report), report);
});

test("parseReport refuses anything outside the expected shape", () => {
  const broken = [
    null,
    "report",
    { ...report, sentAt: "yesterday" },
    { ...report, facts: "none" },
    { ...report, checks: { Player: report.checks.player } },
    { ...report, checks: { player: { status: "fine", detail: "" } } },
    { ...report, checks: { player: { status: "ok", detail: "x".repeat(201) } } },
    { ...report, checks: { player: { status: "ok", detail: "", since: "soon" } } },
    { ...report, facts: [{ label: "Uptime" }] },
  ];
  for (const body of broken) assert.equal(parseReport(body), null);
});

test("a report goes stale after three missed pushes", () => {
  const receivedAt = Date.UTC(2026, 9, 10, 15);
  const stored = { ...parseReport(report)!, receivedAt };
  assert.ok(!isStale(stored, receivedAt + STALE_AFTER_MS));
  assert.ok(isStale(stored, receivedAt + STALE_AFTER_MS + 1));
  assert.ok(isStale(null, receivedAt));
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
  links: [{ from: "app", to: "tv", label: "Wi-Fi", twoWay: true, bend: 0.12, labelAt: "end" }],
};

test("parseReport keeps a well-formed topology", () => {
  assert.deepEqual(parseReport({ ...report, topology })?.topology, topology);
});

test("parseReport drops fields the diagram doesn't know", () => {
  const extra = structuredClone(topology) as typeof topology & Record<string, unknown>;
  (extra.stages[0].parts[0] as Record<string, unknown>).onclick = "alert(1)";
  (extra.links[0] as Record<string, unknown>).style = "x";
  const parsed = parseReport({ ...report, topology: extra })?.topology;
  assert.ok(parsed && !("onclick" in parsed.stages[0].parts[0]) && !("style" in parsed.links[0]));
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
    assert.equal(parseReport({ ...report, topology: bad }), null);
  }
});
