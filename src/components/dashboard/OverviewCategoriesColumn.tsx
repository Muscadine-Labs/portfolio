"use client";

import { OverviewBreakdownPanel } from "@/components/dashboard/OverviewBreakdownPanel";
import type { OverviewSnapshot } from "@/lib/overview";
import type { PortfolioAccent } from "@/lib/portfolio-panel";
import { cn } from "@/lib/utils";

type PanelDef = {
  key: "assets" | "liabilities" | "cash";
  title: string;
  rows: OverviewSnapshot["assets"];
  total: number;
  href: string;
  accent: PortfolioAccent;
  totalLabel: string;
  nameHeader?: string;
  valueHeader?: string;
};

interface OverviewCategoriesColumnProps {
  panels: PanelDef[];
}

export function OverviewCategoriesColumn({ panels }: OverviewCategoriesColumnProps) {
  const gridClass =
    panels.length >= 3
      ? "lg:grid-cols-3"
      : panels.length === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-1";

  return (
    <div className={cn("grid items-start gap-4", gridClass)}>
      {panels.map((panel) => (
        <OverviewBreakdownPanel
          key={panel.key}
          title={panel.title}
          rows={panel.rows}
          total={panel.total}
          totalLabel={panel.totalLabel}
          href={panel.href}
          nameHeader={panel.nameHeader ?? "Category"}
          valueHeader={panel.valueHeader ?? "Value"}
          accent={panel.accent}
        />
      ))}
    </div>
  );
}
