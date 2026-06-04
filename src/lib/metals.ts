import type { PortfolioSection } from "@/types";

/** USD per avoirdupois pound → USD per troy ounce (COMEX copper futures). */
export const TROY_OZ_PER_LB = 1 / 14.583333333333334;

export function isMetalsSection(section?: PortfolioSection): boolean {
  if (!section) return false;
  const haystack = `${section.id} ${section.label}`.toLowerCase();
  return /metal|commodit|precious/.test(haystack);
}

export function metalPriceColumnLabel(section?: PortfolioSection): string {
  return isMetalsSection(section) ? "Price (oz)" : "Price";
}
