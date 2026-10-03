import { useState, useEffect } from "react";
import CardHead from "@nienke/ui/card-head";
import { externalProps } from "@nienke/ui/external";
import Tag from "@nienke/ui/tag";
import type { Track } from "../lib/lastfm-shared";

export default function NowPlaying({ initial }: { initial?: Track | null }) {
  const [track, setTrack] = useState<Track | null>(initial ?? null);
  const [loading, setLoading] = useState(initial === undefined);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await fetch("/api/now-playing", { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`Now playing route responded ${res.status}`);
        setTrack(await res.json());
      } catch {
        // Silently fail - site works fine without Last.fm
      } finally {
        setLoading(false);
      }
    };

    // Only poll while the tab is visible, and catch up when it comes back
    let interval: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(interval);
      if (document.hidden) return;
      fetchTrack();
      interval = setInterval(fetchTrack, 30000);
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const isNowPlaying = track?.["@attr"]?.nowplaying === "true";
  const artist = track?.artist.name || track?.artist["#text"];
  const cover = track?.image?.find((i) => i.size === "extralarge")?.["#text"];

  return (
    <div className="flex h-full flex-col">
      <CardHead
        as="h3"
        tag={
          track && (
            <Tag>
              {isNowPlaying && (
                <span className="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-[2px] animate-[eq_900ms_ease-in-out_infinite_alternate] rounded-full bg-accent"
                      style={{ animationDelay: `${i * 180}ms`, height: "100%" }}
                    />
                  ))}
                </span>
              )}
              {isNowPlaying ? "Now playing" : "Last played"}
            </Tag>
          )
        }
      >
        Listening
      </CardHead>

      <div className="py-5">
        <div className="relative aspect-square w-[45%] max-w-28">
          <div
            className={`absolute inset-y-[4%] left-[38%] aspect-square rounded-full bg-[repeating-radial-gradient(circle,#0d0d0f_0_2px,#1c1d21_2px_4px)] ring-1 ring-white/5 ${
              isNowPlaying ? "animate-spin-slow" : ""
            }`}
            aria-hidden="true"
          >
            <span className="absolute inset-[34%] rounded-full bg-accent" />
            <span className="absolute inset-[47%] rounded-full bg-paper" />
          </div>
          <div className="relative size-full overflow-hidden bg-panel-2 ring-1 ring-line">
            {cover ? (
              <img src={cover} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <span className="grid size-full place-items-center text-4xl text-ink-faint">♪</span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        {loading ? (
          <p className="text-sm text-ink-faint">Tuning in…</p>
        ) : track ? (
          <a href={track.url} {...externalProps(track.url)} className="group block">
            <span className="block truncate font-medium group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
              {track.name}
            </span>
            <span className="mt-0.5 block truncate text-sm text-ink-soft">{artist}</span>
          </a>
        ) : (
          <p className="text-sm text-ink-faint">Silence, for now.</p>
        )}
      </div>
    </div>
  );
}
