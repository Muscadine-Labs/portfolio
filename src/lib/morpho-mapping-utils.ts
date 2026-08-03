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

/** Morpho market IDs may be stored as `8453-0x...` or `0x...` — canonicalize for mapping match. */
export function normalizeMorphoPositionKey(key: string): string {
  const trimmed = key.trim().toLowerCase();
  const parts = trimmed.split(":");
  if (parts.length < 3) return trimmed;
  const network = parts[0];
  const kind = parts[1];
  const id = parts.slice(2).join(":");
  const normalizedId = id.replace(/^\d+-(?=0x)/, "");
  return `${network}:${kind}:${normalizedId}`;
}

/** Parse `kind` from `network:kind:id` when mapping.kind is missing. */
export function morphoKindFromKey(key: string): MorphoPositionKind | undefined {
  const parts = key.trim().toLowerCase().split(":");
  if (parts.length < 2) return undefined;
  const kind = parts[1];
  if (kind === "debt" || kind === "collateral" || kind === "vault") return kind;
  return undefined;
}

export function defaultMorphoTargetForKind(
  kind: MorphoPositionKind | undefined
): MorphoPositionTarget {
  if (kind === "debt") return "liabilities";
  // Vault deposits default to cash (DeFi cash / stables) — matches typical Frontier/Prime USDC.
  if (kind === "vault") return "cash";
  return "assets";
}

/** Debt must map to liabilities; vault/collateral cannot map to liabilities. */
export function coerceMorphoTarget(
  mapping: MorphoPositionMapping,
  fallbackKind?: MorphoPositionKind
): MorphoPositionTarget {
  const kind =
    mapping.kind ?? morphoKindFromKey(mapping.key) ?? fallbackKind ?? "vault";
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
  const target = coerceMorphoTarget(mapping, morphoKindFromKey(mapping.key));
  const allSections = [...assetSections, ...liabilitySections, ...cashSections];
  const sectionId = mapping.sectionId?.trim();
  const canonicalKey = normalizeMorphoPositionKey(mapping.key);
  if (sectionId && sectionMatchesMorphoTarget(sectionId, target, allSections)) {
    return { ...mapping, key: canonicalKey, target };
  }
  const nextSectionId = defaultMorphoSectionId(
    target,
    assetSections,
    liabilitySections,
    cashSections
  );
  return {
    ...mapping,
    key: canonicalKey,
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
