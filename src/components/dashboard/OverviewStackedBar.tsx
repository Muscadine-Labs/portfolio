"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { OverviewRow } from "@/lib/overview";

interface OverviewStackedBarProps {
  rows: OverviewRow[];
  total: number;
}

export function OverviewStackedBar({ rows, total }: OverviewStackedBarProps) {
  const [active, setActive] = useState<OverviewRow | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const segments = rows.filter((row) => row.value > 0);

  const positionTooltip = (element: HTMLElement) => {
    const bar = barRef.current;
    if (!bar) return;
    const seg = element.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    setTooltipX(seg.left - barRect.left + seg.width / 2);
  };

  if (segments.length === 0) {
    return (
      <div className="flex h-4 w-full items-center justify-center rounded-sm bg-muted/40 text-[10px] text-muted-foreground">
        No balance yet
      </div>
    );
  }

  const barTotal = total > 0 ? total : segments.reduce((s, r) => s + r.value, 0);

  return (
    <div className="relative">
      {active && (
        <div
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: tooltipX }}
          role="tooltip"
        >
          <span className="font-medium text-foreground">{active.label}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className="tabular-nums text-foreground">{formatCurrency(active.value)}</span>
          {barTotal > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({((active.value / barTotal) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
      )}

      <div
        ref={barRef}
        className="flex h-4 w-full overflow-hidden rounded-sm"
        onMouseLeave={() => setActive(null)}
      >
        {segments.map((row) => (
          <Link
            key={row.sectionId}
            href={row.href}
            className="h-full min-w-[3px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            style={{
              width: `${barTotal > 0 ? (row.value / barTotal) * 100 : 0}%`,
              backgroundColor: row.color,
            }}
            onMouseEnter={(e) => {
              setActive(row);
              positionTooltip(e.currentTarget);
            }}
            onMouseMove={(e) => positionTooltip(e.currentTarget)}
            onFocus={(e) => {
              setActive(row);
              positionTooltip(e.currentTarget);
            }}
            onBlur={() => setActive(null)}
            aria-label={`${row.label}: ${formatCurrency(row.value)}`}
          />
        ))}
      </div>
    </div>
  );
}
