import Link from "next/link";
import SiteMark from "@nienke/ui/site-mark";
import YearNavigation from "@/components/features/lists/year-navigation";
import { NavLinks } from "@/components/layouts/nav-links";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

/**
 * Sticky site header, the same as nienke.dev's: the mark, the menu and the
 * theme toggle. The year row sits below it and scrolls away.
 */
function Navigation() {
  return (
    <>
      <header className="own-grain sticky top-0 z-[102] border-b border-rule bg-paper/70 backdrop-blur-xl backdrop-saturate-150">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4"
        >
          <Link
            href="/"
            aria-label="what., home"
            className="flex items-center gap-2.5"
          >
            <SiteMark />
            <span className="display hidden text-[1.75rem] sm:inline">
              what.
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <NavLinks />
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <YearNavigation />
    </>
  );
}

export default Navigation;
