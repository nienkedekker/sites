import { useEffect, useRef, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import { formatCount } from "@nienke/ui/format";
import { keepShown, STAGES, type Kanji, type Progress } from "../lib/wanikani";

const STAGE_SHADES = ["opacity-20", "opacity-40", "opacity-60", "opacity-80", "opacity-100"];

export default function KanjiCard({ initial }: { initial?: Progress }) {
  const [progress, setProgress] = useState<Progress | null>(initial ?? null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const charRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef<Kanji | undefined>(undefined);

  const sample = progress?.sample ?? [];
  const current = sample[index];

  useEffect(() => {
    shownRef.current = current;
  });

  useEffect(() => {
    fetch("/api/wanikani")
      .then((res) => {
        if (!res.ok) throw new Error(`WaniKani route responded ${res.status}`);
        return res.json();
      })
      .then((fresh: Progress) => {
        setProgress(keepShown(fresh, shownRef.current));
        setIndex(0);
      })
      .catch(() => setFailed(true));
  }, []);

  const next = () => {
    if (sample.length < 2) return;
    setIndex((i) => (i + 1) % sample.length);
    charRef.current?.animate(
      [
        { opacity: 0, filter: "blur(6px)" },
        { opacity: 1, filter: "blur(0)" },
      ],
      { duration: 350, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
    );
  };

  return (
    <div className="flex h-full flex-col">
      <CardHead
        as="h3"
        tag={progress && <span className="tag whitespace-nowrap">WaniKani lvl. {progress.level}</span>}
      >
        Learning Japanese
      </CardHead>

      <button
        type="button"
        onClick={next}
        disabled={!current}
        aria-label="Show another kanji I've learned"
        className="group my-6 flex flex-1 flex-col items-center justify-center text-center"
      >
        {current ? (
          <>
            <span ref={charRef} lang="ja" className="font-jp text-[112px] leading-none text-ink">
              {current.char}
            </span>
            <span lang="ja" className="mt-6 font-jp text-[16px] text-accent">
              {current.reading}
            </span>
            <span className="mt-1 font-pc text-base text-ink-soft" aria-live="polite">
              {current.meaning}
            </span>
            <span className="mt-4 text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
              Click for another
            </span>
          </>
        ) : failed ? (
          <span className="text-sm text-ink-faint">Couldn't reach WaniKani right now.</span>
        ) : (
          <span className="skeleton size-28" />
        )}
      </button>

      {progress?.stages && <Stats progress={progress} />}
    </div>
  );
}

function Stats({ progress }: { progress: Progress }) {
  const { kanji, stages, vocabulary, accuracy } = progress;
  const percent = Math.round((kanji.learned / kanji.total) * 100);
  const items = STAGES.reduce((n, { key }) => n + stages[key], 0);

  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink-soft">Kanji learned</span>
        <span className="whitespace-nowrap tabular-nums">
          {formatCount(kanji.learned)} <span className="text-ink-faint">/ {formatCount(kanji.total)}</span>
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden bg-line">
        <div
          className="h-full bg-accent transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <span className="text-ink-soft">By stage</span>
        <span className="tabular-nums">
          {formatCount(items)} <span className="text-ink-faint">items</span>
        </span>
      </div>
      <div
        role="img"
        aria-label={`Items by stage: ${STAGES.map(({ key, label }) => `${label} ${formatCount(stages[key])}`).join(", ")}`}
        className="mt-3 flex h-3 gap-[2px]"
      >
        {STAGES.map(({ key, label }, i) =>
          stages[key] ? (
            <div
              key={key}
              className="group relative h-full"
              style={{ flexGrow: stages[key], flexBasis: 0 }}
            >
              <span className={`block h-full bg-movies ${STAGE_SHADES[i]}`} />
              <span className="tooltip left-1/2 -translate-x-1/2 px-2 py-1">
                {label}: <span className="font-medium tabular-nums">{formatCount(stages[key])}</span>
              </span>
            </div>
          ) : null
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-faint" aria-hidden="true">
        <span>Apprentice</span>
        <span>Burned</span>
      </div>

      <dl className="mt-4">
        {[
          ["Vocabulary", formatCount(vocabulary)],
          ["Accuracy", `${accuracy.toFixed(1)}%`],
          ["Burned", formatCount(stages.burned)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 border-t border-line py-2"
          >
            <dt className="text-ink-soft">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
