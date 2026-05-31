import type { NetWorthSnapshot } from "@/types";

/** Sortable month key, e.g. `2026-01`. */
export function monthPeriodKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Human-readable label, e.g. `Jan '26`. */
export function formatMonthPeriodLabel(date = new Date()): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${month} '${year}`;
}

function parsePeriodSortKey(period: string): number | null {
  const iso = period.match(/^(\d{4})-(\d{2})$/);
  if (iso) return Number(iso[1]) * 100 + Number(iso[2]);

  const labeled = period.match(/^([A-Za-z]{3})\s+'(\d{2})$/);
  if (labeled) {
    const monthIndex = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(labeled[1].toLowerCase());
    if (monthIndex >= 0) return (2000 + Number(labeled[2])) * 100 + (monthIndex + 1);
  }

  return null;
}

export function sortNetWorthHistory(history: NetWorthSnapshot[]): NetWorthSnapshot[] {
  return [...history].sort((a, b) => {
    const ka = parsePeriodSortKey(a.period);
    const kb = parsePeriodSortKey(b.period);
    if (ka != null && kb != null) return ka - kb;
    if (ka != null) return -1;
    if (kb != null) return 1;
    return 0;
  });
}

export function periodMatchesMonthKey(period: string, monthKey: string): boolean {
  if (period === monthKey) return true;
  const sortKey = parsePeriodSortKey(period);
  const target = parsePeriodSortKey(monthKey);
  return sortKey != null && target != null && sortKey === target;
}
