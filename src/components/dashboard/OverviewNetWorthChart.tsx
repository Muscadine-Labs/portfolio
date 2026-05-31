"use client";

import { useMemo } from "react";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { hasNetWorthCostBasisSeries, netWorthChartYDomain } from "@/lib/overview-chart";
import { cn, formatCurrency, getGainColor } from "@/lib/utils";
import type { NetWorthSnapshot } from "@/types";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewNetWorthChartProps {
  data: NetWorthSnapshot[];
}

type ChartRow = NetWorthSnapshot & {
  gain?: number;
};

function enrichChartData(data: NetWorthSnapshot[]): ChartRow[] {
  return data.map((row) => ({
    ...row,
    gain:
      row.totalCostBasis != null && row.totalCostBasis > 0
        ? row.netWorth - row.totalCostBasis
        : undefined,
  }));
}

function NetWorthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  let netWorth: number | undefined;
  let totalCostBasis: number | undefined;

  for (const entry of payload) {
    if (entry.dataKey === "netWorth") netWorth = Number(entry.value ?? 0);
    if (entry.dataKey === "totalCostBasis") totalCostBasis = Number(entry.value ?? 0);
  }

  const gain =
    netWorth != null && totalCostBasis != null ? netWorth - totalCostBasis : undefined;

  return (
    <div className="min-w-[11rem] rounded border border-border/80 bg-popover px-3 py-2 font-mono shadow-md">
      <p className="mb-2 border-b border-border/50 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {netWorth != null ? (
        <div className="flex justify-between gap-6 text-xs">
          <span className="text-muted-foreground">Net worth</span>
          <span className="font-semibold tabular-nums">{formatCurrency(netWorth)}</span>
        </div>
      ) : null}
      {totalCostBasis != null ? (
        <div className="mt-1 flex justify-between gap-6 text-xs">
          <span className="text-muted-foreground">Cost basis</span>
          <span className="tabular-nums">{formatCurrency(totalCostBasis)}</span>
        </div>
      ) : null}
      {gain != null ? (
        <div className="mt-1 flex justify-between gap-6 text-xs">
          <span className="text-muted-foreground">Gain</span>
          <span className={cn("font-medium tabular-nums", getGainColor(gain))}>
            {formatCurrency(gain)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ChartLegend({
  barColor,
  costBasisColor,
  showCostBasis,
}: {
  barColor: string;
  costBasisColor: string;
  showCostBasis: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 px-2 pb-1 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-2 rounded-sm" style={{ backgroundColor: barColor }} />
        Net worth
      </span>
      {showCostBasis ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-5 border-t-2"
            style={{ borderColor: costBasisColor }}
          />
          Cost basis
        </span>
      ) : null}
    </div>
  );
}

export function OverviewNetWorthChart({ data }: OverviewNetWorthChartProps) {
  const { uiPreferences } = usePortfolio();
  const chart = uiPreferences.overviewChart;
  const chartData = useMemo(() => enrichChartData(data), [data]);
  const yDomain = useMemo(() => netWorthChartYDomain(data), [data]);
  const showCostBasis =
    chart.showCostBasisLine && hasNetWorthCostBasisSeries(data);
  const barSize = chartData.length > 12 ? 44 : chartData.length > 8 ? 52 : 64;

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80">
      <CardContent className="p-0">
        <ClientOnly
          fallback={
            <div className="h-[380px] w-full animate-pulse bg-muted/20" />
          }
        >
          {data.length === 0 ? (
            <p className="flex h-[380px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
              No history yet. Add periods in Settings → Data or enable monthly auto-snapshot.
            </p>
          ) : (
            <>
              <ChartLegend
                barColor={chart.barColor}
                costBasisColor={chart.costBasisLineColor}
                showCostBasis={showCostBasis}
              />
              <div className="border-t border-border/40 bg-muted/[0.08] px-2 pb-3 pt-1">
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                    barCategoryGap="8%"
                  >
                    <CartesianGrid
                      strokeDasharray="1 4"
                      stroke="currentColor"
                      className="text-border/40"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="period"
                      tick={{
                        fontSize: 10,
                        fontFamily: "ui-monospace, monospace",
                      }}
                      className="fill-muted-foreground"
                      axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={28}
                      dy={8}
                    />
                    <YAxis
                      domain={yDomain}
                      tickFormatter={(v) => {
                        const n = Number(v);
                        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
                        return `$${Math.round(n / 1000)}k`;
                      }}
                      tick={{
                        fontSize: 10,
                        fontFamily: "ui-monospace, monospace",
                      }}
                      className="fill-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      content={<NetWorthTooltip />}
                      cursor={{ fill: "var(--foreground)", opacity: 0.04 }}
                    />

                    <Bar
                      dataKey="netWorth"
                      fill={chart.barColor}
                      fillOpacity={0.88}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={barSize}
                      isAnimationActive={false}
                    />

                    {showCostBasis ? (
                      <Line
                        type="monotone"
                        dataKey="totalCostBasis"
                        stroke={chart.costBasisLineColor}
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "var(--background)",
                          stroke: chart.costBasisLineColor,
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 4,
                          stroke: "var(--background)",
                          strokeWidth: 2,
                          fill: chart.costBasisLineColor,
                        }}
                        isAnimationActive={false}
                      />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
