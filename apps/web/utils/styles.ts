/**
 * Reusable style utilities for consistent design across the app
 */

export const cardStyles =
  "bg-white dark:bg-transparent border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 dark:grayscale";

export const textStyles = {
  muted: "text-gray-600 dark:text-gray-400",
  mutedLight: "text-gray-500 dark:text-gray-500",
  label: "text-gray-700 dark:text-gray-300",
  primary: "text-gray-900 dark:text-gray-100",
} as const;

export const badgeStyles = {
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
} as const;
