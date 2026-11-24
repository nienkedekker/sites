import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unmatchedId } from "@/utils/data/external-ids";
import { lookUp } from "@/utils/server/recommend-lookup";
import { createClientForServer } from "@/utils/supabase/server";

const upcomingSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().max(200),
  year: z.coerce.number().int().min(1000).max(3000),
});

export type UpcomingInput = z.infer<typeof upcomingSchema>;

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

// New releases post here with fetch, not a Server Action: anything an action
// revalidates makes the router re-render the page and scroll back to the top.
// So the checks an action gets for free are done by hand: same origin,
// signed in, and a book that parses
export async function readUpcomingRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return { response: fail("Not allowed.", 403) };
  }
  const parsed = upcomingSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return { response: fail("That book is missing its details.", 400) };
  }
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { response: fail("Your session has expired. Sign in again.", 401) };
  }
  return { supabase, book: parsed.data };
}

// The Open Library or Google Books id when there is one, otherwise a
// placeholder under title and author for the details cron to match later
export async function idForUpcoming({ title, author, year }: UpcomingInput) {
  const [{ found }] = await lookUp([
    { itemtype: "Book", title, creator: author, year, reason: "", because: [] },
  ]);
  return { found, placeholder: unmatchedId(title, author) };
}

export const serverError = (what: string, error: unknown) => {
  console.error(`Error ${what}:`, error);
  return fail("Something went wrong. Please try again.", 500);
};
