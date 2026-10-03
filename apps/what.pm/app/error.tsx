"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@nienke/ui/page-header";
import TagLink from "@nienke/ui/tag-link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="grid lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <PageHeader
          eyebrow="Error"
          intro="Something went wrong loading this page or saving that change. If what.pm was just updated, reloading the page usually fixes it."
          className="mb-10"
        >
          That didn’t work
        </PageHeader>

        <ul className="flex flex-wrap gap-3">
          <li>
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              aria-busy={retrying}
              className="tag cursor-pointer disabled:opacity-50"
            >
              {retrying ? "Trying again…" : "Try again"}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="tag cursor-pointer"
            >
              Reload the page
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
