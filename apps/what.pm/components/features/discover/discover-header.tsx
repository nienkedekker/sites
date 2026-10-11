import type { CSSProperties } from "react";
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

export function DiscoverHeader({
  current,
}: {
  current: (typeof TABS)[number]["href"];
}) {
  const tabs = TABS.filter(({ shown }) => shown());
  return (
    <div className="mb-8">
      <PageHeader className="">Discover</PageHeader>
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
  );
}
