// The shape of what.pm's /api/v1/summary, as far as the shared pieces use it.
// what.pm builds it on the server; nienke.dev fetches it.

export interface MonthCounts {
  month: number;
  books: number;
  movies: number;
  shows: number;
}

export interface YearSummary {
  year: number;
  counts: { books: number; movies: number; shows: number };
  months: MonthCounts[];
  url: string;
}
