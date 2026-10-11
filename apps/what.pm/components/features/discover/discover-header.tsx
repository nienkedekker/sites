import Link from "next/link";
import UiNavLinks from "@nienke/ui/nav-links";
import PageHeader from "@nienke/ui/page-header";
import { hasRecs, hasUpcoming } from "@/utils/server/services";

// Both ways of finding what to read and watch next, under one header: new
// books, and picks from the log. A tab only shows when its service is set up
const TABS = [
  { href: "/discover", label: "New releases", shown: hasUpcoming },
  { href: "/discover/for-you", label: "For you", shown: hasRecs },
] as const;

export function DiscoverHeader({
  current,
  intro,
}: {
  current: (typeof TABS)[number]["href"];
  intro: string;
}) {
  const tabs = TABS.filter(({ shown }) => shown()).map(({ href, label }) => ({
    href,
    label,
  }));
  return (
    <>
      <PageHeader intro={intro} className="mb-8">
        Discover
      </PageHeader>
      {tabs.length > 1 && (
        <nav aria-label="Discover" className="mb-12 sm:mb-16">
          <UiNavLinks links={tabs} currentPath={current} as={Link} />
        </nav>
      )}
    </>
  );
}
