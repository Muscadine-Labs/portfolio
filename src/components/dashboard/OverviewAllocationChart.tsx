"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { OverviewSnapshot } from "@/lib/overview";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface OverviewAllocationChartProps {
  snapshot: OverviewSnapshot;
}

type Slice = { name: string; value: number; color: string; href: string };

function buildSlices(snapshot: OverviewSnapshot): Slice[] {
  const slices: Slice[] = [];
  const addRows = (
    rows: OverviewSnapshot["assets"],
    fallbackColor: string,
    fallbackHref: string
  ) => {
    for (const row of rows) {
      const items = row.children?.length ? row.children : [row];
      for (const item of items) {
        if (item.value > 0) {
          slices.push({
            name: item.label,
            value: item.value,
            color: item.color,
            href: item.href,
          });
        }
      }
    }
    void fallbackColor;
    void fallbackHref;
  };

  addRows(snapshot.assets, "#34d399", "/assets");
  addRows(snapshot.cash, "#60a5fa", "/cash");
  for (const row of snapshot.liabilities) {
    const items = row.children?.length ? row.children : [row];
    for (const item of items) {
      if (item.value > 0) {
        slices.push({
          name: item.label,
          value: item.value,
          color: item.color,
          href: item.href,
        });
      }
    }
  }

  return slices.sort((a, b) => b.value - a.value);
}

function AllocationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: Slice }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border border-border/80 bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium">{slice.name}</p>
      <p className="tabular-nums text-muted-foreground">{formatCurrency(slice.value)}</p>
    </div>
  );
}

function OverviewAllocationChartPlot({ snapshot }: OverviewAllocationChartProps) {
  const slices = useMemo(() => buildSlices(snapshot), [snapshot]);
  const total = useMemo(() => slices.reduce((s, x) => s + x.value, 0), [slices]);

  if (slices.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Add positions with value to see allocation.
      </p>
    );
  }

  const topLegend = slices.slice(0, 6);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-[200px] w-full max-w-[220px] sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="88%"
              paddingAngle={1}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name + slice.href} fill={slice.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<AllocationTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {topLegend.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          return (
            <li key={slice.name + slice.href} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <Link
                href={slice.href}
                className="min-w-0 flex-1 truncate font-medium hover:text-primary hover:underline"
              >
                {slice.name}
              </Link>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {pct.toFixed(1)}%
              </span>
              <span className="shrink-0 tabular-nums">{formatCurrency(slice.value)}</span>
            </li>
          );
        })}
        {slices.length > 6 ? (
          <li className="text-xs text-muted-foreground">+{slices.length - 6} more categories</li>
        ) : null}
      </ul>
    </div>
  );
}

export function OverviewAllocationChart({ snapshot }: OverviewAllocationChartProps) {
  return (
    <Card className="border-border/50 bg-card/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Allocation</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ClientOnly
          fallback={<div className="h-[200px] animate-pulse rounded-lg bg-muted/20" />}
        >
          <OverviewAllocationChartPlot snapshot={snapshot} />
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
