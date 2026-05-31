"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { OVERVIEW_LINE_TYPES } from "@/lib/overview-chart";
import { cn } from "@/lib/utils";

export function OverviewChartSettingsCard() {
  const { uiPreferences, setOverviewChartPreferences } = usePortfolio();
  const chart = uiPreferences.overviewChart;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Overview chart</CardTitle>
        <CardDescription>
          Customize the net worth chart on the dashboard — series, colors, and line style.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={chart.showBar}
              onChange={(e) => setOverviewChartPreferences({ showBar: e.target.checked })}
            />
            Bar chart
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={chart.showLine}
              onChange={(e) => setOverviewChartPreferences({ showLine: e.target.checked })}
            />
            Line chart
          </label>
        </div>

        {!chart.showBar && !chart.showLine ? (
          <p className="text-xs text-amber-500/90">Enable at least one series to show the chart.</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chart-bar-color">Bar color</Label>
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
            <Label htmlFor="chart-line-color">Line color</Label>
            <div className="flex items-center gap-2">
              <input
                id="chart-line-color"
                type="color"
                value={chart.lineColor}
                onChange={(e) => setOverviewChartPreferences({ lineColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
              />
              <span className="font-mono text-xs text-muted-foreground">{chart.lineColor}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chart-line-type">Line interpolation</Label>
          <NativeSelect
            id="chart-line-type"
            value={chart.lineType}
            onValueChange={(v) =>
              setOverviewChartPreferences({
                lineType: v as typeof chart.lineType,
              })
            }
            options={OVERVIEW_LINE_TYPES.map((o) => ({ value: o.value, label: o.label }))}
            disabled={!chart.showLine}
          />
        </div>

        <div
          className={cn(
            "rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
          )}
        >
          Preview uses your saved colors. Open Overview to see the full chart with live data.
        </div>
      </CardContent>
    </Card>
  );
}
