"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatPercent, getGainColor } from "@/lib/utils";

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
    <div className="rounded-xl border border-border/60 bg-card/80 px-6 py-5">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
            {formatCurrency(netWorth)}
          </p>
          <p className="text-sm text-muted-foreground">
            Total Cost Basis{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalCostBasis)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-8 md:gap-12">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Net Gain</p>
            <p
              className={`flex items-center gap-1 text-2xl font-semibold tabular-nums ${getGainColor(netGain)}`}
            >
              {gainPositive ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {formatCurrency(netGain)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">% Gain</p>
            <p
              className={`flex items-center gap-1 text-2xl font-semibold tabular-nums ${getGainColor(netGainPercent)}`}
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
