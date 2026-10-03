import type { ReactNode } from "react";

interface StatListProps {
  children: ReactNode;
  rule?: "top" | "bottom";
  className?: string;
}

export function StatList({ children, rule = "top", className = "" }: StatListProps) {
  return (
    <dl
      className={`${rule === "top" ? "[&>*]:border-t" : "[&>*]:border-b"} ${className}`}
    >
      {children}
    </dl>
  );
}

interface StatRowProps {
  label: ReactNode;
  children: ReactNode;
  swatch?: string;
  className?: string;
}

export function StatRow({ label, children, swatch, className = "py-2" }: StatRowProps) {
  return (
    <div className={`flex items-baseline gap-3 border-line ${className}`}>
      {swatch && (
        <span className={`size-2.5 shrink-0 self-center ${swatch}`} aria-hidden="true" />
      )}
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="ml-auto min-w-0 text-right tabular-nums">{children}</dd>
    </div>
  );
}
