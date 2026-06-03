"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query.
 * Pass `defaultValue: true` for max-width queries to avoid a desktop-first flash on mobile.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}
