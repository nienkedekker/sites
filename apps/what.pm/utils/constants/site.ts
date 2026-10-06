// Whose log this is and where it lives. Unset, every value is mine, so
// www.what.pm needs no env vars; set them to run a copy for someone else.
// NEXT_PUBLIC_ vars are read in full so Next can inline them on the client.

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "what.pm";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.what.pm";

export const yearUrl = (year: number) => `${SITE_URL}/year/${year}`;

// My story, my accounts elsewhere and the since-2007 line only show on my log
export const IS_MINE = !process.env.NEXT_PUBLIC_OWNER_NAME;

export const OWNER_NAME = process.env.NEXT_PUBLIC_OWNER_NAME || "Nienke Dekker";
export const OWNER_FIRST_NAME = OWNER_NAME.split(" ")[0];
export const OWNER_URL = (process.env.NEXT_PUBLIC_OWNER_URL ||
  "https://nienke.dev") as `https://${string}`;

// Where the code lives, which stays the same for every copy
export const SOURCE_URL = "https://github.com/nienkedekker/sites";

export const SITE_DESCRIPTION = IS_MINE
  ? "what!!! every book, movie and show I’ve read or watched since 2007."
  : "every book, movie and show I’ve read or watched.";

// Comma-separated; left out of favourites, stats and recs
export const HIDDEN_PEOPLE: ReadonlySet<string> = new Set(
  (process.env.HIDDEN_PEOPLE ?? "Christopher Nolan")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean),
);
