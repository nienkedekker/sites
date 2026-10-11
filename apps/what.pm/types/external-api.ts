export interface ExternalResult {
  id: string;
  title: string;
  year: number | null;
  creator: string | null;
  cover?: string | null;
}

export type SeasonYears = Record<number, number>;
