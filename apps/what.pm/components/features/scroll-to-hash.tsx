"use client";

import { useEffect } from "react";

/**
 * Scrolls to the element named in the URL hash, e.g. the item just created.
 * Render it inside the same Suspense boundary as that element: the list
 * streams in after Next has already looked for the hash and given up.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    // "instant" overrides the page's scroll-behavior: smooth
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);

  return null;
}
