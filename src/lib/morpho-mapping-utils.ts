import { filterWalletSyncSections } from "@/lib/wallet-sync-sections";
import type {
  MorphoPositionMapping,
  MorphoPositionTarget,
  PortfolioSection,
} from "@/types";

export function defaultMorphoSectionId(
  target: MorphoPositionTarget,
  assetSections: PortfolioSection[],
  liabilitySections: PortfolioSection[],
  cashSections: PortfolioSection[]
): string {
  if (target === "assets") return filterWalletSyncSections(assetSections)[0]?.id ?? "";
  if (target === "liabilities") return filterWalletSyncSections(liabilitySections)[0]?.id ?? "";
  return filterWalletSyncSections(cashSections)[0]?.id ?? "";
}

export function sectionMatchesMorphoTarget(
  sectionId: string,
  target: MorphoPositionTarget,
  sections: PortfolioSection[]
): boolean {
  const section = sections.find((s) => s.id === sectionId);
  return Boolean(
    section && section.page === target && filterWalletSyncSections([section]).length === 1
  );
}

/** Ensure each mapping has a sectionId that matches its target page (assets/cash/liabilities). */
export function normalizeMorphoMapping(
  mapping: MorphoPositionMapping,
  assetSections: PortfolioSection[],
  liabilitySections: PortfolioSection[],
  cashSections: PortfolioSection[]
): MorphoPositionMapping {
  const allSections = [...assetSections, ...liabilitySections, ...cashSections];
  const sectionId = mapping.sectionId?.trim();
  if (sectionId && sectionMatchesMorphoTarget(sectionId, mapping.target, allSections)) {
    return mapping;
  }
  const nextSectionId = defaultMorphoSectionId(
    mapping.target,
    assetSections,
    liabilitySections,
    cashSections
  );
  return {
    ...mapping,
    sectionId: nextSectionId || undefined,
    rowId: undefined,
  };
}

export function normalizeMorphoMappings(
  mappings: MorphoPositionMapping[],
  assetSections: PortfolioSection[],
  liabilitySections: PortfolioSection[],
  cashSections: PortfolioSection[]
): MorphoPositionMapping[] {
  return mappings.map((mapping) =>
    normalizeMorphoMapping(mapping, assetSections, liabilitySections, cashSections)
  );
}
