import { formatAssetNetworkLabel } from "@/lib/asset-network";
import writeExcelFile from "write-excel-file/browser";
import { computeOverviewSnapshot } from "@/lib/overview";
import type { PortfolioDataPayload, PortfolioImportResult } from "@/lib/portfolio-data";
import {
  formatPercent,
  getAverageCost,
  getGain,
  getMarketValue,
} from "@/lib/utils";

export type PortfolioExportData = PortfolioDataPayload;
export type { PortfolioImportResult };

type CellValue = string | number | boolean | Date | null;

function rows(values: (string | number | null | undefined)[][]): CellValue[][] {
  return values.map((row) =>
    row.map((cell) => (cell === undefined || cell === "" ? null : cell))
  );
}

export async function exportPortfolioToXlsx(
  data: PortfolioExportData,
  filename?: string
): Promise<void> {
  const assetSections = data.sections
    .filter((s) => s.page === "assets")
    .sort((a, b) => a.order - b.order);
  const cashSections = data.sections
    .filter((s) => s.page === "cash")
    .sort((a, b) => a.order - b.order);
  const liabilitySections = data.sections
    .filter((s) => s.page === "liabilities")
    .sort((a, b) => a.order - b.order);

  const snapshot = computeOverviewSnapshot(
    data.assets,
    data.cashAccounts,
    data.liabilities,
    assetSections,
    cashSections,
    liabilitySections,
    data.sectionGroups ?? []
  );

  const overviewRows = rows([
    ["Portfolio Export"],
    ["Generated", new Date().toISOString()],
    [],
    ["Summary"],
    ["Metric", "Value"],
    ["Net Worth", snapshot.netWorth],
    ["Total Assets", snapshot.totalAssets],
    ["Total Cash", snapshot.totalCash],
    ["Total Liabilities", snapshot.totalLiabilities],
    ["Net Gain", snapshot.netGain],
    ["Net Gain %", snapshot.netGainPercent],
    [],
    ["Assets by Section"],
    ["Section", "Value"],
    ...snapshot.assets.map((r) => [r.label, r.value]),
    [],
    ["Cash by Section"],
    ["Section", "Value"],
    ...snapshot.cash.map((r) => [r.label, r.value]),
    [],
    ["Liabilities by Section"],
    ["Section", "Value"],
    ...snapshot.liabilities.map((r) => [r.label, r.value]),
    [],
    ["Net Worth History"],
    ["Period", "Net Worth", "Total Cost Basis"],
    ...(data.netWorthHistory ?? []).map((s) => [
      s.period,
      s.netWorth,
      s.totalCostBasis ?? null,
    ]),
  ]);

  const assetRows: (string | number | null | undefined)[][] = [["Assets"], []];
  const assetHeaders = [
    "Symbol",
    "Name",
    "Price",
    "Quantity",
    "Cost Basis",
    "Avg Cost / Share",
    "Market Value",
    "Gain $",
    "Gain %",
    "Network",
    "Protocol",
  ];

  for (const section of assetSections) {
    const sectionAssets = data.assets.filter((a) => a.sectionId === section.id);
    assetRows.push([section.label], assetHeaders);
    for (const asset of sectionAssets) {
      const gain = getGain(asset);
      const avg = getAverageCost(asset);
      assetRows.push([
        asset.symbol,
        asset.name,
        asset.price,
        asset.quantity,
        asset.costBasis ?? null,
        avg ?? null,
        getMarketValue(asset),
        gain?.dollars ?? null,
        gain != null ? formatPercent(gain.percent) : null,
        asset.network ? formatAssetNetworkLabel(asset.network) : null,
        asset.protocol ?? null,
      ]);
    }
    assetRows.push([]);
  }

  const cashRows = rows([
    ["Cash"],
    [],
    ["Section", "Name", "Balance", "Protocol", "Address", "Original", "Interest"],
    ...cashSections.flatMap((section) =>
      data.cashAccounts
        .filter((a) => a.sectionId === section.id)
        .map((account) => [
          section.label,
          account.name,
          account.balance,
          account.protocol ?? null,
          account.address ?? null,
          account.originalAmount ?? null,
          account.interest ?? null,
        ])
    ),
  ]);

  const liaRows = rows([
    ["Liabilities"],
    [],
    [
      "Section",
      "Name",
      "Balance",
      "Address",
      "Collateral",
      "LLTV %",
      "LTV %",
      "Liquidation Price",
    ],
    ...liabilitySections.flatMap((section) =>
      data.liabilities
        .filter((l) => l.sectionId === section.id)
        .map((l) => [
          section.label,
          l.name,
          l.balance,
          l.address ?? null,
          l.collateral ?? null,
          l.lltv ?? null,
          l.ltv ?? null,
          l.liquidationPrice ?? null,
        ])
    ),
  ]);

  const planRows: (string | number | null | undefined)[][] = [
    ["Plan"],
    ["Generated", new Date().toISOString()],
    [],
    ["Income"],
    ["Description", data.incomePlan?.description ?? ""],
    ["Monthly Income", data.monthlyIncome ?? null],
    [],
    ["Allocation Guide"],
    ["Label", "Parent", "% of Parent", "Order", "Notes", "Track Page", "Track Section"],
    ...(data.allocationNodes ?? [])
      .sort((a, b) => a.order - b.order)
      .map((n) => [
        n.label,
        n.parentId ?? null,
        n.percentOfParent,
        n.order,
        n.notes ?? null,
        n.trackPage ?? null,
        n.trackSectionId ?? null,
      ]),
    [],
    ["Wallet Map"],
    ["Label", "Parent", "Owner", "Type", "Address", "Status", "Order"],
    ...(data.walletMapNodes ?? [])
      .sort((a, b) => a.order - b.order)
      .map((n) => [
        n.label,
        n.parentId ?? null,
        n.owner ?? null,
        n.walletType ?? null,
        n.address ?? n.identifier ?? null,
        n.status,
        n.order,
      ]),
    [],
    ["Goals"],
    ["Section", "Title", "Target", "Current", "Target Date", "Status", "Notes"],
  ];
  const planningSections = data.sections
    .filter((s) => s.page === "planning")
    .sort((a, b) => a.order - b.order);
  for (const section of planningSections) {
    for (const item of data.planningItems.filter((i) => i.sectionId === section.id)) {
      planRows.push([
        section.label,
        item.title,
        item.targetAmount ?? null,
        item.currentAmount ?? null,
        item.targetDate ?? null,
        item.status,
        item.notes ?? null,
      ]);
    }
  }
  planRows.push([], ["Budget"], ["Section", "Name", "Budget", "Spent", "Frequency", "Notes"]);
  const spendingSections = data.sections
    .filter((s) => s.page === "spending")
    .sort((a, b) => a.order - b.order);
  for (const section of spendingSections) {
    for (const item of data.spendingItems.filter((i) => i.sectionId === section.id)) {
      planRows.push([
        section.label,
        item.name,
        item.budget,
        item.spent,
        item.frequency,
        item.notes ?? null,
      ]);
    }
  }

  const outName =
    filename ?? `portfolio-${new Date().toISOString().slice(0, 10)}.xlsx`;

  await writeExcelFile([
    { data: overviewRows, sheet: "Overview" },
    { data: rows(assetRows), sheet: "Assets" },
    { data: cashRows, sheet: "Cash" },
    { data: liaRows, sheet: "Liabilities" },
    { data: rows(planRows), sheet: "Plan" },
  ]).toFile(outName);
}
