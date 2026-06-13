import type { NetWorthSnapshot, OverviewChartPreferences } from "@/types";

export const DEFAULT_OVERVIEW_CHART: OverviewChartPreferences = {
  showBar: true,
  showLine: false,
  barColor: "#34d399",
  lineColor: "#6366f1",
  lineType: "monotone",
  showCostBasisLine: true,
  costBasisLineColor: "#94a3b8",
  showAssetsLine: true,
  showCashLine: true,
  showLiabilitiesLine: true,
  assetsLineColor: "#60a5fa",
  cashLineColor: "#fbbf24",
  liabilitiesLineColor: "#f87171",
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
    showAssetsLine: merged.showAssetsLine !== false,
    showCashLine: merged.showCashLine !== false,
    showLiabilitiesLine: merged.showLiabilitiesLine !== false,
    assetsLineColor: isValidChartColor(merged.assetsLineColor)
      ? merged.assetsLineColor
      : DEFAULT_OVERVIEW_CHART.assetsLineColor,
    cashLineColor: isValidChartColor(merged.cashLineColor)
      ? merged.cashLineColor
      : DEFAULT_OVERVIEW_CHART.cashLineColor,
    liabilitiesLineColor: isValidChartColor(merged.liabilitiesLineColor)
      ? merged.liabilitiesLineColor
      : DEFAULT_OVERVIEW_CHART.liabilitiesLineColor,
  };
}

function chartValuePoints(data: NetWorthSnapshot[]): number[] {
  const values: number[] = [];
  for (const row of data) {
    values.push(row.netWorth);
    for (const extra of [
      row.totalCostBasis,
      row.totalAssets,
      row.totalCash,
      row.totalLiabilities,
    ]) {
      if (extra != null && Number.isFinite(extra)) values.push(extra);
    }
  }
  return values;
}

/** Round step to 1 / 2 / 2.5 / 5 / 10 × power of ten. */
function niceStep(roughStep: number): number {
  if (!Number.isFinite(roughStep) || roughStep <= 0) return 10_000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let nice = 10;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 2.5) nice = 2.5;
  else if (normalized <= 5) nice = 5;
  return nice * magnitude;
}

export function formatNetWorthAxisTick(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const text =
      millions % 1 === 0 ? millions.toLocaleString("en-US") : millions.toFixed(1);
    return `${sign}$${text}M`;
  }
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`;
  if (abs >= 1_000) {
    const thousands = abs / 1000;
    return thousands % 1 === 0 ? `${sign}$${thousands}k` : `${sign}$${thousands.toFixed(1)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

/** Y-axis domain + evenly spaced “nice” dollar ticks (~4–6 lines). */
export function netWorthChartScale(
  data: NetWorthSnapshot[],
  targetTicks = 5
): { domain: [number, number]; ticks: number[] } {
  if (data.length === 0) {
    return { domain: [0, 100_000], ticks: [0, 25_000, 50_000, 75_000, 100_000] };
  }

  const values = chartValuePoints(data);
  if (values.length === 0) {
    return { domain: [0, 100_000], ticks: [0, 25_000, 50_000, 75_000, 100_000] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(max * 0.12, 10_000);
  const pad = span * 0.06;
  const paddedMin = Math.max(0, min - pad);
  const paddedMax = max + pad;
  const step = niceStep((paddedMax - paddedMin) / Math.max(2, targetTicks - 1));
  const yMin = Math.floor(paddedMin / step) * step;
  const yMax = Math.ceil(paddedMax / step) * step;

  const ticks: number[] = [];
  for (let value = yMin; value <= yMax + step * 0.001; value += step) {
    ticks.push(Math.round(value));
  }

  return { domain: [yMin, yMax], ticks };
}
export function hasNetWorthCostBasisSeries(data: NetWorthSnapshot[]): boolean {
  return data.some(
    (row) => row.totalCostBasis != null && Number.isFinite(row.totalCostBasis) && row.totalCostBasis > 0
  );
}

export function hasNetWorthSeries(
  data: NetWorthSnapshot[],
  key: "totalAssets" | "totalCash" | "totalLiabilities"
): boolean {
  return data.some((row) => {
    const value = row[key];
    return value != null && Number.isFinite(value) && value > 0;
  });
}
