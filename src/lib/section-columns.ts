import { isCryptoAssetSection } from "@/lib/asset-sections";
import type { PortfolioSection } from "@/types";

/** Section allows the network column (crypto / DeFi sections only). */
export function sectionShowsNetworkColumn(section: PortfolioSection): boolean {
  if (!isCryptoAssetSection(section)) return false;
  return section.metadata?.showNetworkColumn !== false;
}

/** Section allows the protocol column (crypto / DeFi sections only). */
export function sectionShowsProtocolColumn(section: PortfolioSection): boolean {
  if (!isCryptoAssetSection(section)) return false;
  return section.metadata?.showProtocolColumn !== false;
}

export function sectionHasPositionColumnOptions(section: PortfolioSection): boolean {
  return sectionShowsNetworkColumn(section) || sectionShowsProtocolColumn(section);
}

/** DeFi liability sections — Morpho loan detail columns. */
export function isDefiLiabilitySection(section: PortfolioSection): boolean {
  return section.metadata?.isDefi === true;
}

/** Crypto / DeFi liability sections — network & protocol columns. */
export function isPositionLiabilitySection(section: PortfolioSection): boolean {
  return (
    section.metadata?.isDefi === true ||
    section.metadata?.isCrypto === true
  );
}
