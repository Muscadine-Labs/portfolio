import type {
  Asset,
  CashAccount,
  Liability,
  MorphoPositionMapping,
  MorphoPositionTarget,
  WalletMapNode,
} from "@/types";
import { normalizeMorphoPositionKey } from "@/lib/morpho-mapping-utils";

function morphoIdNeedle(mapping: MorphoPositionMapping): string {
  const key = normalizeMorphoPositionKey(mapping.key);
  const parts = key.split(":");
  return (parts.slice(2).join(":") || key).toLowerCase();
}

function findMorphoAssetIndex(assets: Asset[], walletId: string, mapping: MorphoPositionMapping): number {
  const rowId = mapping.rowId?.trim();
  if (rowId) {
    const byRow = assets.findIndex((a) => a.id === rowId);
    if (byRow >= 0) return byRow;
  }
  const needle = morphoIdNeedle(mapping);
  return assets.findIndex(
    (a) =>
      a.walletId === walletId &&
      a.protocol === "Morpho" &&
      a.id.toLowerCase().includes(needle)
  );
}

function findMorphoLiabilityIndex(
  liabilities: Liability[],
  walletId: string,
  mapping: MorphoPositionMapping
): number {
  const rowId = mapping.rowId?.trim();
  if (rowId) {
    const byRow = liabilities.findIndex((l) => l.id === rowId);
    if (byRow >= 0) return byRow;
  }
  const needle = morphoIdNeedle(mapping);
  return liabilities.findIndex(
    (l) =>
      l.walletId === walletId &&
      l.protocol === "Morpho" &&
      l.id.toLowerCase().includes(needle)
  );
}

function findMorphoCashIndex(
  cashAccounts: CashAccount[],
  walletId: string,
  mapping: MorphoPositionMapping
): number {
  const rowId = mapping.rowId?.trim();
  if (rowId) {
    const byRow = cashAccounts.findIndex((c) => c.id === rowId);
    if (byRow >= 0) return byRow;
  }
  const needle = morphoIdNeedle(mapping);
  return cashAccounts.findIndex(
    (c) =>
      c.walletId === walletId &&
      c.protocol === "Morpho" &&
      c.id.toLowerCase().includes(needle)
  );
}

/**
 * Keep Morpho mapping.sectionId and the live portfolio row section in lockstep.
 * Call when wallet mappings are saved.
 */
export function reconcileRowsToMorphoMappings(
  walletId: string,
  mappings: MorphoPositionMapping[] | undefined,
  assets: Asset[],
  liabilities: Liability[],
  cashAccounts: CashAccount[]
): {
  assets: Asset[];
  liabilities: Liability[];
  cashAccounts: CashAccount[];
  mappings: MorphoPositionMapping[] | undefined;
} {
  if (!mappings?.length) {
    return { assets, liabilities, cashAccounts, mappings };
  }

  let nextAssets = assets;
  let nextLiabilities = liabilities;
  let nextCash = cashAccounts;
  const nextMappings = mappings.map((mapping) => {
    if (!mapping.enabled || !mapping.sectionId) return mapping;
    const sectionId = mapping.sectionId;

    if (mapping.target === "assets") {
      const idx = findMorphoAssetIndex(nextAssets, walletId, mapping);
      if (idx < 0) return { ...mapping, rowId: undefined };
      if (nextAssets[idx].sectionId !== sectionId) {
        nextAssets = [...nextAssets];
        nextAssets[idx] = { ...nextAssets[idx], sectionId };
      }
      return { ...mapping, rowId: nextAssets[idx].id };
    }

    if (mapping.target === "liabilities") {
      const idx = findMorphoLiabilityIndex(nextLiabilities, walletId, mapping);
      if (idx < 0) return { ...mapping, rowId: undefined };
      if (nextLiabilities[idx].sectionId !== sectionId) {
        nextLiabilities = [...nextLiabilities];
        nextLiabilities[idx] = { ...nextLiabilities[idx], sectionId };
      }
      return { ...mapping, rowId: nextLiabilities[idx].id };
    }

    const idx = findMorphoCashIndex(nextCash, walletId, mapping);
    if (idx < 0) return { ...mapping, rowId: undefined };
    if (nextCash[idx].sectionId !== sectionId) {
      nextCash = [...nextCash];
      nextCash[idx] = { ...nextCash[idx], sectionId };
    }
    return { ...mapping, rowId: nextCash[idx].id };
  });

  return {
    assets: nextAssets,
    liabilities: nextLiabilities,
    cashAccounts: nextCash,
    mappings: nextMappings,
  };
}

/**
 * When a Morpho-managed row moves section on Assets/Cash/Liabilities,
 * update the wallet mapping to the same section (and target page).
 */
export function reconcileMorphoMappingsToRow(
  wallets: WalletMapNode[],
  row: { id: string; walletId?: string; sectionId: string; protocol?: string },
  target: MorphoPositionTarget
): WalletMapNode[] {
  if (!row.walletId || row.protocol !== "Morpho") return wallets;

  return wallets.map((wallet) => {
    if (wallet.id !== row.walletId || !wallet.morphoMappings?.length) return wallet;

    let changed = false;
    const morphoMappings = wallet.morphoMappings.map((mapping) => {
      const rowId = mapping.rowId?.trim();
      const needle = morphoIdNeedle(mapping);
      const linked =
        (rowId && rowId === row.id) || row.id.toLowerCase().includes(needle);
      if (!linked) return mapping;
      if (mapping.sectionId === row.sectionId && mapping.target === target) {
        return { ...mapping, rowId: row.id };
      }
      changed = true;
      return {
        ...mapping,
        target,
        sectionId: row.sectionId,
        rowId: row.id,
      };
    });

    return changed ? { ...wallet, morphoMappings } : wallet;
  });
}
