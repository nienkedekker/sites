import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import YearNavigation from "@/components/lists/year-navigation";
import { Gamja_Flower } from "next/font/google";

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
        <div className="text-4xl text-white md:text-5xl lg:text-6xl bg-slate-950 dark:bg-zinc-900 p-4">
          <Link href="/" aria-label="What - Home">
            <span className={`${gamja.className}`}>what.</span>
          </Link>
        </div>
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="flex flex-col sm:flex-row sm:items-center justify-between text-sm pl-1 bg-sky-200 dark:bg-zinc-800 border-b border-b-foreground/10"
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
          </ul>
          <div className="flex items-center">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </nav>
        <YearNavigation />
      </div>
    </header>
  );
}
