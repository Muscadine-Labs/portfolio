"use client";

import { useMemo, useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/format-error";
import {
  filterWalletSyncSections,
} from "@/lib/wallet-sync-sections";
import {
  defaultMorphoSectionId,
  normalizeMorphoMappings,
  sectionMatchesMorphoTarget,
} from "@/lib/morpho-mapping-utils";
import type {
  Asset,
  CashAccount,
  Liability,
  MorphoPositionKind,
  MorphoPositionMapping,
  MorphoPositionTarget,
  PortfolioSection,
  WalletAddressEntry,
} from "@/types";

export type MorphoPreviewItem = {
  key: string;
  kind: MorphoPositionKind;
  network: string;
  label: string;
  symbol: string;
  underlyingSymbol: string;
  quantity: number;
  underlyingQuantity: number;
  priceUsd: number;
  underlyingPriceUsd: number;
  usdValue: number;
  vaultAddress: string;
  version: "v1" | "v2";
};

const TARGET_OPTIONS: { value: MorphoPositionTarget; label: string }[] = [
  { value: "assets", label: "Assets" },
  { value: "liabilities", label: "Liabilities" },
  { value: "cash", label: "Cash" },
];

function fmtUsd(value: number): string {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "—";
}

function defaultTarget(kind: MorphoPositionKind): MorphoPositionTarget {
  if (kind === "debt") return "liabilities";
  return "assets";
}

function networkFromMappingKey(key: string): string {
  return key.split(":")[0]?.trim() || "ethereum";
}

function mappingToPreviewItem(mapping: MorphoPositionMapping): MorphoPreviewItem {
  const kind = mapping.kind ?? "vault";
  return {
    key: mapping.key,
    kind,
    network: networkFromMappingKey(mapping.key),
    label: mapping.label ?? mapping.key,
    symbol: "",
    underlyingSymbol: "",
    quantity: 0,
    underlyingQuantity: 0,
    priceUsd: 0,
    underlyingPriceUsd: 0,
    usdValue: 0,
    vaultAddress: "",
    version: "v1",
  };
}

/** Vault/collateral → assets or cash; debt → liabilities only. */
function targetOptionsForKind(kind: MorphoPositionKind): typeof TARGET_OPTIONS {
  if (kind === "debt") {
    return TARGET_OPTIONS.filter((option) => option.value === "liabilities");
  }
  return TARGET_OPTIONS.filter((option) => option.value !== "liabilities");
}

function defaultSectionId(
  target: MorphoPositionTarget,
  assetSections: PortfolioSection[],
  liabilitySections: PortfolioSection[],
  cashSections: PortfolioSection[]
): string {
  return defaultMorphoSectionId(target, assetSections, liabilitySections, cashSections);
}

export function WalletMorphoMappingPanel({
  addressEntries,
  assetSections,
  liabilitySections,
  cashSections,
  assets,
  liabilities,
  cashAccounts,
  mappings,
  onChange,
}: {
  addressEntries: WalletAddressEntry[];
  assetSections: PortfolioSection[];
  liabilitySections: PortfolioSection[];
  cashSections: PortfolioSection[];
  assets: Asset[];
  liabilities: Liability[];
  cashAccounts: CashAccount[];
  mappings: MorphoPositionMapping[];
  onChange: (next: MorphoPositionMapping[]) => void;
}) {
  const hasEvm = addressEntries.some((entry) =>
    entry.networks.some((n) => n === "ethereum" || n === "base")
  );
  const [scanning, setScanning] = useState(false);
  const [positions, setPositions] = useState<MorphoPreviewItem[]>([]);

  const syncAssetSections = useMemo(
    () => filterWalletSyncSections(assetSections),
    [assetSections]
  );
  const syncLiabilitySections = useMemo(
    () => filterWalletSyncSections(liabilitySections),
    [liabilitySections]
  );
  const syncCashSections = useMemo(
    () => filterWalletSyncSections(cashSections),
    [cashSections]
  );

  const mappingByKey = useMemo(
    () => new Map(mappings.map((m) => [m.key, m])),
    [mappings]
  );

  /** Saved mappings + latest scan — edit target/section without re-scanning. */
  const displayItems = useMemo(() => {
    const byKey = new Map<string, MorphoPreviewItem>();
    for (const mapping of mappings) {
      byKey.set(mapping.key, mappingToPreviewItem(mapping));
    }
    for (const item of positions) {
      byKey.set(item.key, item);
    }
    return [...byKey.values()];
  }, [mappings, positions]);

  useEffect(() => {
    if (mappings.length === 0) return;
    const normalized = normalizeMorphoMappings(
      mappings,
      assetSections,
      liabilitySections,
      cashSections
    );
    const changed = normalized.some(
      (mapping, index) =>
        mapping.sectionId !== mappings[index]?.sectionId ||
        mapping.rowId !== mappings[index]?.rowId
    );
    if (changed) onChange(normalized);
  }, [mappings, assetSections, liabilitySections, cashSections, onChange]);

  if (!hasEvm) return null;

  const rowOptions = (target: MorphoPositionTarget, sectionId: string) => {
    if (!sectionId) return [];
    if (target === "assets") {
      return assets
        .filter((a) => a.sectionId === sectionId)
        .map((a) => ({ value: a.id, label: `${a.symbol} — ${a.name}` }));
    }
    if (target === "liabilities") {
      return liabilities
        .filter((l) => l.sectionId === sectionId)
        .map((l) => ({ value: l.id, label: l.name }));
    }
    return cashAccounts
      .filter((c) => c.sectionId === sectionId)
      .map((c) => ({ value: c.id, label: c.name }));
  };

  const sectionOptions = (target: MorphoPositionTarget) => {
    const list =
      target === "assets"
        ? syncAssetSections
        : target === "liabilities"
          ? syncLiabilitySections
          : syncCashSections;
    return list.map((s) => ({ value: s.id, label: s.label }));
  };

  const resolveSectionId = (target: MorphoPositionTarget, sectionId: string | undefined) => {
    if (sectionId && sectionMatchesMorphoTarget(sectionId, target, [
      ...assetSections,
      ...liabilitySections,
      ...cashSections,
    ])) {
      return sectionId;
    }
    return defaultSectionId(target, assetSections, liabilitySections, cashSections);
  };

  const updateMapping = (key: string, patch: Partial<MorphoPositionMapping>) => {
    const existing = mappingByKey.get(key);
    if (!existing) return;
    onChange(
      mappings.map((m) => (m.key === key ? { ...m, ...patch } : m))
    );
  };

  const scanMorpho = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/wallets/morpho-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: addressEntries }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Morpho scan failed", {
          description: apiErrorMessage(data.error, "Unknown error"),
        });
        return;
      }
      const found = (data.positions ?? []) as MorphoPreviewItem[];
      setPositions(found);

      const next: MorphoPositionMapping[] = found.map((item) => {
        const prev = mappingByKey.get(item.key);
        const target = prev?.target ?? defaultTarget(item.kind);
        return {
          key: item.key,
          enabled: prev?.enabled ?? true,
          target,
          sectionId: resolveSectionId(
            target,
            prev?.sectionId ??
              defaultSectionId(target, assetSections, liabilitySections, cashSections)
          ),
          rowId: prev?.rowId,
          label: item.label,
          kind: item.kind,
        };
      });
      onChange(next);

      toast.success(`Found ${found.length} Morpho position(s)`);
    } catch (err) {
      toast.error("Morpho scan failed", {
        description: err instanceof Error ? err.message : "Could not reach the server.",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Morpho positions</p>
          <p className="text-xs text-muted-foreground">
            Scan Ethereum/Base addresses, then map each position to a crypto or DeFi section
            (not brokerage, Roth, etc.).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={scanning}
          onClick={scanMorpho}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
          Scan
        </Button>
      </div>

      {displayItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No Morpho positions yet — click Scan to load vault, collateral, and debt positions from
          Morpho. Mark sections as crypto or DeFi in Assets / Liabilities / Cash settings to use
          them here.
        </p>
      ) : syncAssetSections.length === 0 &&
        syncLiabilitySections.length === 0 &&
        syncCashSections.length === 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          No crypto/DeFi sections found. Edit a section and enable the crypto or DeFi toggle before
          mapping Morpho positions.
        </p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {displayItems.map((item) => {
            const mapping = mappingByKey.get(item.key);
            if (!mapping) return null;
            const kind = mapping.kind ?? item.kind;
            const target = mapping.target;
            const sectionId = mapping.sectionId ?? "";
            const targetOptions = targetOptionsForKind(kind);
            const scanned = positions.some((p) => p.key === item.key);
            return (
              <div key={item.key} className="space-y-2 rounded-md border border-border/50 p-2">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={mapping.enabled}
                    onChange={(e) =>
                      updateMapping(item.key, { enabled: e.target.checked })
                    }
                    className="mt-1 size-4 rounded border-input"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {kind} · {item.network}
                      {scanned && item.usdValue > 0 ? ` · ${fmtUsd(item.usdValue)}` : null}
                      {!scanned ? " · re-scan to refresh USD value" : null}
                    </p>
                  </div>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Add to</Label>
                    <NativeSelect
                      value={target}
                      onValueChange={(value) => {
                        const nextTarget = value as MorphoPositionTarget;
                        updateMapping(item.key, {
                          target: nextTarget,
                          sectionId: defaultSectionId(
                            nextTarget,
                            assetSections,
                            liabilitySections,
                            cashSections
                          ),
                          rowId: undefined,
                        });
                      }}
                      options={targetOptions}
                      disabled={targetOptions.length <= 1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Section</Label>
                    <NativeSelect
                      value={resolveSectionId(target, sectionId)}
                      onValueChange={(value) =>
                        updateMapping(item.key, { sectionId: value, rowId: undefined })
                      }
                      options={sectionOptions(target)}
                      placeholder={
                        sectionOptions(target).length
                          ? "Choose section"
                          : "No crypto/DeFi sections"
                      }
                      disabled={sectionOptions(target).length === 0}
                    />
                  </div>
                </div>
                {sectionId ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Merge into existing row (optional)</Label>
                    <NativeSelect
                      value={mapping.rowId ?? ""}
                      onValueChange={(value) =>
                        updateMapping(item.key, { rowId: value || undefined })
                      }
                      options={rowOptions(target, sectionId)}
                      placeholder="Create new row"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
