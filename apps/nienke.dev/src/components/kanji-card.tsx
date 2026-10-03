import { useEffect, useRef, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import { formatCount } from "@nienke/ui/format";
import Meter from "@nienke/ui/meter";
import { prefersLessMotion } from "@nienke/ui/motion";
import { StatList, StatRow } from "@nienke/ui/stat-list";
import Tag from "@nienke/ui/tag";
import { tooltipAlign } from "@nienke/ui/tooltip";
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
    if (prefersLessMotion()) return;
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
        tag={progress && <Tag>WaniKani lvl. {progress.level}</Tag>}
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
  const items = STAGES.reduce((n, { key }) => n + stages[key], 0);
  let before = 0;
  const shown = STAGES.flatMap(({ key, label }, i) => {
    const count = stages[key];
    if (!count) return [];
    const centre = (before + count / 2) / items;
    before += count;
    return [{ key, label, count, shade: STAGE_SHADES[i], centre }];
  });

  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink-soft">Kanji learned</span>
        <span className="whitespace-nowrap tabular-nums">
          {formatCount(kanji.learned)} <span className="text-ink-faint">/ {formatCount(kanji.total)}</span>
        </span>
      </div>
      <Meter value={kanji.learned} max={kanji.total} className="mt-3" />

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
        {shown.map(({ key, label, count, shade, centre }) => (
          <div
            key={key}
            className="group relative h-full"
            style={{ flexGrow: count, flexBasis: 0 }}
          >
            <span className={`block h-full bg-movies ${shade}`} />
            <span className={`tooltip px-2 py-1 ${tooltipAlign(centre)}`}>
              {label}: <span className="font-medium tabular-nums">{formatCount(count)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-faint" aria-hidden="true">
        <span>Apprentice</span>
        <span>Burned</span>
      </div>

      <StatList className="mt-4">
        <StatRow label="Vocabulary">{formatCount(vocabulary)}</StatRow>
        <StatRow label="Accuracy">{accuracy.toFixed(1)}%</StatRow>
        <StatRow label="Burned">{formatCount(stages.burned)}</StatRow>
      </StatList>
    </div>
  );
}
