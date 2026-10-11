export interface ExternalResult {
  id: string;
  title: string;
  year: number | null;
  creator: string | null;
  // A cover or poster to show with the match
  cover?: string | null;
}

export type SeasonYears = Record<number, number>;
