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

type CurrencyCell = { value: number; format: string };
type CellValue = string | number | boolean | Date | CurrencyCell | null;
type RawCell = string | number | CurrencyCell | null | undefined;

const USD_FORMAT = "$#,##0.00";

/** Excel currency cell with thousand separators ($10,000,000.00). */
function usd(value: number | null | undefined): CurrencyCell | null {
  return value == null ? null : { value, format: USD_FORMAT };
}

function rows(values: RawCell[][]): CellValue[][] {
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
    ["Net Worth", usd(snapshot.netWorth)],
    ["Total Assets", usd(snapshot.totalAssets)],
    ["Total Cash", usd(snapshot.totalCash)],
    ["Total Liabilities", usd(snapshot.totalLiabilities)],
    ["Net Gain", usd(snapshot.netGain)],
    ["Net Gain %", snapshot.netGainPercent],
    [],
    ["Assets by Section"],
    ["Section", "Value"],
    ...snapshot.assets.map((r): RawCell[] => [r.label, usd(r.value)]),
    [],
    ["Cash by Section"],
    ["Section", "Value"],
    ...snapshot.cash.map((r): RawCell[] => [r.label, usd(r.value)]),
    [],
    ["Liabilities by Section"],
    ["Section", "Value"],
    ...snapshot.liabilities.map((r): RawCell[] => [r.label, usd(r.value)]),
    [],
    ["Net Worth History"],
    ["Period", "Net Worth", "Total Cost Basis"],
    ...(data.netWorthHistory ?? []).map((s): RawCell[] => [
      s.period,
      usd(s.netWorth),
      usd(s.totalCostBasis ?? null),
    ]),
  ]);

  const assetRows: RawCell[][] = [["Assets"], []];
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
        usd(asset.price),
        asset.quantity,
        usd(asset.costBasis ?? null),
        usd(avg ?? null),
        usd(getMarketValue(asset)),
        usd(gain?.dollars ?? null),
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
        .map((account): RawCell[] => [
          section.label,
          account.name,
          usd(account.balance),
          account.protocol ?? null,
          account.address ?? null,
          usd(account.originalAmount ?? null),
          usd(account.interest ?? null),
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
        .map((l): RawCell[] => [
          section.label,
          l.name,
          usd(l.balance),
          l.address ?? null,
          usd(l.collateral ?? null),
          l.lltv ?? null,
          l.ltv ?? null,
          usd(l.liquidationPrice ?? null),
        ])
    ),
  ]);

  const planRows: RawCell[][] = [
    ["Plan"],
    ["Generated", new Date().toISOString()],
    [],
    ["Income"],
    ["Description", data.incomePlan?.description ?? ""],
    ["Monthly Income", usd(data.monthlyIncome ?? null)],
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
        usd(item.targetAmount ?? null),
        usd(item.currentAmount ?? null),
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
        usd(item.budget),
        usd(item.spent),
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
