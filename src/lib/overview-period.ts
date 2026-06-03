import {
  parsePeriodSortKey,
  sortNetWorthHistory,
} from "@/lib/net-worth-history";
import type { NetWorthSnapshot } from "@/types";

export type NetWorthChartPeriod = "YTD" | "Y1" | "Y3" | "Y5" | "Y10" | "ALL";

export const NET_WORTH_CHART_PERIOD_DEFS: {
  id: NetWorthChartPeriod;
  label: string;
  /** Minimum years of history required to show this range. */
  minYears: number;
}[] = [
  { id: "YTD", label: "YTD", minYears: 0 },
  { id: "Y1", label: "1Y", minYears: 1 },
  { id: "Y3", label: "3Y", minYears: 3 },
  { id: "Y5", label: "5Y", minYears: 5 },
  { id: "Y10", label: "10Y", minYears: 10 },
  { id: "ALL", label: "All", minYears: 0 },
];

/** Chronological order for the chart range selector. */
export const NET_WORTH_CHART_PERIOD_ORDER: NetWorthChartPeriod[] = [
  "YTD",
  "Y1",
  "Y3",
  "Y5",
  "Y10",
  "ALL",
];

export function earliestNetWorthSortKey(data: NetWorthSnapshot[]): number | null {
  let min: number | null = null;
  for (const row of data) {
    const key = parsePeriodSortKey(row.period);
    if (key != null && (min == null || key < min)) min = key;
  }
  return min;
}

/** Approximate years from earliest snapshot to now. */
export function yearsOfNetWorthHistory(
  data: NetWorthSnapshot[],
  now = new Date()
): number {
  const earliest = earliestNetWorthSortKey(data);
  if (earliest == null) return 0;

  const startYear = Math.floor(earliest / 100);
  const startMonth = earliest % 100;
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const monthsSpan = (endYear - startYear) * 12 + (endMonth - startMonth);
  return Math.max(monthsSpan / 12, 0);
}

export function getAvailableChartPeriods(data: NetWorthSnapshot[]): NetWorthChartPeriod[] {
  if (data.length === 0) return ["ALL"];

  const spanYears = yearsOfNetWorthHistory(data);

  return NET_WORTH_CHART_PERIOD_ORDER.filter((id) => {
    const def = NET_WORTH_CHART_PERIOD_DEFS.find((d) => d.id === id);
    if (!def) return false;
    if (id === "YTD" || id === "ALL") return true;
    return spanYears >= def.minYears;
  });
}

export function getDefaultChartPeriod(
  available: NetWorthChartPeriod[]
): NetWorthChartPeriod {
  if (available.includes("ALL")) return "ALL";
  return available[0] ?? "ALL";
}

function periodCutoff(period: NetWorthChartPeriod, now = new Date()): number | null {
  if (period === "ALL") return null;

  const y = now.getFullYear();

  if (period === "YTD") return y * 100 + 1;

  const yearsBack =
    period === "Y1" ? 1 : period === "Y3" ? 3 : period === "Y5" ? 5 : period === "Y10" ? 10 : 0;

  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  d.setFullYear(d.getFullYear() - yearsBack);
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

export function filterNetWorthHistory(
  data: NetWorthSnapshot[],
  period: NetWorthChartPeriod
): NetWorthSnapshot[] {
  const sorted = sortNetWorthHistory(data);
  if (period === "ALL" || sorted.length === 0) return sorted;

  const cutoff = periodCutoff(period);
  if (cutoff == null) return sorted;

  const filtered = sorted.filter((row) => {
    const key = parsePeriodSortKey(row.period);
    return key != null && key >= cutoff;
  });

  if (filtered.length > 0) return filtered;

  const parseable = sorted.filter((row) => parsePeriodSortKey(row.period) != null);
  return parseable.length > 0 ? parseable : sorted;
}

export type PeriodChangeSummary = {
  delta: number;
  percent: number | null;
  label: string;
};

export function computePeriodNetWorthChange(
  data: NetWorthSnapshot[],
  period: NetWorthChartPeriod
): PeriodChangeSummary | null {
  const filtered = filterNetWorthHistory(data, period);
  if (filtered.length < 2) return null;

  const first = filtered[0].netWorth;
  const last = filtered[filtered.length - 1].netWorth;
  const delta = last - first;
  const percent = first !== 0 ? (delta / Math.abs(first)) * 100 : null;

  const periodLabel =
    NET_WORTH_CHART_PERIOD_DEFS.find((p) => p.id === period)?.label ?? period;

  return {
    delta,
    percent,
    label:
      period === "ALL"
        ? "all time"
        : period === "YTD"
          ? "year to date"
          : `vs ${periodLabel} ago`,
  };
}

export function formatPeriodMonthLabel(period: string): string {
  const key = parsePeriodSortKey(period);
  if (key == null) return period;
  if (/^Q[1-4]-\d{4}$/i.test(period.trim())) return period.trim().toUpperCase();
  const year = Math.floor(key / 100);
  const month = key % 100;
  return `${String(month).padStart(2, "0")}-${year}`;
}
