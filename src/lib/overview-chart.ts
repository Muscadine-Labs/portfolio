import type { NetWorthSnapshot, OverviewChartPreferences } from "@/types";

export const OVERVIEW_LINE_TYPES = [
  { value: "monotone", label: "Smooth (monotone)" },
  { value: "linear", label: "Linear" },
  { value: "natural", label: "Natural" },
  { value: "step", label: "Step" },
  { value: "stepBefore", label: "Step before" },
  { value: "stepAfter", label: "Step after" },
] as const;

export const DEFAULT_OVERVIEW_CHART: OverviewChartPreferences = {
  showBar: true,
  showLine: false,
  barColor: "#34d399",
  lineColor: "#6366f1",
  lineType: "monotone",
  showCostBasisLine: true,
  costBasisLineColor: "#94a3b8",
};

function isValidChartColor(color: string | undefined): color is string {
  if (!color || typeof color !== "string") return false;
  if (color.includes("var(")) return false;
  return /^#[0-9a-fA-F]{3,8}$/.test(color) || /^rgba?\(/i.test(color);
}

export function normalizeOverviewChart(
  prefs?: Partial<OverviewChartPreferences>
): OverviewChartPreferences {
  const merged = { ...DEFAULT_OVERVIEW_CHART, ...prefs };
  return {
    ...merged,
    showBar: merged.showBar !== false,
    showLine: false,
    barColor: isValidChartColor(merged.barColor)
      ? merged.barColor
      : DEFAULT_OVERVIEW_CHART.barColor,
    lineColor: isValidChartColor(merged.lineColor)
      ? merged.lineColor
      : DEFAULT_OVERVIEW_CHART.lineColor,
    costBasisLineColor: isValidChartColor(merged.costBasisLineColor)
      ? merged.costBasisLineColor
      : DEFAULT_OVERVIEW_CHART.costBasisLineColor,
    showCostBasisLine:
      typeof merged.showCostBasisLine === "boolean"
        ? merged.showCostBasisLine
        : DEFAULT_OVERVIEW_CHART.showCostBasisLine,
  };
}

function chartValuePoints(data: NetWorthSnapshot[]): number[] {
  const values: number[] = [];
  for (const row of data) {
    values.push(row.netWorth);
    if (row.totalCostBasis != null && Number.isFinite(row.totalCostBasis)) {
      values.push(row.totalCostBasis);
    }
  }
  return values;
}

/** Y-axis bounds so net-worth moves are visible (not flattened against zero). */
export function netWorthChartYDomain(
  data: NetWorthSnapshot[],
  paddingRatio = 0.08
): [number, number] {
  if (data.length === 0) return [0, 100_000];
  const values = chartValuePoints(data);
  if (values.length === 0) return [0, 100_000];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || max * 0.12;
  const pad = range * paddingRatio;
  const yMin = Math.floor((min - pad) / 5000) * 5000;
  const yMax = Math.ceil((max + pad) / 5000) * 5000;
  return [Math.max(0, yMin), yMax];
}

export function hasNetWorthCostBasisSeries(data: NetWorthSnapshot[]): boolean {
  return data.some(
    (row) => row.totalCostBasis != null && Number.isFinite(row.totalCostBasis) && row.totalCostBasis > 0
  );
}
