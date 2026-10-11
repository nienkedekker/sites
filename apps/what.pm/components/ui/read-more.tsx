"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// Text cut to a few lines, with "Read more" when there's more than fits in
// them. The clamp is a class, like "line-clamp-3", for the text's own styles
// to go with
export function ReadMore({
  children,
  clamp,
  className = "",
}: {
  children: ReactNode;
  clamp: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Whether the clamp hides anything depends on the width, so it's measured,
  // and measured again when the column changes size
  useEffect(() => {
    const element = ref.current;
    if (!element || open) return;
    const measure = () =>
      setCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  return (
    <>
      <p ref={ref} className={`${className} ${open ? "" : clamp}`}>
        {children}
      </p>
      {(cut || open) && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="link mt-1 cursor-pointer font-mono text-xs text-ink-soft hover:text-ink"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}
