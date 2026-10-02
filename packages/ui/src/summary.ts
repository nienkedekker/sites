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
