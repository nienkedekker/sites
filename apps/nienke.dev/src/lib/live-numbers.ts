import { formatCount } from "@nienke/ui/format";
import type { SummaryResponse } from "@nienke/ui/summary";
import type { Progress } from "./wanikani.ts";

// Markdown pages write these as {{books}}, filled in from what.pm and WaniKani
export type LiveNumbers = Partial<Record<string, string>>;

const TOKEN = /\{\{(\w+)\}\}/g;

export const hasLiveNumbers = (text: string) => new RegExp(TOKEN.source).test(text);

export function liveNumbers(summary?: SummaryResponse, progress?: Progress): LiveNumbers {
  return {
    ...(summary && {
      year: String(summary.year),
      books: formatCount(summary.counts.books),
      movies: formatCount(summary.counts.movies),
      shows: formatCount(summary.counts.shows),
    }),
    ...(progress && {
      kanji: formatCount(progress.kanji.learned),
      level: String(progress.level),
    }),
  };
}

export function fillNumbers(
  text: string,
  numbers: LiveNumbers,
  render: (key: string, value: string) => string = (_, value) => value
) {
  return text.replace(TOKEN, (_, key: string) => render(key, numbers[key] ?? "–"));
}
