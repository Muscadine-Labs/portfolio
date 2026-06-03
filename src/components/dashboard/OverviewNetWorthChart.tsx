"use client";

import { useMemo } from "react";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  filterNetWorthHistory,
  getAvailableChartPeriods,
  NET_WORTH_CHART_PERIOD_DEFS,
  type NetWorthChartPeriod,
} from "@/lib/overview-period";
import {
  formatNetWorthAxisTick,
  hasNetWorthCostBasisSeries,
  netWorthChartScale,
} from "@/lib/overview-chart";
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

/** Chart frame + grid — darker strokes for readable axes and dividers. */
const AXIS_LINE = {
  stroke: "var(--foreground)",
  strokeWidth: 1,
  strokeOpacity: 0.5,
};

const AXIS_TICK_LINE = {
  stroke: "var(--foreground)",
  strokeWidth: 1,
  strokeOpacity: 0.4,
};

const GRID_LINE = {
  stroke: "var(--foreground)",
  strokeWidth: 1,
  strokeOpacity: 0.32,
  strokeDasharray: "4 4",
};

interface OverviewNetWorthChartProps {
  data: NetWorthSnapshot[];
  period?: NetWorthChartPeriod;
  onPeriodChange?: (period: NetWorthChartPeriod) => void;
}

type ChartRow = NetWorthSnapshot & {
  index: number;
  gain?: number;
};

function enrichChartData(data: NetWorthSnapshot[]): ChartRow[] {
  return data.map((row, index) => ({
    ...row,
    index,
    gain:
      row.totalCostBasis != null && row.totalCostBasis > 0
        ? row.netWorth - row.totalCostBasis
        : undefined,
  }));
}

function NetWorthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; payload?: ChartRow }[];
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const label = row?.period;
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

function ChartPeriodSelector({
  period,
  availablePeriods,
  onPeriodChange,
}: {
  period: NetWorthChartPeriod;
  availablePeriods: NetWorthChartPeriod[];
  onPeriodChange?: (period: NetWorthChartPeriod) => void;
}) {
  if (!onPeriodChange || availablePeriods.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1 px-3 pt-3 sm:px-4"
      role="group"
      aria-label="Chart time range"
    >
      {NET_WORTH_CHART_PERIOD_DEFS.filter((d) => availablePeriods.includes(d.id)).map(
        ({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onPeriodChange(id)}
            aria-pressed={period === id}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
              period === id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {label}
          </button>
        )
      )}
    </div>
  );
}

function OverviewNetWorthChartPlot({
  data,
  period = "ALL",
  onPeriodChange,
}: OverviewNetWorthChartProps) {
  const { uiPreferences } = usePortfolio();
  const chart = uiPreferences.overviewChart;
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isCompact = !isDesktop;

  const availablePeriods = useMemo(() => getAvailableChartPeriods(data), [data]);

  const filteredData = useMemo(() => filterNetWorthHistory(data, period), [data, period]);
  const chartData = useMemo(() => enrichChartData(filteredData), [filteredData]);
  const yScale = useMemo(() => netWorthChartScale(filteredData), [filteredData]);
  const periodDividers = useMemo(
    () => (chartData.length > 1 ? chartData.slice(0, -1).map((_, i) => i + 0.5) : []),
    [chartData]
  );
  const periodTicks = useMemo(() => chartData.map((row) => row.index), [chartData]);
  const labelTicks = useMemo(() => {
    if (!isCompact || chartData.length <= 6) return periodTicks;
    return periodTicks.filter((_, i) => i % 2 === 0);
  }, [isCompact, periodTicks, chartData.length]);

  const showCostBasis =
    chart.showCostBasisLine && hasNetWorthCostBasisSeries(filteredData);
  const scrollChart = isCompact && chartData.length > 8;
  const chartHeight = isCompact ? 268 : 340;
  const chartMinWidth = scrollChart ? Math.max(chartData.length * 46, 320) : undefined;
  const barSize = scrollChart
    ? 36
    : chartData.length > 12
      ? 44
      : chartData.length > 8
        ? 52
        : 64;
  const showEveryPeriod = !isCompact && chartData.length <= 18;
  const xDomain: [number, number] =
    chartData.length <= 1 ? [0, 1] : [0, chartData.length - 1];
  const xAngle = isCompact && chartData.length > 4 ? -42 : 0;
  const xTextAnchor = xAngle !== 0 ? "end" : "middle";

  return (
    <>
      <ChartPeriodSelector
        period={period}
        availablePeriods={availablePeriods}
        onPeriodChange={onPeriodChange}
      />
      <ChartLegend
        barColor={chart.barColor}
        costBasisColor={chart.costBasisLineColor}
        showCostBasis={showCostBasis}
      />
      <div
        className={cn(
          "border-t border-border/40 bg-muted/[0.08] px-1 pb-3 pt-1 sm:px-2",
          scrollChart && "overflow-x-auto [-webkit-overflow-scrolling:touch]"
        )}
      >
        {scrollChart ? (
          <p className="mb-1 px-1 text-[10px] text-muted-foreground sm:hidden">
            Swipe chart for earlier periods →
          </p>
        ) : null}
        <div
          className="min-h-[200px] min-w-0 w-full"
          style={chartMinWidth ? { minWidth: chartMinWidth } : undefined}
        >
          <ResponsiveContainer width="100%" height={chartHeight} minHeight={chartHeight}>
            <ComposedChart
              data={chartData}
              margin={{
                top: 8,
                right: isCompact ? 8 : 12,
                left: 2,
                bottom: xAngle !== 0 ? 48 : 8,
              }}
              barCategoryGap="8%"
            >
              <CartesianGrid
                stroke={GRID_LINE.stroke}
                strokeWidth={GRID_LINE.strokeWidth}
                strokeOpacity={GRID_LINE.strokeOpacity}
                strokeDasharray={GRID_LINE.strokeDasharray}
                horizontal
                vertical
                syncWithTicks={false}
                horizontalValues={yScale.ticks}
                verticalValues={periodDividers}
              />
              <XAxis
                type="number"
                dataKey="index"
                domain={xDomain}
                ticks={labelTicks}
                tick={{
                  fontSize: isCompact ? 9 : 10,
                  fontFamily: "ui-monospace, monospace",
                  angle: xAngle,
                  textAnchor: xTextAnchor,
                }}
                tickFormatter={(index) => chartData[Number(index)]?.period ?? ""}
                className="fill-muted-foreground"
                axisLine={AXIS_LINE}
                tickLine={AXIS_TICK_LINE}
                interval={showEveryPeriod ? 0 : "preserveStartEnd"}
                minTickGap={showEveryPeriod ? 0 : 28}
                allowDecimals={false}
                padding={{ left: isCompact ? 12 : 16, right: isCompact ? 12 : 16 }}
                dy={xAngle !== 0 ? 4 : 8}
                height={xAngle !== 0 ? 56 : 30}
              />
              <YAxis
                domain={yScale.domain}
                ticks={yScale.ticks}
                tickFormatter={formatNetWorthAxisTick}
                tick={{
                  fontSize: isCompact ? 9 : 10,
                  fontFamily: "ui-monospace, monospace",
                }}
                className="fill-muted-foreground"
                axisLine={AXIS_LINE}
                tickLine={AXIS_TICK_LINE}
                width={isCompact ? 48 : 56}
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
                    r: isCompact ? 2.5 : 3,
                    fill: "var(--background)",
                    stroke: chart.costBasisLineColor,
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: isCompact ? 3.5 : 4,
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
      </div>
    </>
  );
}

export function OverviewNetWorthChart({
  data,
  period = "ALL",
  onPeriodChange,
}: OverviewNetWorthChartProps) {
  const emptyHeightClass = "h-[268px] sm:h-[380px]";

  return (
    <Card className="overflow-hidden border-border/50 bg-card/70 shadow-sm">
      <CardContent className="p-0">
        <ClientOnly
          fallback={
            <div className={cn("w-full animate-pulse bg-muted/20", emptyHeightClass)} />
          }
        >
          {data.length === 0 ? (
            <div className={cn("flex flex-col", emptyHeightClass)}>
              {onPeriodChange ? (
                <ChartPeriodSelector
                  period={period}
                  availablePeriods={getAvailableChartPeriods(data)}
                  onPeriodChange={onPeriodChange}
                />
              ) : null}
              <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                No history yet. Add periods in Settings → Data or enable monthly auto-snapshot.
              </p>
            </div>
          ) : (
            <OverviewNetWorthChartPlot
              data={data}
              period={period}
              onPeriodChange={onPeriodChange}
            />
          )}
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
