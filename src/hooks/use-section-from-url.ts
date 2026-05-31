"use client";

import { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { scrollToPortfolioTarget } from "@/lib/portfolio-scroll";

/** Reads and updates section filter via `?section=` (overview deep links). */
export function useSectionFilterFromUrl(filterIds: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get("section");

  const sectionFilter = param && filterIds.includes(param) ? param : "all";
  const highlightSectionId =
    param && filterIds.includes(param) && !param.startsWith("group:") ? param : null;

  const setSectionFilter = (value: string) => {
    const next = value !== "all" && filterIds.includes(value) ? value : "all";
    const current = param && filterIds.includes(param) ? param : "all";
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
      scrollToPortfolioTarget(sectionId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [sectionId]);

  return sectionId;
}

/** Scroll to a section or group block after toolbar pill / nav selection. */
export function scrollToPortfolioSection(sectionId: string) {
  scrollToPortfolioTarget(sectionId);
}
