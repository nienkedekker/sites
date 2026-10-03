/**
 * Classes that keep a `.tooltip` inside its chart. `position` is where the
 * hovered bar's centre sits across the chart, from 0 (left) to 1 (right).
 * Bars in the outer thirds pin the tooltip to their outer edge; the rest
 * centre it.
 */
export function tooltipAlign(position: number) {
  if (position < 1 / 3) return "left-0";
  if (position > 2 / 3) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/** Centre of the `i`th of `count` equal-width bars, for `tooltipAlign`. */
export function barCentre(i: number, count: number) {
  return (i + 0.5) / count;
}
