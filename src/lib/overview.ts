import { computeTotalCash, computeTotalInvestments, computeTotalLiabilities } from "@/lib/mock-data";
import { getCostBasis, getMarketValue } from "@/lib/utils";
import type { Asset, CashAccount, Liability, PortfolioSection } from "@/types";

export type OverviewRow = {
  sectionId: string;
  label: string;
  value: number;
  color: string;
  href: string;
};

export type OverviewSnapshot = {
  assets: OverviewRow[];
  liabilities: OverviewRow[];
  cash: OverviewRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalCash: number;
  netWorth: number;
  totalCostBasis: number;
  netGain: number;
  netGainPercent: number;
};

const SECTION_PALETTE = [
  "#86efac",
  "#6b7280",
  "#c4b5fd",
  "#4ade80",
  "#22d3ee",
  "#fca5a5",
  "#fdba74",
  "#93c5fd",
  "#60a5fa",
  "#f59e0b",
  "#a78bfa",
  "#fb7185",
];

function sectionColor(index: number): string {
  return SECTION_PALETTE[index % SECTION_PALETTE.length];
}

function buildSectionRows(
  sections: PortfolioSection[],
  valuesBySectionId: Map<string, number>,
  pageHref: string
): OverviewRow[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      sectionId: section.id,
      label: section.label,
      value: valuesBySectionId.get(section.id) ?? 0,
      color: sectionColor(index),
      href: `${pageHref}?section=${encodeURIComponent(section.id)}`,
    }));
}

function sumBySectionId<T extends { sectionId: string }>(
  items: T[],
  getValue: (item: T) => number
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.sectionId, (totals.get(item.sectionId) ?? 0) + getValue(item));
  }
  return totals;
}

export function computeOverviewSnapshot(
  assets: Asset[],
  cashAccounts: CashAccount[],
  liabilities: Liability[],
  assetSections: PortfolioSection[],
  cashSections: PortfolioSection[],
  liabilitySections: PortfolioSection[]
): OverviewSnapshot {
  const assetTotals = sumBySectionId(assets, getMarketValue);
  const cashTotals = sumBySectionId(cashAccounts, (c) => c.balance);
  const liabilityTotals = sumBySectionId(liabilities, (l) => l.balance);

  const assetRows = buildSectionRows(assetSections, assetTotals, "/assets");
  const cashRows = buildSectionRows(cashSections, cashTotals, "/cash");
  const liabilityRows = buildSectionRows(liabilitySections, liabilityTotals, "/liabilities");

  const totalAssets = computeTotalInvestments(assets);
  const totalCash = computeTotalCash(cashAccounts);
  const totalLiabilities = computeTotalLiabilities(liabilities);
  const netWorth = totalAssets + totalCash - totalLiabilities;

  const totalCostBasis = assets.reduce((sum, a) => sum + (getCostBasis(a) ?? 0), 0);
  const netGain = netWorth - totalCostBasis;
  const netGainPercent = totalCostBasis > 0 ? (netGain / totalCostBasis) * 100 : 0;

  return {
    assets: assetRows.filter((r) => r.value > 0),
    liabilities: liabilityRows.filter((r) => r.value > 0),
    cash: cashRows.filter((r) => r.value > 0),
    totalAssets,
    totalLiabilities,
    totalCash,
    netWorth,
    totalCostBasis,
    netGain,
    netGainPercent,
  };
}
