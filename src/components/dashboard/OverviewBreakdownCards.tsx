"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionColorDot } from "@/components/dashboard/SectionColorDot";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { OverviewRow } from "@/lib/overview";

interface OverviewBreakdownCardsProps {
  title: string;
  rows: OverviewRow[];
  total: number;
  href: string;
  accent?: PortfolioAccent;
}

function flattenRows(rows: OverviewRow[]): OverviewRow[] {
  const out: OverviewRow[] = [];
  for (const row of rows) {
    if (row.children?.length) {
      out.push(...row.children.filter((c) => c.value > 0));
    } else if (row.value > 0) {
      out.push(row);
    }
  }
  return out.sort((a, b) => b.value - a.value);
}

export function OverviewBreakdownCards({
  title,
  rows,
  total,
  href,
  accent = "neutral",
}: OverviewBreakdownCardsProps) {
  const panel = portfolioPanel(accent);
  const items = flattenRows(rows).slice(0, 6);

  if (items.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card/70 shadow-sm", panel.panel)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/40 px-4 py-3">
        <CardTitle className="text-sm font-semibold">
          <Link href={href} className="hover:text-primary hover:underline">
            {title}
          </Link>
        </CardTitle>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          View
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-2 p-3 sm:grid-cols-2">
        {items.map((row) => {
          const pct = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <Link
              key={row.sectionId}
              href={row.href}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/30"
            >
              <SectionColorDot color={row.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPercent(pct)} of {title.toLowerCase().replace("total ", "")}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrency(row.value)}
              </p>
            </Link>
          );
        })}
      </CardContent>
      <div className="border-t border-border/40 px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Total </span>
        <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
      </div>
    </Card>
  );
}
