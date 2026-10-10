// What nanami, the media server at home, reports about itself every minute.
// The report also carries the diagram's layout, so what runs at home is never
// described in this public code, only shown once I'm signed in

export type Status = "ok" | "warn" | "down";

export interface Check {
  status: Status;
  detail: string;
  // When this check last changed status, as nanami saw it
  since?: string;
}

export interface Fact {
  label: string;
  value: string;
}

export interface Part {
  id: string;
  name: string;
  role: string;
  // The check in the report that colours this part's light
  check?: string;
  href?: string;
  // Where it sits in the diagram, as [column, row]
  at?: [number, number];
}

export interface Stage {
  title: string;
  parts: Part[];
}

export interface Link {
  from: string;
  to: string;
  label?: string;
  // Labels go on the first stretch of a link unless they'd sit in a crowd there
  labelAt?: "start" | "end";
  labelBelow?: boolean;
  // Where a link bends, from 0 at the left of the gap next to `from` to 1 at its
  // right, or in the gap next to `to` with `bendIn: "to"`. Links with the same
  // bend share their vertical stretch, like a bus
  bend?: number;
  bendIn?: "from" | "to";
  // Shift where a link leaves `from` or reaches `to`, to keep it off another line
  fromDy?: number;
  toDy?: number;
  // Background work rather than a request or a hand-off
  dashed?: boolean;
  // A request whose answer comes back along the same line: arrows at both ends
  twoWay?: boolean;
}

export interface Topology {
  columns: string[];
  subheadings: { column: number; row: number; text: string }[];
  stages: Stage[];
  links: Link[];
}

export interface Report {
  sentAt: string;
  checks: Record<string, Check>;
  facts: Fact[];
  topology?: Topology;
}

export interface StoredReport extends Report {
  receivedAt: number;
}

// nanami pushes every minute, so three missed pushes means it's off, asleep or offline
export const STALE_AFTER_MS = 3 * 60 * 1000;

export const isStale = (report: StoredReport | null, now = Date.now()) =>
  !report || now - report.receivedAt > STALE_AFTER_MS;

// The diagram's grid, which the layout has to fit
export const COLUMNS = 6;
export const ROWS = 6;

const STATUSES = new Set<unknown>(["ok", "warn", "down"]);
const ID = /^[a-z0-9-]{1,32}$/;

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.length <= max ? value : null;

const isDate = (value: unknown) =>
  typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));

const isInt = (value: unknown, below: number) =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < below;

const isNumber = (value: unknown, min: number, max: number) =>
  typeof value === "number" && value >= min && value <= max;

const optional = (value: unknown, valid: (value: unknown) => boolean) =>
  value === undefined || valid(value);

const isId = (value: unknown) => typeof value === "string" && ID.test(value);

class Refused extends Error {}

// Throws Refused at the first thing that doesn't fit, so a bad report is refused whole
function need(ok: boolean): asserts ok {
  if (!ok) throw new Refused();
}

function parsePart(value: unknown): Part {
  const { id, name, role, check, href, at } = (value ?? {}) as Record<string, unknown>;
  need(isId(id) && text(name, 40) !== null && text(role, 40) !== null);
  need(optional(check, isId));
  // Only links to real web pages; React would refuse javascript: anyway
  need(optional(href, (h) => text(h, 200) !== null && (h as string).startsWith("https://")));
  need(
    optional(
      at,
      (a) => Array.isArray(a) && a.length === 2 && isInt(a[0], COLUMNS) && isInt(a[1], ROWS)
    )
  );
  return {
    id: id as string,
    name: name as string,
    role: role as string,
    ...(check === undefined ? {} : { check: check as string }),
    ...(href === undefined ? {} : { href: href as string }),
    ...(at === undefined ? {} : { at: [(at as number[])[0], (at as number[])[1]] }),
  };
}

function parseLink(value: unknown): Link {
  const link = (value ?? {}) as Record<string, unknown>;
  need(isId(link.from) && isId(link.to));
  need(optional(link.label, (l) => text(l, 20) !== null));
  need(optional(link.labelAt, (l) => l === "start" || l === "end"));
  need(optional(link.bendIn, (b) => b === "from" || b === "to"));
  need(optional(link.bend, (b) => isNumber(b, 0, 1)));
  need(optional(link.fromDy, (d) => isNumber(d, -30, 30)));
  need(optional(link.toDy, (d) => isNumber(d, -30, 30)));
  for (const flag of ["labelBelow", "dashed", "twoWay"]) {
    need(optional(link[flag], (f) => typeof f === "boolean"));
  }
  // Keep only the fields the diagram knows, nothing else that came along
  const keys = [
    "from",
    "to",
    "label",
    "labelAt",
    "labelBelow",
    "bend",
    "bendIn",
    "fromDy",
    "toDy",
    "dashed",
    "twoWay",
  ] as const;
  return Object.fromEntries(
    keys.filter((key) => link[key] !== undefined).map((key) => [key, link[key]])
  ) as unknown as Link;
}

function parseTopology(value: unknown): Topology {
  const { columns, subheadings, stages, links } = (value ?? {}) as Record<string, unknown>;
  need(Array.isArray(columns) && columns.length === COLUMNS);
  need(columns.every((c) => text(c, 40) !== null));
  need(Array.isArray(subheadings) && subheadings.length <= 8);
  need(Array.isArray(stages) && stages.length <= 10);
  need(Array.isArray(links) && links.length <= 80);
  return {
    columns: columns as string[],
    subheadings: subheadings.map((s) => {
      const { column, row, text: label } = (s ?? {}) as Record<string, unknown>;
      need(isInt(column, COLUMNS) && isInt(row, ROWS) && text(label, 40) !== null);
      return { column: column as number, row: row as number, text: label as string };
    }),
    stages: stages.map((stage) => {
      const { title, parts } = (stage ?? {}) as Record<string, unknown>;
      need(text(title, 40) !== null && Array.isArray(parts) && parts.length <= 20);
      return { title: title as string, parts: parts.map(parsePart) };
    }),
    links: links.map(parseLink),
  };
}

// Only the shape the page knows how to show gets stored; anything else is refused whole
export function parseReport(body: unknown): Report | null {
  try {
    need(!!body && typeof body === "object");
    const { sentAt, checks, facts, topology } = body as Record<string, unknown>;
    need(isDate(sentAt) && !!checks && typeof checks === "object" && Array.isArray(facts));

    const entries = Object.entries(checks as object);
    need(entries.length <= 60 && (facts as unknown[]).length <= 20);

    const parsedChecks: Record<string, Check> = {};
    for (const [id, check] of entries) {
      const { status, detail, since } = (check ?? {}) as Record<string, unknown>;
      const parsedDetail = text(detail, 200);
      need(ID.test(id) && STATUSES.has(status) && parsedDetail !== null);
      need(optional(since, isDate));
      parsedChecks[id] = {
        status: status as Status,
        detail: parsedDetail as string,
        ...(since === undefined ? {} : { since: since as string }),
      };
    }

    const parsedFacts: Fact[] = (facts as unknown[]).map((fact) => {
      const { label, value } = (fact ?? {}) as Record<string, unknown>;
      need(text(label, 40) !== null && text(value, 80) !== null);
      return { label: label as string, value: value as string };
    });

    return {
      sentAt: sentAt as string,
      checks: parsedChecks,
      facts: parsedFacts,
      ...(topology === undefined ? {} : { topology: parseTopology(topology) }),
    };
  } catch (error) {
    if (error instanceof Refused) return null;
    throw error;
  }
}
