"use client";

import Link from "next/link";
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
import { formatCurrency } from "@/lib/utils";
import type { OverviewRow } from "@/lib/overview";

interface OverviewBreakdownPanelProps {
  title: string;
  rows: OverviewRow[];
  total: number;
  totalLabel: string;
  href: string;
  nameHeader?: string;
  valueHeader?: string;
}

export function OverviewBreakdownPanel({
  title,
  rows,
  total,
  totalLabel,
  href,
  nameHeader = "Category",
  valueHeader = "Value",
}: OverviewBreakdownPanelProps) {
  return (
    <Card className="h-auto self-start overflow-visible border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          <Link href={href} className="hover:text-primary hover:underline">
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 bg-emerald-600/90 text-xs font-semibold text-white">
                {nameHeader}
              </TableHead>
              <TableHead className="h-8 bg-emerald-600/90 text-right text-xs font-semibold text-white">
                {valueHeader}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.sectionId} className="hover:bg-muted/30">
                <TableCell className="py-1.5 text-sm">
                  <Link
                    href={row.href}
                    className="inline-flex max-w-full items-center gap-2 hover:text-primary hover:underline"
                  >
                    <SectionColorDot color={row.color} muted={row.value <= 0} />
                    <span className="truncate">{row.label}</span>
                  </Link>
                </TableCell>
                <TableCell className="py-1.5 text-right text-sm tabular-nums">
                  {formatCurrency(row.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-semibold hover:bg-transparent">
              <TableCell className="py-2 text-sm">
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

        {rows.length > 0 && <OverviewStackedBar rows={rows} total={total} />}
      </CardContent>
    </Card>
  );
}
