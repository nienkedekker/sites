"use client";

import { useEffect } from "react";
import Link from "next/link";
import PageHeader from "@nienke/ui/page-header";
import TagLink from "@nienke/ui/tag-link";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <PageHeader
          intro="Something went wrong loading this page or saving that change. If what.pm was just updated, reloading the page usually fixes it."
          className="mb-10"
        >
          That didn’t work
        </PageHeader>

        <ul className="flex flex-wrap gap-3">
          <li>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="tag cursor-pointer"
            >
              Try again
            </button>
          </li>
          <li>
            <TagLink as={Link} href="/">
              Back to the log
            </TagLink>
          </li>
        </ul>
      </div>
    </div>
  );
}
