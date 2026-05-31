import { computeTotalCash, computeTotalInvestments, computeTotalLiabilities } from "@/lib/mock-data";
import { formatSectionDisplayLabel } from "@/lib/section-groups";
import { getCostBasis, getMarketValue } from "@/lib/utils";
import type { Asset, CashAccount, Liability, PortfolioSection, SectionGroup } from "@/types";

export type OverviewRow = {
  sectionId: string;
  label: string;
  value: number;
  color: string;
  href: string;
  /** When set, this row rolls up multiple sections on Overview only. */
  isGroup?: boolean;
  children?: OverviewRow[];
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

function sectionRow(
  section: PortfolioSection,
  value: number,
  pageHref: string,
  colorIndex: number
): OverviewRow {
  return {
    sectionId: section.id,
    label: formatSectionDisplayLabel(section),
    value,
    color: sectionColor(colorIndex),
    href: `${pageHref}?section=${encodeURIComponent(section.id)}`,
  };
}

function sortOverviewRowsByValue(rows: OverviewRow[]): OverviewRow[] {
  return [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({
      ...row,
      color: sectionColor(index),
      children: row.children
        ? [...row.children]
            .sort((a, b) => b.value - a.value)
            .map((child, childIndex) => ({
              ...child,
              color: sectionColor(index + childIndex + 1),
            }))
        : undefined,
    }));
}

function buildGroupedSectionRows(
  sections: PortfolioSection[],
  groups: SectionGroup[],
  valuesBySectionId: Map<string, number>,
  pageHref: string
): OverviewRow[] {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const rows: OverviewRow[] = [];
  const processedGroups = new Set<string>();
  let colorIndex = 0;

  for (const section of sorted) {
    const group = section.groupId ? groupById.get(section.groupId) : undefined;
    const value = valuesBySectionId.get(section.id) ?? 0;

    if (group) {
      if (processedGroups.has(group.id)) continue;
      processedGroups.add(group.id);

      const members = sorted.filter((member) => member.groupId === group.id);
      const children = members
        .map((member, index) =>
          sectionRow(
            member,
            valuesBySectionId.get(member.id) ?? 0,
            pageHref,
            colorIndex + index
          )
        )
        .filter((child) => child.value > 0);

      const total = children.reduce((sum, child) => sum + child.value, 0);
      if (total <= 0) continue;

      rows.push({
        sectionId: `group:${group.id}`,
        label: group.name,
        value: total,
        color: sectionColor(colorIndex++),
        href: `${pageHref}?section=${encodeURIComponent(`group:${group.id}`)}`,
        isGroup: true,
        children,
      });
      continue;
    }

    if (value > 0) {
      rows.push(sectionRow(section, value, pageHref, colorIndex++));
    }
  }

  return sortOverviewRowsByValue(rows);
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
  liabilitySections: PortfolioSection[],
  sectionGroups: SectionGroup[] = []
): OverviewSnapshot {
  const assetTotals = sumBySectionId(assets, getMarketValue);
  const cashTotals = sumBySectionId(cashAccounts, (c) => c.balance);
  const liabilityTotals = sumBySectionId(liabilities, (l) => l.balance);

  const assetGroups = sectionGroups.filter((group) => group.page === "assets");
  const cashGroups = sectionGroups.filter((group) => group.page === "cash");
  const liabilityGroups = sectionGroups.filter((group) => group.page === "liabilities");

  const assetRows = buildGroupedSectionRows(
    assetSections,
    assetGroups,
    assetTotals,
    "/assets"
  );
  const cashRows = buildGroupedSectionRows(cashSections, cashGroups, cashTotals, "/cash");
  const liabilityRows = buildGroupedSectionRows(
    liabilitySections,
    liabilityGroups,
    liabilityTotals,
    "/liabilities"
  );

  const totalAssets = computeTotalInvestments(assets);
  const totalCash = computeTotalCash(cashAccounts);
  const totalLiabilities = computeTotalLiabilities(liabilities);
  const netWorth = totalAssets + totalCash - totalLiabilities;

  const totalCostBasis = assets.reduce((sum, a) => sum + (getCostBasis(a) ?? 0), 0);
  const netGain = netWorth - totalCostBasis;
  const netGainPercent = totalCostBasis > 0 ? (netGain / totalCostBasis) * 100 : 0;

  return {
    assets: assetRows,
    liabilities: liabilityRows,
    cash: cashRows,
    totalAssets,
    totalLiabilities,
    totalCash,
    netWorth,
    totalCostBasis,
    netGain,
    netGainPercent,
  };
}
