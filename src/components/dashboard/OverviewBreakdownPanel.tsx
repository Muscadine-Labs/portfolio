"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewStackedBar } from "@/components/dashboard/OverviewStackedBar";
import { SectionColorDot } from "@/components/dashboard/SectionColorDot";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";
import { cn, formatCurrency } from "@/lib/utils";
import type { OverviewRow } from "@/lib/overview";

interface OverviewBreakdownPanelProps {
  title: string;
  rows: OverviewRow[];
  total: number;
  totalLabel: string;
  href: string;
  nameHeader?: string;
  valueHeader?: string;
  accent?: PortfolioAccent;
}

function OverviewDataRow({
  row,
  depth = 0,
  expandedGroups,
  onToggleGroup,
  rowClass,
  cellClass,
}: {
  row: OverviewRow;
  depth?: number;
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  rowClass: string;
  cellClass: string;
}) {
  const isExpanded = row.isGroup && expandedGroups.has(row.sectionId);
  const hasChildren = (row.children?.length ?? 0) > 0;

  return (
    <>
      <TableRow className={rowClass}>
        <TableCell className={cn("py-1.5 text-sm", cellClass)} style={{ paddingLeft: `${12 + depth * 16}px` }}>
          {row.isGroup && hasChildren ? (
            <div className="inline-flex max-w-full min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleGroup(row.sectionId)}
                className="shrink-0 text-muted-foreground hover:text-primary"
                aria-label={isExpanded ? "Collapse group" : "Expand group"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              <SectionColorDot color={row.color} muted={row.value <= 0} />
              <Link
                href={row.href}
                className="min-w-0 truncate font-medium hover:text-primary hover:underline"
              >
                {row.label}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                ({row.children?.length ?? 0})
              </span>
            </div>
          ) : (
            <Link
              href={row.href}
              className="inline-flex max-w-full items-center gap-2 hover:text-primary hover:underline"
            >
              <SectionColorDot color={row.color} muted={row.value <= 0} />
              <span className={cn("truncate", depth > 0 && "text-muted-foreground")}>
                {row.label}
              </span>
            </Link>
          )}
        </TableCell>
        <TableCell className="py-1.5 text-right text-sm tabular-nums">
          {row.isGroup && hasChildren ? (
            <Link href={row.href} className="hover:text-primary hover:underline">
              {formatCurrency(row.value)}
            </Link>
          ) : (
            formatCurrency(row.value)
          )}
        </TableCell>
      </TableRow>
      {row.isGroup && isExpanded
        ? row.children?.map((child) => (
            <OverviewDataRow
              key={child.sectionId}
              row={child}
              depth={depth + 1}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              rowClass={rowClass}
              cellClass={cellClass}
            />
          ))
        : null}
    </>
  );
}

export function OverviewBreakdownPanel({
  title,
  rows,
  total,
  totalLabel,
  href,
  nameHeader = "Category",
  valueHeader = "Value",
  accent = "neutral",
}: OverviewBreakdownPanelProps) {
  const panel = portfolioPanel(accent);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <Card className={cn("h-auto self-start overflow-visible", panel.panel)}>
      <CardHeader className="border-b border-border/60 px-4 py-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          <Link href={href} className="hover:text-primary hover:underline">
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={panel.headCell}>{nameHeader}</TableHead>
              <TableHead className={cn(panel.headCell, "text-right")}>{valueHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <OverviewDataRow
                key={row.sectionId}
                row={row}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                rowClass={panel.dataRow}
                cellClass={panel.dataCell}
              />
            ))}
            <TableRow className={cn(panel.footerRow, "hover:bg-transparent")}>
              <TableCell className={cn("py-2 text-sm", panel.dataCell)}>
                <Link href={href} className="hover:text-primary hover:underline">
                  {totalLabel}
                </Link>
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                {formatCurrency(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {rows.length > 0 ? (
          <div className="px-3 pb-3">
            <OverviewStackedBar rows={rows} total={total} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
