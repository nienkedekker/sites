import Link from "next/link";
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
    <PageHeader
      tabs={
        tabs.length > 1
          ? { label: "Discover", links: tabs, current, as: Link }
          : undefined
      }
      className="mb-8"
    >
      Discover
    </PageHeader>
  );
}
