/** Scroll offset so section/group targets clear the sticky header + page toolbar. */
export function getPortfolioStickyScrollOffset(): number {
  if (typeof document === "undefined") return 120;

  const header = document.querySelector("header");
  const stickyBar = document.querySelector("[data-portfolio-sticky-bar]");
  const headerHeight = header?.getBoundingClientRect().height ?? 48;
  const stickyBarHeight = stickyBar?.getBoundingClientRect().height ?? 48;

  return headerHeight + stickyBarHeight + 16;
}

export function portfolioTargetElementId(sectionId: string): string {
  if (sectionId.startsWith("group:")) {
    return `group-${sectionId.slice("group:".length)}`;
  }
  return `section-${sectionId}`;
}

export function scrollToPortfolioTarget(sectionId: string, behavior: ScrollBehavior = "smooth") {
  if (sectionId === "all") return;

  const el = document.getElementById(portfolioTargetElementId(sectionId));
  if (!el) return;

  const offset = getPortfolioStickyScrollOffset();
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}
