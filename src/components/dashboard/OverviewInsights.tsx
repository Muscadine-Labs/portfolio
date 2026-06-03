"use client";

import Link from "next/link";
import { TrendingUp, Scale, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { OverviewSnapshot } from "@/lib/overview";
import type { Asset } from "@/types";
import { getMarketValue } from "@/lib/utils";

interface OverviewInsightsProps {
  snapshot: OverviewSnapshot;
  assets: Asset[];
}

function topHolding(assets: Asset[]): { label: string; value: number; href: string } | null {
  if (assets.length === 0) return null;
  let best = assets[0];
  let bestVal = getMarketValue(best);
  for (const asset of assets) {
    const v = getMarketValue(asset);
    if (v > bestVal) {
      best = asset;
      bestVal = v;
    }
  }
  if (bestVal <= 0) return null;
  return {
    label: best.symbol || best.name,
    value: bestVal,
    href: `/assets?section=${encodeURIComponent(best.sectionId)}`,
  };
}

function largestSectionRow(snapshot: OverviewSnapshot): {
  label: string;
  value: number;
  href: string;
} | null {
  const all = [...snapshot.assets, ...snapshot.cash, ...snapshot.liabilities];
  const flat = all.flatMap((row) =>
    row.children?.length ? row.children : [row]
  );
  if (flat.length === 0) return null;
  const top = [...flat].sort((a, b) => b.value - a.value)[0];
  return top.value > 0 ? { label: top.label, value: top.value, href: top.href } : null;
}

export function OverviewInsights({ snapshot, assets }: OverviewInsightsProps) {
  const holding = topHolding(assets);
  const gross = snapshot.totalAssets + snapshot.totalCash;
  const debtRatio = gross > 0 ? (snapshot.totalLiabilities / gross) * 100 : null;
  const largest = largestSectionRow(snapshot);

  const chips: { key: string; icon: typeof TrendingUp; content: React.ReactNode }[] = [];

  if (holding) {
    chips.push({
      key: "holding",
      icon: TrendingUp,
      content: (
        <>
          Top holding{" "}
          <Link href={holding.href} className="font-medium text-foreground hover:underline">
            {holding.label}
          </Link>{" "}
          <span className="tabular-nums">{formatCurrency(holding.value)}</span>
        </>
      ),
    });
  }

  if (debtRatio != null && snapshot.totalLiabilities > 0) {
    chips.push({
      key: "debt",
      icon: Scale,
      content: (
        <>
          Debt ratio{" "}
          <span className="font-medium tabular-nums text-foreground">
            {debtRatio.toFixed(1)}%
          </span>{" "}
          of assets + cash
        </>
      ),
    });
  }

  if (largest) {
    chips.push({
      key: "section",
      icon: Layers,
      content: (
        <>
          Largest category{" "}
          <Link href={largest.href} className="font-medium text-foreground hover:underline">
            {largest.label}
          </Link>{" "}
          <span className="tabular-nums">{formatCurrency(largest.value)}</span>
        </>
      ),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ key, icon: Icon, content }) => (
        <div
          key={key}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/50 bg-muted/25 px-3 py-1.5 text-xs text-muted-foreground"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          <span className="min-w-0 truncate">{content}</span>
        </div>
      ))}
    </div>
  );
}
