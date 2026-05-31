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
  showLine: true,
  barColor: "#4ade80",
  lineColor: "#38bdf8",
  lineType: "monotone",
};

export function normalizeOverviewChart(
  prefs?: Partial<OverviewChartPreferences>
): OverviewChartPreferences {
  return {
    ...DEFAULT_OVERVIEW_CHART,
    ...prefs,
  };
}

/** Y-axis bounds so net-worth moves are visible (not flattened against zero). */
export function netWorthChartYDomain(
  data: NetWorthSnapshot[],
  paddingRatio = 0.08
): [number, number] {
  if (data.length === 0) return [0, 100_000];
  const values = data.map((d) => d.netWorth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || max * 0.12;
  const pad = range * paddingRatio;
  const yMin = Math.floor((min - pad) / 5000) * 5000;
  const yMax = Math.ceil((max + pad) / 5000) * 5000;
  return [Math.max(0, yMin), yMax];
}
