import { filterWalletSyncSections } from "@/lib/wallet-sync-sections";
import { createSectionId } from "@/lib/sections";
import type {
  MorphoPositionKind,
  MorphoPositionMapping,
  MorphoPositionTarget,
  PageType,
  PortfolioSection,
} from "@/types";

const WALLET_SYNC_DEFAULT_SECTIONS: Record<
  MorphoPositionTarget,
  { label: string; metadata: NonNullable<PortfolioSection["metadata"]> }
> = {
  assets: { label: "Crypto", metadata: { isCrypto: true } },
  liabilities: { label: "DeFi", metadata: { isDefi: true } },
  cash: { label: "DeFi Cash", metadata: { isDefi: true } },
};

export function buildWalletSyncSection(
  target: MorphoPositionTarget,
  sections: PortfolioSection[]
): PortfolioSection {
  const page = target as PageType;
  const pageSections = sections.filter((s) => s.page === page);
  const defaults = WALLET_SYNC_DEFAULT_SECTIONS[target];
  return {
    id: createSectionId(page),
    page,
    label: defaults.label,
    order: pageSections.length,
    metadata: defaults.metadata,
  };
}

/** Create a crypto/DeFi section for the target page when none exists yet. */
export function ensureWalletSyncSectionForTarget(
  sections: PortfolioSection[],
  target: MorphoPositionTarget
): { sections: PortfolioSection[]; sectionId: string } {
  const page = target as PageType;
  const pageSections = sections.filter((s) => s.page === page);
  const syncSections = filterWalletSyncSections(pageSections);
  if (syncSections[0]) {
    return { sections, sectionId: syncSections[0].id };
  }
  const newSection = buildWalletSyncSection(target, sections);
  return { sections: [...sections, newSection], sectionId: newSection.id };
}

export function defaultMorphoTargetForKind(
  kind: MorphoPositionKind | undefined
): MorphoPositionTarget {
  if (kind === "debt") return "liabilities";
  return "assets";
}

/** Debt must map to liabilities; vault/collateral cannot map to liabilities. */
export function coerceMorphoTarget(mapping: MorphoPositionMapping): MorphoPositionTarget {
  const kind = mapping.kind ?? "vault";
  if (kind === "debt") return "liabilities";
  if (mapping.target === "liabilities") return "assets";
  return mapping.target;
}

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
  const target = coerceMorphoTarget(mapping);
  const allSections = [...assetSections, ...liabilitySections, ...cashSections];
  const sectionId = mapping.sectionId?.trim();
  if (sectionId && sectionMatchesMorphoTarget(sectionId, target, allSections)) {
    return { ...mapping, target };
  }
  const nextSectionId = defaultMorphoSectionId(
    target,
    assetSections,
    liabilitySections,
    cashSections
  );
  return {
    ...mapping,
    target,
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
