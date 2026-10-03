"use client";

import { useEffect } from "react";
import PageHeader from "@nienke/ui/page-header";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // The root layout (and next-themes with it) is gone, so pick the theme here
  useEffect(() => {
    let theme: string | null = null;
    try {
      theme = localStorage.getItem("theme");
    } catch {}
    const dark =
      theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <title>That didn’t work · what.pm</title>
        <main className="mx-auto w-full max-w-6xl px-4 pt-16 sm:pt-24">
          <PageHeader
            eyebrow="Error"
            intro="what.pm couldn’t load. If it was just updated, reloading the page usually fixes it."
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
                Reload the page
              </button>
            </li>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load is the point here */}
              <a href="/" className="tag">
                Back to the log
              </a>
            </li>
          </ul>
        </main>
      </body>
    </html>
  );
}
