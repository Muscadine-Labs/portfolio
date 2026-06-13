"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LineChart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  capturePeriodKey,
  normalizeNetWorthSnapshot,
  periodMatchesCaptureKey,
} from "@/lib/net-worth-history";
import { computeOverviewSnapshot } from "@/lib/overview";
import { cn, formatCurrency } from "@/lib/utils";

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export function NetWorthHistorySettingsCard({ className }: { className?: string }) {
  const [tableOpen, setTableOpen] = useState(false);
  const {
    assets,
    cashAccounts,
    liabilities,
    getSections,
    sectionGroups,
    netWorthHistory,
    upsertNetWorthSnapshotAt,
    addNetWorthSnapshot,
    deleteNetWorthSnapshot,
    uiPreferences,
    setMonthlyAutoSnapshot,
    setNetWorthSnapshotCadence,
  } = usePortfolio();

  const cadence = uiPreferences.netWorthSnapshotCadence;
  const currentPeriodKey = useMemo(
    () => capturePeriodKey(new Date(), cadence),
    [cadence]
  );

  const liveSnapshot = useMemo(
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

  const handleCaptureCurrent = () => {
    const key = capturePeriodKey(new Date(), cadence);
    const existingIndex = netWorthHistory.findIndex((row) =>
      periodMatchesCaptureKey(row.period, key)
    );

    const snapshot = normalizeNetWorthSnapshot({
      period: key,
      netWorth: liveSnapshot.netWorth,
      totalAssets: liveSnapshot.totalAssets,
      totalCash: liveSnapshot.totalCash,
      totalLiabilities: liveSnapshot.totalLiabilities,
      totalCostBasis: liveSnapshot.totalCostBasis,
    });

    if (existingIndex >= 0) {
      upsertNetWorthSnapshotAt(existingIndex, snapshot);
      toast.success(`Updated ${key}`, {
        description: `Net worth set to ${formatCurrency(liveSnapshot.netWorth)}.`,
      });
      return;
    }

    addNetWorthSnapshot(snapshot);
    toast.success(`Added ${key}`, {
      description: `Captured live net worth for ${key}.`,
    });
  };

  return (
    <Card className={cn("border-border/60 bg-card/80", className)}>
      <CardHeader className="space-y-4 pb-3">
        <div>
          <CardTitle className="text-base">Net worth history</CardTitle>
          <CardDescription>
            Chart data saved with the portfolio. Use{" "}
            <span className="font-mono text-xs">06-2026</span> for months or{" "}
            <span className="font-mono text-xs">Q2-2026</span> for quarters (legacy{" "}
            <span className="font-mono text-xs">YYYY-MM</span> still works).
          </CardDescription>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">Capture cadence</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                { value: "month", label: "Monthly (06-2026)" },
                { value: "quarter", label: "Quarterly (Q2-2026)" },
              ] as const
            ).map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="net-worth-cadence"
                  className="accent-primary"
                  checked={cadence === value}
                  onChange={() => setNetWorthSnapshotCadence(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-border"
            checked={uiPreferences.monthlyAutoSnapshot}
            onChange={(e) => setMonthlyAutoSnapshot(e.target.checked)}
          />
          <span>
            <span className="font-medium">Auto-snapshot on the 1st</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {cadence === "quarter"
                ? "Records on Jan 1, Apr 1, Jul 1, and Oct 1 when the home API snapshot timer runs."
                : "Records every month on the 1st when the home API snapshot timer runs."}
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addNetWorthSnapshot()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add row
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCaptureCurrent}>
            <LineChart className="mr-1.5 h-4 w-4" />
            Capture current ({currentPeriodKey})
          </Button>
          <span className="text-xs text-muted-foreground">
            Live net worth: {formatCurrency(liveSnapshot.netWorth)}
            {liveSnapshot.totalCostBasis > 0
              ? ` · cost basis ${formatCurrency(liveSnapshot.totalCostBasis)}`
              : null}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 pb-4 pt-0">
        {netWorthHistory.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No history yet. Add a row manually or capture your current net worth.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <button
              type="button"
              className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/45"
              aria-expanded={tableOpen}
              onClick={() => setTableOpen((prev) => !prev)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  tableOpen && "rotate-180"
                )}
              />
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-2 text-xs font-medium text-muted-foreground max-sm:grid-cols-2">
                <span>Period</span>
                <span className="text-right">Net worth</span>
                <span className="hidden text-right sm:inline">Cost basis</span>
              </div>
              <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {netWorthHistory.length}
              </span>
            </button>

            {tableOpen ? (
              <div className="max-h-[min(60vh,32rem)] overflow-auto border-t border-border/60">
                <Table>
                  <TableHeader className="sr-only">
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Net worth</TableHead>
                      <TableHead className="text-right">Cost basis</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {netWorthHistory.map((row, index) => (
                      <TableRow key={`${row.period}-${index}`}>
                        <TableCell>
                          <Label htmlFor={`nw-period-${index}`} className="sr-only">
                            Period
                          </Label>
                          <Input
                            id={`nw-period-${index}`}
                            defaultValue={row.period}
                            placeholder={cadence === "quarter" ? "Q2-2026" : "06-2026"}
                            className="h-8 min-w-[7rem] font-mono text-xs"
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next === row.period) return;
                              upsertNetWorthSnapshotAt(index, { period: next });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Label htmlFor={`nw-value-${index}`} className="sr-only">
                            Net worth
                          </Label>
                          <Input
                            id={`nw-value-${index}`}
                            type="number"
                            step="any"
                            defaultValue={row.netWorth}
                            className="h-8 text-right tabular-nums"
                            onBlur={(e) => {
                              const next = parseOptionalNumber(e.target.value);
                              if (next == null || next === row.netWorth) return;
                              upsertNetWorthSnapshotAt(index, { netWorth: next });
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Input
                            type="number"
                            step="any"
                            defaultValue={row.totalCostBasis ?? ""}
                            placeholder="Optional"
                            className="h-8 text-right tabular-nums"
                            onBlur={(e) => {
                              const next = parseOptionalNumber(e.target.value);
                              if (next === row.totalCostBasis) return;
                              upsertNetWorthSnapshotAt(index, { totalCostBasis: next });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${row.period || "row"}`}
                            onClick={() => deleteNetWorthSnapshot(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
