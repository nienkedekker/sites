import { test } from "node:test";
import assert from "node:assert/strict";
import { asLastPlayed, summarise, WEEK, WEEKS, weekStarts, type Track } from "../src/lib/lastfm.ts";
import { accuracyOf, countAssignments, keepShown, type Progress } from "../src/lib/wanikani.ts";

const kanji = (char: string) => ({ char, meaning: char, reading: char });

const fresh: Progress = {
  level: 22,
  kanji: { learned: 720, burned: 100, total: 2087 },
  vocabulary: 2400,
  stages: { apprentice: 1, guru: 2, master: 3, enlightened: 4, burned: 5 },
  accuracy: 88.5,
  sample: [kanji("山"), kanji("川"), kanji("日")],
};

test("keepShown puts the kanji on screen first in the fresh sample", () => {
  const progress = keepShown(fresh, kanji("火"));
  assert.equal(progress.level, 22);
  assert.deepEqual(progress.kanji, fresh.kanji);
  assert.deepEqual(
    progress.sample.map(({ char }) => char),
    ["火", "山", "川", "日"]
  );
});

test("keepShown doesn't repeat a kanji that is in both samples", () => {
  assert.deepEqual(
    keepShown(fresh, kanji("川")).sample.map(({ char }) => char),
    ["川", "山", "日"]
  );
});

test("keepShown uses the fresh sample as-is when nothing is shown yet", () => {
  assert.equal(keepShown(fresh, undefined), fresh);
});

test("asLastPlayed drops the now-playing flag and keeps the rest", () => {
  const track: Track = {
    name: "Diarabi",
    url: "https://www.last.fm/music/x",
    artist: { "#text": "Vieux Farka Touré" },
    "@attr": { nowplaying: "true" },
  };
  assert.deepEqual(asLastPlayed(track), {
    name: track.name,
    url: track.url,
    artist: track.artist,
  });
  assert.equal(track["@attr"]?.nowplaying, "true", "the original is untouched");
});

test("weekStarts gives 12 back-to-back weeks of whole days ending today", () => {
  const now = Date.UTC(2026, 9, 2, 12, 34, 56);
  const starts = weekStarts(now);
  assert.equal(starts.length, WEEKS);
  assert.equal(starts.at(-1)! + WEEK, Date.UTC(2026, 9, 3) / 1000);
  assert.equal(starts.at(-1), Date.UTC(2026, 8, 26) / 1000);
  for (let i = 1; i < starts.length; i++) assert.equal(starts[i] - starts[i - 1], WEEK);
});

test("summarise turns Last.fm responses into card stats", () => {
  const starts = [100, 100 + WEEK];
  const recent = (total: string) => ({ recenttracks: { track: [], "@attr": { total } } });
  const top = (name: string, playcount: string) => ({
    topartists: { artist: [{ name, playcount, url: `https://www.last.fm/music/${name}` }] },
  });
  const stats = summarise(
    { user: { playcount: "149557", registered: { unixtime: "1219051266" } } },
    top("Bladee", "752"),
    top("Burial", "4007"),
    [recent("487"), recent("217")],
    starts
  );

  assert.deepEqual(stats, {
    total: 149557,
    since: 2008,
    weeks: [
      { start: 100, count: 487 },
      { start: 100 + WEEK, count: 217 },
    ],
    topArtist: { name: "Bladee", plays: 752, url: "https://www.last.fm/music/Bladee" },
    topArtistAllTime: { name: "Burial", plays: 4007, url: "https://www.last.fm/music/Burial" },
  });
});

test("summarise copes with no top artist and the older registered format", () => {
  const stats = summarise(
    { user: { playcount: "0", registered: { "#text": 1219051266 } } },
    { topartists: { artist: [] } },
    { topartists: { artist: [] } },
    [],
    []
  );
  assert.equal(stats.since, 2008);
  assert.equal(stats.topArtist, undefined);
  assert.equal(stats.topArtistAllTime, undefined);
  assert.deepEqual(stats.weeks, []);
});

test("countAssignments groups SRS stages and counts what's learned", () => {
  const a = (subject_type: string, srs_stage: number) => ({
    subject_id: 1,
    subject_type,
    srs_stage,
  });
  const counts = countAssignments([
    a("radical", 1),
    a("kanji", 4),
    a("kanji", 5),
    a("kanji", 9),
    a("vocabulary", 6),
    a("kana_vocabulary", 7),
    a("vocabulary", 8),
    a("vocabulary", 2),
    a("kanji", 0),
  ]);

  assert.deepEqual(counts.stages, { apprentice: 3, guru: 2, master: 1, enlightened: 1, burned: 1 });
  assert.equal(counts.kanji, 2);
  assert.equal(counts.kanjiBurned, 1);
  assert.equal(counts.vocabulary, 3);
});

test("accuracyOf is the share of correct meaning and reading answers", () => {
  const stat = (mc: number, mi: number, rc: number, ri: number) => ({
    meaning_correct: mc,
    meaning_incorrect: mi,
    reading_correct: rc,
    reading_incorrect: ri,
  });
  assert.equal(accuracyOf([stat(9, 1, 0, 0), stat(4, 1, 4, 1)]), 85);
  assert.equal(accuracyOf([stat(2, 1, 0, 0)]), 66.7);
  assert.equal(accuracyOf([]), 0);
});
