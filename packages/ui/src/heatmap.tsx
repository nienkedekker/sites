import type { ReactNode } from "react";
import { tooltipAlign } from "./tooltip";

const LEVELS = [18, 38, 60, 82, 100];

const mix = (level: number) =>
  `color-mix(in srgb, var(--movies) ${level}%, transparent)`;

export function heatShade(count: number, max: number, scale: "linear" | "log" = "linear") {
  if (count === 0) return undefined;
  const ratio =
    scale === "log" ? Math.log(count) / Math.log(max + 1) : count / max;
  return mix(LEVELS[Math.min(LEVELS.length - 1, Math.floor(ratio * LEVELS.length))]);
}

interface HeatCellProps {
  count: number;
  max: number;
  scale?: "linear" | "log";
  position: number;
  label: string;
  title: ReactNode;
  children: ReactNode;
  tabbable?: boolean;
}

export function HeatCell({
  count,
  max,
  scale,
  position,
  label,
  title,
  children,
  tabbable = false,
}: HeatCellProps) {
  return (
    <div
      role="img"
      tabIndex={tabbable ? 0 : -1}
      aria-label={label}
      data-heat-cell
      className={`group relative h-full w-full ${count === 0 ? "bg-line" : ""}`}
      style={{ backgroundColor: heatShade(count, max, scale) }}
    >
      <div
        className={`tooltip max-w-[min(16rem,calc(100vw-7rem))] text-left group-focus:opacity-100 ${tooltipAlign(position)}`}
        aria-hidden="true"
      >
        <p className="flex items-baseline justify-between gap-4 font-medium">
          {title}
          <span className="font-mono font-normal text-ink-soft tabular-nums">
            {count}
          </span>
        </p>
        {children}
      </div>
    </div>
  );
}

export function HeatLegend() {
  return (
    <div
      className="mt-4 flex items-center justify-end gap-1 font-mono text-[0.7rem] text-ink-faint"
      aria-hidden="true"
    >
      Fewer
      <span className="ml-1 size-3 bg-line" />
      {LEVELS.map((level) => (
        <span
          key={level}
          className="size-3"
          style={{ backgroundColor: mix(level) }}
        />
      ))}
      <span className="ml-1">More</span>
    </div>
  );
}
