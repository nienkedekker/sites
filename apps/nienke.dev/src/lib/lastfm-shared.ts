// What client islands may import; the API key stays in lastfm.ts, which only runs on the server.
export const USER = "shinyhats";
export const PROFILE_URL = `https://www.last.fm/user/${USER}`;

export const DAY = 24 * 60 * 60;
export const WEEK = 7 * DAY;
export const WEEKS = 12;

export interface Track {
  name: string;
  url: string;
  artist: { name?: string; "#text"?: string };
  image?: { size: string; "#text": string }[];
  date?: { uts: string };
  "@attr"?: { nowplaying: string };
}

export interface Artist {
  name: string;
  plays: number;
  url: string;
}

export interface ListeningStats {
  total: number;
  since: number;
  weeks: { start: number; count: number }[];
  topArtist?: Artist;
  topArtistAllTime?: Artist;
}
