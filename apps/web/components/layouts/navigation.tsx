import Link from "next/link";
import { ThemeSwitcher } from "@/components/features/theme-switcher";
import YearNavigation from "@/components/features/lists/year-navigation";
import { Gamja_Flower } from "next/font/google";
import { AuthHeader } from "@/components/layouts/auth-header";
import IsLoggedIn from "@/components/auth/is-logged-in";

const gamja = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
});

export default function Navigation() {
  return (
    <header role="banner">
      <a href="#main-content" className="sr-only skip-link">
        Skip to main content
      </a>
      <div className="border-b border-b-foreground/10 flex flex-col gap-0">
        <div className="text-4xl text-white md:text-5xl lg:text-6xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
          <Link
            href="/"
            aria-label="What - Home"
            className="hover:text-indigo-100 transition-colors duration-200"
          >
            <span className={`${gamja.className} drop-shadow-lg`}>what.</span>
          </Link>
        </div>
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="flex flex-wrap items-center justify-between gap-x-1 text-sm px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-50/30 via-slate-50 to-indigo-50/30 dark:from-indigo-950/20 dark:via-zinc-800 dark:to-indigo-950/20 border-b border-b-foreground/10"
        >
          <ul className="flex flex-wrap gap-4 sm:gap-6 list-none">
            <li>
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                About
              </Link>
            </li>
            <li>
              <Link href="/stats" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Stats
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Search
              </Link>
            </li>
            <IsLoggedIn>
              <li>
                <Link href="/export" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Export
                </Link>
              </li>
            </IsLoggedIn>
          </ul>
          <div className="flex items-center gap-4 sm:gap-6">
            <AuthHeader />
            <ThemeSwitcher />
          </div>
        </nav>
        <YearNavigation />
      </div>
    </header>
  );
}
