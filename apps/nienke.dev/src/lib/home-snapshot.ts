import { WANIKANI_KEY } from "astro:env/server";
import {
  asLastPlayed,
  getLatestTrack,
  getListeningStats,
  type ListeningStats,
  type Track,
} from "./lastfm";
import { liveNumbers, type LiveNumbers } from "./live-numbers";
import { getProgress, type Progress } from "./wanikani";
import { fetchSummary, type Summary } from "./whatpm";

export interface HomeSnapshot {
  summary?: Summary;
  progress?: Progress;
  track?: Track | null;
  stats?: ListeningStats;
}

const TIMEOUT = 8000;

const attempt = <T>(source: string, load: (signal: AbortSignal) => Promise<T>) =>
  load(AbortSignal.timeout(TIMEOUT)).catch((error) => {
    console.warn(`[build] Building without ${source} data: ${error}`);
    return undefined;
  });

const loadProgress = () =>
  WANIKANI_KEY ? attempt("WaniKani", (signal) => getProgress(WANIKANI_KEY!, signal)) : undefined;

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  const [summary, progress, track, stats] = await Promise.all([
    attempt("what.pm", fetchSummary),
    loadProgress(),
    attempt("Last.fm", async (signal) => {
      const latest = await getLatestTrack(signal);
      return latest && asLastPlayed(latest);
    }),
    attempt("Last.fm stats", getListeningStats),
  ]);

  return { summary, progress, track, stats };
}

let numbers: Promise<LiveNumbers> | undefined;

// Fetched once per build, for every page that fills in {{books}} and the like
export function getLiveNumbers() {
  numbers ??= Promise.all([attempt("what.pm", fetchSummary), loadProgress()]).then(
    ([summary, progress]) => liveNumbers(summary, progress)
  );
  return numbers;
}
