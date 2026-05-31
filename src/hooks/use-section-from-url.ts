"use client";

import { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Reads and updates section filter via `?section=` (overview deep links). */
export function useSectionFilterFromUrl(sectionIds: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get("section");

  const sectionFilter =
    param && sectionIds.includes(param) ? param : "all";
  const highlightSectionId =
    param && sectionIds.includes(param) ? param : null;

  const setSectionFilter = (value: string) => {
    const next =
      value !== "all" && sectionIds.includes(value) ? value : "all";
    const current =
      param && sectionIds.includes(param) ? param : "all";
    if (next === current) return;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("section");
      else params.set("section", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return { sectionFilter, setSectionFilter, highlightSectionId };
}

/** Scrolls to a section card when opened from overview (`?section=`). */
export function useScrollToSectionFromUrl() {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get("section");
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sectionId || !mountedRef.current) return;

    const timer = window.setTimeout(() => {
      if (!mountedRef.current) return;
      document
        .getElementById(`section-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [sectionId]);

  return sectionId;
}
