"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { cn } from "@/lib/utils";

export function OverviewChartSettingsCard() {
  const { uiPreferences, setOverviewChartPreferences } = usePortfolio();
  const chart = uiPreferences.overviewChart;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Overview chart</CardTitle>
        <CardDescription>
          Net worth history as bars with an optional cost basis benchmark line — the standard
          wealth chart layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-border"
            checked={chart.showCostBasisLine}
            onChange={(e) => setOverviewChartPreferences({ showCostBasisLine: e.target.checked })}
          />
          <span>
            <span className="font-medium">Show cost basis line</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Overlays invested capital on the same scale as net worth bars.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chart-bar-color">Net worth bar color</Label>
            <div className="flex items-center gap-2">
              <input
                id="chart-bar-color"
                type="color"
                value={chart.barColor}
                onChange={(e) => setOverviewChartPreferences({ barColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
              />
              <span className="font-mono text-xs text-muted-foreground">{chart.barColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart-cost-basis-color">Cost basis line color</Label>
            <div className="flex items-center gap-2">
              <input
                id="chart-cost-basis-color"
                type="color"
                value={chart.costBasisLineColor}
                onChange={(e) =>
                  setOverviewChartPreferences({ costBasisLineColor: e.target.value })
                }
                className="h-9 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
                disabled={!chart.showCostBasisLine}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {chart.costBasisLineColor}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
          )}
        >
          Layout is fixed: bars = net worth at each period, line = cost basis. Edit values in
          Settings → Data.
        </div>
      </CardContent>
    </Card>
  );
}
