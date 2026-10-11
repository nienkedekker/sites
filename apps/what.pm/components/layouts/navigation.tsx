import { Suspense } from "react";
import Link from "next/link";
import SiteMark from "@nienke/ui/site-mark";
import YearNavigation from "@/components/features/lists/year-navigation";
import { NavLinks, NavLinksFor } from "@/components/layouts/nav-links";

function Navigation() {
  return (
    <>
      <header className="site-header own-grain">
        <nav aria-label="Main" className="site-nav">
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

          <Suspense fallback={<NavLinksFor pathname={null} />}>
            <NavLinks />
          </Suspense>
        </nav>
      </header>
      <YearNavigation />
    </>
  );
}

export default Navigation;
