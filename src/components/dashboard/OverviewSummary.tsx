"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatPercent, getGainColor } from "@/lib/utils";
import type { PeriodChangeSummary } from "@/lib/overview-period";
import { cn } from "@/lib/utils";

interface OverviewSummaryProps {
  netWorth: number;
  netGain: number;
  netGainPercent: number;
  totalCostBasis: number;
  periodChange?: PeriodChangeSummary | null;
}

export function OverviewSummary({
  netWorth,
  netGain,
  netGainPercent,
  totalCostBasis,
  periodChange,
}: OverviewSummaryProps) {
  const gainPositive = netGain >= 0;
  const periodPositive = periodChange ? periodChange.delta >= 0 : true;

  return (
    <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 px-5 py-6 shadow-sm md:px-8 md:py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Net worth
      </p>
      <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl md:text-6xl">
        {formatCurrency(netWorth)}
      </p>

      {periodChange ? (
        <p
          className={cn(
            "mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium tabular-nums",
            getGainColor(periodChange.delta)
          )}
        >
          {periodPositive ? (
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          ) : (
            <ArrowDownRight className="h-4 w-4 shrink-0" />
          )}
          <span>
            {periodChange.delta >= 0 ? "+" : ""}
            {formatCurrency(periodChange.delta)}
          </span>
          {periodChange.percent != null ? (
            <span className="text-muted-foreground">
              ({periodChange.delta >= 0 ? "+" : ""}
              {formatPercent(periodChange.percent)})
            </span>
          ) : null}
          <span className="font-normal text-muted-foreground">{periodChange.label}</span>
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-6 border-t border-border/40 pt-5 md:gap-10">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Net gain
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-xl font-semibold tabular-nums md:text-2xl",
              getGainColor(netGain)
            )}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            % gain
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-xl font-semibold tabular-nums md:text-2xl",
              getGainColor(netGainPercent)
            )}
          >
            {gainPositive ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
            {formatPercent(netGainPercent)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Cost basis
          </p>
          <p className="text-xl font-semibold tabular-nums text-foreground md:text-2xl">
            {formatCurrency(totalCostBasis)}
          </p>
        </div>
      </div>
    </section>
  );
}
