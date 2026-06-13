import type { NetWorthSnapshot } from "@/types";

export type NetWorthSnapshotCadence = "month" | "quarter";

/** Round currency values to two decimal places. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function roundOptionalMoney(value: number | undefined): number | undefined {
  return value != null && Number.isFinite(value) ? roundMoney(value) : undefined;
}

export function normalizeNetWorthSnapshot(snapshot: NetWorthSnapshot): NetWorthSnapshot {
  return {
    ...snapshot,
    netWorth: roundMoney(snapshot.netWorth),
    totalCostBasis: roundOptionalMoney(snapshot.totalCostBasis),
    totalAssets: roundOptionalMoney(snapshot.totalAssets),
    totalCash: roundOptionalMoney(snapshot.totalCash),
    totalLiabilities: roundOptionalMoney(snapshot.totalLiabilities),
  };
}

export function normalizeNetWorthHistory(
  history: NetWorthSnapshot[]
): NetWorthSnapshot[] {
  return sortNetWorthHistory(history.map(normalizeNetWorthSnapshot));
}

/** Canonical month period, e.g. `06-2026` (MM-YYYY). */
export function monthPeriodKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${year}`;
}

/** Canonical quarter period, e.g. `Q2-2026`. */
export function quarterPeriodKey(date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}-${date.getFullYear()}`;
}

export function capturePeriodKey(
  date = new Date(),
  cadence: NetWorthSnapshotCadence = "month"
): string {
  return cadence === "quarter" ? quarterPeriodKey(date) : monthPeriodKey(date);
}

export function normalizeNetWorthSnapshotCadence(
  value: unknown
): NetWorthSnapshotCadence {
  return value === "quarter" ? "quarter" : "month";
}

/** Whether auto-snapshot should run on this calendar day (timer runs on the 1st). */
export function shouldRunAutoSnapshot(
  date: Date,
  cadence: NetWorthSnapshotCadence
): boolean {
  if (cadence === "month") return true;
  const m = date.getMonth();
  return m === 0 || m === 3 || m === 6 || m === 9;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function expandYear(yearStr: string): number | null {
  const y = Number(yearStr);
  if (!Number.isFinite(y)) return null;
  if (yearStr.length === 4) return y;
  if (yearStr.length === 2) return y >= 70 ? 1900 + y : 2000 + y;
  return null;
}

function quarterSortKey(quarter: number, year: number): number | null {
  if (quarter < 1 || quarter > 4) return null;
  const month = quarter * 3;
  return year * 100 + month;
}

/**
 * Sortable key YYYYMM for chart ordering and period filters.
 * Supports MM-YYYY, YYYY-MM (legacy), Q2-2026, Q1 2023, Jan '26, etc.
 */
export function parsePeriodSortKey(period: string): number | null {
  const trimmed = period.trim();
  if (!trimmed) return null;

  const monthYear = trimmed.match(/^(\d{2})-(\d{4})$/);
  if (monthYear) return Number(monthYear[2]) * 100 + Number(monthYear[1]);

  const quarterDash = trimmed.match(/^Q([1-4])-(\d{4})$/i);
  if (quarterDash) {
    return quarterSortKey(Number(quarterDash[1]), Number(quarterDash[2]));
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (iso) return Number(iso[1]) * 100 + Number(iso[2]);

  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (isoDate) return Number(isoDate[1]) * 100 + Number(isoDate[2]);

  const quarterPatterns = [
    /^Q([1-4])\s+(\d{2,4})$/i,
    /^Q([1-4])\s*[''](\d{2})$/i,
    /^(\d{4})\s+Q([1-4])$/i,
    /^(\d{4})-Q([1-4])$/i,
  ] as const;

  for (const pattern of quarterPatterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const isYearFirst = /^\d{4}/.test(trimmed);
    const q = Number(isYearFirst ? match[2] : match[1]);
    const yearRaw = isYearFirst ? match[1] : match[2];
    const year = expandYear(yearRaw);
    if (year != null) return quarterSortKey(q, year);
  }

  const labeledShort = trimmed.match(/^([A-Za-z]{3})\s+'(\d{2})$/);
  if (labeledShort) {
    const month = MONTH_NAMES[labeledShort[1].toLowerCase()];
    if (month) return expandYear(labeledShort[2])! * 100 + month;
  }

  const labeledLong = trimmed.match(/^([A-Za-z]+)\s+(\d{2,4})$/);
  if (labeledLong) {
    const month = MONTH_NAMES[labeledLong[1].toLowerCase()];
    const year = expandYear(labeledLong[2]);
    if (month && year != null) return year * 100 + month;
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
    return a.period.localeCompare(b.period);
  });
}

export function periodMatchesCaptureKey(
  period: string,
  captureKey: string
): boolean {
  if (period === captureKey) return true;
  const sortKey = parsePeriodSortKey(period);
  const target = parsePeriodSortKey(captureKey);
  return sortKey != null && target != null && sortKey === target;
}

/** @deprecated Use periodMatchesCaptureKey */
export function periodMatchesMonthKey(period: string, monthKey: string): boolean {
  return periodMatchesCaptureKey(period, monthKey);
}

export function formatPeriodDisplayLabel(period: string): string {
  const key = parsePeriodSortKey(period);
  if (key == null) return period;
  if (/^Q[1-4]-\d{4}$/i.test(period.trim())) return period.trim().toUpperCase();
  const year = Math.floor(key / 100);
  const month = key % 100;
  const mm = String(month).padStart(2, "0");
  return `${mm}-${year}`;
}

/** @deprecated Use formatPeriodDisplayLabel */
export function formatMonthPeriodLabel(date = new Date()): string {
  return monthPeriodKey(date);
}
