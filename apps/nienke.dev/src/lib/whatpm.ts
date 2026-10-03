import type { YearSummary } from "@nienke/ui/summary";

const WHATPM_URL = import.meta.env.PUBLIC_WHATPM_URL || "https://www.what.pm";

export interface Book {
  title: string;
  author: string;
  reread?: boolean;
}

export interface Summary extends YearSummary {
  recent: { books: Book[] };
}

export const whatpmUrl = WHATPM_URL;

export async function fetchSummary(signal?: AbortSignal) {
  const res = await fetch(`${WHATPM_URL}/api/v1/summary?limit=5`, { signal });
  if (!res.ok) throw new Error(`what.pm responded ${res.status}`);
  return res.json() as Promise<Summary>;
}

let request: Promise<Summary> | undefined;

export function getSummary() {
  request ??= fetchSummary().catch((error) => {
    request = undefined;
    throw error;
  });
  return request;
}
