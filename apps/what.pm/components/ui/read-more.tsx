"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

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
  const [element, setElement] = useState<HTMLElement | null>(null);

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
