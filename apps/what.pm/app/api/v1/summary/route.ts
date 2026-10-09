import { NextRequest, NextResponse } from "next/server";
import { supabasePublic } from "@/utils/supabase/public";
import {
  type SummaryBook,
  type SummaryMovie,
  type SummaryResponse,
  type SummaryShow,
} from "@nienke/ui/summary";
import { yearUrl } from "@/utils/constants/site";
import {
  validateAndTypeItem,
  type BookItem,
  type MovieItem,
  type ShowItem,
  type TypedItem,
} from "@/types/shared";
import { getCurrentYear } from "@/utils/formatters/date";
import { countByMonth } from "@/utils/data/summary";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const FIRST_YEAR = 1900;

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

function parseIntParam(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function toBook(item: BookItem): SummaryBook {
  return {
    title: item.title,
    author: item.author,
    publishedYear: item.published_year,
    reread: item.redo,
    inProgress: item.in_progress,
    loggedAt: item.created_at,
  };
}

function toMovie(item: MovieItem): SummaryMovie {
  return {
    title: item.title,
    director: item.director,
    releaseYear: item.published_year,
    loggedAt: item.created_at,
  };
}

function toShow(item: ShowItem): SummaryShow {
  return {
    title: item.title,
    season: item.season,
    inProgress: item.in_progress,
    loggedAt: item.created_at,
  };
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

  const books = items.filter((item) => item.itemtype === "Book");
  const movies = items.filter((item) => item.itemtype === "Movie");
  const shows = items.filter((item) => item.itemtype === "Show");

  return NextResponse.json<SummaryResponse>(
    {
      year,
      counts: {
        books: books.length,
        movies: movies.length,
        shows: shows.length,
      },
      months: countByMonth(items, year),
      recent: {
        books: books.slice(0, limit).map(toBook),
        movies: movies.slice(0, limit).map(toMovie),
        shows: shows.slice(0, limit).map(toShow),
      },
      url: yearUrl(year),
    },
    { headers: HEADERS },
  );
}
