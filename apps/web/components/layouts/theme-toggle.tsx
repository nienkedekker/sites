"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Flips between light and dark. Until it's clicked the theme follows the
 * system. The icons switch in CSS, so there's no flash before hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-8 shrink-0 cursor-pointer place-items-center text-ink-soft transition-colors hover:bg-panel-2 hover:text-ink"
      aria-label="Toggle dark mode"
    >
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
      <Moon className="block size-4 dark:hidden" aria-hidden="true" />
    </button>
  );
}
