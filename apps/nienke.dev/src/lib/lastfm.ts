import {
  DAY,
  PROFILE_URL,
  USER,
  WEEK,
  WEEKS,
  type Artist,
  type ListeningStats,
  type Track,
} from "./lastfm-shared.ts";

export { PROFILE_URL, WEEK, WEEKS, type ListeningStats, type Track };

const API = "https://ws.audioscrobbler.com/2.0/";
const KEY = "54f8f15133336606e882fdf20148d123";

interface UserInfo {
  user: { playcount: string; registered: { unixtime?: string; "#text"?: number } };
}

interface TopArtists {
  topartists: { artist: { name: string; playcount: string; url: string }[] };
}

interface RecentTracks {
  recenttracks: { track: Track[]; "@attr": { total: string } };
}

async function lastfm<T>(
  method: string,
  params: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const query = new URLSearchParams({ method, user: USER, api_key: KEY, format: "json" });
  for (const [key, value] of Object.entries(params)) query.set(key, String(value));

  const res = await fetch(`${API}?${query}`, { signal });
  if (!res.ok) throw new Error(`Last.fm responded ${res.status} to ${method}`);
  const data = await res.json();
  // Last.fm reports some errors, like rate limiting, with a 200 status
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  return data;
}

export async function getLatestTrack(signal?: AbortSignal): Promise<Track | null> {
  const data = await lastfm<RecentTracks>("user.getrecenttracks", { limit: 1 }, signal);
  return data.recenttracks.track[0] || null;
}

export function asLastPlayed(track: Track): Track {
  const rest = { ...track };
  delete rest["@attr"];
  return rest;
}

export function weekStarts(now: number) {
  const endOfToday = (Math.floor(now / 1000 / DAY) + 1) * DAY;
  return Array.from({ length: WEEKS }, (_, i) => endOfToday - (WEEKS - i) * WEEK);
}

const topOf = ({ topartists }: TopArtists): Artist | undefined => {
  const artist = topartists.artist[0];
  return artist && { name: artist.name, plays: Number(artist.playcount), url: artist.url };
};

export function summarise(
  info: UserInfo,
  topMonth: TopArtists,
  topAllTime: TopArtists,
  weekly: RecentTracks[],
  starts: number[]
): ListeningStats {
  const registered = Number(info.user.registered.unixtime ?? info.user.registered["#text"]);

  return {
    total: Number(info.user.playcount),
    since: new Date(registered * 1000).getUTCFullYear(),
    weeks: starts.map((start, i) => ({
      start,
      count: Number(weekly[i].recenttracks["@attr"].total),
    })),
    topArtist: topOf(topMonth),
    topArtistAllTime: topOf(topAllTime),
  };
}

export async function getListeningStats(
  signal?: AbortSignal,
  now = Date.now()
): Promise<ListeningStats> {
  const starts = weekStarts(now);
  const [info, topMonth, topAllTime, weekly] = await Promise.all([
    lastfm<UserInfo>("user.getinfo", {}, signal),
    lastfm<TopArtists>("user.gettopartists", { period: "1month", limit: 1 }, signal),
    lastfm<TopArtists>("user.gettopartists", { period: "overall", limit: 1 }, signal),
    Promise.all(
      starts.map((from) =>
        lastfm<RecentTracks>("user.getrecenttracks", { from, to: from + WEEK, limit: 1 }, signal)
      )
    ),
  ]);
  return summarise(info, topMonth, topAllTime, weekly, starts);
}
