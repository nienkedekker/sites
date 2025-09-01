/**
 * Reusable style utilities for consistent design across the app
 */

// Card styling for consistent appearance across category lists and search results
export const cardStyles =
  "bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-800/50 rounded-lg transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700";

// Text color utilities for consistent typography
export const textStyles = {
  muted: "text-slate-600 dark:text-slate-400",
  mutedLight: "text-slate-500 dark:text-slate-500",
  label: "text-slate-700 dark:text-slate-300",
  primary: "text-slate-900 dark:text-slate-100",
} as const;

// Badge/tag styling
export const badgeStyles = {
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
} as const;
