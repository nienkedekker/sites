import Link from "next/link";
import PageHeader from "@nienke/ui/page-header";
import { hasUpcoming } from "@/utils/server/services";

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
