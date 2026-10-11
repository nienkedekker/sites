"use client";

import { Fragment, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { canSwell, registerSwell, subscribeSwell, swellWords } from "./swell";

export default function SwellText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = useSyncExternalStore(subscribeSwell, canSwell, () => false);

  useLayoutEffect(() => {
    if (enabled && ref.current) return registerSwell(ref.current);
  }, [enabled, children]);

  if (!enabled) return <>{children}</>;

  return (
    <span ref={ref}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {swellWords(children).map((letters, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="swell-w">
              {letters.map((ch, j) => (
                <span key={j} className="swell-l">
                  {ch}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
