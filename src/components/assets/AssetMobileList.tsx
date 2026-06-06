"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPercent, getGain, getGainColor, getMarketValue } from "@/lib/utils";
import type { Asset } from "@/types";

interface AssetMobileListProps {
  assets: Asset[];
  totalPortfolioMV: number;
  onEdit: (asset: Asset) => void;
}

export function AssetMobileList({ assets, totalPortfolioMV, onEdit }: AssetMobileListProps) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-2 md:hidden">
      {assets.map((asset) => {
        const mv = getMarketValue(asset);
        const gain = getGain(asset);
        const pctPort = totalPortfolioMV > 0 ? (mv / totalPortfolioMV) * 100 : 0;

        return (
          <div
            key={asset.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/80 px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold tracking-wide">{asset.symbol}</span>
                <span className="truncate text-xs text-muted-foreground">{asset.name}</span>
              </div>
              <p className="mt-0.5 text-sm font-medium tabular-nums">{formatCurrency(mv)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatPercent(pctPort)} of portfolio
                {gain != null ? (
                  <span className={cn("ml-2", getGainColor(gain.dollars))}>
                    · {formatCurrency(gain.dollars)} ({formatPercent(gain.percent)})
                  </span>
                ) : null}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onEdit(asset)}
              aria-label={`Edit ${asset.symbol}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
