import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { TypedItem } from "@/types/shared";
import { HIDDEN_PEOPLE } from "@/utils/constants/site";
import { hasRecs } from "@/utils/server/services";
import {
  creatorOf,
  favouriteCreators,
  isLogged,
  knownNames,
  logIndex,
  pickSeeds,
  promptItems,
  seedWeights,
  SUGGESTION_COUNT,
  type Suggestion,
} from "@/utils/data/recommend";

const SuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      itemtype: z.enum(["Book", "Movie", "Show"]),
      title: z.string(),
      creator: z.string(),
      year: z.number().int(),
      reason: z.string(),
      because: z.array(z.string()),
    }),
  ),
});

const SYSTEM = `You recommend books, movies and TV shows to me, from my own log.

Everything in the log was finished and liked: I drop what I don't like, so there are no ratings and every entry counts as a yes. "reread" marks something I went back to, which is the strongest signal there is. Newer entries say more about my taste now than old ones. The log covers the last three years in full; before that it only has rereads and the entries that weigh most, and a line with the authors and directors I've logged most over the years.

Suggest ${SUGGESTION_COUNT}, best first:
- About a third each of books, movies and TV shows.
- Only by people I haven't logged anything by: <known_people> lists everyone I have. Nothing adapted from a book by one of them either. The point is discovering authors, directors and showrunners new to me.
- Nothing in my log, nothing I dismissed, and nothing much like what I dismissed as not for me.
- Nothing on my want list either. I picked those out of earlier suggestions to read or watch next, so they say a lot about what I'm after now.
- <picks_logged> lists earlier suggestions I saved and then went on to read or watch. They're in the log too, but they show best what kind of pick works for me.
- Real, released works you're sure about, each a single work rather than a box set or collection. For a series, suggest where to start.
- Give the title as published in English, the author for a book, the director for a movie, the creator for a show, and the year it first came out. Each suggestion is looked up on OpenLibrary or TMDB, and anything that can't be found is dropped.
- Prefer links across media, like a book I'd love behind a show I watched.
- Anime and manga count like anything else.

For each, write one plain sentence, in English and addressed to me as "you", that says why, naming the logged titles behind it. No hype. In "because", list those logged titles exactly as they appear in the log.`;

const logLine = (item: TypedItem) =>
  [
    item.itemtype,
    item.title + (item.itemtype === "Show" ? ` S${item.season}` : ""),
    creatorOf(item) ?? "",
    item.published_year,
    `logged ${item.belongs_to_year}`,
    item.redo ? "reread" : "",
    [...item.genres, ...item.subgenres].join(", "),
  ]
    .filter((part) => part !== "")
    .join(" · ");

export async function suggestWithClaude(
  items: TypedItem[],
  dismissed: { title: string; kind: string }[],
  wanted: {
    itemtype: string;
    external_id: string;
    title: string;
    creator: string | null;
    reason: string | null;
  }[],
): Promise<Suggestion[] | null> {
  if (!hasRecs()) return null;
  const logged = logIndex(items);
  const open = wanted.filter((w) => !isLogged(w, logged));
  const picksLogged = wanted.filter((w) => w.reason && isLogged(w, logged));
  const wantLine = (w: (typeof wanted)[number]) =>
    [w.itemtype, w.title, w.creator].filter(Boolean).join(" · ");
  const log = promptItems(items, pickSeeds(items, seedWeights(items)));
  const authors = favouriteCreators(items, "Book", HIDDEN_PEOPLE);
  const directors = favouriteCreators(items, "Movie", HIDDEN_PEOPLE);
  const prompt = [
    `<log>\n${log.map(logLine).join("\n")}\n</log>`,
    `<most_logged>\nAuthors: ${authors.join(", ")}\nDirectors: ${directors.join(", ")}\n</most_logged>`,
    `<known_people>\n${knownNames(items).join(", ")}\n</known_people>`,
    open.length > 0
      ? `<want_list>\n${open.map(wantLine).join("\n")}\n</want_list>`
      : "",
    picksLogged.length > 0
      ? `<picks_logged>\n${picksLogged.map(wantLine).join("\n")}\n</picks_logged>`
      : "",
    dismissed.length > 0
      ? `<dismissed>\n${dismissed.map((d) => `${d.title} (${d.kind === "seen" ? "already seen" : "not for me"})`).join("\n")}\n</dismissed>`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    // The page gets 60 seconds, and looking up the picks takes some of them
    const client = new Anthropic({ timeout: 40_000, maxRetries: 1 });
    const response = await client.beta.messages.parse(
      {
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: {
          effort: "low",
          format: betaZodOutputFormat(SuggestionsSchema),
        },
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: AbortSignal.timeout(45_000) },
    );
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.error("Claude gave no usable suggestions:", response.stop_reason);
      return null;
    }
    const { suggestions } = response.parsed_output;
    return suggestions.length > 0 ? suggestions : null;
  } catch (error) {
    console.error("Claude recommendation pass failed:", error);
    return null;
  }
}
