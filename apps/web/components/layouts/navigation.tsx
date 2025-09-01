import Link from "next/link";
import { Button } from "@/components/ui/button";
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
            className="hover:text-slate-200 transition-colors duration-200"
          >
            <span className={`${gamja.className} drop-shadow-lg`}>what.</span>
          </Link>
        </div>
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="flex flex-col sm:flex-row sm:items-center justify-between text-sm px-4 py-2 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border-b border-b-foreground/10"
        >
          <ul className="flex list-none">
            <li>
              <Button asChild variant="link">
                <Link href="/">Home</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="link">
                <Link href="/about">About</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="link">
                <Link href="/stats">Stats</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="link">
                <Link href="/search">Search</Link>
              </Button>
            </li>
            <IsLoggedIn>
              <li>
                <Button asChild variant="link">
                  <Link href="/export">Export</Link>
                </Button>
              </li>
            </IsLoggedIn>
          </ul>
          <div className="flex items-center">
            <AuthHeader />
            <ThemeSwitcher />
          </div>
        </nav>
        <YearNavigation />
      </div>
    </header>
  );
}
