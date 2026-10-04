import { ViewTransition, type ReactNode } from "react";

// The year links tag each navigation, so the log moves like a timeline: a
// later year comes in from the right, an earlier one from the left
const SLIDE = { later: "year-later", earlier: "year-earlier", default: "none" };

export function YearTransition({
  year,
  children,
}: {
  year: number;
  children: ReactNode;
}) {
  return (
    <ViewTransition key={year} enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
