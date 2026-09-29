/**
 * Public, read-only summary of a year's log: counts per type plus the most
 * recently logged items. Used by nienke.dev.
 *
 * GET /api/v1/summary?year=2026&limit=5
 *   year  - belongs_to_year to summarise (defaults to the current year)
 *   limit - recent items per type, 1–20 (defaults to 5)
 */
import { NextRequest, NextResponse } from "next/server";
import { supabasePublic } from "@/utils/supabase/public";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { getCurrentYear } from "@/utils/formatters/date";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const FIRST_YEAR = 1900;

// Public data, so any site may read it. Cached at the edge for an hour.
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

function parseIntParam(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function toSummaryItem(item: TypedItem) {
  const loggedAt = item.created_at;
  switch (item.itemtype) {
    case "Book":
      return {
        title: item.title,
        author: item.author,
        publishedYear: item.published_year,
        loggedAt,
      };
    case "Movie":
      return {
        title: item.title,
        director: item.director,
        releaseYear: item.published_year,
        loggedAt,
      };
    case "Show":
      return {
        title: item.title,
        season: item.season,
        inProgress: item.in_progress,
        loggedAt,
      };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currentYear = getCurrentYear();
  const year = parseIntParam(searchParams.get("year"), currentYear);
  const limit = parseIntParam(searchParams.get("limit"), DEFAULT_LIMIT);

  if (Number.isNaN(year) || year < FIRST_YEAR || year > currentYear + 1) {
    return NextResponse.json(
      {
        error: `year must be a whole number between ${FIRST_YEAR} and ${currentYear + 1}`,
      },
      { status: 400, headers: HEADERS },
    );
  }

  if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json(
      { error: `limit must be a whole number between 1 and ${MAX_LIMIT}` },
      { status: 400, headers: HEADERS },
    );
  }

  const { data: rawItems, error } = await supabasePublic
    .from("items")
    .select("*")
    .eq("belongs_to_year", year)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database error building summary for", year, ":", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500, headers: HEADERS },
    );
  }

  const items = (rawItems ?? [])
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null);

  const byType = (type: TypedItem["itemtype"]) =>
    items.filter((item) => item.itemtype === type);

  const books = byType("Book");
  const movies = byType("Movie");
  const shows = byType("Show");

  return NextResponse.json(
    {
      year,
      counts: {
        books: books.length,
        movies: movies.length,
        shows: shows.length,
      },
      // Newest first
      recent: {
        books: books.slice(0, limit).map(toSummaryItem),
        movies: movies.slice(0, limit).map(toSummaryItem),
        shows: shows.slice(0, limit).map(toSummaryItem),
      },
      url: `https://what.pm/year/${year}`,
    },
    { headers: HEADERS },
  );
}
