// What nanami, the media server at home, reports about itself every minute

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

export interface Report {
  sentAt: string;
  checks: Record<string, Check>;
  facts: Fact[];
}

export interface StoredReport extends Report {
  receivedAt: number;
}

// nanami pushes every minute, so three missed pushes means it's off, asleep or offline
export const STALE_AFTER_MS = 3 * 60 * 1000;

export const isStale = (report: StoredReport | null, now = Date.now()) =>
  !report || now - report.receivedAt > STALE_AFTER_MS;

const STATUSES = new Set<unknown>(["ok", "warn", "down"]);
const CHECK_ID = /^[a-z0-9-]{1,32}$/;

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.length <= max ? value : null;

const isDate = (value: unknown) =>
  typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));

// Only the shape the page knows how to show gets stored; anything else is refused whole
export function parseReport(body: unknown): Report | null {
  if (!body || typeof body !== "object") return null;
  const { sentAt, checks, facts } = body as Record<string, unknown>;
  if (!isDate(sentAt) || !checks || typeof checks !== "object" || !Array.isArray(facts)) {
    return null;
  }

  const entries = Object.entries(checks);
  if (entries.length > 60 || facts.length > 20) return null;

  const parsedChecks: Record<string, Check> = {};
  for (const [id, check] of entries) {
    const { status, detail, since } = (check ?? {}) as Record<string, unknown>;
    const parsedDetail = text(detail, 200);
    if (!CHECK_ID.test(id) || !STATUSES.has(status) || parsedDetail === null) return null;
    if (since !== undefined && !isDate(since)) return null;
    parsedChecks[id] = {
      status: status as Status,
      detail: parsedDetail,
      ...(since === undefined ? {} : { since: since as string }),
    };
  }

  const parsedFacts: Fact[] = [];
  for (const fact of facts) {
    const label = text(fact?.label, 40);
    const value = text(fact?.value, 80);
    if (label === null || value === null) return null;
    parsedFacts.push({ label, value });
  }

  return { sentAt: sentAt as string, checks: parsedChecks, facts: parsedFacts };
}
