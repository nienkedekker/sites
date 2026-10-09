export const cardStyles = "card";

export const textStyles = {
  muted: "text-ink-soft",
  mutedLight: "text-ink-faint",
  label: "text-ink-soft",
  primary: "text-ink",
} as const;

export const badgeStyles = {
  base: "inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-px font-mono text-[0.7rem] leading-snug",
  redo: "border-line-strong text-ink-soft",
  progress: "border-movies/40 text-movies-text",
  dnf: "border-line text-ink-faint",
} as const;

export const formStyles = {
  container: "above-grain card p-5 sm:p-8",
  fieldGroup: "space-y-5",
} as const;
