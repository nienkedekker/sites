import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import PageHeader from "@nienke/ui/page-header";
import TagLink from "@nienke/ui/tag-link";
import { LastLogged } from "@/components/features/lists/last-logged";
import { thisYear } from "@/utils/server/clock";

export const metadata: Metadata = {
  title: "Not found",
};

export default async function NotFound() {
  const year = await thisYear();

  return (
    <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <PageHeader intro="¯\_(ツ)_/¯" className="mb-10">
          404
        </PageHeader>

        <nav aria-label="Elsewhere on what.pm">
          <ul className="flex flex-wrap gap-3">
            <li>
              <TagLink as={Link} href={`/year/${year}`}>
                {year} so far
              </TagLink>
            </li>
            <li>
              <TagLink as={Link} href="/search">
                Search log
              </TagLink>
            </li>
            <li>
              <TagLink as={Link} href="/stats">
                Stats
              </TagLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="lg:col-span-5">
        <Suspense fallback={null}>
          <LastLogged limit={5} />
        </Suspense>
      </div>
    </div>
  );
}
