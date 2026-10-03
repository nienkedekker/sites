const API = "https://api.wanikani.com/v2";
const LEARNED_STAGE = 5;
const SAMPLE_SIZE = 12;
// The subjects endpoint has no page size, so counting kanji live costs a 1.8 MB download.
// This is its total_count for types=kanji&hidden=false; it only moves with content updates.
const KANJI_TOTAL = 2101;

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
  vocabulary: number;
  stages: Record<StageKey, number>;
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

const CACHE_MS = 10 * 60 * 1000;
let cache: { at: number; progress: Promise<Progress> } | undefined;

export function getProgress(key: string, signal?: AbortSignal): Promise<Progress> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.progress;

  const progress = loadProgress(key, signal);
  cache = { at: Date.now(), progress };
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

  const [user, assignments, reviewStats] = await Promise.all([
    wanikani<{ data: { level: number } }>("/user"),
    allPages<Assignment>("/assignments?started=true"),
    allPages<ReviewStatistic>("/review_statistics"),
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
      total: KANJI_TOTAL,
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

export function keepShown(fresh: Progress, shown?: Kanji): Progress {
  if (!shown) return fresh;
  return {
    ...fresh,
    sample: [shown, ...fresh.sample.filter(({ char }) => char !== shown.char)],
  };
}
