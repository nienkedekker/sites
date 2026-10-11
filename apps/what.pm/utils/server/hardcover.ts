import "server-only";
import { cacheLife } from "next/cache";
import {
  toUpcoming,
  type HardcoverBook,
  type UpcomingBook,
} from "@/utils/data/upcoming";
import { getJson } from "@/utils/server/external-api";

const ENDPOINT = new URL("https://api.hardcover.app/v1/graphql");
const MONTHS_BACK = 2;
const MONTHS_AHEAD = 6;
// Fewer shelves than this and it's mostly self-published or a data stub
const MIN_READERS = 5;

// Two top-level fields, so two requests against Hardcover's limits: books out
// already and books still to come are asked for apart, or the ones out, with
// more time to gather readers, would crowd the others out. Category 1 is
// books: no novellas, short stories, comics or poetry collections; status 1
// leaves out books awaiting review or merged away. The limits leave room for
// the romance the page drops
const FIELDS = `
    id
    slug
    title
    release_date
    users_count
    description
    cached_image
    cached_contributors
    cached_tags`;

const where = (dates: string) => `{
      release_date: ${dates}
      book_category_id: { _eq: 1 }
      book_status_id: { _eq: 1 }
      compilation: { _eq: false }
      users_count: { _gte: ${MIN_READERS} }
    }`;

const QUERY = `query Recent($from: date!, $today: date!, $to: date!) {
  out: books(
    where: ${where("{ _gt: $from, _lte: $today }")}
    order_by: { users_count: desc }
    limit: 250
  ) {${FIELDS}
  }
  coming: books(
    where: ${where("{ _gt: $today, _lte: $to }")}
    order_by: { users_count: desc }
    limit: 300
  ) {${FIELDS}
  }
}`;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// The token goes in as is, or with "Bearer " added when it was saved without
function authorization() {
  const token = process.env.HARDCOVER_API_TOKEN?.trim() ?? "";
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

// The most read books of the last two months and the most anticipated of the
// next six, fetched from Hardcover once a day at most
export async function recentBooks(): Promise<UpcomingBook[]> {
  "use cache: remote";
  cacheLife("days");
  const today = new Date();
  const from = new Date(today);
  from.setUTCMonth(from.getUTCMonth() - MONTHS_BACK);
  const to = new Date(today);
  to.setUTCMonth(to.getUTCMonth() + MONTHS_AHEAD);

  const result = await getJson<{
    data?: { out: HardcoverBook[]; coming: HardcoverBook[] };
    errors?: { message: string }[];
  }>(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: authorization(),
      "content-type": "application/json",
      "user-agent": "what.pm upcoming books (personal use)",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        from: isoDate(from),
        today: isoDate(today),
        to: isoDate(to),
      },
    }),
  });
  if (!result.data) {
    throw new Error(result.errors?.[0]?.message ?? "Hardcover sent no books");
  }
  return toUpcoming([...result.data.out, ...result.data.coming]);
}
