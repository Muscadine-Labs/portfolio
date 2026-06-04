"use client";

import { useMemo, useState } from "react";
import { OverviewCategoriesColumn } from "@/components/dashboard/OverviewCategoriesColumn";
import { OverviewInsights } from "@/components/dashboard/OverviewInsights";
import { OverviewNetWorthChart } from "@/components/dashboard/OverviewNetWorthChart";
import { OverviewSummary } from "@/components/dashboard/OverviewSummary";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  computePeriodNetWorthChange,
  getAvailableChartPeriods,
  getDefaultChartPeriod,
  type NetWorthChartPeriod,
} from "@/lib/overview-period";
import { computeOverviewSnapshot } from "@/lib/overview";
import { orderedVisibleOverviewWidgets } from "@/lib/overview-widgets";
import { isNavPageVisible } from "@/lib/ui-preferences";
import { Button } from "@/components/ui/button";
import type { OverviewWidgetId } from "@/types";
import Link from "next/link";

export function OverviewContent() {
  const { assets, cashAccounts, liabilities, getSections, sectionGroups, uiPreferences, netWorthHistory } =
    usePortfolio();

  const availableChartPeriods = useMemo(
    () => getAvailableChartPeriods(netWorthHistory),
    [netWorthHistory]
  );

  const [chartPeriodSelection, setChartPeriod] = useState<NetWorthChartPeriod>("ALL");

  const chartPeriod = useMemo(() => {
    if (availableChartPeriods.includes(chartPeriodSelection)) {
      return chartPeriodSelection;
    }
    return getDefaultChartPeriod(availableChartPeriods);
  }, [availableChartPeriods, chartPeriodSelection]);

  const snapshot = useMemo(
    () =>
      computeOverviewSnapshot(
        assets,
        cashAccounts,
        liabilities,
        getSections("assets"),
        getSections("cash"),
        getSections("liabilities"),
        sectionGroups
      ),
    [assets, cashAccounts, liabilities, getSections, sectionGroups]
  );

  const periodChange = useMemo(
    () => computePeriodNetWorthChange(netWorthHistory, chartPeriod),
    [netWorthHistory, chartPeriod]
  );

  const widgetOrder = useMemo(
    () => orderedVisibleOverviewWidgets(uiPreferences.overviewWidgets),
    [uiPreferences.overviewWidgets]
  );

  const panels = useMemo(() => {
    const defs = [
      {
        key: "assets" as const,
        title: "Total Assets",
        rows: snapshot.assets,
        total: snapshot.totalAssets,
        totalLabel: "Total Assets",
        href: "/assets",
        valueHeader: "Asset Value",
        accent: "assets" as const,
      },
      {
        key: "liabilities" as const,
        title: "Total Liabilities",
        rows: snapshot.liabilities,
        total: snapshot.totalLiabilities,
        totalLabel: "Total Liabilities",
        href: "/liabilities",
        valueHeader: "Liabilities",
        accent: "liabilities" as const,
      },
      {
        key: "cash" as const,
        title: "Total Cash",
        rows: snapshot.cash,
        total: snapshot.totalCash,
        totalLabel: "Total Cash",
        href: "/cash",
        valueHeader: "Cash Value",
        accent: "cash" as const,
      },
    ];

    return defs
      .filter((p) => isNavPageVisible(uiPreferences, p.key) && p.rows.length > 0)
      .map((p) => ({
        ...p,
        total: p.rows.reduce((sum, r) => sum + r.value, 0),
      }));
  }, [snapshot, uiPreferences]);

  const hasPositions =
    snapshot.totalAssets > 0 || snapshot.totalCash > 0 || snapshot.totalLiabilities > 0;

  const renderWidget = (id: OverviewWidgetId) => {
    switch (id) {
      case "insights":
        return <OverviewInsights key={id} snapshot={snapshot} assets={assets} />;
      case "chart":
        return (
          <OverviewNetWorthChart
            key={id}
            data={netWorthHistory}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        );
      case "breakdown":
        return hasPositions && panels.length > 0 ? (
          <OverviewCategoriesColumn key={id} panels={panels} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <OverviewSummary
        netWorth={snapshot.netWorth}
        netGain={snapshot.netGain}
        netGainPercent={snapshot.netGainPercent}
        totalCostBasis={snapshot.totalCostBasis}
        periodChange={periodChange}
      />

      {widgetOrder.map((id) => renderWidget(id))}

      {!hasPositions ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your dashboard will populate once you add assets, cash, or liabilities.
          </p>
          <Button className="mt-4" size="sm" nativeButton={false} render={<Link href="/assets" />}>
            Add your first asset
          </Button>
        </div>
      ) : null}

      {panels.length === 0 && hasPositions && uiPreferences.overviewWidgets.breakdown ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Enable pages in Settings → Navigation to see category cards, or add positions with
          value greater than $0.
        </p>
      ) : null}
    </div>
  );
}
