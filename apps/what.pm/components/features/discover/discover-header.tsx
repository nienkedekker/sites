import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import UiNavLinks from "@nienke/ui/nav-links";
import PageHeader from "@nienke/ui/page-header";
import { hasUpcoming } from "@/utils/server/services";

// Both ways of finding what to read and watch next, under one header: new
// books, and picks from the log with up next. New releases only shows with a
// Hardcover token; For you always does, as up next lives there
const TABS = [
  { href: "/discover", label: "New releases", shown: hasUpcoming },
  { href: "/discover/for-you", label: "For you", shown: () => true },
] as const;

// Something to do beside the title, like For you's box for adding to up
// next, sits on the right, level with the links under it, over a rule
export function DiscoverHeader({
  current,
  aside,
}: {
  current: (typeof TABS)[number]["href"];
  aside?: ReactNode;
}) {
  const tabs = TABS.filter(({ shown }) => shown());
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-x-10 gap-y-6 ${aside ? "mb-10 border-b border-rule pb-7" : "mb-8"}`}
    >
      <div>
        <PageHeader className="">Discover</PageHeader>
        {/* In the intro's place, drawn like the header's links, since these
          are pages too. Pulled left by a link's padding to line up with the
          title */}
        {tabs.length > 1 && (
          <nav
            aria-label="Discover"
            className="rise mt-4 -ml-2 sm:-ml-3"
            style={{ "--delay": "160ms" } as CSSProperties}
          >
            <UiNavLinks links={tabs} currentPath={current} as={Link} />
          </nav>
        )}
      </div>
      {aside}
    </div>
  );
}
