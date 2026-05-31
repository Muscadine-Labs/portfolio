"use client";

import { useMemo } from "react";
import { OverviewBreakdownPanel } from "@/components/dashboard/OverviewBreakdownPanel";
import { OverviewSummary } from "@/components/dashboard/OverviewSummary";
import { OverviewNetWorthChart } from "@/components/dashboard/OverviewNetWorthChart";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeOverviewSnapshot } from "@/lib/overview";
import { isNavPageVisible } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

export function OverviewContent() {
  const { assets, cashAccounts, liabilities, getSections, sectionGroups, uiPreferences, netWorthHistory } =
    usePortfolio();

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

  const gridClass =
    panels.length >= 3
      ? "lg:grid-cols-3"
      : panels.length === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-1";

  return (
    <div className="space-y-3">
      {panels.length > 0 ? (
        <div className={cn("grid items-start gap-4", gridClass)}>
          {panels.map((panel) => (
            <OverviewBreakdownPanel
              key={panel.key}
              title={panel.title}
              rows={panel.rows}
              total={panel.total}
              totalLabel={panel.totalLabel}
              href={panel.href}
              nameHeader="Category"
              valueHeader={panel.valueHeader}
              accent={panel.accent}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No portfolio sections to show. Enable pages in Settings → Navigation, or add
          positions with value greater than $0.
        </p>
      )}

      <OverviewSummary
        netWorth={snapshot.netWorth}
        netGain={snapshot.netGain}
        netGainPercent={snapshot.netGainPercent}
        totalCostBasis={snapshot.totalCostBasis}
      />

      <OverviewNetWorthChart data={netWorthHistory} />
    </div>
  );
}
