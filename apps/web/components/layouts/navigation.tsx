import Link from "next/link";
import YearNavigation from "@/components/features/lists/year-navigation";
import { Gamja_Flower } from "next/font/google";
import { AuthHeader } from "@/components/layouts/auth-header";
import IsLoggedIn from "@/components/auth/is-logged-in";
import { navStyles } from "@/utils/styles";

const gamja = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
});

/** Navigation links configuration */
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
] as const;

/**
 * Main navigation header component.
 * Includes logo, nav links, auth controls, and year navigation.
 */
function Navigation() {
  return (
    <header>
      <a href="#main-content" className="sr-only skip-link">
        Skip to main content
      </a>
      <div className="border-b border-b-foreground/10 flex flex-col gap-0">
        <div className={navStyles.logo}>
          <Link
            href="/"
            aria-label="What - Home"
            className="hover:text-indigo-100 transition-colors duration-200"
          >
            <span className={`${gamja.className} drop-shadow-lg`}>what.</span>
          </Link>
        </div>
        <nav aria-label="Main navigation" className={navStyles.navbar}>
          <ul className="flex flex-wrap gap-4 sm:gap-6 list-none">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={navStyles.link}>
                  {label}
                </Link>
              </li>
            ))}
            <IsLoggedIn>
              <li>
                <Link href="/export" className={navStyles.link}>
                  Export
                </Link>
              </li>
            </IsLoggedIn>
          </ul>
          <AuthHeader />
        </nav>
        <YearNavigation />
      </div>
    </header>
  );
}

export default Navigation;
