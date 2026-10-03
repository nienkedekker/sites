"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  LOW_POWER_CLASS,
  prefersLessMotion,
  watchLowPower,
} from "@nienke/ui/motion";

/** Marks <html> while the battery is low enough for Chrome's Energy Saver. */
export function LowPower() {
  useEffect(
    () =>
      watchLowPower((low) =>
        document.documentElement.classList.toggle(LOW_POWER_CLASS, low),
      ),
    [],
  );

  return null;
}

function subscribe(onChange: () => void) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const observer = new MutationObserver(onChange);
  query.addEventListener("change", onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => {
    query.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/** For motion CSS can't reach, like recharts' JS animations. */
export function useLessMotion() {
  return useSyncExternalStore(subscribe, prefersLessMotion, () => true);
}
