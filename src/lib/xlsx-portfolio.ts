import * as XLSX from "xlsx";
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

function sheetFromRows(rows: (string | number | null | undefined)[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(rows);
}

export function exportPortfolioToXlsx(data: PortfolioExportData, filename?: string): void {
  const wb = XLSX.utils.book_new();
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

  const overviewRows: (string | number)[][] = [
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
      s.totalCostBasis ?? "",
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(overviewRows), "Overview");

  const assetRows: (string | number)[][] = [["Assets"], []];
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
        asset.costBasis ?? "",
        avg ?? "",
        getMarketValue(asset),
        gain.dollars,
        formatPercent(gain.percent),
        asset.network ?? "",
        asset.protocol ?? "",
      ]);
    }
    assetRows.push([]);
  }
  XLSX.utils.book_append_sheet(wb, sheetFromRows(assetRows), "Assets");

  const cashRows: (string | number)[][] = [
    ["Cash"],
    [],
    ["Section", "Name", "Balance", "Protocol", "Address", "Original", "Interest"],
  ];
  for (const section of cashSections) {
    for (const account of data.cashAccounts.filter((a) => a.sectionId === section.id)) {
      cashRows.push([
        section.label,
        account.name,
        account.balance,
        account.protocol ?? "",
        account.address ?? "",
        account.originalAmount ?? "",
        account.interest ?? "",
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, sheetFromRows(cashRows), "Cash");

  const liaRows: (string | number)[][] = [
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
  ];
  for (const section of liabilitySections) {
    for (const l of data.liabilities.filter((x) => x.sectionId === section.id)) {
      liaRows.push([
        section.label,
        l.name,
        l.balance,
        l.address ?? "",
        l.collateral ?? "",
        l.lltv ?? "",
        l.ltv ?? "",
        l.liquidationPrice ?? "",
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, sheetFromRows(liaRows), "Liabilities");

  const planRows: (string | number)[][] = [
    ["Plan"],
    ["Generated", new Date().toISOString()],
    [],
    ["Income"],
    ["Description", data.incomePlan?.description ?? ""],
    ["Monthly Income", data.monthlyIncome ?? ""],
    [],
    ["Allocation Guide"],
    ["Label", "Parent", "% of Parent", "Order", "Notes", "Track Page", "Track Section"],
    ...(data.allocationNodes ?? [])
      .sort((a, b) => a.order - b.order)
      .map((n) => [
        n.label,
        n.parentId ?? "",
        n.percentOfParent,
        n.order,
        n.notes ?? "",
        n.trackPage ?? "",
        n.trackSectionId ?? "",
      ]),
    [],
    ["Wallet Map"],
    ["Label", "Parent", "Owner", "Type", "Identifier", "Status", "Order"],
    ...(data.walletMapNodes ?? [])
      .sort((a, b) => a.order - b.order)
      .map((n) => [
        n.label,
        n.parentId ?? "",
        n.owner ?? "",
        n.walletType ?? "",
        n.identifier ?? "",
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
        item.targetAmount ?? "",
        item.currentAmount ?? "",
        item.targetDate ?? "",
        item.status,
        item.notes ?? "",
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
        item.notes ?? "",
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, sheetFromRows(planRows), "Plan");

  const outName =
    filename ?? `portfolio-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, outName);
}
