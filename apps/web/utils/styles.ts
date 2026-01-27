/**
 * Reusable style utilities for consistent design across the app
 */

export const cardStyles =
  "bg-white dark:bg-transparent border-neutral-200/50 dark:border-neutral-700/50 rounded-lg transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600";

export const textStyles = {
  muted: "text-gray-600 dark:text-gray-400",
  mutedLight: "text-gray-500 dark:text-gray-500",
  label: "text-gray-700 dark:text-gray-300",
  primary: "text-gray-900 dark:text-gray-100",
} as const;

export const badgeStyles = {
  amber:
    "bg-amber-100 dark:bg-orange-900/30 text-amber-800 dark:text-orange-300",
  progress:
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
} as const;

export const formStyles = {
  container:
    "bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm",
  fieldGroup: "space-y-5",
} as const;

export const navStyles = {
  link: "font-medium hover:underline underline-offset-4",
  linkDisabled: "font-medium hover:underline underline-offset-4 disabled:opacity-50",
  logo: "text-4xl text-white md:text-5xl lg:text-6xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6",
  navbar:
    "flex flex-wrap items-center gap-4 sm:gap-6 sm:justify-between text-sm px-6 py-5 bg-gradient-to-r from-indigo-50/30 via-slate-50 to-indigo-50/30 dark:from-indigo-950/20 dark:via-zinc-800 dark:to-indigo-950/20 border-b border-b-foreground/10",
} as const;
