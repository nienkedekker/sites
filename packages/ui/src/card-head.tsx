import type { ReactNode } from "react";

interface CardHeadProps {
  children: ReactNode;
  as?: "h2" | "h3";
  id?: string;
  tag?: ReactNode;
  note?: ReactNode;
  className?: string;
}

export default function CardHead({
  children,
  as: Heading = "h2",
  id,
  tag,
  note,
  className = "",
}: CardHeadProps) {
  const title = (
    <Heading id={id} className="card-title">
      {children}
    </Heading>
  );

  if (note) {
    return (
      <div
        className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${className}`}
      >
        {title}
        <p className="font-mono text-xs text-ink-soft tabular-nums">{note}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      {title}
      {tag}
    </div>
  );
}
