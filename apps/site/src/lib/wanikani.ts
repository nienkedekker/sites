// My WaniKani progress, for the kanji card on the home page. Server-only: it
// needs the API token. Used by /api/wanikani and when building the home page.

const API = "https://api.wanikani.com/v2";
// SRS stage 5 is "Guru" — WaniKani's own "learned" threshold. 9 is "Burned".
const LEARNED_STAGE = 5;
const SAMPLE_SIZE = 12;

// WaniKani's named SRS groups, in order, by the stage numbers they cover
export const STAGES = [
  { key: "apprentice", label: "Apprentice", from: 1, to: 4 },
  { key: "guru", label: "Guru", from: 5, to: 6 },
  { key: "master", label: "Master", from: 7, to: 7 },
  { key: "enlightened", label: "Enlightened", from: 8, to: 8 },
  { key: "burned", label: "Burned", from: 9, to: 9 },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export interface Kanji {
  char: string;
  meaning: string;
  reading: string;
}

export interface Progress {
  level: number;
  kanji: { learned: number; burned: number; total: number };
  // Vocabulary at Guru or above, kana-only words included
  vocabulary: number;
  // Items (radicals, kanji and vocabulary) in each SRS group
  stages: Record<StageKey, number>;
  // Share of review answers that were right, as a percentage (one decimal)
  accuracy: number;
  sample: Kanji[];
}

interface Collection<T> {
  total_count: number;
  pages: { next_url: string | null };
  data: { id: number; data: T }[];
}

export interface Assignment {
  subject_id: number;
  subject_type: string;
  srs_stage: number;
}

export interface ReviewStatistic {
  meaning_correct: number;
  meaning_incorrect: number;
  reading_correct: number;
  reading_incorrect: number;
}

interface KanjiSubject {
  characters: string;
  meanings: { meaning: string; primary: boolean }[];
  readings: { reading: string; primary: boolean }[];
}

// Counts by SRS group and of learned kanji and vocabulary, from every started
// assignment
export function countAssignments(assignments: Assignment[]) {
  const stages = Object.fromEntries(STAGES.map(({ key }) => [key, 0])) as Record<StageKey, number>;
  let kanji = 0;
  let kanjiBurned = 0;
  let vocabulary = 0;

  for (const { subject_type, srs_stage } of assignments) {
    const stage = STAGES.find(({ from, to }) => srs_stage >= from && srs_stage <= to);
    if (stage) stages[stage.key] += 1;
    if (srs_stage < LEARNED_STAGE) continue;
    if (subject_type === "kanji") {
      kanji += 1;
      if (srs_stage === 9) kanjiBurned += 1;
    } else if (subject_type === "vocabulary" || subject_type === "kana_vocabulary") {
      vocabulary += 1;
    }
  }

  return { stages, kanji, kanjiBurned, vocabulary };
}

// Percentage of all meaning and reading answers that were correct
export function accuracyOf(stats: ReviewStatistic[]) {
  let correct = 0;
  let total = 0;
  for (const s of stats) {
    correct += s.meaning_correct + s.reading_correct;
    total += s.meaning_correct + s.meaning_incorrect + s.reading_correct + s.reading_incorrect;
  }
  return total ? Math.round((correct / total) * 1000) / 10 : 0;
}

function pickRandom<T>(items: T[], count: number) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

// A full fetch is about 19 requests and WaniKani allows 60 a minute, so one
// result is reused for a while; callers in the meantime share it.
const CACHE_MS = 10 * 60 * 1000;
let cache: { at: number; progress: Promise<Progress> } | undefined;

export function getProgress(key: string, signal?: AbortSignal): Promise<Progress> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.progress;

  const progress = loadProgress(key, signal);
  cache = { at: Date.now(), progress };
  // Don't hold on to a failure
  progress.catch(() => {
    if (cache?.progress === progress) cache = undefined;
  });
  return progress;
}

async function loadProgress(key: string, signal?: AbortSignal): Promise<Progress> {
  async function wanikani<T>(url: string): Promise<T> {
    const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Wanikani-Revision": "20170710",
      },
      signal,
    });
    if (!res.ok) throw new Error(`WaniKani responded ${res.status} for ${url}`);
    return res.json();
  }

  // Follow pagination so counts and samples cover every page
  async function allPages<T>(url: string) {
    const items: Collection<T>["data"] = [];
    let next: string | null = url;
    while (next) {
      const page: Collection<T> = await wanikani(next);
      items.push(...page.data);
      next = page.pages.next_url;
    }
    return items;
  }

  const [user, assignments, reviewStats, allKanji] = await Promise.all([
    wanikani<{ data: { level: number } }>("/user"),
    allPages<Assignment>("/assignments?started=true"),
    allPages<ReviewStatistic>("/review_statistics"),
    // Only the total is needed; the first page carries total_count
    wanikani<Collection<KanjiSubject>>("/subjects?types=kanji"),
  ]);

  const counts = countAssignments(assignments.map((a) => a.data));
  const learnedKanji = assignments.filter(
    ({ data }) => data.subject_type === "kanji" && data.srs_stage >= LEARNED_STAGE
  );
  const sampleIds = pickRandom(learnedKanji, SAMPLE_SIZE).map((a) => a.data.subject_id);
  const subjects = sampleIds.length
    ? await wanikani<Collection<KanjiSubject>>(`/subjects?ids=${sampleIds.join(",")}`)
    : { data: [] };

  return {
    level: user.data.level,
    kanji: {
      learned: counts.kanji,
      burned: counts.kanjiBurned,
      total: allKanji.total_count,
    },
    vocabulary: counts.vocabulary,
    stages: counts.stages,
    accuracy: accuracyOf(reviewStats.map((s) => s.data)),
    sample: subjects.data.map(({ data }) => ({
      char: data.characters,
      meaning: data.meanings.find((m) => m.primary)?.meaning ?? "",
      reading: data.readings.find((r) => r.primary)?.reading ?? "",
    })),
  };
}

// Swap in fresh progress without changing the kanji on screen: it moves to the
// front of the new sample, so the card doesn't flicker after loading
export function keepShown(fresh: Progress, shown?: Kanji): Progress {
  if (!shown) return fresh;
  return {
    ...fresh,
    sample: [shown, ...fresh.sample.filter(({ char }) => char !== shown.char)],
  };
}
