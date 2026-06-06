import type { PortfolioSection } from "@/types";

/** Sections explicitly marked crypto or DeFi — only these accept wallet / Morpho sync. */
export function isWalletSyncSection(section: PortfolioSection): boolean {
  return section.metadata?.isCrypto === true || section.metadata?.isDefi === true;
}

export function filterWalletSyncSections(sections: PortfolioSection[]): PortfolioSection[] {
  return sections.filter(isWalletSyncSection);
}
