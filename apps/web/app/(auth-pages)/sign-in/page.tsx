import { Suspense } from "react";
import PageHeader from "@nienke/ui/page-header";
import { getRecentItems } from "@/utils/data/items";
import type { TypedItem } from "@/types/shared";
import { SignInForm } from "./sign-in-form";

const SWATCH_MAP: Record<TypedItem["itemtype"], string> = {
  Book: "bg-books",
  Movie: "bg-movies",
  Show: "bg-shows",
};

const LABEL_MAP: Record<TypedItem["itemtype"], string> = {
  Book: "Book",
  Movie: "Movie",
  Show: "TV",
};

const loggedDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

async function LastLogged() {
  const result = await getRecentItems(3);
  if (!result.success || result.data.length === 0) return null;

  return (
    <section aria-labelledby="last-logged-heading" className="mt-12">
      <h2 id="last-logged-heading" className="tag">
        Last logged
      </h2>
      <ol className="mt-4 border-t border-rule">
        {result.data.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b border-line py-3"
          >
            <span
              className={`size-2.5 shrink-0 ${SWATCH_MAP[item.itemtype]}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate font-medium tracking-[-0.01em]">
              {item.title}
            </span>
            <span className="shrink-0 font-mono text-xs text-ink-soft">
              <span className="sr-only">{LABEL_MAP[item.itemtype]}, </span>
              {item.created_at && loggedDate.format(new Date(item.created_at))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function SignInPage() {
  return (
    <div className="grid items-center gap-y-12 lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <PageHeader className="mb-0">Sign in</PageHeader>
        <div className="max-w-md">
          <Suspense fallback={null}>
            <LastLogged />
          </Suspense>
        </div>
      </div>

      <div className="lg:col-span-5">
        <Suspense
          fallback={<p className="font-mono text-xs text-ink-soft">Loading…</p>}
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
