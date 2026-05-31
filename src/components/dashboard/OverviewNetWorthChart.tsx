"use client";

import { useMemo } from "react";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { netWorthChartYDomain } from "@/lib/overview-chart";
import { formatCurrency } from "@/lib/utils";
import type { NetWorthSnapshot, OverviewChartLineType } from "@/types";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewNetWorthChartProps {
  data: NetWorthSnapshot[];
}

function NetWorthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}

export function OverviewNetWorthChart({ data }: OverviewNetWorthChartProps) {
  const { uiPreferences } = usePortfolio();
  const chart = uiPreferences.overviewChart;
  const yDomain = useMemo(() => netWorthChartYDomain(data), [data]);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold">Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientOnly
          fallback={
            <div className="h-[400px] w-full min-w-0 animate-pulse rounded-md bg-muted/30" />
          }
        >
          {!chart.showBar && !chart.showLine ? (
            <p className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              Enable bar or line chart in Settings → Display.
            </p>
          ) : (
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data} margin={{ top: 28, right: 16, left: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="nwBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.barColor} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={chart.barColor} stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="nwAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.lineColor} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={chart.lineColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/70"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    domain={yDomain}
                    tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<NetWorthTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.15 }} />
                  {chart.showLine ? (
                    <Area
                      type={chart.lineType as OverviewChartLineType}
                      dataKey="netWorth"
                      fill="url(#nwAreaGradient)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  ) : null}
                  {chart.showBar ? (
                    <Bar
                      dataKey="netWorth"
                      fill="url(#nwBarGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  ) : null}
                  {chart.showLine ? (
                    <Line
                      type={chart.lineType as OverviewChartLineType}
                      dataKey="netWorth"
                      stroke={chart.lineColor}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chart.lineColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
