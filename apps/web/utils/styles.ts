/**
 * Reusable style utilities for consistent design across the app.
 * The tokens and the .card/.tag/.display classes come from @nienke/ui.
 */

/** A bordered panel, as on nienke.dev */
export const cardStyles = "card";

export const textStyles = {
  muted: "text-ink-soft",
  mutedLight: "text-ink-faint",
  label: "text-ink-soft",
  primary: "text-ink",
} as const;

/**
 * Small labels for rereads and shows in progress, in an item's detail line.
 * A softer box than .tag, so they don't compete with the title.
 */
export const badgeStyles = {
  base: "inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-px font-mono text-[0.7rem] leading-snug",
  redo: "border-line-strong text-ink-soft",
  progress: "border-movies/40 text-movies",
} as const;

export const formStyles = {
  container: "card p-5 sm:p-8",
  fieldGroup: "space-y-5",
} as const;

export const linkStyles = {
  /** Inline links in running text */
  inline:
    "text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink",
  /** Small mono links in the footer */
  footer:
    "underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink",
} as const;
