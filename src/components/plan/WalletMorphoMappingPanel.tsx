"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/format-error";
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

function defaultSectionId(
  target: MorphoPositionTarget,
  links: {
    assetsSectionId?: string;
    liabilitiesSectionId?: string;
    cashSectionId?: string;
  }
): string {
  if (target === "assets") return links.assetsSectionId ?? "";
  if (target === "liabilities") return links.liabilitiesSectionId ?? "";
  return links.cashSectionId ?? "";
}

export function WalletMorphoMappingPanel({
  addressEntries,
  links,
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
  links: {
    assetsSectionId?: string;
    cashSectionId?: string;
    liabilitiesSectionId?: string;
  };
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

  const mappingByKey = useMemo(
    () => new Map(mappings.map((m) => [m.key, m])),
    [mappings]
  );

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
        ? assetSections
        : target === "liabilities"
          ? liabilitySections
          : cashSections;
    return list.map((s) => ({ value: s.id, label: s.label }));
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
          sectionId: prev?.sectionId ?? defaultSectionId(target, links),
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
            Scan Ethereum/Base addresses, then choose where each position syncs.
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

      {positions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No scan yet — click Scan to load vault, collateral, and debt positions from Morpho.
        </p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {positions.map((item) => {
            const mapping = mappingByKey.get(item.key);
            if (!mapping) return null;
            const target = mapping.target;
            const sectionId = mapping.sectionId ?? "";
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
                      {item.kind} · {item.network} · {fmtUsd(item.usdValue)}
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
                          sectionId: defaultSectionId(nextTarget, links),
                          rowId: undefined,
                        });
                      }}
                      options={TARGET_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Section</Label>
                    <NativeSelect
                      value={sectionId}
                      onValueChange={(value) =>
                        updateMapping(item.key, { sectionId: value, rowId: undefined })
                      }
                      options={sectionOptions(target)}
                      placeholder="Choose section"
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
