import { test } from "node:test";
import assert from "node:assert/strict";
import type { SummaryResponse } from "@nienke/ui/summary";
import { fillNumbers, hasLiveNumbers, liveNumbers } from "../src/lib/live-numbers.ts";
import type { Progress } from "../src/lib/wanikani.ts";

const summary = {
  year: 2026,
  counts: { books: 52, movies: 31, shows: 19 },
} as SummaryResponse;
const progress = { level: 21, kanji: { learned: 1204 } } as Progress;

test("liveNumbers formats counts but not the year or level", () => {
  assert.deepEqual(liveNumbers(summary, progress), {
    year: "2026",
    books: "52",
    movies: "31",
    shows: "19",
    kanji: "1,204",
    level: "21",
  });
});

test("fillNumbers fills tokens and dashes the ones it couldn't fetch", () => {
  const text = "In {{year}} I read {{books}} books and know {{kanji}} kanji.";
  assert.ok(hasLiveNumbers(text));
  assert.ok(!hasLiveNumbers("No numbers {here}."));
  assert.equal(
    fillNumbers(text, liveNumbers(summary)),
    "In 2026 I read 52 books and know – kanji."
  );
  assert.equal(
    fillNumbers(
      "{{books}} books",
      liveNumbers(summary),
      (key, value) => `<b id="${key}">${value}</b>`
    ),
    '<b id="books">52</b> books'
  );
});
