"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatPercent, getGainColor } from "@/lib/utils";
import { portfolioPanel } from "@/lib/portfolio-panel";

interface OverviewSummaryProps {
  netWorth: number;
  netGain: number;
  netGainPercent: number;
  totalCostBasis: number;
}

export function OverviewSummary({
  netWorth,
  netGain,
  netGainPercent,
  totalCostBasis,
}: OverviewSummaryProps) {
  const gainPositive = netGain >= 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card/80 px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-0.5">
          <p className={portfolioPanel("neutral").label}>Net worth</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
            {formatCurrency(netWorth)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cost basis{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalCostBasis)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-6 md:gap-10">
          <div className="space-y-0.5">
            <p className={portfolioPanel("neutral").label}>Net gain</p>
            <p
              className={`flex items-center gap-1 text-xl font-semibold tabular-nums md:text-2xl ${getGainColor(netGain)}`}
            >
              {gainPositive ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {formatCurrency(netGain)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className={portfolioPanel("neutral").label}>% gain</p>
            <p
              className={`flex items-center gap-1 text-xl font-semibold tabular-nums md:text-2xl ${getGainColor(netGainPercent)}`}
            >
              {gainPositive ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {formatPercent(netGainPercent)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
