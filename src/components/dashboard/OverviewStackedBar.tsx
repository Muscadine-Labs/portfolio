"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { OverviewRow } from "@/lib/overview";

interface OverviewStackedBarProps {
  rows: OverviewRow[];
  total: number;
}

type TooltipState = {
  row: OverviewRow;
  x: number;
  y: number;
};

export function OverviewStackedBar({ rows, total }: OverviewStackedBarProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const segments = rows.filter((row) => row.value > 0);

  const showTooltip = useCallback((element: HTMLElement, row: OverviewRow) => {
    const rect = element.getBoundingClientRect();
    setTooltip({
      row,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (segments.length === 0) {
    return (
      <div className="flex h-4 w-full items-center justify-center rounded-sm bg-muted/40 text-[10px] text-muted-foreground">
        No balance yet
      </div>
    );
  }

  const barTotal = total > 0 ? total : segments.reduce((s, r) => s + r.value, 0);

  const tooltipNode =
    tooltip && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: tooltip.x, top: tooltip.y - 6 }}
            role="tooltip"
          >
            <span className="font-medium text-foreground">{tooltip.row.label}</span>
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="tabular-nums text-foreground">
              {formatCurrency(tooltip.row.value)}
            </span>
            {barTotal > 0 ? (
              <span className="ml-1 text-muted-foreground">
                ({((tooltip.row.value / barTotal) * 100).toFixed(1)}%)
              </span>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {tooltipNode}
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {segments.map((row) => (
          <Link
            key={row.sectionId}
            href={row.href}
            className="h-full min-w-[3px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            style={{
              width: `${barTotal > 0 ? (row.value / barTotal) * 100 : 0}%`,
              backgroundColor: row.color,
            }}
            onMouseEnter={(e) => showTooltip(e.currentTarget, row)}
            onMouseMove={(e) => showTooltip(e.currentTarget, row)}
            onMouseLeave={hideTooltip}
            onFocus={(e) => showTooltip(e.currentTarget, row)}
            onBlur={hideTooltip}
            aria-label={`${row.label}: ${formatCurrency(row.value)}`}
          />
        ))}
      </div>
    </>
  );
}
