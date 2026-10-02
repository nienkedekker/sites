import { WANIKANI_KEY } from "astro:env/server";
import {
  asLastPlayed,
  getLatestTrack,
  getListeningStats,
  type ListeningStats,
  type Track,
} from "./lastfm";
import { getProgress, type Progress } from "./wanikani";
import { fetchSummary, type Summary } from "./whatpm";

export interface HomeSnapshot {
  summary?: Summary;
  progress?: Progress;
  // null: Last.fm answered, but nothing has been played
  track?: Track | null;
  stats?: ListeningStats;
}

const TIMEOUT = 8000;

// Data for the home page cards, fetched while the page is built so it has real
// content before any JavaScript runs. The cards still refresh it in the
// browser. A source that fails or is slow is left out, and its card starts
// in the loading state instead.
export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  const attempt = <T>(source: string, load: (signal: AbortSignal) => Promise<T>) =>
    load(AbortSignal.timeout(TIMEOUT)).catch((error) => {
      console.warn(`[home] Building without ${source} data: ${error}`);
      return undefined;
    });

  const [summary, progress, track, stats] = await Promise.all([
    attempt("what.pm", fetchSummary),
    WANIKANI_KEY ? attempt("WaniKani", (signal) => getProgress(WANIKANI_KEY!, signal)) : undefined,
    attempt("Last.fm", async (signal) => {
      const latest = await getLatestTrack(signal);
      return latest && asLastPlayed(latest);
    }),
    attempt("Last.fm stats", getListeningStats),
  ]);

  return { summary, progress, track, stats };
}
