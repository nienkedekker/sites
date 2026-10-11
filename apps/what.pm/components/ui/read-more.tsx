"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// Text cut to a few lines, opened in full when there's more than fits in
// them: with "Read more" under it, or, with toggle="text", by clicking the
// text itself, for where another link would crowd it. The clamp is a class,
// like "line-clamp-3", for the text's own styles to go with
export function ReadMore({
  children,
  clamp,
  className = "",
  toggle = "link",
}: {
  children: ReactNode;
  clamp: string;
  className?: string;
  toggle?: "link" | "text";
}) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  // An element rather than a ref: it changes when the text becomes a button
  const [element, setElement] = useState<HTMLElement | null>(null);

  // Whether the clamp hides anything depends on the width, so it's measured,
  // and measured again when the column changes size
  useEffect(() => {
    if (!element || open) return;
    const measure = () =>
      setCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, open]);

  const clamped = open ? "" : clamp;
  const flip = () => setOpen((value) => !value);

  if (toggle === "text") {
    const text = (
      <span
        ref={setElement}
        // The clamp sets its own display, so block is only for the full text
        className={`transition-colors group-hover/more:text-ink ${className} ${clamped || "block"}`}
      >
        {children}
      </span>
    );
    return cut || open ? (
      <button
        type="button"
        onClick={flip}
        aria-expanded={open}
        className="group/more block w-full cursor-pointer text-left"
      >
        {text}
      </button>
    ) : (
      text
    );
  }

  return (
    <>
      <p ref={setElement} className={`${className} ${clamped}`}>
        {children}
      </p>
      {(cut || open) && (
        <button
          type="button"
          onClick={flip}
          aria-expanded={open}
          className="link mt-1 cursor-pointer font-mono text-xs text-ink-soft hover:text-ink"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}
