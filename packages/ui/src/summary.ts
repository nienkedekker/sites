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

export interface SummaryBook {
  title: string;
  author: string;
  publishedYear: number;
  reread: boolean;
  loggedAt: string | null;
}

export interface SummaryMovie {
  title: string;
  director: string;
  releaseYear: number;
  loggedAt: string | null;
}

export interface SummaryShow {
  title: string;
  season: number;
  inProgress: boolean;
  loggedAt: string | null;
}

export interface SummaryResponse extends YearSummary {
  recent: { books: SummaryBook[]; movies: SummaryMovie[]; shows: SummaryShow[] };
}
