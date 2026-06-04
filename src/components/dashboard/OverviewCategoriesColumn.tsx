"use client";

import { OverviewAllocationChart } from "@/components/dashboard/OverviewAllocationChart";
import { OverviewBreakdownPanel } from "@/components/dashboard/OverviewBreakdownPanel";
import type { OverviewSnapshot } from "@/lib/overview";
import type { PortfolioAccent } from "@/lib/portfolio-panel";

type PanelDef = {
  key: "assets" | "liabilities" | "cash";
  title: string;
  rows: OverviewSnapshot["assets"];
  total: number;
  href: string;
  accent: PortfolioAccent;
  totalLabel: string;
};

interface OverviewCategoriesColumnProps {
  panels: PanelDef[];
  snapshot: OverviewSnapshot;
  showAllocation: boolean;
}

export function OverviewCategoriesColumn({
  panels,
  snapshot,
  showAllocation,
}: OverviewCategoriesColumnProps) {
  const assetsPanel = panels.find((p) => p.key === "assets");
  const rest = panels.filter((p) => p.key !== "assets");

  return (
    <div className="space-y-4">
      {assetsPanel ? (
        <div className="space-y-4">
          {showAllocation ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start">
              <OverviewBreakdownPanel
                title={assetsPanel.title}
                rows={assetsPanel.rows}
                total={assetsPanel.total}
                totalLabel={assetsPanel.totalLabel}
                href={assetsPanel.href}
                accent={assetsPanel.accent}
                nameHeader="Section"
              />
              <OverviewAllocationChart snapshot={snapshot} assetsOnly />
            </div>
          ) : (
            <OverviewBreakdownPanel
              title={assetsPanel.title}
              rows={assetsPanel.rows}
              total={assetsPanel.total}
              totalLabel={assetsPanel.totalLabel}
              href={assetsPanel.href}
              accent={assetsPanel.accent}
              nameHeader="Section"
            />
          )}
        </div>
      ) : null}

      {rest.map((panel) => (
        <OverviewBreakdownPanel
          key={panel.key}
          title={panel.title}
          rows={panel.rows}
          total={panel.total}
          totalLabel={panel.totalLabel}
          href={panel.href}
          accent={panel.accent}
          nameHeader="Section"
        />
      ))}
    </div>
  );
}
